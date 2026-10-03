#!/usr/bin/env python3
"""Nightly candidate-shape fixture validator (bead fr-tww).

The nightly writes one directory per candidate under
probes/daily-candidates/<date>-<slug>/ with a fixed contract (see
franken-nightly prompts/build-candidate.md): recipe.md, baseline.py,
candidate.py, fixtures/input.json, fixtures/transfer.json, test.py and
a harness-generated execution.json. Until now nothing re-checked that
shape after merge: a candidate could land with a stale execution.json,
a tampered fixture, or a missing file and only fail months later.

This validator is the golden-fixture leg for that surface. For every
committed candidate it checks the contract statically (required files,
<=20 files, <=256 KiB, fixtures are valid JSON and distinct) and then
re-executes every run recorded in execution.json, requiring the exit
code and the stdout sha256 to reproduce exactly. execution.json is
harness-generated and never model-written, so a mismatch means the
bytes on disk no longer produce the recorded evidence.

Commands (run from the repo root):
  python3 scripts/candidate-shape.py verify [--root PATH] [DIR ...]

With no DIR, every directory under <root>/probes/daily-candidates/ is
checked. Exit status: 0 iff every candidate conforms.
Stdlib only. See docs/fixtures.md.
"""
import argparse
import hashlib
import json
import os
import signal
import subprocess
import sys
from pathlib import Path

TOOL = "scripts/candidate-shape.py@1"
REQUIRED = (
    "recipe.md",
    "baseline.py",
    "candidate.py",
    "fixtures/input.json",
    "fixtures/transfer.json",
    "test.py",
    "execution.json",
)
MAX_FILES = 20
MAX_BYTES = 256 * 1024
RUN_TIMEOUT_S = 60
EXPECTED_RUNS = (
    "baseline/input",
    "candidate/input",
    "baseline/transfer",
    "candidate/transfer",
    "test",
)


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def run_recorded(candidate: Path, argv: list[str]) -> tuple[int, str] | None:
    """Re-run one recorded argv inside the candidate dir.

    Whole process group is killed on timeout; returns None on timeout
    or spawn failure instead of hanging the fixture suite.
    """
    try:
        proc = subprocess.Popen(
            [sys.executable, *argv], cwd=candidate,
            stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            start_new_session=True)
        out, _ = proc.communicate(timeout=RUN_TIMEOUT_S)
    except subprocess.TimeoutExpired:
        os.killpg(os.getpgid(proc.pid), signal.SIGKILL)
        proc.wait()
        return None
    except OSError:
        return None
    return proc.returncode, sha256(out)


def check_candidate(candidate: Path) -> list[str]:
    """Return a list of contract violations (empty = conforming)."""
    problems: list[str] = []
    files = sorted(
        p.relative_to(candidate).as_posix()
        for p in candidate.rglob("*") if p.is_file())
    for rel in REQUIRED:
        if rel not in files:
            problems.append(f"missing required file: {rel}")
    if len(files) > MAX_FILES:
        problems.append(f"{len(files)} files exceeds limit {MAX_FILES}")
    total = sum((candidate / rel).stat().st_size for rel in files)
    if total > MAX_BYTES:
        problems.append(f"{total} bytes exceeds limit {MAX_BYTES}")
    if problems:
        return problems

    fixture_bytes = {}
    for rel in ("fixtures/input.json", "fixtures/transfer.json"):
        raw = (candidate / rel).read_bytes()
        fixture_bytes[rel] = raw
        try:
            json.loads(raw)
        except ValueError as exc:
            problems.append(f"{rel} is not valid JSON: {exc}")
    if fixture_bytes.get("fixtures/input.json") == \
            fixture_bytes.get("fixtures/transfer.json"):
        problems.append("fixtures/input.json and fixtures/transfer.json "
                        "are byte-identical; transfer must be a distinct case")

    try:
        execution = json.loads((candidate / "execution.json").read_text())
    except ValueError as exc:
        problems.append(f"execution.json is not valid JSON: {exc}")
        return problems
    if not execution.get("generated_by"):
        problems.append("execution.json lacks generated_by "
                        "(harness provenance is required)")
    runs = {r.get("name"): r for r in execution.get("runs", [])}
    for name in EXPECTED_RUNS:
        if name not in runs:
            problems.append(f"execution.json has no run named {name!r}")
    if problems:
        return problems

    for name in EXPECTED_RUNS:
        recorded = runs[name]
        argv = recorded.get("argv") or []
        if not argv or not all(isinstance(a, str) for a in argv):
            problems.append(f"run {name}: argv missing or not strings")
            continue
        result = run_recorded(candidate, argv)
        if result is None:
            problems.append(f"run {name}: re-execution timed out "
                            f"(>{RUN_TIMEOUT_S}s) or failed to start")
            continue
        exit_code, out_hash = result
        if exit_code != recorded.get("exit"):
            problems.append(
                f"run {name}: re-executed exit {exit_code} "
                f"!= recorded {recorded.get('exit')}")
        if out_hash != recorded.get("output_sha256"):
            problems.append(
                f"run {name}: re-executed stdout sha256 {out_hash} "
                f"!= recorded {recorded.get('output_sha256')}")
    return problems


def find_candidates(root: Path) -> list[Path]:
    base = root / "probes" / "daily-candidates"
    if not base.is_dir():
        return []
    return sorted(p for p in base.iterdir() if p.is_dir())


def cmd_verify(root: Path, dirs: list[Path]) -> int:
    candidates = dirs or find_candidates(root)
    if not candidates:
        print("candidate-shape: no candidate directories found")
        return 1
    failed = 0
    for candidate in candidates:
        problems = check_candidate(candidate)
        if problems:
            failed += 1
            print(f"DRIFT  {candidate.name}")
            for problem in problems:
                print(f"  {problem}")
        else:
            print(f"CONFORMING  {candidate.name}")
    print(f"candidate-shape: {len(candidates) - failed}/{len(candidates)} "
          f"conforming")
    return 1 if failed else 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=("verify",))
    parser.add_argument("--root", type=Path, default=None,
                        help="repo root (default: parent of scripts/)")
    parser.add_argument("dirs", nargs="*", type=Path,
                        help="candidate dirs (default: all committed ones)")
    args = parser.parse_args()
    root = args.root or Path(__file__).resolve().parents[1]
    return cmd_verify(root, args.dirs)


if __name__ == "__main__":
    raise SystemExit(main())
