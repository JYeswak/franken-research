# Applied performance trial — 2026-09-29

Baseline: merged FR eb9bc99, unchanged `bun run verify`. Objective: >=100x
elapsed-time and child/process CPU improvement for repeated eligible research-note
and Beads-only local validation, with all affected checks retained. This is a
software validation workload, not proof of research quality or human productivity.

The initial CI packet candidate is rejected before implementation: seven genuine
jobs; existing one-load exported API already handles them. No duplicated jobs or
weaker CLI-only baseline may manufacture 100x. Reviewer retained measurements.

Technique under trial: input-bound reuse of a prior successful full validation,
following action-input caching (Bazel documentation):
https://bazel.build/versions/7.7.0/remote/caching . Reuse requires complete repository
content/mode inventory (including ignored dependencies), local tool/environment
identity, stable pre/post execution inputs, and a private local full-run receipt.
Only Beads edits and new Markdown notes beneath docs/evidence/applied-research/
are eligible. Re-run the original privacy predicate on changed content, and the
existing decision identity validator. Other changes require full verification.
Release/CI still uses the unchanged full command. Cache use must explicitly say
which results were reused, not claim every check just executed.

Matched trials: record a real full-suite result, then compare full and incremental
paths on the same real Beads/note change. At least two full samples and ten
incremental samples. Report all raw wall and CPU times, median, worst incremental
ratio versus fastest full sample, startup/setup cost and amortization separately.
Include A/A full controls. No tuning on an independent reviewer's withheld negative
cases. Reject on missing/tampered certificate, unrelated code/data/tool/input
changes, symlink/path/permission drift, missing Git objects, source mutation during
verification, or changed bound evidence. Missing measurements remain unknown.

Fresh notes must record real work from this round, not padding or repeated data.
A fresh copied checkout must first earn its own full receipt. Invalid reuse can
fall back to full verification; a dry inspection may report FULL_REQUIRED without
running it. A rejected 100x target stays rejected, even if a smaller gain is useful.
