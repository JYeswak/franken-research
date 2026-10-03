#!/usr/bin/env python3
"""One-command self-verification against golden fixtures (bead fr-tww).

Agents no longer need a full `bun run verify` (minutes, site-wide) or
Josh to prove their work: this runner executes the three fixture
surfaces that carry golden oracles, reports each surface's result and
wall time, and fails if the total exceeds the 5-minute budget that
keeps the independent-verify gate cheap enough to run daily.

Surfaces:
  packet-verifier       scripts/test_golden_packets.py,
                        scripts/golden-packets.py verify,
                        scripts/test_packet_receipts.py
  kit-install-paths     starter-kit/tests/test_gates.py
  nightly-candidate-shape
                        scripts/test_candidate_shape.py,
                        scripts/candidate-shape.py verify

Commands (run from anywhere):
  python3 scripts/fixtures.py [--json]

Exit status: 0 iff every surface passes inside the budget. Every
subprocess runs in its own process group and is killed whole on
timeout, so a hung fixture can never orphan a child on the Mac.
Stdlib only. See docs/fixtures.md.
"""
import argparse
import json
import os
import signal
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BUDGET_S = 300
SUITE_TIMEOUT_S = 240

SUITES = (
    ("packet-verifier", (
        ("golden-packet tests", ("scripts/test_golden_packets.py",)),
        ("golden-packet verify", ("scripts/golden-packets.py", "verify")),
        ("packet-receipt tests", ("scripts/test_packet_receipts.py",)),
    )),
    ("kit-install-paths", (
        ("kit gate tests", ("starter-kit/tests/test_gates.py",)),
    )),
    ("nightly-candidate-shape", (
        ("candidate-shape tests", ("scripts/test_candidate_shape.py",)),
        ("candidate-shape verify", ("scripts/candidate-shape.py", "verify")),
    )),
)


def run_command(argv: tuple[str, ...], timeout: int) -> tuple[int, float, str]:
    """Run one fixture command; kill the whole group on timeout."""
    started = time.monotonic()
    try:
        proc = subprocess.Popen(
            [sys.executable, *argv], cwd=ROOT,
            stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
            text=True, start_new_session=True)
        out, _ = proc.communicate(timeout=timeout)
        return proc.returncode, time.monotonic() - started, out
    except subprocess.TimeoutExpired:
        os.killpg(os.getpgid(proc.pid), signal.SIGKILL)
        proc.wait()
        return 124, time.monotonic() - started, f"TIMEOUT after {timeout}s"


def run_suites(suites=SUITES, budget: int = BUDGET_S) -> tuple[int, dict]:
    results = []
    total = 0.0
    failed = False
    for name, commands in suites:
        suite_seconds = 0.0
        suite_ok = True
        details = []
        for label, argv in commands:
            rc, seconds, out = run_command(argv, SUITE_TIMEOUT_S)
            suite_seconds += seconds
            if rc != 0:
                suite_ok = False
                tail = "\n".join(out.rstrip().splitlines()[-5:])
                details.append(f"{label}: exit {rc}\n{tail}")
            else:
                details.append(f"{label}: ok ({seconds:.1f}s)")
        total += suite_seconds
        failed = failed or not suite_ok
        results.append({"surface": name, "ok": suite_ok,
                        "seconds": round(suite_seconds, 1),
                        "details": details})
    over_budget = total > budget
    summary = {"tool": "scripts/fixtures.py@1", "budget_s": budget,
               "total_s": round(total, 1), "over_budget": over_budget,
               "surfaces": results}
    return (1 if failed or over_budget else 0), summary


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", action="store_true",
                        help="print only the JSON summary")
    args = parser.parse_args()
    rc, summary = run_suites()
    if args.json:
        print(json.dumps(summary, indent=2))
    else:
        for surface in summary["surfaces"]:
            mark = "PASS" if surface["ok"] else "FAIL"
            print(f"{mark}  {surface['surface']} ({surface['seconds']}s)")
            for detail in surface["details"]:
                for line in detail.splitlines():
                    print(f"      {line}")
        verdict = "PASS" if rc == 0 else "FAIL"
        print(f"fixtures: {verdict} total {summary['total_s']}s "
              f"of {summary['budget_s']}s budget")
    return rc


if __name__ == "__main__":
    raise SystemExit(main())
