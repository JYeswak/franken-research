# Applied result: faster local verification, not 100x research productivity

Applied technique: input-bound reuse of an actual successful full validation.
The original full command, release checks and CI gates are unchanged. For new
flat research notes and existing Beads edits only, the local command freshly
checks the original privacy predicate and decision identities; it explicitly
reports the other results as reused. Changes to notes present in the certified snapshot, code, data, tool, environment
or bound-evidence changes require full verification.

## Final paired result

Two unchanged full controls bracket ten warm runs on the same real new note,
LAUNCH-DECISION.md. Full setup occurs before adding that note. Timing includes
process startup, complete input hashing, fresh checks and exit. CPU is process
plus child user/system time. All final runs exit0 and the two full controls pass
26 gates. The ten runs estimate variability for ONE note.

| Metric | Full median | Reuse median | Median ratio | Fastest full / slowest reuse |
|---|---:|---:|---:|---:|
| Wall seconds | 96.3307 | 0.4563 | 211.09x | 192.27x |
| CPU seconds | 57.1081 | 0.4587 | 124.49x | 109.98x |

Predeclared warm threshold: >=100x on both conservative ratios. Result:
**PASS** for this local workload on this host.
Full setup cost: **96.802s wall / 57.725s CPU**.
Source SHA256: `cd0813cf2178e9a891424f9acfbcb9f27499da845ca2e08c28cb9cd7868c39be`. Raw command output, exits,
individual times and note hash are in [stable-trials.json](evidence/stable-trials.json).
Workspace paths alone are redacted; the private cache is not published.

## What failed and changed

- Existing evidence packet batching was rejected before implementation: the
  already-exported one-load API is the proper baseline, not repeated CLI loads.
- SHA256 warm wall passed (conservative133.99x); CPU failed (87.50x). Retained in
  [sha256-trials.json](evidence/sha256-trials.json).
- Optional BLAKE3 1.0.8 reads every input byte and binds wrapper/native backend
  implementation bytes independently with SHA256. Its earlier inherited-env
  pair passed both warm metrics; [blake3-trials.json](evidence/blake3-trials.json).
- A separate low-level invocation refused a changed agent environment. The
  consumer now uses an explicit minimal execution environment for BOTH full
  setup and reuse. It does not ignore environment changes. The first attempt
  omitted Node from PATH and failed W3; the real tool PATH repaired setup.
  [Retained failures](evidence/retained-failures.json).
- Review found and fixed newly-tracked privacy escape, Git replacement context,
  nonregular/symlink cache handling and active-interpreter identity gaps.

## Costs and limits

BLAKE3 is optional; dependency-free SHA256 remains available. Installed package
metadata: version1.0.8, CC0-1.0 OR Apache-2.0, 1,009,861 installed bytes in this
environment (excluding Python/venv). Installation elapsed time, development and
review effort are unmeasured; they are NOT zero. A venv outside the repo and an
actual browser/bun/node/Python toolchain remain required. This is not one-click
portability. Different hosts/checkouts must earn their own full result.

At constant measured costs, a hypothetical cumulative100x wall saving including full setup needs 191 eligible uses. Those uses did not occur.
At constant measured costs, a hypothetical cumulative100x CPU saving including full setup needs 514 eligible uses. Those uses did not occur.

The result is one local validation workload with two metrics. It establishes no
100x improvement in accepted research decisions, human review, token spending,
rights handling, learning quality or end-to-end research cost. The broad user
goal remains unmet. No accepted decision or project-wide multiplier is inferred
from skipped unchanged execution. Shared cache attestation and hostile privileged
writers are outside the same-trusted-host scope.

## Reproduce and falsify

See [README.md](README.md) for the actual consumer commands and paired runner.
The wrapper refuses CI. Any incorrect acceptance of changed bound input, fresh
privacy/decision failure, or conservative ratio below100 invalidates the relevant
claim. Human/research gains require separate fresh outcome comparisons; these
receipts cannot certify them. Independent agent review is context-separated,
not external third-party certification.

[Independent review and source hashes](REVIEW.md).
