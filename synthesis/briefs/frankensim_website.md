# Cross-Suite Brief — frankensim_website

**Analyst:** cross-suite analyst (44-packet sweep) · **Date:** 2026-09-22
**Own packet:** `~/workspace/franken-research/frankensim_website-assessment.md` (v8, pin `e179bafc`, Rulebook v1.0)
**Coverage:** own packet read fully; the other 43 packets skimmed on TL;DR, claim inventory, verdict/TRL/NODUS ring, benchmark/limitation sections, and license/governance.
**Evidence tiers used below are the packets' own** ([Counted], [Git-observed], [Code-verified], [CI-observed], [Maintainer claim], [External], [Verified], [Inference] with High/Medium/Low confidence). Every claim below quotes or cites its source packet; nothing is invented.

---

## 1. OWN-PACKET DISTILLATION

- **Verdict:** "a genuinely executable marketing site — its strongest claims are wired into the code, not the copy — carrying unacknowledged scaffold debt (wrong changelog, wrong package name, no license file) and a 32-day silence at the pin." (NODUS: Monitor)
- **TRL:** 8 — deployed and serving at frankensim.org with all routes resolving [Verified, High]; point off TRL 9 because demo execution was not observed by the analyst and the stats pipeline's freshness is admitted-stale.
- **NODUS ring:** Monitor [Inference, High] — "the Rulebook's ring rules name websites as textbook Monitor." Value is entirely derivative of the parent FrankenSim workspace.
- **Strongest strength:** The "live kernels" claim is structurally corroborated, not just asserted — "all 43 demo components (30 Lab across three tiers + 10 E2E campaigns + 3 flagship pipelines) route through a single shared Web Worker (`lib/use-fs-wasm.ts`, module-level singleton), every component verified to actually invoke `call<…>(…)` (not merely import the hook), 45 of 48 exports exercised, and no `fetch(` anywhere in the demo fleet" [Counted, High].
- **Strongest ceiling:** Decay by quiet desynchronization. Bus factor 1, no CI, 32-day silence at the pin [Git-observed + Code-verified, High], and "every freshness vector requires a human to remember, locally, to run it" [Inference, High] — "a frozen marketing site *decays in place*: the vendored WASM keeps running (it's static), while every number around it goes stale" [Inference, High].
- **Three most important pieces of evidence:**
  1. **Claim 3 — "same bytes the native build runs": partially demonstrated** [Counted, High on the wiring; the same-bytes linkage is unestablished]. All 43 demo components demonstrably invoke `call<…>("kernel", …)`; 45/48 WASM exports exercised; no network-data fakery path exists — but no hash links the vendored `.wasm` to a parent-repo commit.
  2. **Claim 9 — "The site is MIT-licensed": disproven (as a legal fact)** [Code-verified + External, High]. "README `## License\n\nMIT.` and footer 'MIT License' are text assertions; **no LICENSE file exists anywhere in the tree** and the GitHub API `license` field is `null` — there is no license grant, so the site is not open source under any OSI definition; default copyright applies."
  3. **Claim 2 — WASM anchor**: "SHA-256 of `public/fs-wasm/fs_wasm_bg.wasm` at the pin is `d4e3461ab091f8c8d1f78285f7d8214b5319166e423304a00404433710f46232` [Counted, High]" — recorded as the falsifiable anchor for the kill test (rebuild `crates/fs-wasm` from the parent repo and compare).

---

## 2. SHARED NEGATIVE PATTERNS

**Pattern 1 — Missing LICENSE file (default copyright).**
frankensim_website: claim 9 disproven [Code-verified + External, High]. Shared (missing-file form) with:
- beads-for-frankentui: "there is **no LICENSE file** and the GitHub API license field is null" [Code-verified/External, High]
- beads_for_franken_engine: "No LICENSE file — the 7.9 MB dataset is technically all-rights-reserved"
- franken_native_capsule: "no license text" (one squashed commit, "no license text, no releases" [Verified/External, High])
- franken_nlp: "no license file"
- frankensqlite_website: "No LICENSE file (default copyright — more restrictive than the engine's MIT+rider)" [Verified, High]
Caveat that matters: the *missing-file* form is shared with five others, but the **assertion-without-grant** form — README "MIT." + footer "MIT License" + no file + null API field — appears in no other packet (a grep for license assertions across all 44 packets found only frankensim_website). frankensqlite_website is the honest contrast: its badge "honestly reads 'Unspecified'" and its README quotes "default copyright protections apply" [Code-verified, High].

**Pattern 2 — README/metadata drift (the copy lags the code).**
frankensim_website: repo description "20 real Rust kernels" vs 30–40 in README/badge/live /lab [External, High]; `use-fs-wasm.ts` doc comment lists ~16 of 48 exports [Code-verified, High]; `app/sitemap.ts` omits /lab, /e2e, /beads — "the three most distinctive interactive pages" (claim 19) [Code-verified, High]. Shared with:
- franken_markdown_website: "the Lab Notes honesty strip and the README's deploy section are two engine versions stale (0.3.5 claimed vs 0.4.2 shipped vs 0.4.1 live), and the live page simultaneously claims both 0.4.1 and 0.3.5" [Verified, High]
- frankentui_website: "hero banner is now a small museum of stale claims: the '12 workspace crates' stat was true in February and the kernel has since grown to 20"
- frankensqlite_website: "'26-crate workspace' vs 28 counted crates — stale, and the staleness is **enforced by the site's own tests** (`expect(crates).toHaveLength(26))" [Verified, High]; CHANGELOG documents 17 of 29 commits
- franken_networkx: "The README is a drift source (13-variant tie-break → 12 counted; 33 fuzz targets → 34 counted…)" [Counted, High]
- franken_whisper: "CHANGELOG scope window 4 weeks stale at HEAD"
- frankentui: "the CHANGELOG describes a v0.9.0 release (2026-09-18) that exists on no surface GitHub tags, GitHub Releases, or crates.io can see"
- franken_drone_geometry_reconstruction: "README/IMPLEMENTATION_STATUS both claim '28 members' while the workspace has 30" [Counted, High]

**Pattern 3 — No observable CI; verification on maintainer-private infrastructure only.**
frankensim_website: "No `.github/workflows/` directory at the pin; no Actions badges in README" [Code-verified, High]. Shared with:
- franken_code_browser: "no CI workflows (the `.github` directory contains only issue templates" [Verified, High])
- franken_whisper: "no CI config in the tree"
- franken_overlap: "GitHub Actions is deliberately disabled, so no third party can observe test greenness; validation is owner-local via `scripts/ci-local.sh`" [Code-verified, High]
- franken_nlp: "GitHub Actions is disabled"
- franken_markdown: "the disabled CI workflow (name: 'DISABLED — releases use DSR exclusively', `if: ${{ false }}`)"
- franken_markdown_website: "no CI in this repo (`.github` 404s; every verification script is a manual `bun run`)"
- frankentui_website, frankensqlite_website: "no CI"
- frankengraphdb: "GitHub Actions was de-automated by owner ruling on 2026-09-03 ('we do not use gh actions for any reason, ONLY /dsr')"
- frankenterm: "no public CI (verification runs on maintainer-private DSR)"
- frankentui: "GitHub Actions was disabled 2026-09-06 so all verification runs on maintainer-private DSR"
- asupersync: "zero workflow runs exist at the pinned commit … every behavioral claim about the assessed tree rests on maintainer-run DSR gates, unobservable externally" [CI-observed, High]

**Pattern 4 — Frozen/stale vendored data (the museum artifact).**
frankensim_website: beads DB "1,741 issues, July" shipped as a 16 MB binary [Counted + Git-observed, High]; WASM blob rebuilt by hand with no rebuild trigger; hero stats last recomputed 2026-07-22. Shared with:
- beads-for-frankentui: "the snapshot is frozen at **2026-03-08** — 197 days (~6.5 months) before the pin" [Code-verified, High]
- beads_for_franken_engine: "One commit, last pushed 2026-03-09; data 197 days stale" [Counted, High] — "all 1,180 tracked issues closed in the live journal, which has grown to 4,537 beads"
- franken_markdown_website: "the repo carries six wasm trees (23 of 28 MB) of which five are dead weight, and two different binaries both wear the 0.3.5 label" [Counted, High]

**Pattern 5 — Bus factor 1 with refused outside contributions (universal across the suite).**
frankensim_website: "All 35 commits in the visible history … are authored by Jeffrey Emanuel" [Git-observed, High]; README "About Contributions" states PRs will not be merged directly [Maintainer claim, High]. Every packet's bus factor reads 1. Explicit-refusal sharers include:
- franken_nlp: "the bus factor is 1 *by stated policy* ('I do not accept outside contributions')"
- franken_term: "bus factor 1 by **explicit, deliberate policy** (no outside contributions accepted)"
- frankentui_website: PRs "'reviewed by Claude or Codex' but never merged"
- frankensqlite_website: *"Please don't take this the wrong way, but I do not accept outside contributions for any of my projects…"* [Maintainer claim, High]
- franken_ocr, franken_snowflake, franken_sqlite, franken_agent_detection, franken_manim, franken_markdown_website, franken_jax, asupersync: all carry explicit no-outside-contributions policies [Maintainer claim / Code-verified, High].

---

## 3. CI/EVIDENCE BAR — what frankensim_website demonstrates that other packets lack

Honest framing first: frankensim_website has **no CI at all** [Code-verified, High], so this section is evidence practice, not continuous practice. The genuinely uncommon practices:

1. **Per-component wiring census of the demo fleet ("prove the demo is real").** Every one of 43 demo components was verified to actually *invoke* `call<…>(…)` — not merely import the hook — 45 of the 48 wasm-bindgen exports are exercised, and zero `fetch(` calls exist anywhere in the demo fleet, so no network-data fakery path exists [Counted, High]. *Who lacks it:* franken_markdown_website verified its playground's worker protocol [Code-verified, High] but never census-checked its engine surface — five of its six wasm trees are dead weight; frankentui_website ships "per-file sha256 + a pinned kernel SHA" [Code-verified, High] but reports no export-exercise census of its WASM demo; the frankentts.com (franken_tts) and browser playground (franken_ocr) packets report no such check at all.

2. **A falsifiable binary-artifact anchor tied to a named kill test.** The packet records SHA-256 `d4e3461a…` of `fs_wasm_bg.wasm` [Counted, High] plus the explicit kill test: "Rebuild `fs_wasm_bg.wasm` from the parent repo's `fs-wasm` crate at whatever commit the maintainer names as its source, and compare SHA-256 hashes: if they differ, the 'same bytes the native build runs' claim … is falsified" [Inference, High]. *Who lacks it:* frankentui_website has the hashes but "the only thing missing is a signature binding them, so a visitor can't verify 'this demo is that commit' without trusting the host" — the hash exists without the checkable claim; franken_markdown_website's six wasm trees have no recorded anchor at all.

3. **Compute-from-source stats scripts with a documented regeneration flow.** `scripts/compute-stats.mjs` + `generate-atlas.mjs` exist with a documented `FRANKENSIM_DIR` flow [Code-verified, High] — "computed, not typed" as mechanism. *Who lacks it:* frankensqlite_website hand-freezes its hero stats ("26-crate" enforced by `expect(crates).toHaveLength(26)`); frankentui_website's hero banner went stale ("12 workspace crates" → 20 grown); franken_markdown_website's Lab Notes are "two engine versions stale". The honest caveat: the scripts "do not run at deploy time — the README's own Limitations section admits deployed numbers can go stale" [Code-verified, High] — so frankensim_website demonstrates the *existence* of scripted recompute where others hand-type, but not the scheduling. (The scripted live-check itself is one frankensim_website does *manually* while franken_markdown_website owns the automated form: its `verify:live` script "sha256-compares every production asset" and "reports 8 stale assets with the wasm glue matching no committed tree, exit nonzero" [Verified, High].)

---

## 4. SHARED HURDLES

- **Bus factor 1.** frankensim_website: 35/35 commits by Jeffrey Emanuel [Git-observed, High]; 0 open issues, 1 fork, 8 stars [External, High]; no succession plan. Universal across all 44 packets; the sharpest shared instances are franken_networkx ("bus factor is 1 (single GitHub contributor, 8,808 contributions [External, High])") and frankenscipy ("bus factor 1 (6,395 commits by a `claude` contributor, 158 by the human owner)").
- **License/governance gap.** The missing LICENSE file is shared with five repos (§2 Pattern 1). The suite-standard form — "MIT plus a non-OSI OpenAI/Anthropic/affiliates/agents exclusion" (~37 repos, [Code-verified (license text), High] in their packets) — is absent here: "this one carries **no rider at all**, because it carries no license text at all" (own §4.8). "Whether the omission here is deliberate (a marketing site wants maximum shareability) or accidental (the LICENSE file was never copied from the scaffold) is unestablished" [Inference, Medium].
- **README drift** (§2 Pattern 2) — the suite-wide copy-vs-code staleness class.
- **Velocity-vs-decay: the quiet pin.** frankensim_website: "untouched for 32 days (pin 2026-08-21)" [Git-observed, High]. Shared with franken_drone_geometry_reconstruction ("development stopped 2026-09-04"), franken_overlap ("18 days quiet at assessment"), franken_native_capsule ("no commit to the default branch in 33 days"). The shared failure mode: "fossilizes at 200 OK" (frankentui_website [Inference, Medium]) — a serving artifact that is simultaneously a museum.
- **Stale vendored data** (§2 Pattern 4).
- **No observable CI** (§2 Pattern 3) — including the suite-specific DSR-only verification culture (frankengraphdb, frankentui, frankenterm, franken_markdown, asupersync).

---

## 5. GENUINE UNIQUENESS — things no other packet does

1. **The only repo in the suite that asserts a license it does not grant.** A grep across all 44 packets found no other repo combining a README/footer license assertion with no LICENSE file and a null API `license` field. The contrasts are sharp: frankensqlite_website's badge "honestly reads 'Unspecified'" with a README quoting "default copyright protections apply" [Code-verified, High]; the other four no-LICENSE repos (beads-for-frankentui, beads_for_franken_engine, franken_native_capsule, franken_nlp) assert nothing. [Code-verified + External, High]
2. **The only repo with scaffold fossils from a *sibling site project*.** `package.json` still named `asupersync-website`, all six CHANGELOG entries linking to `Dicklesworthstone/asupersync_website` commits (newest 2026-03-16), `trustedDependencies: ["sharp"]` drift — with GitHub API `fork: false`, i.e. copy-paste lineage, not a fork [Code-verified + External, High]. A grep for `asupersync_website` across the other 43 packets returned zero hits. (Own next step 2 proposes the suite-wide audit that would falsify the one-off theory.)
3. **The only executable-numerics demo fleet with a counted wiring census.** 48 wasm-compiled numerical kernels, 43 demo components in three explicit tiers (10 foundations + 10 frontier + 10 deep) + 10 E2E campaigns + 3 flagship pipelines, singleton Web Worker, zero-copy `Float64Array` transfer — and the packet's per-component `call<…>` census + zero-`fetch(` guarantee [Counted + Code-verified, High]. Comparators: frankentui_website has one interactive WASM demo ("pinned to a kernel commit SHA … per-file sha256"); franken_markdown_website has a single two-pane playground; frankensqlite_website's "demo" is a spec-evolution SQLite viewer (data archaeology, not kernel execution); frankentts.com (franken_tts) and franken_ocr's browser playground run ML models, not numerical kernels. No other packet assesses a website whose core mechanism is *in-browser execution of compiled Rust numerics with a verified no-fake wiring census*.
4. **The beads-viewer-as-89%-of-the-tree embedding.** A 39 MB vendored SQLite issue-viewer (16 MB `beads.sqlite3` + full viewer app) inside a marketing site — "~89% of the 44 MB working tree (excluding `.git`)" [Counted, High]. The standalone dashboards (beads-for-frankentui, beads_for_franken_engine) are `bv --pages` generated repos unto themselves; no other marketing-site packet vendors a second product this way. (Own §4.10 places it at Wardley **genesis**: "nobody else ships their issue tracker as a static SQLite artifact inside their homepage.")
5. **What it pointedly does NOT do (negative uniqueness, honestly labeled):** it is the only packet whose core CI-adjacent evidence practice had to be performed *manually by the analyst* because the repo has none — and the only website packet whose value proposition ("cannot be faked") is explicitly unfalsifiable as shipped: "no parent-repo commit SHA, no build recipe output hash, no reproducible-build attestation for `fs_wasm_bg.wasm`" [Inference, High] — the packet's own phrasing, "the unoccupied lane."

(Explicitly *not* unique — shared, so excluded: Monitor ring (shared with the four other website packets + franken_nlp); no CI (shared with 11+ repos); stale hero stats (frankentui_website, frankensqlite_website, franken_markdown_website); Bun-only toolchain (frankensqlite_website is also bun-only); vendored WASM demo (frankentui_website, franken_markdown_website, franken_tts, franken_ocr all have one).)

---

## 6. CROSS-POLLINATION IN — concepts from other packets frankensim_website should adopt

1. **WASM provenance pinning** → *origin: frankentui_website* → **why it fits:** frankensim_website's load-bearing claim 3 ("same bytes the native build runs") is [Code-verified on wiring; unestablished on linkage]; frankentui_website demonstrates the missing half in production — its "WASM demo ships `version.` … per-file sha256 + a pinned kernel SHA" [Code-verified, High], and names only the signature binding as missing. → **payoff:** claim 3 flips from partially-demonstrated to demonstrated; the own-packet kill test (open question 1) becomes a one-command check; this is own next step 3 with a proven in-suite reference implementation.

2. **`verify:live` script** → *origin: franken_markdown_website* → **why it fits:** frankensim_website's live-route checks were done manually by the analyst on 2026-09-22 [Verified, High], and its own open question 6 admits "the pin and the site are two different artifacts" (the 2026-09-04 dangling push, Vercel deploy provenance unestablished). franken_markdown_website owns the automated form: a "`verify:live` script that sha256-compares every production asset" which "reports 8 stale assets with the wasm glue matching no committed tree, exit nonzero" [Verified, High]. → **payoff:** mechanizes deploy-provenance detection; the pin-vs-live desync and the next stale-asset drift become CI failures instead of analyst findings.

3. **Claim-discipline gate** → *origin: franken_markdown* → **why it fits:** frankensim_website's drift class is exactly un-gated copy — repo description "20 kernels" vs 30–40 [External, High], doc comment "~16 kernels" [Code-verified, High], sitemap hole on /lab /e2e /beads (claim 19) [Code-verified, High], floored "100+ crates" vs 109 counted. franken_markdown wires "`claims.tsv` + `check-claim-discipline.sh` … each README claim to a `capabilities --json` key and a proof script — marketing hygiene as CI, a discipline no incumbent practices" [Verified, High]. → **payoff:** description, doc comments, sitemap coverage, and atlas counts re-derive from the tree at build time; the fossil-claim class becomes a build failure.

4. **Truth pack (pinned-source pin record)** → *origin: franken_ocr* (and franken_tts) → **why it fits:** frankensim_website's vendored artifacts (`fs_wasm_bg.wasm`, `beads.sqlite3`, wasm glue) have no in-repo pin record — the provenance gap behind claims 2–3 and open question 1. franken_ocr's "Phase −1 'truth pack' pinning the exact model source commit and fixture hashes" [Verified, High] (franken_tts: "pinned truth pack (HF weights @ `5d83992`, upstream source @ `022e286`)") is the in-suite template. → **payoff:** "cannot be faked" becomes checkable in-repo; own Q7's agent-era use case ("a machine-readable kernel manifest … so the agent can cite *which* code it ran") becomes buildable.

5. **Green-at-pin CI lane incl. scheduled refresh** → *origin: frankenscipy / franken_threed* → **why it fits:** frankensim_website's anti-drift machinery (`compute-stats.mjs`, `generate-atlas.mjs`) is human-triggered and the repo has zero CI; frankenscipy keeps "CI gates G1–G9 green at the pin" and franken_threed runs "one GitHub Actions workflow (green at the pin)" with a differential harness the analyst re-executed 61/61 locally [Verified, High]. → **payoff:** scheduled stats refresh + build + verify:live moves the Wardley placement from custom-built ("a scheduled job away from real self-maintenance" [Code-verified, High]) toward product; closes revisit triggers 5 and decides the museum-vs-instrument bifurcation.

---

## 7. CROSS-POLLINATION OUT — frankensim_website concepts to export to named projects

1. **License-assertion audit** (own next step 4) → *targets: beads-for-frankentui, beads_for_franken_engine, franken_native_capsule, franken_nlp, frankensqlite_website* → **why it fits them:** the five other no-LICENSE-file repos; frankensqlite_website is honest ("Unspecified") but still default-copyright, and the audit's assertion-vs-grant-vs-API-license-field table is the exact check that catches the next "MIT."-without-grant. → **payoff:** suite-wide legal hygiene; frankensim_website becomes the reference case (revisit trigger 1: LICENSE file appears → closes the sharpest finding).

2. **Fork-fossil audit** (own next step 2) → *targets: frankentui_website, franken_markdown_website, frankensqlite_website* → **why it fits them:** the other three suite marketing sites, each presumably scaffolded from a sibling template (frankensim_website found three `asupersync_website` remnants "without trying"). → **payoff:** per-repo remnant table (package names, changelogs, comments, README links); zero remnants everywhere falsifies the one-off-scaffold-slip theory — either outcome is a governance finding.

3. **Demo-wiring census method** (43/43 components invoke `call<…>`, 45/48 exports exercised, zero `fetch(` in the demo fleet) → *targets: franken_markdown_website, frankentui_website, franken_tts, franken_ocr* → **why it fits them:** every one ships a browser WASM demo as an evidence vehicle; franken_markdown_website's fleet has "six wasm trees … five are dead weight, and two different binaries both wear the 0.3.5 label" [Counted, High] — the census would have caught the dead weight; frankentui_website's pinned-SHA demo lacks a demonstrated export-exercise check. → **payoff:** "prove the demo is real, not decorative" generalized — kills decorative-demo drift across the suite's evidence vehicles.

4. **Singleton-worker embeddable unit** (~140 lines: `lib/use-fs-wasm.ts` + `public/fs-wasm/worker.js`; module-level singleton, `import *` auto-exposes every wasm-bindgen export, zero-copy `Float64Array` transfer [Counted + Code-verified, High]) → *targets: franken_markdown_website, frankentui_website, frankentts.com (franken_tts), franken_ocr's browser/WASM playground* → **why it fits them:** all run wasm-bindgen modules inside workers; the pattern is framework-free (only the hook is React) and auto-exposes new exports without glue edits. → **payoff:** one WASM instance per page instead of per-demo; new kernels become demoable with no worker-code changes; own Q2's "kernel playground" route becomes trivial.

5. **Stats watermarking** (own next step 3: stamp the parent commit SHA into `lib/content.ts`, render "computed from FrankenSim @ `abc123`" next to hero numbers) → *targets: frankentui_website, frankensqlite_website, franken_markdown_website* → **why it fits them:** all three fail on the admitted-staleness class — frankentui_website's hero banner "fossilizes at 200 OK" ("12 workspace crates" from February vs 20 grown), frankensqlite_website's "26-crate" figure is frozen by its own test (`expect(crates).toHaveLength(26)`), franken_markdown_website's Lab Notes are two versions stale. → **payoff:** staleness becomes a visible, visitor-checkable metric ("the data's birthday") instead of an analyst-only discovery.

---

*Brief compiled 2026-09-22 from the 44 Rulebook v1.0 assessment packets. All cross-packet claims cite the cited packet's own evidence tiers; quoted strings are verbatim from those packets. No facts invented.*
