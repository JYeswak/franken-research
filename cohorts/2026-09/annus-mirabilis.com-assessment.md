# Annus Mirabilis (annus-mirabilis.com): RULEBOOK v1.1 Assessment Packet, cohort 2026-09

## 4.1 Header

| Field | Value |
|---|---|
| Repository | https://github.com/Dicklesworthstone/annus-mirabilis.com |
| Pinned commit | `d33916fac50b509d132c1145b6284a2c6102f2ca`, committed 2026-09-24T18:45:47-04:00 (22:45:47Z), subject "chore(tracker): close am-r2-shows-every-step-lq-26jg and am-r2-shows-every-step-sr-qqye" **[Git-observed, High]** |
| Later HEAD not read | None. At 00:30Z on 2026-09-25 the GitHub API still reported the pin as `main` HEAD (`compare` ahead_by 0). The repository moves at hundreds of commits a day, so any later HEAD is unread by this packet. **[External, High]** |
| Created / last push | Created 2026-09-14T22:14:28Z; `pushed_at` 2026-09-24T22:45:50Z, the pin's push **[External, High]** |
| Language | GitHub primary language TypeScript. Languages API bytes: TypeScript 22,996,588; JavaScript 2,701,800; CSS 497,487; Swift 287,078; Rust 48,207; HTML 26,572; Python 20,401 **[External, High]** |
| License | `LICENSE` first line: "MIT License (with OpenAI/Anthropic Rider)". The rider is present in full. GitHub API `license: NOASSERTION` **[License-verified, High]** |
| Stars / forks / open issues | 3 / 0 / 0 **[External, High]** |
| Releases / tags / GitHub deployments | 0 / 0 / 0 **[External, High]** |
| Live site | https://annus-mirabilis.com, served by Vercel **[Verified, High]** |
| Assessment date | 2026-09-24 (US Eastern). Live-site and API checks ran between about 00:10Z and 00:35Z on 2026-09-25. |
| Analyst | One agent session (Claude Opus 5.5, Anthropic), cohort 2026-09. Pending review by a different-lineage agent. |

**Method.** Full (not shallow) clone of the default branch into scratch storage, read-only, so that commit history could be counted; the Rulebook asks for a shallow clone, and the extra depth changes nothing at the pin. 4,841 tracked files, 4,663 commits. Read: `README.md` in full, `LICENSE` verbatim, `NOTICE.md` and `THIRD_PARTY_NOTICES.md` excerpts, `AGENTS.md` sections (status, OCR policy, swarm operations), `docs/OWNERS.md`, `docs/DECISIONS.md` entries, all six provenance receipts in `docs/provenance/`, `package.json`, `next.config.mjs`, `vercel.json`, all five workflow files, `public/wasm/manifest.json`, the `fs-annus-wasm` crate manifest, `src/app/notation/notationData.ts`, all four German transcripts, all 43 mass-energy English translation units. Recomputed: SHA-256 of all six facsimiles and both shipped `.wasm` files; notation concordance counts (by re-implementing the loader's filter in Python over the YAML, not by running the project's code); the printed physical constants by hand arithmetic. Compared the mass-energy transcript in full and the relativity transcript (22 of 31 pages) word by word against German Wikisource, and settled every disagreement by reading the pinned facsimile's page image (rendered with `pdftoppm`) myself. Checked bibliographic metadata for all six DOIs against the Crossref API and publication dates against English Wikipedia. Queried the Actions API for all 3,112 workflow runs and read the failed-step logs of the three runs at the pin. Fetched the live site with `curl` (four papers, three faces each, sitemap, one lab page).

**Not done.** No `bun install`, no build, no test run (all need a dependency install; the brief allows only install-free local runs). No browser execution; the site was read as served HTML only. The Rust transport crate's native tests were attempted through RCH and refused (see §4.5). No iOS build. No human review of the translation. The English Wikipedia and German Wikisource texts used as comparison witnesses are community-edited and are not authorities; where they disagreed with the transcript, the page image decided.

**Tier legend (Rulebook §1).** Tier 1 **[Verified]**, direct inspection by the analyst, with flavors **[Counted]** (analyst ran the count), **[Git-observed]** (git metadata), **[Code-verified]** (source read at the pin), **[License-verified]** (license text read verbatim), **[Plate-verified]** (read by the analyst from a rendered page image of the pinned facsimile PDF). Tier 2 **[CI-observed]**, seen on GitHub Actions run pages or logs; attests that a run happened and, where legible, its verdict. Tier 3 **[Maintainer claim]**. Tier 4 **[External]**, third-party sources and APIs (GitHub API, Crossref, Wikipedia, Wikisource, web search). Tier 5 **[Inference]**. Confidence: High, Medium, Low.

### Screening (candidates/README.md, predicates 1 to 7)

| # | Predicate | Result | Evidence |
|---|---|---|---|
| 1 | Public | Pass | `private: false`; cloned over HTTPS without credentials **[Verified, High]** |
| 2 | Rust | **Fail** | Primary language TypeScript. Rust is present but small: one 366-line transport crate (`scripts/wasm-artifacts/fs-annus-wasm`, plus 530 lines of tests) that compiles FrankenSim sources by reference, and one test fixture **[Counted, High]**. Predicate 2 fails under the published rule, which requires all seven predicates and has no website exception. The brief for this packet directs that the repository be assessed as a website, the way the pinned 44 assessed four TypeScript website repositories; that is a separate scope exception (DEC-002, `.atlas-arc/registries/decisions.jsonl`), not a screening pass. Rulebook §4.9's website-to-Monitor mapping is a ring rule, not a screening waiver. |
| 3 | Active | Pass | Last push 2026-09-24 **[External, High]** |
| 4 | Agent-built signal | Pass | `AGENTS.md` at root (147 KB). 3,050 of 4,663 commits carry `Co-authored-by` trailers naming models (most often "Claude Opus 5.5", 1,590; "Claude Opus 5", 999; also Grok, Claude Sonnet 5, Antigravity); 26 of the last 30 do **[Git-observed, High]** |
| 5 | Not a fork | Pass | `fork: false` **[External, High]** |
| 6 | Not already covered | Pass | Not among the 44; no earlier `candidate` issue in JYeswak/franken-research names it; `watch/state.json` lists it as the daily watch's ordinary coverage **[Verified, High]** |
| 7 | Not Dicklesworthstone's | Fails; set aside for the cohort | The 2026-09 cohort was approved to cover repositories Dicklesworthstone created after the 44 |

This is a real, active project, not a smoke-test page, so a packet is written.

---

## Hook

On page 639 of *Annalen der Physik* 18, the second paragraph of Einstein's E = mc² paper speaks of the Maxwell-Hertz equations "für den leeren Raum". German Wikisource's proofread transcription (revision 5052266) reads "für den leeren Baum" (for the empty tree). The pinned scan in this repository prints "Raum", and the repository's machine-drafted transcript has "Raum" **[Plate-verified, High]**. On the same comparison over 22 pages of the relativity paper, the repository's draft keeps a printer's error the original really has ("Eektrodynamischer Teil", p. 907), and it also introduces two errors of its own ("der starren Körper" for "des starren Körpers", p. 892; a doubled word fragment at the p. 899/900 break) **[Plate-verified, High]**. That is the project in miniature: careful, checkable source work, still at the draft stage, and labelled as a draft.

## TL;DR

- **What it is.** A Next.js static-export website (with a SwiftUI iPhone shell in `ios/`) that aims to be a critical edition of Einstein's four 1905 papers: pinned facsimiles, German transcriptions, a new sentence-aligned English translation, layered explanations, and 33 interactive "instruments" **[Code-verified, High]**. Ten days old at the pin, 4,663 commits, written by one maintainer directing agent swarms **[Git-observed, High]**.
- **Strongest evidence.** The README's status block is dated and names a command for each clause, and every clause I could re-run held: 6 facsimiles whose SHA-256 match their receipts, 4 machine-draft German ledgers and no reviewed one, 43 English draft units for one paper and 0 reviewed, 190 notation entries over 124 glyphs, 33 instrument pages live, no FrankenSim result wired into a reader page, 55 empty reviewer slots **[Counted + Verified, High]**. The bibliographic apparatus matches Crossref for all six articles, and the received and published dates match the plates and Wikipedia **[External + Plate-verified, High]**.
- **Strongest doubts.** Nothing is reviewed: no German ledger, no translation, no explanation, and the only named person is the owner **[Verified, High]**. Only one of four papers has an English draft **[Verified, High]**. CI is red at the pin on all three push workflows, and Quality Gates has passed 5 times in 1,049 runs, last on 2026-09-17 **[CI-observed, High]**. Three German ledgers were drafted from the scan's OCR text layer during a period when the project's own policy forbade that, which the project recorded as a contradiction after the fact **[Maintainer claim, High]**.
- **Verdict.** NODUS **Monitor** (a website; Rulebook §4.9). TRL **7**. CI **C2**. Release **R1**. License **MIT + OpenAI/Anthropic rider** (non-OSI). Bus factor **1**.

## Quick links (pin-relative)

1. [Repository](https://github.com/Dicklesworthstone/annus-mirabilis.com)
2. [README at pin](https://github.com/Dicklesworthstone/annus-mirabilis.com/blob/d33916fac50b509d132c1145b6284a2c6102f2ca/README.md)
3. [LICENSE at pin](https://github.com/Dicklesworthstone/annus-mirabilis.com/blob/d33916fac50b509d132c1145b6284a2c6102f2ca/LICENSE)
4. [Mass-energy provenance receipt](https://github.com/Dicklesworthstone/annus-mirabilis.com/blob/d33916fac50b509d132c1145b6284a2c6102f2ca/docs/provenance/ap-18-639.md)
5. [Live site](https://annus-mirabilis.com), [mass-energy German face](https://annus-mirabilis.com/papers/mass-energy/view/german/), [mass-energy English face](https://annus-mirabilis.com/papers/mass-energy/view/english/), [lab BM-05](https://annus-mirabilis.com/lab/bm-05/)
6. Actions runs at the pin: [Quality Gates #1049](https://github.com/Dicklesworthstone/annus-mirabilis.com/actions/runs/36069233818), [Browser Acceptance #951](https://github.com/Dicklesworthstone/annus-mirabilis.com/actions/runs/36069233706), [Brownian laboratory preview #1097](https://github.com/Dicklesworthstone/annus-mirabilis.com/actions/runs/36069233842), all failure
7. Upstream numerical owner: [FrankenSim](https://github.com/Dicklesworthstone/frankensim) (assessed in the 44 as Explore, TRL 4); architecture donor: [classic-patents.com](https://github.com/Dicklesworthstone/classic-patents.com) (not assessed)

---

## 4.2 Executive verdict

Annus Mirabilis is a deployed, statically exported Next.js site that presents Einstein's 1905 *Annalen* papers as a pinned-source edition with German drafts, one English draft, notation tools and 33 host-computed physics instruments; its content is unreviewed by anyone but its editor, and it says so on its first screen. TRL 7 **[Inference, Medium]**: the application runs in its operational environment with every route serving, but the product it defines, a reviewed critical edition with a translation of all four papers, does not exist yet (one of four English faces, three of four German faces, zero reviewed units). NODUS ring **Monitor** **[Inference, High]**, because the Rulebook reserves Monitor for websites, and because its value to the program is as a FrankenSim consumer that does not yet consume. The most important strength is source provenance that holds up under outside checking: six SHA-256-pinned scans matching their receipts, bibliographic data matching Crossref, and a status README whose every re-runnable clause I reproduced **[Verified, High]**. The most important ceiling is the absence of human review, which the project's own rules make a precondition for calling anything reviewed; 55 reviewer slots are open and there is no public route (no issues, no contributing guide) by which a reviewer would arrive **[Verified, High]**.

## 4.3 Claim inventory

Status values follow Rulebook §4.3. Each row was checked against the pin on 2026-09-24.

| # | Claim (source) | Status | Evidence | Tier, confidence |
|---|---|---|---|---|
| 1 | "annus-mirabilis.com serves the application. Each of the four papers answers 200 at /papers/<slug>/" (README) | demonstrated | `curl` returned 200 for all four papers and for all twelve `/view/german/` and `/view/english/` routes; `server: Vercel` | [Verified, High] |
| 2 | "All 33 core instruments, lq-01 to me-03, have a page in the live /sitemap.xml" (README) | demonstrated | Live sitemap has 205 `<loc>` entries, 33 distinct `/lab/(lq|bm|sr|me)-NN/` ids | [Verified, High] |
| 3 | "Six pinned facsimiles, each matching the SHA-256 in its receipt" (README) | demonstrated | 6 PDFs in `public/papers/pdfs/`; `shasum -a 256` of each equals the `sha256` in `docs/provenance/<key>.md` (6/6) | [Counted, High] |
| 4 | Bibliographic apparatus: series 4 vols 17, 17, 17, 18 (whole-series 322, 322, 322, 323), pages 132–148, 549–560, 891–921, 639–641; dissertation 19: 289–306; correction 34: 591–592 (README table, receipts) | demonstrated | Crossref API for all six DOIs returns the same volume, issue and page ranges | [External, High] |
| 5 | Received 18 Mar, 11 May, 30 Jun, 27 Sep 1905; published 9 Jun, 18 Jul, 26 Sep, 21 Nov 1905 (README) | demonstrated | Received dates: 30 June read on the p. 921 page image; 11 May from the scan text layer of p. 560; 18 March and 27 September from the transcripts of pp. 148 and 641. All four received dates and all four publication dates match English Wikipedia "Annus mirabilis papers" | [Plate-verified + Code-verified + External, High] |
| 6 | "Sixty-three journal pages carry the four arguments: 17, 12, 31, and 3" (README) | demonstrated | Inclusive page counts from the Crossref ranges sum to 63 | [Counted, High] |
| 7 | Notation: Einstein writes light speed as V (L in the light paper), viscosity k, radius P, never writes h, his β is the modern γ (README) | demonstrated | Transcripts: `L die Lichtgeschwindigkeit` (light quanta), `Reibungskoeffizienten $k$`, `Kugelradius $P$`, `\beta = \frac{1}{\sqrt{1 - (v/V)^2}}` (relativity); the only "h" in the light-quanta transcript is the abbreviation "d. h."; the scan text layer agrees on k and P | [Code-verified, High] |
| 8 | "Einstein's printed numbers are regression fixtures": N = 6.17×10²³, about 4.3 V at ν = 1.03×10¹⁵, about 0.8 µm in one second and about 6 µm in a minute (README) | partially demonstrated | The numbers are on the plates (pp. 136, 146; p. 559 text layer) and my arithmetic reproduces them: N = 6.1705×10²³ with α = 6.10×10⁻⁵⁷; Π = 4.3385 V; λ = 0.7948 µm (1 s) and 6.1564 µm (60 s) at 290.15 K, k = 1.35×10⁻², P = 5×10⁻⁵ cm, N = 6×10²³. The values appear in test files (e.g. `src/testing/constants.historical.test.ts`), but no test was run | [Plate-verified + Counted, High on the numbers; not run on the tests] |
| 9 | German face published for three papers; relativity withheld (README) | demonstrated | Live German faces show body text for light quanta, Brownian motion and mass-energy; the relativity face shows an untranscribed-pages notice | [Verified, High] |
| 10 | Relativity ledger "covers 22 of 31 pages (913-921 are missing)" (AGENTS.md, receipt) | demonstrated | In `ap-17-891-machine-draft.txt` the page blocks for printed pages 913–921 are empty; the other three transcripts have no empty pages | [Counted, High] |
| 11 | "No reviewed German ledger: four `*-machine-draft.txt` files and no `*-reviewed.txt`" (README) | demonstrated | `public/papers/transcripts/` holds exactly the four machine-draft files | [Counted, High] |
| 12 | "An English draft of mass and energy: 43 machine-drafted passages ... none is reviewed" (README) | demonstrated | 43 YAML units; all 43 `reviewState: "machine-draft"`; every unit's `translator.id` is `agent:claude-opus-5-5` | [Counted, High] |
| 13 | English faces for the other three papers read "not yet available" (README) | demonstrated | Live English faces: light quanta, Brownian motion and relativity each contain "not yet available"; mass-energy does not | [Verified, High] |
| 14 | "A notation concordance of 190 entries over 124 printed symbols" (README) | demonstrated | Five concordance files hold 194 entries; the loader drops 4 marked `printed: false` (all in light quanta), leaving 190 over 124 distinct glyph keys. The count includes the dissertation's 11 entries, which the README sentence does not say | [Counted, High] |
| 15 | "No FrankenSim result reaches a reader: the only .tsx that imports the WASM loader is a planted guard fixture" (README) | demonstrated | The only `.tsx` under `src/` referencing `workers/wasm` is `src/testing/fixtures/viewImportGuard/PlantedWasmLoader.fixture.tsx` | [Code-verified, High] |
| 16 | "Every number shown is a labelled host calculation" (README) | partially demonstrated | Live `/lab/bm-05/` labels each output "Host calculation (…). Owner …"; one of 33 labs sampled | [Verified, High on the sample] |
| 17 | "No reviewer is named except the owner: docs/OWNERS.md lists one person and 55 slots marked open: recruiting" (README) | demonstrated | `grep -c 'open: recruiting'` = 55; one filled row, `jemanuel` | [Counted, High] |
| 18 | The FrankenSim WASM artifact is content-addressed and pinned to a named upstream revision (manifest, THIRD_PARTY_NOTICES) | demonstrated | `public/wasm/manifest.json`: `wasmDigest` 80a1f8fd…a917bd, 92,751 bytes, `frankensim` 01824653087a…; my SHA-256 of the shipped file matches and the directory name is its 16-hex prefix; the revision exists in the public FrankenSim repository (committed 2026-09-24T02:45:55Z) | [Counted + External, High] |
| 19 | "public/wasm holds a 154-byte placeholder (manifest.json wasmBytes) ... not yet built or pinned" (AGENTS.md "Project Status", measured 2026-09-24) | stale | At the same pin the manifest points at the 92,751-byte bundle pinned to 01824653; the 154-byte file survives beside it in an older hash directory | [Code-verified, High] |
| 20 | "English translation: none yet (`ls content/translation-units`)" (AGENTS.md "Project Status") | stale | `content/translation-units/mass-energy/` holds 43 units at the pin; the README, updated the same day, reports them correctly | [Counted, High] |
| 21 | iPhone app "about 5,900 lines of Swift" (AGENTS.md) | stale | 54 Swift files, 6,264 lines | [Counted, High] |
| 22 | "Once the application scaffold lands, the standard commands will be ..."; "Architecture (Planned)" (README) | stale | The scaffold has landed: `package.json` defines `dev`, `gates`, `test`, `typecheck`, `lint`, `build`; the site is deployed | [Code-verified, High] |
| 23 | D-2026-09-21: after the text-layer drafting aid was withdrawn, "No implementation followed the withdrawn approval" (AGENTS.md, DECISIONS.md) | disproven, by the project itself | D-2026-09-24-text-layer-ledgers states that three receipts record drafting "from the OCR text layer ... corrected against the pinned page images" and that the earlier sentence "is contradicted by those receipts" | [Maintainer claim, High] |
| 24 | "MIT License with the OpenAI/Anthropic Rider" (README badge and License section) | demonstrated, with a metadata conflict | `LICENSE` carries the rider verbatim. The Rust crate's `Cargo.toml` says `license = "MIT OR Apache-2.0"`, which FrankenSim's own workspace manifest also says while its `LICENSE` is MIT + rider; no Apache text ships | [License-verified, High] |
| 25 | German texts are public domain, "Basis: Published over 70 years after the death of the author" (NOTICE.md) | disproven as worded; conclusion correct | The papers were published in 1905–1906, fifty years before Einstein's death in 1955. They are public domain because the author died more than 70 years ago (life + 70 ends 31 Dec 2025) and, in the US, because of pre-1931 publication **[Inference, Medium]** | [Code-verified, High on the wording] |
| 26 | Quality gates chain via `bun run gates` (README) | partially demonstrated | The chain exists and runs in CI; at the pin all three push-triggered workflows failed (see §4.5) | [CI-observed, High] |

**Aggregate.** The README's dated status block is the most accurate document in the repository: every clause I could re-derive held. Drift lives in `AGENTS.md`'s status section (three stale clauses measured the same day as the pin) and in the README's older "planned" framing. Given 772 commits on the pin's date, same-day staleness is expected; it is still drift **[Inference, High]**.

## 4.4 Architecture (reconstructed)

**Topology.** 4,841 tracked files: `src/` 3,449, `content/` 562, `scripts/` 388, `public/` 235, `docs/` 95, `ios/` 75 **[Counted, High]**. TypeScript and ESM code: 3,373 `.ts`/`.tsx`/`.mjs` files, 645,673 lines; of those, 2,863 files and 540,629 lines under `src/` **[Counted, High]**. Test files (`*.test.*`, `*.spec.*`): 1,563 files, 291,337 lines, about 45% of code lines **[Counted, High]**. 99 CSS files, no Tailwind **[Counted, High]**. 84 `page.tsx` routes under `src/app` and 41 lab directories **[Counted, High]**. Five planning documents at the root total 1,157,287 bytes; `AGENTS.md` names the site master plan and the iPhone plan as current and the other three (ASTRA, ASTRA_V2, FABLE) as superseded **[Counted + Maintainer claim, High]**.

**Build and deploy.** `next.config.mjs` sets `output: "export"`, so the site is exported as static HTML **[Code-verified, High]**. Next.js 15.5.25, React 19.0.0, KaTeX 0.18.4, Bun 1.4.0; 15 declared dependencies and devDependencies in total **[Code-verified, High]**. `vercel.json` disables git-triggered deployment and runs a Bun build; `AGENTS.md` says releases go only through `bun scripts/verified-production-deploy.ts` from the maintainer's machine **[Code-verified + Maintainer claim, High]**. There are no GitHub deployments and no public release id endpoint; the live site's `last-modified` header (2026-09-24T23:42:35Z) is later than the pin's commit time, so which commit is live cannot be established from outside **[External, High]**. A strict CSP forbids remote scripts and permits `wasm-unsafe-eval` **[Code-verified, High]**.

**Content model.** Content is data, compiled at build time: `content/` holds equations (156 files), experiments (54), arguments (52), foundations (50), scenarios (47), editorial (43), translation units (43), source blocks (36), gloss units (34), notation (5) and more **[Counted, High]**. The German text lives in marked-up transcripts (`[[ANNALEN-PAGE n]]`, `[[SPERR]]` for letter-spaced names, `[[FN-MARK]]`, TeX for mathematics) and a manifest of stable paragraph ids; translation units reference source ids and record translator identity, revision, review state and unresolved alternatives **[Code-verified, High]**.

**Provenance chain.** Each facsimile has a receipt with scan origin URL (Internet Archive `sim_annalen-der-physik_*` items), acquisition date, SHA-256 of the served extract, SHA-256 and page indices of the local parent volume, DOI, and a list of "watch items" checked against the plate (e.g. the α exponent and the Π·10⁷ misprint on the light-quanta paper) **[Code-verified, High]**. Parent volumes are gitignored (`/sources/`), so the chain from served PDF back to parent volume can be checked only on the maintainer's machine **[Code-verified, High]**.

**Numerics and FrankenSim.** Every instrument number is computed by TypeScript "reference owners" and labelled "host calculation" **[Verified, High on one sampled lab]**. The FrankenSim path is a 366-line Rust crate, `fs-annus-wasm`, that compiles three FrankenSim source files (`brownian.rs`, `diffusion1d.rs`, `philox_normals.rs`) by path from a sibling FrankenSim checkout, and whose `build.rs` refuses to compile unless those files are byte-identical to digests pinned in `src/pins.rs` (BLAKE3 via FrankenSim's `fs-blake3`) **[Code-verified, High]**. Its output, a 92,751-byte wasm bundle, ships in `public/wasm/` but no reader page imports it **[Code-verified, High]**.

**Unsafe, dependencies, asupersync.** The token `unsafe` does not occur in any `.rs` file of the crate (`src/`, `tests/`, `build.rs`) **[Code-verified, High]**; the FrankenSim sources it compiles by reference were not audited. `build.rs` hashes each referenced FrankenSim file and the dependency closure with `fs_blake3` and panics with "fs-annus-wasm refuses to build" on any mismatch **[Code-verified, High]**. Asupersync is not a dependency of anything that ships: it appears in plans, `AGENTS.md`, a profile-diagnosis test module (`src/testing/asupersyncProfile.ts`) and a hardcoded revision string in `scripts/build-wasm-artifacts.ts`; the shipped manifest's `revisions` block names only FrankenSim **[Code-verified, High]**.

**iOS.** `ios/` holds an Xcode project, 54 Swift files (6,264 lines), unit and UI test targets; the maintainer says it runs in the simulator only and is validated locally, not in CI **[Counted + Maintainer claim, High]**.

**Work tracking.** `.beads/issues.jsonl` holds 663 issues: 487 open, 153 closed, 14 in progress, 6 blocked, 2 deferred, 1 tombstone **[Counted, High]**. A corrupted database backup (`.beads/beads-BROKEN-v0-1789791445.dbbak`, 372,736 bytes) is committed **[Counted, High]**.

## 4.5 Benchmark and conformance audit

The site publishes no performance benchmarks of its own. `perf/profiles.json` and two scheduled budget workflows exist **[Code-verified, High]**; their thresholds were not audited. For an edition, the conformance question that matters is textual accuracy against the primary source, and that is what this section measures.

**Textual conformance: independent checks by the analyst.**

| Check | Result | Tier |
|---|---|---|
| Mass-energy transcript (3 pages) vs German Wikisource ("korrigiert", revision 5052266), word by word | 580 vs 572 words; the only prose disagreement is Raum/Baum on p. 639 line 5. The page image prints "Raum": the transcript is right and Wikisource is wrong. Other differences are footnote placement and "cos" tokens from rendered mathematics | [Plate-verified, High] |
| Relativity transcript (printed pp. 891–912) vs German Wikisource (revision 5052298) | 4,450 vs 5,843 words (Wikisource also covers pp. 913–921). Four substantive disagreements. p. 907 "Eektrodynamischer Teil": the plate prints this misprint, so the transcript is diplomatically right and Wikisource silently corrected it. p. 892 "Kinematik der starren Körper": the plate prints "des starren Körpers", transcript wrong. pp. 899/900: the plate hyphenates "Anfangs-/punkt"; the transcript has "Anfangspunkte" then "punkt", a page-break defect. "Wertsystem" (p. 898): Wikisource splits the word; not checked on the plate | [Plate-verified, High] |
| Light-quanta α exponent (receipt watch item with "no second witness") | My render of p. 136 at 300 dpi reads "α = 6,10 . 10⁻⁵⁶", agreeing with the receipt. This is a second reading of the same scan, not a second witness. With α = 6.10×10⁻⁵⁶ the printed N comes out 6.17×10²², so the printed exponent is inconsistent with the printed result, as the receipt says | [Plate-verified, Medium] |
| Light-quanta p. 146 "Π . 10⁷ = 4,3 Volt" (receipt `typo-pi-exponent-p146`) | The plate prints "Π . 10⁷" three lines after "Π . 10⁻⁸ das Potential in Volts". Confirmed as recorded | [Plate-verified, High] |
| Mass-energy English draft (43 units) vs the German | I read every unit against the transcript. No omissions and no mistranslations found; "Folgerung" is carried as "conclusion" with "consequence" recorded as an unresolved alternative. The analyst is not a qualified German-source reviewer and is an Anthropic model, as is the translator | [Inference, Medium] |

**Reading of the textual evidence.** On the pages compared, the published draft (mass-energy) has no error I could find, and the unpublished draft (relativity) has about one defect per 11 pages against the plates **[Counted, Medium]**. Two points cut the other way. First, three of the four ledgers were drafted from the Internet Archive OCR text layer and then corrected against the images (DECISIONS D-2026-09-24-text-layer-ledgers) **[Maintainer claim, High]**, so the transcript and the text layer are not independent witnesses; Raum/Baum was settled by the image, not by their agreement. Second, a sample of 25 pages from two papers says nothing about the light-quanta and Brownian ledgers, which were checked here only at the few passages holding the README's numeric fixtures **[Inference, High]**.

**CI at the pin.**

| Workflow | Trigger | Pin run | Failed step and cause (from log) | All-time record |
|---|---|---|---|---|
| Quality Gates | push, PR | #1049 failure | "Run node-only subprocess tests": 393 pass, 36 fail. Of the failure messages, 33 say the static build directory `out/` is absent or no base URL is set ("This is not-available, not a pass"); one says a shallow clone makes a history gate vacuous; the parent-scan gate cannot pass because parent scans are gitignored | 5 success, 399 failure, 645 cancelled; last success 2026-09-17 |
| Browser Acceptance | push, PR | #951 failure | "Expected static build directory "out" to be present" | 168 success, 219 failure, 564 cancelled; last success 2026-09-21 |
| Brownian laboratory preview | push | #1097 failure | Playwright `waitForFunction` 30 s timeout in the local video-annotation check | 35 success, 397 failure, 665 cancelled; last success 2026-09-16 |
| Performance Budgets Gate | schedule 03:00Z | none at pin | not applicable | 4 success, 3 failure; succeeded 2026-09-24T07:50Z on an earlier commit |
| Nightly Performance Gates | schedule 04:00Z | none at pin | not applicable | 3 success, 5 failure; last success 2026-09-19 |

All counts **[CI-observed, High]**, from 3,112 runs listed by the Actions API. My reading of the Quality Gates failure is that the job never runs `bun run build` and uses the default depth-1 checkout, so gates that fail closed on missing inputs fail by construction; the code under test may be fine **[Inference, Medium]**. That reading does not change the class: public CI is red at the pin, **C2**. The fail-closed messages themselves ("not-available, not a pass") are a real strength; the red persists because the workflow was not changed to supply what the gates ask for **[Inference, Medium]**.

**Rust reproduction attempt.** `RCH_VISIBILITY=verbose rch exec -- cargo test -j 2 --locked` in `fs-annus-wasm`, with FrankenSim fetched at 01824653 beside the clone, was refused before any remote command ran: RCH reported the project path outside its canonical root and "all workers failed preflight checks", then "refusing local fallback". No `Remote command finished` line appeared, so the result is **not run** **[Verified, High]**. The crate's own receipt (`docs/FRANKENSIM_BINDING.md`) records earlier RCH failures from incomplete sync of path dependencies outside the project root, which is the same structural obstacle **[Maintainer claim, Medium]**.

**Reproduction cost.** Clone 191 MB working tree plus 98 MB `.git`; Bun 1.4.0, Node 22, Playwright with Chromium and WebKit, poppler; the parent-scan gates need the maintainer's local `sources/` directory, which is not published; the wasm rebuild needs a FrankenSim checkout at 01824653 and the nightly-2026-07-06 toolchain **[Code-verified, High]**.

**Maintainer vs independent numbers.** Maintainer: all counts in the README status block. Independent: this packet's recounts (all agree), the Crossref and plate checks, and the Wikisource comparison. No third party has reviewed, benchmarked or cited the site as far as a GitHub and web search could find (3 stars, 0 forks, 0 issues) **[External, Medium]**.

## 4.6 Comparison: who owns the lane

**The incumbent** is the Digital Einstein Papers from Princeton University Press and the Einstein Papers Project: *The Collected Papers of Albert Einstein*, Volume 2, which prints the 1905 papers in German with scholarly annotation, and its companion English Translation volume, both free to read online with linking between the documentary edition and the translation **[External, High, via web search 2026-09-24: einsteinpapers.press.princeton.edu, AIP news]**. The repository's receipts cite it as the locator of record (`collectedPapers: volume 2, document 24` for mass-energy) **[Code-verified, High]**. The incumbent wins today on everything an edition is judged by: named, qualified editors, peer review, decades of annotation, and institutional permanence. Its English translation is free to read but not openly licensed for reuse **[External, Medium]**.

**Adjacent occupants.** German Wikisource carries proofread transcriptions of the relativity and mass-energy papers (not, as of 2026-09-24, the light-quanta or Brownian papers, which its Einstein author page lists only as external scans) **[External, High]**. English translations exist in many textbooks and anthologies, with varying rights **[External, Low]**. Interactive physics explainers (simulations of Brownian motion, light clocks, Lorentz transformations) are abundant but are not tied to the text of the papers **[Inference, Medium]**.

**Unoccupied lane.** A sentence-aligned German and English presentation of the four papers, openly licensed (subject to the rider), with symbol-level notation mapping and every interactive number tied to the paragraph it illustrates, does not appear to exist **[Inference, Medium]**. The site has built the machinery for that lane. It has not yet filled it with reviewed content, and three of four papers have no English at all.

## 4.7 Technical merit and adversarial review

**Strengths.**

1. **Checkable provenance.** Six scans, each with a receipt carrying origin, acquisition date, SHA-256, DOI and plate-checked watch items; 6/6 hashes reproduce and 6/6 bibliographic records match Crossref **[Counted + External, High]**. The FrankenSim artifact is content-addressed (directory name = hash prefix, manifest digest = file hash) and pinned to a public upstream revision, and `build.rs` refuses to compile if the upstream source files drift from their pinned digests **[Code-verified, High]**. This closes the gap the pinned `frankensim_website` packet recorded, where a shipped wasm blob carried no link to its source **[Inference, Medium]**.
2. **A status README that survives recounting.** Each status clause names the command that produced it, and all 11 README status clauses I re-derived held at the pin (claims 1–3, 9, 11–17; claim 16 on a one-lab sample); the twelfth, the registry count, needs a Bun run and was not checked **[Counted, High]**. Drafts are labelled drafts on the live site, and the relativity German face is withheld rather than shown incomplete **[Verified, High]**.
3. **Diplomatic care in the transcripts.** The draft keeps printed errors rather than silently fixing them ("Eektrodynamischer", Π·10⁷, α·10⁻⁵⁶) and records them as watch items, which is what a critical edition should do and what Wikisource did not do on p. 907 **[Plate-verified, High]**.
4. **Honesty rules enforced in code.** Host calculations are labelled as such; a planted-fixture guard checks that no view imports the wasm loader without earning the label; fail-closed tests refuse to count missing inputs as passes **[Code-verified + CI-observed, High]**.
5. **Self-reporting of its own governance failure.** The project recorded that its ban on text-layer drafting had been broken and that an earlier decision's statement was false, instead of quietly amending the receipts **[Maintainer claim, High]**.

**Weaknesses.**

1. **[HIGH] No review of anything.** Zero reviewed German ledgers and zero reviewed translation units **[Counted, High]**; the 42 explanation passages are all drafts **[Maintainer claim, High]**; 55 open reviewer slots and one named person **[Counted, High]**. For an edition, review is the product; the project's own rules say machine drafts "never self-certify".
2. **[HIGH] Coverage is thin where readers look first.** English exists for one paper, the three-page one; German is withheld for relativity, the paper most readers want **[Verified, High]**. The README's delivery plan budgets 30 weeks "for a small team" **[Maintainer claim, High]**; the project is ten days in.
3. **[HIGH] Red CI with a structural cause left in place.** Quality Gates passed 5 of 1,049 runs and none since 2026-09-17 **[CI-observed, High]**. The failing checks are fail-closed gates starved of a build and full history **[Inference, Medium]**, which means the CI record cannot currently tell a regression from a missing input.
4. **[MEDIUM] Transcription defects in the unpublished draft.** Two plate-confirmed errors in 22 pages of the relativity draft **[Plate-verified, High]**, from a pipeline that started from the OCR text layer in breach of the project's own rule **[Maintainer claim, High]**.
5. **[MEDIUM] Private inputs.** Parent scans are gitignored, releases are deployed from a local machine with no public release record, and deploy provenance cannot be tied to a commit from outside **[Code-verified + External, High]**.
6. **[LOW] Volume as a hazard.** 4,663 commits in eleven calendar days, 845 on 2026-09-17, a committed corrupt database backup, 1.16 MB of plans, and a DECISIONS entry about an unidentified process sweeping work into commits (D-2026-09-24-sweeper) **[Git-observed + Maintainer claim, High]**. The swarm rules in `AGENTS.md` name "commit-stream pumping" as forbidden and say "Commit rate is a saturation signal, never a metric" **[Maintainer claim, High]**.
7. **[LOW] License metadata conflict.** The Rust crate declares `MIT OR Apache-2.0` while the repository license, and `THIRD_PARTY_NOTICES.md` for the same artifact, say MIT + rider **[License-verified, High]**.

**Bear-case steelman.** The Einstein Papers Project already provides the German originals, a scholarly English translation and annotation, free, under editors with names and credentials. This site adds an unreviewed machine translation of one three-page paper, machine transcriptions of three others, and physics widgets available in many places, all produced at a rate no human reviewer could follow. Its provenance discipline is excellent and beside the point, because the hard part of an edition is qualified human judgement, and the project has no route to getting any: no issue tracker in use, no contribution guide, a license that attaches an unusual rider to the new prose, and 55 empty slots. At current velocity the site will keep adding surface faster than any reviewer could certify it, so the gap between "built" and "reviewed" widens rather than closes. On this view it stays an impressive demonstration of agent-produced scaffolding for an edition that does not arrive **[Inference, Medium]**.

## 4.8 License and governance

**License text.** First line: "MIT License (with OpenAI/Anthropic Rider)"; "Copyright (c) 2026 Jeffrey Emanuel" **[License-verified, High]**. The rider defines "Restricted Parties" as "OpenAI, L.L.C.; Anthropic, PBC; any of their respective Affiliates; and any person or entity acting directly or indirectly on behalf of, for the benefit of, or under the direction of any of the foregoing". It states "no rights are granted to any Restricted Party", forbids making the Software or derivative works available "to or for any Restricted Party", and defines "use" to include "benchmarking, testing, analyzing, indexing, or incorporating the Software or any Derivative Works into any dataset, training corpus, evaluation harness, or pipeline for machine learning or other automated systems". Breach terminates the license. **[License-verified, High]**

**Scope, stated exactly.** The rider bars OpenAI, Anthropic, their affiliates and those acting for them, and it bars use of the Software in machine-learning training or evaluation. It does not bar people who use those labs' models. The repository's own record shows that distinction in practice: 3,050 commits carry co-author trailers naming Claude-family and other models, and every English translation unit names `agent:claude-opus-5-5` as translator **[Git-observed + Code-verified, High]**. No motive is assigned here.

**OSI status.** Non-OSI; the field-of-use and named-party restrictions fail the Open Source Definition **[Inference, High]**. Layering matters for an edition: `README.md` and `NOTICE.md` say the license covers code and new prose (including the English translation) and not the scans, the historical German text (public domain) or fonts (OFL-1.1) **[Code-verified, High]**. So the German text is free to everyone, while the new translation and explanations carry the rider. Whether machine-generated translation is copyrightable at all, and so whether the rider can attach to it, is a legal question this packet does not answer **[Inference, Low]**.

**Bus factor: 1.** All 4,663 commits are authored by "Jeff Emanuel"; `docs/OWNERS.md` fills one human role and marks the rest "open: recruiting" **[Git-observed + Counted, High]**. Unlike 19 of the pinned 44, the repository contains no explicit refusal of outside contributions; it contains the opposite, a table of wanted reviewers, but no CONTRIBUTING file, no issue templates and no open issues, so no path in **[Verified, High]**.

**Velocity vs review depth.** 22, 146, 336, 845, 401, 308, 187, 269, 775, 602 and 772 commits per day from 2026-09-14 to 2026-09-24 **[Git-observed, High]**. Beads closure is described as orchestrator-only and audited **[Maintainer claim, High]**. No human review record exists for any content unit **[Counted, High]**.

## 4.9 NODUS factsheet

| Criterion | Score | One-line justification |
|---|---|---|
| Technology readiness | TRL 7 | The application is deployed and every route serves [Verified, High]; the defined product (reviewed edition, four translations) is not complete, so it is a working prototype in its operational environment, below the TRL 8–9 given to the 44's feature-complete marketing sites [Inference, Medium] |
| Strategic relevance | 2 | Peripheral to FrankenSuite: a FrankenSim consumer whose wasm is built but unwired [Code-verified, High]; its relevance to the program is as a provenance-method example [Inference, Medium] |
| Impact potential | 3 | A free, aligned, reviewed edition of these four papers would have real teaching value [Inference, Medium]; today 3 stars, 0 forks, no third-party mention found [External, Medium] |
| Implementation feasibility | 3 | The software is built; the missing piece, qualified human review of German and English, is not something the current process can produce [Inference, Medium] |
| Time to mainstream | 2 | Months to years: review of four papers by qualified people is slow, and the incumbent already serves scholars [Inference, Low] |
| Collaboration potential | 2 | Reviewer roles are wanted but there is no intake path, and the rider applies to the new prose [Verified + Inference, Medium] |

**Ring: Monitor** **[Inference, High].** Rulebook §4.9 names websites as Monitor, and nothing here meets Explore's bar as an independent technical asset: the novel Rust is a 366-line transport crate. The provenance discipline could justify a *-with-exemplar* modifier (source-edition receipts with plate-checked watch items); I leave the ring unmodified and raise it as an open question, since ringing down is the rule when in doubt.

**Matrix row (cohort, not the 44):** annus-mirabilis.com · TRL 7 · Monitor · Rider · Bus 1 · No-contrib: no (reviewers wanted, no intake) · CI C2 · Rel R1 · 3rd-party validation none · Analyst behavioral repro: no (textual plate checks only, not behavioral).

## 4.10 Wardley placement

- **Static Next.js site on Vercel:** commodity. Nothing would move it. **[Inference, High]**
- **Pinned-facsimile receipts with SHA-256, DOI and plate-checked watch items:** custom-built. Would move toward product if the receipt format were extracted and used by a second edition (the donor, classic-patents.com, is the likely first) **[Inference, Medium]**.
- **Sentence-aligned, many-to-many translation units with notation concordance and per-unit translator and review state:** custom-built, edging on genesis for digital editions. TEI-based editions are the product-stage comparison; this model is its own schema, not TEI **[Inference, Medium]**.
- **33 host-computed instruments tied to paragraphs:** custom-built. The interactive-physics pattern is commodity; tying each number to a named owner and a source paragraph is not **[Inference, Medium]**.
- **FrankenSim compiled by reference with a BLAKE3 pin guard:** genesis. Would move if a second consumer adopted the pattern or if the three exports reached a reader page **[Inference, Medium]**.
- **Agent-swarm production of edition content under honesty rules:** genesis. What would move it is the first external review showing the process yields reviewable text at acceptable error rates **[Inference, Medium]**.

## 4.11 Trajectory (12 / 24 / 60 months)

**[Inference, all of this section.]**

**Base case, 12 months.** The site keeps growing in surface: more lab pages, more draft explanations, English drafts for the other three papers, the relativity German face published once pages 913–921 are transcribed. Review stays at zero or near it, because the process produces drafts faster than any recruited reviewer could read them. The site becomes the most thoroughly instrumented unreviewed edition of these papers.

**Upside.** One or two qualified reviewers (a German-source reader and a physicist) are recruited and sign review records for the mass-energy paper; the project then has a reviewed paper, a documented error rate for its machine drafts, and a reusable review workflow. FrankenSim results reach reader pages under the labels the rules define. The receipt and alignment model are extracted and reused by classic-patents.com.

**Decay.** Velocity drops when the maintainer moves on, as the frankensim_website packet recorded for that site. Because the site is static, it keeps serving; drafts stay labelled drafts, which limits harm, but the edition freezes partway, with one English paper and a red CI.

**24 months.** Either a small reviewed core (one or two papers) or a large unreviewed one. **60 months.** The scans, receipts and German transcripts are the durable residue; they are public-domain text with good provenance and could outlive the application.

**Revisit triggers.** (1) The first `*-reviewed.txt` ledger or `reviewState: "reviewed"` unit with a named non-owner reviewer. (2) Any filled row in `docs/OWNERS.md` other than the owner. (3) A green Quality Gates run on a `main` commit. (4) A reader page importing the FrankenSim bundle. (5) The relativity German face going live. (6) A tagged release or a public release record that ties the live site to a commit. (7) Any third-party citation or review of the edition.

## 4.12 Limitations and open questions

**Not done.** Did not install dependencies, build, or run any JavaScript, TypeScript or Swift test; the "38 catalogue ids, 37 registered" clause (needs `bun run check:types`) was not checked. Did not run the site in a browser, so interactivity, accessibility, no-JavaScript rendering and the 320 px claims are unobserved. Did not build or verify the wasm bundle from FrankenSim source (RCH refused; see §4.5). Did not compare the light-quanta or Brownian transcripts in full against any independent transcription; German Wikisource has none, and the scan's text layer is not independent of the drafts. Did not check the dissertation or its 1911 correction beyond Crossref metadata. Did not audit performance budgets, the search index, the offline chapters or the iPhone app. Did not identify which commit is deployed. The translation check was done by an Anthropic model, the same model family as the translator, which is a cross-check, not independence (Rulebook §2).

**Open questions that would most change the verdict.**

1. What is the transcription error rate of the light-quanta and Brownian ledgers against their plates? A full plate comparison of one of them would settle whether the relativity rate (about one defect per 11 pages) is typical.
2. Will any outside reviewer sign a review record, and through what channel, given no issues, no contribution guide and a rider on the new prose?
3. Is the Quality Gates red caused only by the missing build and shallow checkout? Adding `bun run build` and `fetch-depth: 0` in a fork and rerunning would answer it.
4. Does the 92,751-byte bundle rebuild byte-identically from FrankenSim 01824653 with the pinned toolchain?
5. Should the provenance method earn a *-with-exemplar* modifier? That is a program-level judgement for the reviewer, not this packet.
6. Which commit is live at annus-mirabilis.com?

---

## The eight deepening questions

1. **Provenance.** The repository records more about its artifacts than any of the four website packets in the 44: per-scan receipts with origin URL, acquisition time, SHA-256, parent-volume hash and page indices, DOI and plate-checked watch items; per-unit translator identity and review state; a content-addressed wasm bundle naming its upstream revision and toolchain **[Code-verified, High]**. It stops at two points. Parent scans stay on the maintainer's disk, so the extract-to-parent link cannot be checked by anyone else, and live deploys carry no public release record. Publishing parent-scan hashes alongside their Internet Archive item checksums (the receipts already record `hostChecksumsVerified`) and exposing a release id on the site would make the chain portable end to end **[Inference, Medium]**.

2. **The embeddable unit.** The smallest adoptable piece is the receipt format with its parser and checker (`docs/editorial/RECEIPT_FORMAT.md`, `src/content/provenance/`) together with the German source-block and translation-unit schema: YAML files plus a TypeScript loader, no framework lock-in **[Code-verified, Medium]**. A second edition could adopt them at the cost of writing its own manifests. The instruments and reader shell are tied to Next.js and to this corpus and are not cheaply embeddable **[Inference, Medium]**.

3. **Unexercised option value.** A pinned, guarded FrankenSim bundle with three exports already ships and is used by no page **[Code-verified, High]**. The iPhone shell exists and runs only in a simulator **[Maintainer claim, High]**. The alignment model is many-to-many, and the README says historical translations will be cited as attributed comparison witnesses; whether any are loaded was not checked **[Maintainer claim, Medium]**. Unlocking the first needs one reader page and the labelling rules the project already wrote.

4. **Benchmark honesty.** There are no performance claims to rerun. The load-bearing numbers are counts and historical constants, and all that I checked survived: 11 README status clauses, 6 hashes, 6 Crossref records, 4 received dates, 4 printed numerical results. The thesis-bearing number that is not yet measurable is the accuracy of machine drafts; this packet's sample (0 defects in 3 published pages, 2 in 22 unpublished pages) is the only independent figure so far, and it is small **[Counted, Medium]**.

5. **The governance path.** The route from one maintainer to an institution runs through reviewers, and the project has already designed their roles, records and rules **[Code-verified, High]**. What breaks first if velocity decays is CI, already red, and then the status documents, whose `AGENTS.md` copy already carried three stale clauses at the pin; the static site itself would keep serving. The most credible institutional path would be partnership with an existing history-of-science or physics-education body, which would also bring the reviewers **[Inference, Low]**.

6. **The license as strategy.** The rider withholds rights from Restricted Parties (OpenAI, Anthropic, their affiliates and those acting for them), including their use of the code or the new prose in machine-learning training or evaluation; it does not prohibit machine-learning use by anyone else, or mere use of those companies' models, and it cannot reach the public-domain German text or the scans **[License-verified + Code-verified, High]**. For an edition whose stated purpose is that "almost nobody has read" these papers, a restriction on the English translation narrows reuse by schools, other editions and tools that index text. It sits alongside the project's own use of Anthropic models as translator and co-author, which the rider does not forbid **[Inference, Medium]**.

7. **Agent-era fit.** An agent answering questions about the 1905 papers could use the site's stable paragraph ids, notation concordance and sentence alignment to cite exact German passages with an English gloss, which Wikisource and the Einstein Papers portal do not offer in machine-readable form **[Inference, Medium]**. Two things would have to become true first: reviewed text, so that citations rest on checked readings, and a license that permits the indexing and evaluation uses the rider names **[Inference, Medium]**.

8. **The kill test.** A full plate comparison of one published German ledger (light quanta or Brownian motion) by a qualified German reader. If it finds defects at a rate a reader would notice (several per page), the thesis that agent drafting plus hand correction yields edition-grade text fails, and the site's value falls back to its facsimiles and receipts. If it finds the published drafts as clean as the mass-energy one, the thesis gains its first independent support **[Inference, High]**.

## Cross-cutting lenses (Rulebook §6)

- **Decoupling.** The project separates the source (pinned scan plus receipt), the reading (diplomatic transcript with printed errors kept), the translation (units with their own review state) and the computation (named owners, labelled host or FrankenSim). Each can be corrected without invalidating the others, which `AGENTS.md` states as a rule **[Code-verified, High]**.
- **Methodology export.** If the site fails, the receipt format, the dated status README with a command per clause, and the practice of recording plate-checked watch items survive as exportable method **[Inference, Medium]**.
- **The asupersync question.** Not a runtime or build dependency of anything shipped. It appears as a pinned revision string in a build script, a diagnostic test module, and planning text **[Code-verified, High]**.
- **The rider question.** See §4.8 and question 6: the rider covers code and new prose, including the machine-drafted English translation, and not the public-domain German.

---

*Packet v1 · 2026-09-24 · Pin `d33916fac50b509d132c1145b6284a2c6102f2ca` · Rulebook v1.1 · Status: pending different-lineage review. Clone and FrankenSim checkout deleted after hashes were recorded.*
