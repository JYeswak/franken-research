# Status packet (primary recovery surface)

Updated: 2026-09-25 (UTC), lead session.

- **Arc state:** CHARTERED. The maintainer locked the charter on 2026-09-25 ("Lock, but allow quotes"). S01 is at maturity 2; S02-S11 are at 1 (GROUNDED). Median 1, max 2.
- **Charter hash:** see manifest.json (sha256 of PROJECT_CHARTER.md at lock).
- **Open P0/P1 defects:** none.
- **Blocking unknowns:** UNK-007 tier mapping BLOCKS_BUILD, for the rigor-atlas and fh ingest beads only (TIER-MAP.md is with Luna for independent sign-off, review 5). UNK-008 crawler policy RESOLVED 2026-09-25 by the maintainer: open, no crawler-specific rule (DEC-011; DEC-008 rejected). UNK-001, UNK-006 and UNK-010 were resolved at the lock.
- **Intake reports:** ~/.local/state/zeststream/scratch/control-plane/franken-lead/atlas/intake-{IntakeFH2,IntakeRigor2,IntakeFR2,IntakeEco2}.md; crate table atlas/eco2-crates.tsv.
- **Key intake facts:** fh = 1.9M raw docs, 8-12 s/query, rank-1 relevance 0/37 on build-intent queries (curation beats breadth). rigor-atlas = 1,497 techniques / 139 crate profiles / 140 prescriptions / 589 entities, pinned 2026-09-02, KNOW/INFER/GUESS labels. Crates = 1,290 own in 86 repos, 211 on crates.io. frankensearch has no WASM path. Rider: pointer-only (DEC-004).
- **Decisions:** DEC-001/002/003/005/006/007/009/011 accepted; DEC-004 superseded by DEC-009 (short cited quotes allowed); DEC-008 rejected (DEC-011: crawler policy open); DEC-010 proposed.
- **Perf probe (a55f8fd) and optimisation run (20260925T175730Z-4b31427):** engine A recommended (DEC-010, proposed). With levers L1 (bounded top-k), L2 (dense accumulators) and L3a (in-place result rows) the phone keystroke p95 is 8.0 ms against the 16 ms budget. That is measured in headless Chrome with a 4x throttle on 2026-09-25, not on real phones, and it held in 2 invocations of 10 runs each. The incumbent measured 16.4 and 15.8 ms on the same invocations and 15.2 ms on a quieter-host re-baseline, so the old 18.0 ms was partly host load. Desktop p95 is 1.8 ms; the index files are unchanged. Identity is a test with an oracle: golden-diff shows 0 changed rows, including the 88-query golden set, and 2 of 2 plants were caught. L3b (containment, fixed rows) and L4 (JIT warm-up) were rejected. Open: 2-3 phone long tasks > 50 ms per 11,650 keystrokes, the paint frame (p95 9.2 ms), and a port to S05.
- **Contracts (85775c1) and golden set (ebac079):** committed, not yet independently reviewed.
- **Done, unpushed (local main):** cohort screening readme_smoke_wt-pages (f273e97, pending review), watch candidate predicate (6246d37), beads_bend packet (e353f1b, pending review), CHANGELOG gate-W count fix (db345e3). Push only after the cohort packets pass independent review (method: verdicts land after review).
- **Next reviews:** cohort packets -> Luna (pane 2, GPT-6-Luna, different lineage) via ntm packet with report-back.
- **Live product:** v1.2.0 at https://fr.zeststream.ai (a993340), deploy token only in the `production` environment (repo-level secret removed and verified 0).
- **Fleet notes:** contabo-4 disk near full (0.95 GB free); scout agent type points at a missing local model (qwen3.8:27b-mlx), use task agents.
- **Next legal transition:** S02-S11 advance to CONTRACTED (2) together, following R1 (no section more than one level above the median). The perf probe result decides S05's contract.
- **Cohort review:** Luna (pane 2) is reviewing f273e97, e353f1b and 7922e87 (packet: scratch cohort/luna-review-1.md; results: cohort/luna-review-1-result.md).
