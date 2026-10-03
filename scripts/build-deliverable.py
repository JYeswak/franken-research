#!/usr/bin/env python3
"""Deliverable ZIP automator (bead fr-3tw).

Maintains the franken-assessments deliverable as ONE versioned lineage:

    franken-assessments-44-v<N>.zip

ZIP layout (matches the v10/v11 lineage): RULEBOOK.md at root plus the
packets/, synthesis/, site/, starter-kit/ and ecosystem/ trees and every
v*-manifest.md at root, including the freshly generated v<N>-manifest.md.

Behaviour:
  * Deterministic build — sorted entries, fixed zip timestamps, fixed
    permissions — so identical sources always produce a byte-identical ZIP.
  * Content-fingerprint idempotency: if the sources have not changed since
    the last recorded build, re-running produces NO new version; it rebuilds
    to a temp file, proves the hash is identical, and stops.
  * When sources changed: version bumps by one, the new ZIP replaces the old
    one in the output directory (old versions are deleted), the state file
    in the output directory records {version, fingerprint, sha256}, and the
    ZIP is mirrored.

Mirrors (exactly one franken-assessments ZIP exists at the destination):
  * --mirror dir   : copy into --mirror-dir, delete older versions there.
  * --mirror drive : update the single existing Drive file IN PLACE via
                     hatch_gws_cli (same file id, renamed to the new
                     version), then verify Drive holds exactly one
                     franken-assessments ZIP whose md5 matches the local
                     file. Requires hatch_gws_cli in PATH (VM).
  * --mirror none  : skip mirroring.

Modes:
  build (default) : build + (optionally) mirror as one run.
  --mirror-only ZIP --mirror drive|dir : mirror an existing ZIP file.

Exit codes: 0 ok, 2 usage/state error, 3 mirror unavailable/failed.

Run tests: python3 scripts/test_build_deliverable.py
"""

import argparse
import hashlib
import json
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile

ZIP_NAME_RE = re.compile(r"^franken-assessments-44-v(\d+)\.zip$")
MANIFEST_RE = re.compile(r"^v\d+-manifest\.md$")
ROOT_FILES = ["RULEBOOK.md"]
ROOT_DIRS = ["packets", "synthesis", "site", "starter-kit", "ecosystem"]
EXCLUDED_DIR_NAMES = {"node_modules", "__pycache__", ".git"}
EXCLUDED_FILE_NAMES = {".DS_Store"}
ZIP_DATE = (1980, 1, 1, 0, 0, 0)
STATE_NAME = ".franken-deliverable-state.json"
DRIVE_QUERY_NAME = "franken-assessments-44-v"
SUBPROCESS_TIMEOUT_S = 300


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def iter_source_files(repo: pathlib.Path):
    """All (arcname, absolute path) pairs that go into the ZIP, sorted."""
    out = []
    for name in ROOT_FILES:
        p = repo / name
        if p.is_file():
            out.append((name, p))
    for name in sorted(os_listdir(repo)):
        if MANIFEST_RE.match(name) and (repo / name).is_file():
            out.append((name, repo / name))
    for top in ROOT_DIRS:
        base = repo / top
        if not base.is_dir():
            continue
        for p in sorted(base.rglob("*")):
            if not p.is_file():
                continue
            if any(part in EXCLUDED_DIR_NAMES for part in p.parts):
                continue
            if p.name in EXCLUDED_FILE_NAMES:
                continue
            out.append((p.relative_to(repo).as_posix(), p))
    out.sort(key=lambda t: t[0])
    return out


def os_listdir(path: pathlib.Path):
    try:
        return [p.name for p in path.iterdir()]
    except FileNotFoundError:
        return []


def read_sources(repo: pathlib.Path):
    """Return list of (arcname, sha256, bytes) for every source file."""
    entries = []
    for arc, p in iter_source_files(repo):
        data = p.read_bytes()
        entries.append((arc, sha256_bytes(data), data))
    return entries


def fingerprint(entries) -> str:
    """Content fingerprint over non-manifest sources."""
    h = hashlib.sha256()
    for arc, digest, _data in entries:
        if MANIFEST_RE.match(arc):
            continue
        h.update(arc.encode("utf-8"))
        h.update(b"\0")
        h.update(digest.encode("ascii"))
        h.update(b"\n")
    return h.hexdigest()


def render_manifest(version: int, entries, fp: str) -> str:
    lines = [
        f"# v{version} Manifest — franken-assessments-44",
        "",
        f"Built by scripts/build-deliverable.py (deterministic build). "
        f"Single versioned lineage: this ZIP replaces v{version - 1} in place "
        f"(same Drive file). Older versions deleted locally and superseded on Drive.",
        "",
        f"- Version: v{version}",
        f"- Content fingerprint (sha256, manifests excluded): {fp}",
        f"- Entries: {len(entries) + 1} (including this manifest)",
        "",
        "## Entries (arcname, sha256, bytes)",
        "",
    ]
    for arc, digest, data in entries:
        lines.append(f"- `{arc}` — {digest} — {len(data)}")
    lines.append(
        f"- `v{version}-manifest.md` — (this file; excluded from fingerprint)")
    lines.append("")
    return "\n".join(lines)


def build_zip(entries, version: int, fp: str, dest: pathlib.Path) -> str:
    """Write the deterministic ZIP; return its sha256."""
    target = f"v{version}-manifest.md"
    # A previous build may have left this version's manifest in the repo
    # root; the generated copy replaces it (never duplicate the arcname,
    # and the manifest is rendered from the same filtered entry list on
    # every run so rebuilds are byte-identical).
    base = [(a, d, data) for a, d, data in entries if a != target]
    manifest = render_manifest(version, base, fp).encode("utf-8")
    all_entries = base + [(target, sha256_bytes(manifest), manifest)]
    all_entries.sort(key=lambda t: t[0])
    with zipfile.ZipFile(dest, "w", compression=zipfile.ZIP_DEFLATED,
                         compresslevel=9) as zf:
        for arc, _digest, data in all_entries:
            info = zipfile.ZipInfo(arc, date_time=ZIP_DATE)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.create_system = 3
            info.external_attr = 0o100644 << 16
            zf.writestr(info, data)
    return sha256_bytes(dest.read_bytes())


def find_versions(out_dir: pathlib.Path):
    versions = {}
    if out_dir.is_dir():
        for p in out_dir.iterdir():
            m = ZIP_NAME_RE.match(p.name)
            if m:
                versions[int(m.group(1))] = p
    return versions


def load_state(out_dir: pathlib.Path):
    p = out_dir / STATE_NAME
    if p.is_file():
        try:
            return json.loads(p.read_text(encoding="utf-8"))
        except (ValueError, OSError):
            return None
    return None


def save_state(out_dir: pathlib.Path, state: dict):
    (out_dir / STATE_NAME).write_text(
        json.dumps(state, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def prune_old_versions(out_dir: pathlib.Path, keep: int):
    removed = []
    for ver, p in find_versions(out_dir).items():
        if ver != keep:
            p.unlink()
            removed.append(p.name)
    return removed


def run_cmd(argv, timeout=SUBPROCESS_TIMEOUT_S):
    proc = subprocess.run(argv, capture_output=True, text=True,
                          timeout=timeout)
    if proc.returncode != 0:
        raise RuntimeError(
            f"command failed ({proc.returncode}): {' '.join(argv)}\n"
            f"{proc.stdout}\n{proc.stderr}")
    return proc.stdout


def mirror_to_dir(zip_path: pathlib.Path, mirror_dir: pathlib.Path) -> dict:
    mirror_dir.mkdir(parents=True, exist_ok=True)
    dest = mirror_dir / zip_path.name
    shutil.copyfile(zip_path, dest)
    removed = []
    for p in mirror_dir.iterdir():
        if ZIP_NAME_RE.match(p.name) and p.name != zip_path.name:
            p.unlink()
            removed.append(p.name)
    remaining = [p.name for p in mirror_dir.iterdir()
                 if ZIP_NAME_RE.match(p.name)]
    if remaining != [zip_path.name]:
        raise RuntimeError(f"mirror dir must hold exactly one ZIP: {remaining}")
    digest = sha256_bytes(dest.read_bytes())
    if digest != sha256_bytes(zip_path.read_bytes()):
        raise RuntimeError("mirror dir copy hash mismatch")
    return {"backend": "dir", "path": str(dest), "removed": removed,
            "sha256": digest}


def drive_files_list():
    out = run_cmd(["hatch_gws_cli", "drive", "files", "list", "--params",
                   json.dumps({
                       "q": f"name contains '{DRIVE_QUERY_NAME}' "
                            "and trashed=false",
                       "pageSize": 50,
                       "fields": "files(id,name,size,md5Checksum)"})])
    return json.loads(out).get("files", [])


def mirror_drive(zip_path: pathlib.Path) -> dict:
    if shutil.which("hatch_gws_cli") is None:
        raise RuntimeError(
            "hatch_gws_cli not in PATH; Drive mirror unavailable here")
    files = drive_files_list()
    if len(files) != 1:
        raise RuntimeError(
            f"expected exactly one Drive deliverable file, found "
            f"{len(files)}: {[f.get('name') for f in files]}")
    file_id = files[0]["id"]
    local_md5 = hashlib.md5(zip_path.read_bytes()).hexdigest()
    run_cmd(["hatch_gws_cli", "drive", "files", "update", "--params",
             json.dumps({"fileId": file_id}),
             "--upload", str(zip_path),
             "--json", json.dumps({"name": zip_path.name})])
    after = drive_files_list()
    if len(after) != 1:
        raise RuntimeError(
            f"Drive must hold exactly one deliverable ZIP, found "
            f"{len(after)}: {[f.get('name') for f in after]}")
    f = after[0]
    if f["id"] != file_id or f["name"] != zip_path.name:
        raise RuntimeError(f"Drive file mismatch after update: {f}")
    if f.get("md5Checksum") != local_md5:
        raise RuntimeError(
            f"Drive md5 {f.get('md5Checksum')} != local md5 {local_md5}")
    return {"backend": "drive", "file_id": file_id, "name": f["name"],
            "md5": f["md5Checksum"], "in_place": True}


MIRRORS = {"dir": mirror_to_dir, "drive": mirror_drive}


def do_mirror(kind: str, zip_path: pathlib.Path, mirror_dir):
    if kind == "none":
        return {"backend": "none"}
    if kind == "dir":
        if mirror_dir is None:
            raise RuntimeError("--mirror dir requires --mirror-dir")
        return mirror_dir_backend(zip_path, mirror_dir)
    if kind == "drive":
        return mirror_drive(zip_path)
    raise RuntimeError(f"unknown mirror backend: {kind}")


def mirror_dir_backend(zip_path, dest_dir):
    return mirror_to_dir(zip_path, dest_dir)


def cmd_build(args) -> dict:
    repo = pathlib.Path(args.repo).resolve()
    out_dir = pathlib.Path(args.out_dir).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)
    entries = read_sources(repo)
    fp = fingerprint(entries)
    state = load_state(out_dir)
    existing = find_versions(out_dir)
    current_version = None
    if state and state.get("version") is not None:
        current_version = int(state["version"])
    elif existing:
        current_version = max(existing)

    if (state and state.get("fingerprint") == fp
            and current_version in existing):
        zip_path = existing[current_version]
        with tempfile.TemporaryDirectory() as td:
            probe = pathlib.Path(td) / zip_path.name
            digest = build_zip(entries, current_version, fp, probe)
        if digest != state.get("sha256"):
            raise RuntimeError(
                "rebuild hash differs from recorded state; refusing to "
                "treat as unchanged")
        removed = prune_old_versions(out_dir, current_version)
        mirror_info = do_mirror(args.mirror, zip_path,
                                pathlib.Path(args.mirror_dir)
                                if args.mirror_dir else None)
        return {"action": "unchanged", "version": current_version,
                "zip": str(zip_path), "sha256": digest, "fingerprint": fp,
                "removed_local": removed, "mirror": mirror_info}

    version = (current_version or 0) + 1
    zip_name = f"franken-assessments-44-v{version}.zip"
    zip_path = out_dir / zip_name
    with tempfile.TemporaryDirectory() as td:
        tmp_zip = pathlib.Path(td) / zip_name
        digest = build_zip(entries, version, fp, tmp_zip)
        shutil.copyfile(tmp_zip, zip_path)
    removed = prune_old_versions(out_dir, version)
    # The manifest also lands in the repo root, as with v10/v11, so the
    # lineage's manifests are part of the repo record. Copy the exact
    # bytes that went into the ZIP.
    with zipfile.ZipFile(zip_path) as zf:
        manifest_bytes = zf.read(f"v{version}-manifest.md")
    (repo / f"v{version}-manifest.md").write_bytes(manifest_bytes)
    save_state(out_dir, {"version": version, "fingerprint": fp,
                         "sha256": digest, "zip": zip_name})
    mirror_info = do_mirror(args.mirror, zip_path,
                            pathlib.Path(args.mirror_dir)
                            if args.mirror_dir else None)
    return {"action": "created", "version": version, "zip": str(zip_path),
            "sha256": digest, "fingerprint": fp, "removed_local": removed,
            "mirror": mirror_info}


def cmd_mirror_only(args) -> dict:
    zip_path = pathlib.Path(args.mirror_only).resolve()
    if not zip_path.is_file() or not ZIP_NAME_RE.match(zip_path.name):
        raise RuntimeError(f"not a deliverable ZIP: {zip_path}")
    info = do_mirror(args.mirror, zip_path,
                     pathlib.Path(args.mirror_dir) if args.mirror_dir else None)
    return {"action": "mirrored", "zip": str(zip_path),
            "sha256": sha256_bytes(zip_path.read_bytes()), "mirror": info}


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--repo", default=".",
                    help="franken-research checkout (default: cwd)")
    ap.add_argument("--out-dir",
                    help="directory holding the versioned ZIP lineage")
    ap.add_argument("--mirror", choices=["drive", "dir", "none"],
                    default="none")
    ap.add_argument("--mirror-dir", help="destination for --mirror dir")
    ap.add_argument("--mirror-only", metavar="ZIP",
                    help="mirror an existing ZIP and exit")
    args = ap.parse_args(argv)
    try:
        if args.mirror_only:
            result = cmd_mirror_only(args)
        else:
            if not args.out_dir:
                ap.error("--out-dir is required in build mode")
            result = cmd_build(args)
    except (RuntimeError, subprocess.TimeoutExpired) as exc:
        print(json.dumps({"error": str(exc)}), file=sys.stderr)
        return 3
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    sys.exit(main())
