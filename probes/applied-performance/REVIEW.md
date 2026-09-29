# Independent review: measured local verification reuse

Reviewed local candidate (file hashes below identify the published implementation): `eb58549c87caa689bd9d7e6de61d781abbfc6554`.

| File | SHA-256 |
|---|---|
| scripts/verify-incremental.py | cd0813cf2178e9a891424f9acfbcb9f27499da845ca2e08c28cb9cd7868c39be |
| scripts/verify-local.sh | 67adc14be25ba13298c38ad8011a29a6f241e633cdb1633a7e4725442f4c99fe |
| probes/applied-performance/run.py | cbd795023a809fd2973eb1b33f693f110a06083a2824689a0654f12867b82963 |

## Verdict

PASS for greater-than-100x warm wall latency and CPU reduction on **one narrowly scoped local validation workload**, under the documented same-host trust boundary. No identified correctness blocker remains within that scope. This is reuse of a successful prior full verification plus freshly executed affected checks. It is not a new execution of all 26 gates, remote attestation, or proof of 100x research productivity.

The reviewer independently inspected gate consumers, developed probes, found concrete defects, executed isolated negative cases and independently reproduced a successful separate-invocation fast-path hit. Paired timing controls were executed by the parent; this review independently reads and recomputes their results rather than pretending to have run another paired trial.

## Results

The paired trial uses one actual new research note, two direct full controls bracketing ten repeated candidate executions, identical declared execution environment, and successful full setup. Both full controls and all reuse executions exit zero; reuse output names the changed note and fresh privacy/decision checks.

| Resource | Full median | Reuse median | Median ratio | Fastest full / slowest reuse |
|---|---:|---:|---:|---:|
| Wall seconds | 96.330689 | 0.456349 | 211.09x | 192.27x |
| CPU seconds | 57.108104 | 0.458727 | 124.49x | 109.98x |

Independent fresh wrapper invocation outside the trial parent: exit zero, 0.488346 wall seconds and 0.491111 CPU seconds, `reused_full_result_with_fresh_metadata_checks`, `fresh.ok=true`, with `LAUNCH-DECISION.md` as the changed input. This repaired the initially observed cross-launch cache miss.

Full setup consumed 96.802219 wall seconds and 57.725258 CPU seconds. Counting setup, one later check yields about 0.990x wall and 0.982x CPU relative to one full control. Under hypothetical constant costs, 100x cumulative payoff would require 191 later eligible checks for wall time and 514 for CPU. These uses have not occurred. Installation, development and review effort are not included in those forecasts. Ten timing repetitions are one job, not ten productive outcomes.

## Independent challenges and repairs

- Rejected packet batching as a 100x workload: seven genuine historical jobs, existing single-load exports, and mandatory source evidence left insufficient headroom.
- Found that newly tracked byte-identical Beads could escape delta privacy scanning. Final delta includes newly tracked paths.
- Demonstrated in an isolated Git repository that replacement refs change `SHA^{commit}` validity without changing object inventory. Final cache binds effective Git configuration/replacements/grafts/shallow context.
- Challenged unbound injected-code environment resources; unsafe inherited environments cannot reuse through the low-level command. Wrapper deliberately executes both setup and reuse under a declared minimal environment and refuses CI.
- Challenged actual Python interpreter identity when different from PATH Python; final snapshot/guard binds active interpreter bytes/path.
- Thirteen independent eligibility/invalidation cases pass under both SHA256 and BLAKE3. Three additional isolated Git/filesystem cases pass (replacement binding, FIFO rejection, symlink rejection). Actual successful cache refuses another checkout/root.
- Reviewed BLAKE3 opt-in, pinned version, full-byte hashing, independent SHA256 identities of wrapper/native implementation, and backend change invalidation. No mtime-only reuse is introduced.

## Misses retained

The SHA256 candidate passed warm wall latency but missed CPU 100x (94.58x median). Two independently launched low-level commands refused reuse because launcher environment differed. A stable-environment trial failed setup after an unsuitable hand-written PATH selected incompatible tooling. These are development misses, not successful trials; they must remain visible alongside the successful final run.

## Boundaries

Release/CI still runs the full suite. New executable/code/data changes, modifications to notes/receipts present in the certified snapshot, deletions, changed dependency bytes, modes, toolchain identity, relevant Git context, unsupported filesystem entries and unsafe cache files cannot reuse. Beads edits and new flat Markdown evidence notes are the narrow eligible changes; affected privacy and decision identity checks execute freshly.

Private cache and a stable trusted host are assumptions. This does not bind every OS/shared-library behavior, independently authenticate previous execution, or defeat a privileged concurrent attacker. Another checkout must establish its own full result; refusing a copied cache is isolation, not successful product transfer.

This proves one local-validation acceleration in two resource dimensions. It does not establish gains in model tokens, source acquisition, human effort, adoption quality, overall research throughput, multiple research areas, or net project ROI.

Evidence: [independent checks](evidence/independent-checks.json), [paired receipts](evidence/stable-trials.json), and [retained failures](evidence/retained-failures.json). Private cache is excluded from public review material.
