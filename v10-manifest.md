# v10 Manifest — franken-assessments-44

Built 2026-09-23. Single versioned lineage: this ZIP replaces v9 in place
(same Drive file ID). v9 deleted locally and superseded on Drive.

## What v10 contains vs v9

**New folders/files**
- `ecosystem/` — ECOSYSTEM.md and A-Z-PLAYBOOK.md (unified evidence-substrate /
  method-kernel / planning-constitution / executable-machinery / decision /
  governance-spine model, 35-step A-Z playbook). New in v10.
- `site/og-image.png` — 1200×630 branded share card, wired via og:image +
  twitter:card into all 51 site pages.
- `v10-manifest.md` (this file, at ZIP root).

**Renamed**
- v9's `shareable/` folder is now `site/` (the built static site). The 44 brief
  source .md files that v9 carried at `shareable/*.md` are superseded by the
  rebuilt `site/briefs/*.html`; the generator moved to
  `shareable/reader-template/` and no longer ships inside the site tree.

**Starter kit** — the validated 28-item two-phase kit (checklist snapshot
2026-09-22 22:03; scripts, templates, README, CHECKLIST.md, REFERENCES.md,
index.html). The site starter-kit page now carries a dated disclosure: the
14 vendor-port rigor gates (Phase C) are in final grading and ship in the
next version. See "Gates status" below.

## Gaps fixed across the three v10 waves

### Wave 1 — seven skill passes (page-cro, seo-audit, codebase-audit, de-slopify,
technical-writing, modes-of-reasoning claim verification, evaluation-framework)
- P0 (1, closed): vendor-port-learnings.md intro implied NVIDIA was a third
  shipped agent-assisted Rust port; evidence showed early-stage native tracks.
  Title/intro rewritten to two shipped ports + NVIDIA as contrast case.
- P1 (19, all closed): front-door CRO (hero rewrite, starter-kit CTA/nav,
  Emanuel named on first-visit path); 8 of 9 v9 cold gaps repaired (h1
  hierarchy, meta descriptions, failure-modes 10/7 taxonomy, hardcoded-count
  claim scoped, dome caption, mobile stats wrap, search/ARIA/skip-links,
  reproduce-page citation, exceptions footnote, bundle rebuild); duplicate
  static/runtime h1; 44 brief meta descriptions (147–160 chars) + OG tags;
  failure-modes CI taxonomy 11/6 → 10/7 (frankenjax → C6); Rulebook "11
  sections" → 12 (Rulebook v1.1); evidence-tier flavor drift (v1.1 sanctions
  flavors, per-packet mapping); `fh` gate statuses vs Rulebook claim statuses
  scoped (fh algebra marked PROPOSED, not ratified); frankenjax Rulebook §5b
  addendum answering the binding eight questions; ECOSYSTEM.md v9-refs and
  unsourced "34 repos" corrected; frankentorch 98 → 116 unsafe sites;
  uniqueness-catalog franken_ocr releases documented (v0.5.0–v0.9.0); all 44
  packet legends list `[CI-observed]` as Tier 2 per Rulebook v1.1;
  method-page citation drift after legend insertions; `reader-template/`
  internal scaffolding removed from the public site tree; gates B/C/G
  regression repaired without weakening any gate.
- P2 (closed): slop trims ("genuinely threatening", "genuinely", "textbook"
  phrasing) across packets, synthesis briefs, and app.src.js ring notes;
  titles ≤60 chars; sitemap.xml (51 pages); robots.txt; skip links;
  ring-aware brief pagers.

### Wave 2 — closure audit + fresh cold pass
- Closure audit: 18/20 confirmed closed; 2 partials fixed (build.py:meta_desc
  now budgets for html.escape() expansion so all 44 brief descriptions are
  ≤160 chars in built HTML; 4 remaining non-compliant packet legends
  repaired — all 44 now list `[CI-observed]` as Tier 2).
- Cold pass (1 P0 / 5 P1 / 4 P2): P0 — method-page JS cited the
  franken_markdown zero-dependencies claim at :72 instead of :70 (fixed);
  P1 — desktop legend occluded the kit CTA (legend max-height raised,
  verified via elementFromPoint); og:image generated and wired into all 51
  pages; duplicated `.stat` CSS rule removed; "Invest · 0" filter disabled
  with explanatory tooltip; techniques/failure-modes/lessons/reproduce got
  full OG tags; mobile legend/controls collision not reproducible (no
  change); program attribution left OPEN for Josh's decision.

### Wave 3 — fresh hostile review + fixes (final confirmation wave)
- P0 (1, fixed): frankenredis brief presented the "internal guardrails always
  fail" formulation as Emanuel's explicit wording; the program's own source
  (synthesis/briefs/maintainer-writing.md) labels it a paraphrase ("thesis via
  page"). Brief reworded to explicit paraphrase attribution; the claim's
  source chip now points at the maintainer-writing brief, not the repository.
- P1 (3, fixed): lessons page attributed frankenlibc's 5.95×/12.39×
  harness-disagreement measurement to frankenscipy (re-attributed to
  frankenlibc, frankenscipy's fleet-wide adoption noted); site starter kit
  carried no snapshot disclosure vs the newer root kit (dated disclosure
  added — 28 items / two phases / 2026-09-22 snapshot, Phase C pending);
  mobile front door unusable at 390×844 (canvas given a real 300px band with
  reframed nodes, filter chips wrap with zero clipping, Verdict-table toggle
  moved to the top of the toolbar and styled for discoverability).
- P2 (3, fixed): stray source chips in the Tier-4 definition across 18/44
  briefs (root cause: place_chips() ran after verdict-key insertion; fixed
  with _shield_verdict_key(), all 44 briefs rebuilt, 0 remaining); Three.js
  canvas now has role="img" + factual aria-label; unsupported "Almost every
  app you use has a Redis sitting behind it" removed from the frankenredis
  brief and its meta/og descriptions.
- Re-verification: verify-site.sh 11/11 PASS; 10/10 page renders at 1440×900
  and 390×844 with zero console errors; desktop rendering pixel-identical
  to pre-fix.

## P1-4 disposition (program attribution)

Left exactly as-is per Josh's decision on 2026-09-23: no colophon, no
operator name, no contact added. The site continues to describe itself as
"an independent assessment program" without naming an operator.

## Gates status — 14 vendor-port rigor gates ride v11

`.gates-v1-complete` was absent at packaging time (grading still in progress,
round 10 at last check). Per the standing rule — gated work does not ship
before its explicit completion marker — v10 ships the validated 28-item
two-phase kit only. The root kit's Phase C (C1–C14 checkers, commit-msg hook,
src/ examples, extra templates) is not included. When the marker lands, the
gated kit ships in v11.

## Verification summary (packaging time)

- 44/44 site packets byte-identical to root finals; site RULEBOOK.md
  byte-identical to root RULEBOOK.md.
- verify-site.sh: 11/11 PASS. 51 pages, 0 broken internal links.
- Drive: same file updated in place (franken-assessments-44-v9.zip →
  franken-assessments-44-v10.zip, renamed); upload verified; local v9 deleted.
- Mac: changed site files synced to ~/franken-site/ with
  byte-identical check. Note: ~/franken-site/assets/vendor/
  three.core.js (unused, corrupted dev file) still awaits Josh's manual
  deletion — nothing loads it.
