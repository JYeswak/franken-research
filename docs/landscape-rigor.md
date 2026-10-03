# Landscape rigor — drift-gated re-assessment of the 44 packets

**Status:** design of record for bead `fr-landscape-rigor` (2026-10-03).
**Scope:** how the 44 pinned assessment packets in `packets/` stay honest against the
live FrankenSuite repositories without ever being silently rewritten.

The packets are frozen at their 2026-09-22 pins. The suite is not: the daily census
(`watch/latest.json`, 2026-10-03) counts 38 of 44 repos moved since their pins and
8,957 commits landed after them. This document records the drift pipeline that keeps
that gap visible and gated: what counts as drift, which gates a drift claim must pass,
and the only paths by which packet-adjacent text may change.

## 1. Drift inputs (what is observed, and how often)

| Input | Source | Cadence | What it proves |
|---|---|---|---|
| Daily census | `watch/watch.mjs` via `.github/workflows/watch.yml`, 11:23 UTC → `watch/census/YYYY-MM-DD.tsv`, `watch/state.json`, `watch/changes/YYYY-MM-DD.json`, `watch/latest.json` | Daily | Pin vs default-branch HEAD, commits since pin, releases/tags since pin, license SPDX + text-change flag, workflow-file set, archived/renamed/deleted, pin reachability. `material_since_pin` flags only events that could move a master-matrix cell; commits alone never do. |
| Packet receipts | `scripts/packet-receipts.py` → `packets/*-assessment.receipt.json` | On any packet or RULEBOOK change | Each packet still regenerates byte-identically from its pinned inputs (target-repo commit, claim-set hash, RULEBOOK hash). Drift *inside this repo* is caught here, before any live-repo question. |
| Release/registry APIs | GitHub Releases API, crates.io, npm registry | At re-check time | A flagged release actually exists, its target commit, asset list and digests; registry versions and download counts. |
| Fresh clone | Blobless clone of the target repo into scratch outside this tree | At re-check time | Commit range pin→re-check-pin: authors (bus factor), `git diff` on LICENSE/workflows/manifests, claim-relevant files read at the new pin. Scratch is deleted after the check (updates/METHOD.md rule 7). |
| Program rhythm | launchd nightly (06:20 MDT) candidate work, Sunday retro, fleet quota report | Nightly / weekly | Decides *when* drift is worked: census flags land in the morning report; re-checks are worked as beads in the daily DAG pass; the retro samples closed re-checks. Quota state bounds how much live-API and clone work a night may spend. |

## 2. The gate chain (no claim moves without passing every gate)

1. **Census gate.** A re-check starts only from a census `material_since_pin` flag or a
   packet revisit trigger. Unflagged movement (commits only) is recorded in the census
   and nothing else happens. This is the drift gate: it keeps 44 repos' worth of noise
   from becoming 44 rewrites.
2. **Receipt gate.** `python3 scripts/packet-receipts.py verify` must be green, proving
   the pinned packet being re-checked is the packet that was graded.
3. **Evidence gate.** The re-check is written under RULEBOOK v1.1 tiers and
   `updates/METHOD.md` rules 3–6: own pin (full hash + date), HEAD named but not
   assessed, every matrix cell (TRL, ring, license, bus factor, CI class, release
   class) given pin value, re-check value, and tier — "unchanged" is stated out loud,
   and suite totals are described as what they *would become* under a re-pin, never
   edited.
4. **Verify gate.** `TMPDIR=/Users/josh/.cache/fr-tmp/ bun run verify` — the full
   site gate chain (including gate M: the Atom feed regenerates byte-identically from
   `updates/`, so a new re-check rebuilds `site/feed.xml` in the same commit) — must
   pass on the exact commit.
5. **Independent review.** A separate agent session reviews the re-check before it
   lands (docs/PIPELINE.md step 4). The author never closes their own re-check bead;
   an independent verifier closes it against the acceptance criteria.

Packet files themselves have exactly one update path: **none**. A packet is never
edited after its pin. Corrections at the pin go through the fix-PR path in
docs/PIPELINE.md; post-pin truth lives in dated re-checks under `updates/`. A new
suite-wide count requires a new dated synthesis, not an edit (METHOD.md rule 5).

## 3. Worked example

`updates/franken_markdown-2026-10-03.md` is the first end-to-end run of this design:
census flag (release v0.5.0, 2026-10-02) → receipt verify → clone-and-diff evidence →
dated re-check with all six cells → `bun run verify` green → independent review.
Its verdict: the release is real and larger than the packet's 0.4.5, and no matrix
cell moves — which is itself the finding the census alone could not give.
