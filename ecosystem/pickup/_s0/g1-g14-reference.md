# G1–G14 reference (starter-kit mechanical gates)

Source of truth: `starter-kit/scripts/gates/run-all.sh` `gate_label()` mapping
plus each `check-*.sh` header comment. Extracted 2026-09-23 for the
project-pickup S2 wave. Companion authors: cite these IDs exactly; do not
re-derive them from CHECKLIST.md prose, which uses different numbering in
places.

| ID | Script | Name | One-line definition |
|----|--------|------|---------------------|
| G1 | check-oracle.sh | ORACLE | Oracle (golden/snapshot) files are two-party assets: changed oracle files must be declared in `kit-oracle.yml`; renaming an oracle out of its dir counts as weakening and blocks. |
| G2 | check-paired-ops.sh | PAIR | Paired operations must change together per `paired-ops.tsv` (e.g. lock/unlock): an added line mentioning half_a without half_b fails. |
| G3 | check-ownership.sh | OWN | New ownership/allocation sites must be classified in `ownership.tsv` with non-empty evidence. |
| G4 | check-contracts.sh | CONTRACT | CI-only (needs a build). Contract harness in `kit-contracts.yml` runs against a .git-less sandbox copy of the staged tree. |
| G5 | check-host-boundaries.sh | HOST | Ambient/host reads and new unsafe code must be declared in the same diff (`docs/host-boundaries.md` + `unsafe-boundaries.tsv`). |
| G6 | check-unsafe.sh | UNSAFE | Every new `unsafe` site needs a `// SAFETY:` comment; tree-wide unsafe inventory (`docs/evidence/unsafe-inventory.tsv`) must stay accounted for. |
| G7 | check-review.sh | REVIEW | Sensitive changes (unsafe, extern "C", raw-pointer ops, leaks, alloc patterns) need a diff-only review artifact. |
| G8 | check-rulebook.sh | RULEBOOK | Bulk porting must be declared AND evidenced via `kit-rulebook.yml` (`bulk_porting: true` triggers bulk rules). |
| G9 | check-iou.sh | IOU | Agent loops must declare a positive round bound in `kit-loops.yml`; no structured IOU may be left unresolved at the phase gate. |
| G10 | check-miri.sh | MIRI | CI-only (needs cargo). `cargo miri test` over declared crates under a named aliasing model; exemptions need reasons. `rust: false` skips for non-Rust projects. |
| G11 | check-layout.sh | LAYOUT | Layout-sensitive Rust structs (repr(C), Serialize/Deserialize, on-disk/wire markers) must carry `size_of`/`align_of` asserts naming the struct. |
| G12 | check-audit.sh | AUDIT | Fix-class eradications declared in `kit-audits/*.audit` (pattern → replacement); exemptions via `exemptions.tsv`. |
| G13 | check-nostub.sh | NOSTUB | Stub markers (`unimplemented!`, `todo!`, `stub_to_satisfy_compiler`, `panic_on_unimplemented`) in added lines block. |
| G14 | check-reject.sh | REJECT | Every claimed safety property needs rejection evidence in `kit-rejections.tsv`: a test demonstrating the FAILURE being rejected (compile_fail | sealed | test), not just the success path. |

Notes for pickup companions:
- G1, G9, G13, G14 are the most type-agnostic: oracle discipline, loop bounds,
  no stubs, and rejection evidence transfer to almost any agentic-tech project.
- G4 and G10 are CI-only and build-requiring; G10 has an explicit non-Rust
  off-switch. Companions for non-Rust-typical types (e.g. voice-agent SDK
  layers, eval harnesses) should say so rather than force-fit.
- G6/G7/G11 are Rust-centric; for Python/TypeScript-heavy types, record the
  analog (e.g. G6-analog: every new privileged/syscall-adjacent site needs a
  SAFETY-equivalent comment) as a type-specific proposed gate rather than
  claiming G6 applies as-is.
