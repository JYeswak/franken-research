#!/usr/bin/env python3
"""Run a real, local decision lifecycle using an installed FR starter kit."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys


def write_json(path, data):
    path.write_text(json.dumps(data, indent=2) + "\n")


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def execute(root, argv, expected=0):
    started = datetime.now(timezone.utc).isoformat()
    # The recorded portable command uses python3; run with this interpreter.
    actual = [sys.executable, *argv[1:]] if argv[0] == "python3" else argv
    result = subprocess.run(actual, cwd=root, capture_output=True, text=True)
    receipt = {"command": argv, "cwd": ".", "started_at": started,
               "finished_at": datetime.now(timezone.utc).isoformat(),
               "exit_code": result.returncode, "stdout": result.stdout,
               "stderr": result.stderr, "python_version": sys.version}
    if result.returncode != expected:
        raise RuntimeError(f"Expected exit {expected}: {argv}\n{result.stdout}{result.stderr}")
    return receipt


def run(destination, kit):
    # mkdir rejects existing directories, files and dangling symlinks. No force.
    destination.mkdir(parents=True, exist_ok=False)
    env = dict(os.environ, KIT_NO_GIT="1")
    installed = subprocess.run(["sh", str(kit / "scripts/init.sh"), str(destination)],
                               env=env, capture_output=True, text=True)
    if installed.returncode:
        raise RuntimeError(installed.stdout + installed.stderr)
    shutil.copyfile(Path(__file__).with_name("probe.py"), destination / "probe.py")
    write_json(destination / "settings.json", {"format_version": 1})
    receipt = execute(destination, ["python3", "probe.py"])
    write_json(destination / "probe-receipt.json", receipt)
    # Include the installed tools as public inputs so the exported subset carries
    # its own checker/reviewer. All paths and commands are relative to the bundle.
    inputs = ["settings.json", "probe.py", "scripts/check-decisions.py",
              "scripts/review-decisions.py"]
    data = {"version": 1,
            "evidence": [{"id": "local-probe", "kind": "execution",
                          "artifact": "probe-receipt.json",
                          "sha256": digest(destination / "probe-receipt.json"),
                          "inputs": {p: digest(destination / p) for p in inputs},
                          "scope": "Only this local probe accepted these version-1 settings; no product or research-quality claim.",
                          "visibility": "public"}],
            "claims": [{"id": "settings-accepted", "text": "The recorded local probe accepted the declared settings bytes.",
                        "status": "supported", "evidence": ["local-probe"]}],
            "decisions": [{"id": "example-format", "question": "Can this local example use these settings with the bundled probe?",
                           "owner": "example operator", "priority": 1,
                           "next_check": "Inspect settings.json and rerun python3 probe.py before reconsidering support.",
                           "alternatives": ["keep version-1 settings", "change the probe and retest"],
                           "disposition": "adopt", "claims": ["settings-accepted"]}]}
    record = destination / "decisions.json"
    write_json(record, data)
    checks = []
    check = ["python3", "scripts/check-decisions.py", "decisions.json", "--root", "."]
    review = ["python3", "scripts/review-decisions.py", "decisions.json", "--root", ".", "--json"]
    def stage(name, root, command, expected=0):
        outcome = execute(root, command, expected)
        checks.append({"stage": name, **outcome})
        return outcome
    stage("current", destination, check)
    stage("current-review", destination, review)
    write_json(destination / "settings.json", {"format_version": 2})
    stage("changed-probe-fails", destination, ["python3", "probe.py"], 1)
    stage("stale-label", destination, check, 1)
    stage("stale-review", destination, review, 1)
    stage("demote", destination, check + ["--refresh"])
    if json.loads(record.read_text())["claims"][0]["status"] != "review_required":
        raise RuntimeError("Checker did not demote the stale supported claim")
    stage("demoted-review", destination, review)
    stage("export", destination, check + ["--export", "public-transfer"])
    transfer = destination / "public-transfer"
    stage("standalone-check", transfer, check)
    queue = json.loads(stage("standalone-review", transfer, review)["stdout"])
    if queue["decisions"][0]["state"] != "review":
        raise RuntimeError("Transferred decision lost its outstanding review")
    write_json(destination / "cycle-results.json", checks)
    print(f"Completed local lifecycle: {destination}")
    print("Public transfer validates independently; the decision still needs review.")
    print("No claim of research learning, speedup, semantic truth or execution authorization.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("destination", type=Path, help="new directory; existing paths are rejected")
    parser.add_argument("--kit", type=Path, default=Path(__file__).resolve().parents[2],
                        help="starter-kit directory containing scripts/init.sh")
    args = parser.parse_args()
    try:
        run(args.destination.absolute(), args.kit.resolve())
    except (OSError, ValueError, RuntimeError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
