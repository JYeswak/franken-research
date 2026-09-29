# Applied performance screening decision

The existing evidence-packet path is not a credible 100x target on the available
workload. At merged eb9bc99, an independent comparison of all seven real
historical jobs measured median 836.78 ms for separate JSON CLI invocations and
206.74 ms for one process using the already-exported API (with both output
formats). The latter is a stronger existing baseline, not a new optimization.
No repeated or duplicated jobs were added to inflate the comparison.

The expanded reference is 4,899,079 bytes; the seven jobs need 1,974,891 unique
source-text bytes plus their recorded facts. A projection cannot remove 99% of
that workload while keeping the same full source-backed outputs. Network use is
already zero. Decision: do not implement or advertise a 100x packet optimization.

Apply dependency-based prior-result reuse to local metadata validation instead.
The initial full verification control passed all 26 gates in 99.97 seconds and
65.58 CPU-seconds. Before benchmarking the candidate, independent review found
and corrected newly-tracked privacy omission and unchecked Git replacement
interpretation. The fresh comparison must still include full setup cost, direct
full-suite controls, affected-check equivalence and independent failure probes.
This note records an actual rejected optimization and the resulting application
choice. It is not itself evidence of 100x research productivity.
