# Cross-Suite Brief: beads-for-frankentui

**Packet:** `~/workspace/franken-research/beads-for-frankentui-assessment.md` (v5, assessed 2026-09-22, pinned `e1a842f6a1e37f9c5f9648634652163219aa461e`)
**Analyst method for this brief:** read the own packet in full; skimmed the other 43 packets (TL;DR, claim inventory, verdict, NODUS ring, benchmark/fidelity sections, limitations, license/governance).

---

## 1. OWN-PACKET DISTILLATION

- **Verdict:** "A working, candid, unlicensed deployment artifact whose generated code is maintained and whose data is a fossil — valuable as a pattern for the FrankenSuite, not as a product to adopt."
- **TRL:** 8 (rates the *deployed technology*, proven in operation: live HTTP 200, 57 deploy runs, 0 failures) [CI-observed + External, High].
- **NODUS ring:** **Monitor** [Inference, Medium] — explicitly "when in doubt, ring down": a website serving a 197-day-old snapshot with no development beyond formatting. The packet stresses the split: TRL rates the technology, the ring rates the artifact's current fitness.
- **Strongest strength:** Integrity-conscious, offline-capable data shipping *(bv's design, verified in this deployment)* — 11/11 chunk SHA-256 hashes re-verified by the analyst, reassembled bytes byte-identical to the SQLite DB, manifest whole-db hash matches; zero external URLs at runtime; CSP `default-src 'self'` [Verified/Code-verified, High]. Plus the documentation honesty: the CHANGELOG admits orphan commits, removed features, and metric regressions in writing, dated [Maintainer claim, High].
- **Strongest ceiling:** The snapshot is frozen at **2026-03-08 — 197 days before the pin** — so every "top priority / critical bottleneck / quick win" on the live site describes a March frankentui [Code-verified, High]. The packet's bear case: "a triage dashboard that cannot triage the present is decorative." Second ceiling: **no license at all** (no LICENSE file, GitHub API `license: null`) [Code-verified + External, High] — with no grant, no party holds reuse rights, and the most plausible reuse (forking the dashboard as a template) is legally void.
- **The 3 most important pieces of evidence:**
  1. **SHA-256 chunk manifest, analyst re-verified:** "11/11 chunk hashes match manifest; concatenated chunks byte-identical to `beads.sqlite3`; manifest whole-db hash matches" [Verified, High]. (In-browser fetch cycle not executed — no browser control; chunk reassembly code-verified, not executed.)
  2. **Staleness, dated by the repo's own metadata:** `data/meta.json` `generated_at: 2026-03-08T18:41:03Z`, "unchanged through the pin commit (verified via `git show` at pin and parent)" [Code-verified + Git-observed, High]; the 2,590-issue / 3,700-dependency counts the analyst re-derived from the DB [Counted, High].
  3. **Deploy record with zero failures but nothing tested:** "35 success / 22 cancelled / 0 failed across 57 runs; pin's run green" [CI-observed, High] — alongside "the only test file is a browser-embedded self-test no CI ever runs" and the analyst having to run `hybrid_scorer.test.js` by hand under a Node `window`-shim [Code-verified, High].

---

## 2. SHARED NEGATIVE PATTERNS

Patterns beads-for-frankentui shares with other packets, with packet evidence showing the sharing.

### 2.1 Bus factor 1 + explicit no-outside-contributions policy (universal)
- **beads-for-frankentui:** "bus factor 1 across all 8 commits" [Git-observed, High].
- **franken_markdown_website:** "bus factor 1 by declaration" — README "About Contributions" states verbatim: "I do not accept outside contributions for any of my projects" [Maintainer claim, High].
- **asupersync:** "bus factor 1 with outside contributions explicitly refused (README L2620)" [Maintainer claim, High].
- **frankentui_website:** "One contributor, 235 commits, all Dicklesworthstone" [External, High].
- **frankensqlite_website:** "bus factor 1, 4 stars" [all Verified, High].
This pattern is shared across effectively the entire suite (all 43 other packets show bus factor 1); it is table stakes, not a differentiator.

### 2.2 No releases, no release discipline
- **beads-for-frankentui:** "No tags; GitHub Releases API returns 0 releases" [Git-observed + External, High].
- **beads_for_franken_engine:** "there are no releases, and no CHANGELOG exists in the repo" [Code-verified, High].
- **frankentui_website:** "Releases/tags: 0 / 0" [External, High].
- **franken_threed:** "No tags, no releases; 5 stars, 1 fork; single human author" [demonstrated, via `git for-each-ref` + API].
- **frankenredis:** "Bus factor 1 plus no release discipline at the assessed commit" [Inference, High].

### 2.3 README-vs-code drift as a governance signal
- **beads-for-frankentui:** README says 3,696 dependencies (DB: 3,700 — "Four-edge drift inside the same snapshot"); CHANGELOG's file table describes the February tree; CHANGELOG omits the last three maintenance commits [Counted + Git-observed, High].
- **franken_networkx:** "README is a drift source (13-variant tie-break → 12 counted; 33 fuzz targets…)" — 10 drift hits in the packet.
- **frankengit:** "README currently carries stale '15 crates' / 'every component forbids unsafe' sentences" [demonstrated (drift)].
- **frankenredis:** "The README is a drift source, and the project knows it. The Sept 2 audit found the README counting 13 crates (16 at pin)" — 12 drift hits in the packet.

### 2.4 Deploy-only / testless CI (or no CI at all)
- **beads-for-frankentui:** "CI does nothing but deploy — 35 of 57 runs succeeded, 22 cancelled, 0 failed — and the only test file is a browser-embedded self-test no CI ever runs" [CI-observed + Code-verified, High].
- **frankenmermaid:** "CI / Actions (pages-build-deployment only — no test workflows)" [External, High].
- **frankentui_website:** "No `.github/workflows` — zero GitHub CI whatsoever… the Playwright suites are run locally or not at all" [Code-verified, High].
- **franken_markdown_website:** "the repo has no CI at all (no `.github` directory)" [Code-verified, High] — deploys are manual `wrangler pages deploy`.
- **asupersync:** "Zero workflow runs at the pinned commit" — "CI that has never once run against the assessed commit".

### 2.5 Stale data / staleness without alarm
- **beads-for-frankentui:** snapshot `generated_at` 2026-03-08; pin 2026-09-21 — 197 days; "the failure mode is staleness without alarm, not outage" [Inference, High].
- **beads_for_franken_engine:** "data 197 days stale [Counted, High]"; the live frankentui journal "has grown to 4,537 beads — the dashboard covers 26% of a journal that moved on" [Verified, High].
- **frankensim_website:** "The README admits deployed stats can go stale (scripts need a local checkout)" — the norm is admitting it; beads' README does not banner the staleness.

### 2.6 Unlicensed (total absence, not the rider)
- **beads-for-frankentui:** "No LICENSE file in the tree at the pin, no license headers in the inspected sources… GitHub API `license: null`" [Code-verified + External, High]. The packet notes this is "the inverse of the FrankenSuite's usual MIT+AI-lab-rider posture, and worse for adoption than the rider: the rider at least grants *some* parties rights, while here *no* party has any."
- **beads_for_franken_engine:** "License: none — no LICENSE file in the tree; GitHub reports `license: null`" [Code-verified + External, High] — and adds the legal twist that bv's rider-licensed frontend code ships "without the rider its license requires on Derivative Works."
- **frankensqlite_website:** "License: none — no LICENSE file; README declares default copyright applies" [Code-verified, High].
- **frankensim_website, franken_native_capsule, franken_nlp** also show no-license/no-grant posture. This is a minority pattern (most of the suite carries MIT+OpenAI/Anthropic rider) — but beads shares it with 5 siblings.

### 2.7 No independent validation / demand signal belongs elsewhere
- **beads-for-frankentui:** "no independent coverage of this dashboard exists beyond its own GitHub pages" [External, High]; "the demand signal belongs to the tool, not this deployment" (12 stars here vs 1,691 on beads_viewer).
- **franken_overlap:** "a web search for independent coverage of FrankenOverlap (production users, third-party reviews, downstream forks, citations) returned nothing beyond the repository itself, its own commits, and search-engine mirrors of its README" [External, High].

---

## 3. CI/EVIDENCE BAR

What beads-for-frankentui *demonstrates* that most other packets lack (mechanism → what it does → who lacks it):

1. **SHA-256 chunk manifest with independent analyst re-verification.** Mechanism: an 11-entry manifest (`beads.sqlite3.config.json`) plus whole-db hash; the analyst re-fetched all 11 chunks, re-verified 11/11 hashes, and confirmed the reassembled bytes are byte-identical to the committed `beads.sqlite3` [Verified, High]. **Who lacks it:** nearly everyone. The sharpest contrast is **frankensim_website**, whose "same bytes the native build runs" demo claim has "no hash linkage" [Code-verified, High], and **franken_node**, whose `honesty_manifest.json` carries `generated_at: 1970-01-01T00:00:00Z` (epoch zero) — a claim census whose content is unverifiable at the pin [Counted, High]. (Note: the direct sibling **beads_for_franken_engine** *also* does this — 8 chunks, byte-exact reassembly [Verified, High] — and **franken_markdown_website** has its own `verify:live` sha256-compare deploy verifier. So this bar is shared with exactly those two; absent from the other 41.)
2. **Zero-failure deploy record, fully audited.** 57 runs pulled via API: 35 success / 22 cancelled / 0 failed; pin's run green [CI-observed, High]. The packet distinguishes what CI *checks* (weakness: nothing) from deploy *reliability* (strength: nothing ever went red). **Who lacks it:** the red-CI cluster — **frankenredis** ("CI at the pinned commit is red on both lanes" — conformance failed at the cargo fmt gate), **frankensympy** ("the build-and-test gate has failed 786 consecutive runs; the pin is red at the formatting gate" [CI-observed, High]), **franken_engine** ("CI lane is red at the pin — `native-runtime.yml`"), **franken_snowflake** (CI run #140 red, 2026-09-13), **frankenfs** (CI red on the main workflow at HEAD), **frankenlibc** (CI red at the pin).
3. **Analyst-grade data-fidelity table (counted vs. claimed side by side).** The packet's §4.5 table pits README claims against `meta.json`, `project_health.json`, and the analyst's own SQLite row counts — catching the 3,696-vs-3,700 four-edge drift [Verified, High]. **Who lacks it:** most packets rely on README figures; **franken_whisper**'s "Changelog (scope window ends 2026-08-24 — stale at HEAD)" and **franken_node**'s epoch-zero honesty manifest are the failure-mode examples. ("Also does X": **beads_for_franken_engine** — "Every headline count reproduces exactly from the shipped sqlite (1,180 / 853 closed / 1,916 deps [Counted, High])"; **franken_networkx** — 4,129/4,129 machine-checked surface [Counted, High]; **frankenscipy** — G1–G9 CI gates green at pin.)
4. **Documentation honesty as an auditable feature.** The CHANGELOG admits orphan-commit topology, the removed `history.json` ("remains absent (removed in second deployment)"), per-deployment metric regressions (99% → 92% completion), and "There are no semver tags or GitHub Releases in this repository" [Maintainer claim, High]. **Who lacks it:** **frankenmermaid** ("README is internally inconsistent and chronically stale"), **frankensympy** (README claims "green workspace tests" while the gate failed 786 consecutive runs), **franken_whisper** (CHANGELOG scope window stale at HEAD).

---

## 4. SHARED HURDLES

Structural hurdles beads-for-frankentui shares, with evidence:

- **Bus factor 1 + no-contribution policy = single-point-of-decay.** beads: 8 commits, one verified author [Git-observed, High]. Suite-wide the policy is explicit: franken_markdown_website's README ("I do not accept outside contributions for any of my projects" [Maintainer claim, High]), asupersync's README L2620, franken_lean / franken_manim / franken_markdown / franken_nlp / franken_tts / frankensqlite all carry explicit no-merge policies. For beads the failure mode is specific: "the fossil ages silently. The failure mode is staleness without alarm, not outage" [Inference, High] — no community mechanism can regenerate the snapshot.
- **License posture caps adoption either way.** The majority carry MIT + the OpenAI/Anthropic rider ("the rider bars the likeliest evaluators (AI labs and their agents) from using, benchmarking, or analyzing the code" — frankentorch [Inference, High]); beads and 5 siblings (beads_for_franken_engine, frankensqlite_website, frankensim_website, franken_native_capsule, franken_nlp) have *no* license, which the beads packet judges worse: "the rider at least grants *some* parties rights, while here *no* party has any."
- **Velocity vs. review depth, agent-authored at scale.** beads' pin commit is a formatting pass "Co-authored-by: Grok" [Git-observed, High] — the packet's Did-You-Know: "the agent that formatted the JavaScript could have regenerated the snapshot, and didn't" [Inference, Medium]. Shared with **franken_threed** ("AI-agent-authored at scale with opaque provenance"), **frankenscipy** ("6,395 commits by a `claude` contributor, 158 by the human owner"), **frankentorch** ("120 under agent-persona author names" [Git-observed, High]), and the fleet-wide note in the sibling packet that "a 2026-09-21 batch commit reformatted three sibling dashboards' *code* — data untouched since March everywhere" [External, High].
- **README drift as the structural tax of velocity.** beads' drift ledger (3,696 vs 3,700; stale CHANGELOG file table; omitted maintenance commits) is the same class as franken_networkx (10 drift hits), frankenpandas (9), frankenredis (12), frankenmermaid ("chronically stale"), frankengit. The packet's diagnosis generalizes: "the docs are maintained by hand around a generated core, and the hand is slower than the generator" [Counted, High].
- **No release artifact, no bounded workload fit for Pilot.** beads' Monitor ring reasoning applies to the whole website cluster: franken_markdown_website, frankensim_website, frankensqlite_website, frankentui_website, franken_nlp, beads_for_franken_engine are all Monitor — websites with 0 releases and no governance. The Rulebook explicitly lists websites under Monitor, "and when in doubt, ring down."

---

## 5. GENUINE UNIQUENESS

Only things **no other packet does**. Where the sibling shares a trait, that is stated rather than claimed.

1. **The candid deployment CHANGELOG as the repo's main document.** Three dated `bv --pages` deployments (Feb 4, Feb 9, Mar 8) with orphan-commit topology documented, per-deployment metric deltas, the removed-`history.json` admission, the 99%→92% completion regression, and the line "There are no semver tags or GitHub Releases in this repository" [Maintainer claim, High]. The sibling beads_for_franken_engine has **one commit and no CHANGELOG** ("no CHANGELOG exists in the repo"); no other packet's CHANGELOG reads as a dated confession. *This is the packet's "honesty gradient runs opposite to most repos" finding — unique in the suite.*
2. **The machine-readable agent API seed: `triage.json` with a `commands` contract** (`claim_top`, `show_top`, `list_ready`, `list_blocked`, `refresh_triage` — keys verified [Code-verified, High]). The sibling has `triage.json` too but **zero `claim_top` hits** — its triage ships no command contract. No other packet ships a pre-computed, file-based agent command API for issue triage.
3. **22 unexplained cancelled CI runs with `cancel-in-progress: false`.** 35 success / 22 cancelled / 0 failed across 57 runs; the cancellations are "unexplained by the workflow file (`cancel-in-progress: false`) — plausibly superseded pushes or manual cancels" [Inference, Low]. No other packet reports a cancellation anomaly of this shape.
4. **The drift ledger inside a single frozen snapshot.** README (3,696) vs `project_health.json` (3,696) vs DB/`meta.json` (3,700); CHANGELOG file table describing the February tree while the pin is September; CHANGELOG omitting the Apr/Sep maintenance commits entirely [Counted + Git-observed, High]. Other packets' drift is README-vs-*current-code*; beads' is *intra-snapshot* — the documents disagree with each other about the same March data.
5. **The largest `bv --pages` deployment in the suite, and the only one with a multi-deployment history.** 2,590 issues / 3,700 dependencies / 10.1 MB DB vs the sibling's 1,180 / 1,916 / 7.9 MB [Counted, High]; the only dashboard with 8 commits and 3 documented deployments. (Also: TRL 8, the highest in the Monitor cluster alongside the other three TRL-8 websites — but shared, so noted as "also does X" for franken_markdown_website, frankensim_website, frankensqlite_website.)

**Explicitly NOT unique (shared):** the SHA-256 chunk-manifest discipline (shared with beads_for_franken_engine — 8 chunks, byte-exact — and franken_markdown_website's verify:live); the hybrid scorer + self-test (sibling: "the hybrid scorer's self-test passes under node"); the offline vendored stack (franken_markdown_website also self-hosts fonts and vendors everything); the generated-as-orphans topology (sibling: "the repo's entire history is exactly one commit" of bv output); the 197-day staleness (identical date in the sibling); the Grok-co-authored formatting pass (the sibling packet documents the same 2026-09-21 batch commit hitting "three sibling dashboards" — beads-for-frankentui is one of them; beads_for_franken_engine explicitly missed it).

---

## 6. CROSS-POLLINATION IN

Specific concepts from other packets to apply to beads-for-frankentui.

1. **Signed claim census → from franken_node → extend `meta.json` into a signed honesty manifest.**
   franken_node ships `docs/honesty_manifest.json` — "7 claims, Ed25519-signed … signed claim census" [Code-verified, High]. beads' `meta.json` already carries `generated_at` but no source-revision hash, no claim→verification mapping, no signature. **Fit:** this is exactly the packet's next step 1 ("hash-pin the source revision in the snapshot manifest"), upgraded with the node's signing discipline. **Expected payoff:** staleness becomes a measured, attributable quantity — any consumer (human or agent) can verify which frankentui commit the dashboard describes without trusting the repo.

2. **Headless e2e suite + sha256-compare deploy verifier → from franken_markdown_website → wire real execution into `static.yml`.**
   franken_markdown_website implements "a 30-check headless e2e suite, a `verify:live` sha256-compare deploy verifier, a 12-round stress suite, and Firefox/WebKit smokes — all manual `bun run` invocations" [Code-verified, High]. beads' own limitations admit: "chunk reassembly, FTS5 search, WASM PageRank execution, and the offline path are code-verified, not executed… the hybrid scorer test ran under a Node `window`-shim, not a real DOM" [Code-verified]. **Fit:** beads *has* CI where the markdown site has none — the checks just need a home. Run the chunk-reassembly cycle, FTS5 query, and WASM PageRank in headless CI. **Expected payoff:** converts deploy-only CI into the repo's first real gate (the packet's next step 2, generalized); the 11/11 analyst verification becomes a repeatable machine check.

3. **"Never cite an un-gated number" → from frankentui_website → freshness-gate the dashboard's own triage claims.**
   frankentui_website's doctrine: "**Never cite an un-gated number as a result:** per the Rulebook, the 60 fps figure is not citable as a result of anything" [Inference, Medium]. beads' dashboard displays "top priority" / "47 ready to work" — numbers true of March, unverifiable of September [Inference, High]. **Fit:** gate the triage surface behind a freshness SLA — a staleness banner when `generated_at` is older than N days, exactly as frankensim_website's packet recommends ("Watermark the stats with the parent commit" / stamp the source SHA). **Expected payoff:** the fossil stops actively misleading visitors; the honesty norm moves from the CHANGELOG into the UI itself.

4. **Machine-readable negative-claim ledger → from frankensympy → ship what the dashboard may *not* claim.**
   frankensympy "keeps a machine-readable ledger of everything it is *not* allowed to claim — 27 claims, 15 marked 'implemented but uncertified,' zero marked validated or certified" [Counted, High]. beads' §4.3 claim inventory already exists in the packet but not in the repo. **Fit:** commit the inventory as JSON (e.g., `triage_recommendations: implemented-but-uncertified, valid only against 2026-03-08 data`) so the `triage.json` agent API can read it. **Expected payoff:** agents consuming `claim_top`/`list_ready` inherit the validity bounds automatically — the packet's "agent-era fit" concern answered in the artifact, not just the prose.

5. **Tamper-evident, CI-enforced evidence packs → from frankenscipy → generalize the chunk manifest into a signed, hash-chained artifact.**
   frankenscipy's packet recommends: "Tamper-evident evidence packs as a publication format. The RaptorQ sidecar + decode-proof triples + G8 integrity scrub are already CI-enforced. Generalize them into a signed, hash-chained artifact format a journal or regulator could verify independently of the repo." beads already ships the raw material (chunk manifest + whole-db hash). **Fit:** chain each regeneration's manifest to the previous one and sign it — the missing freshness loop (regenerate → manifest → sign) becomes the artifact format. **Expected payoff:** provenance and integrity verifiable independently of the GitHub repo — the dashboard becomes citable evidence rather than a diorama.

---

## 7. CROSS-POLLINATION OUT

Specific beads-for-frankentui concepts to export to named projects.

1. **`bv --pages` as the FrankenSuite's evidence-dashboard template → frankentui, frankenscipy, frankensqlite, frankentorch.**
   The packet's next step 5, grounded: "this repo accidentally demonstrates the suite's cheapest auditability upgrade — every franken repo's beads DB rendered as a self-contained, offline, SHA-256-verified static site" [Inference, Medium]. **Fit:** frankentui (1,124,747 lines, 20 crates, 283 stars, "an agent-driven development program" generating issues faster than humans triage — the beads packet's own §4.1 demand case) is the data source this dashboard already renders; frankenscipy (613,565 lines, 6,395 claude-authored commits — triage at a scale no human reads) and frankentorch (6,305 commits) have the same legibility problem. The generator already supports `--watch-export` (re-export on beads-file change) and `--export-pages` recipe filters (open-issues-only, single-label dashboards from one pipeline) [External, High]. **Expected payoff:** suite-wide, zero-backend, offline project visibility — each repo's journal becomes a URL instead of JSONL.

2. **SHA-256 chunk-manifest discipline → frankensim_website, franken_node, frankensqlite_website.**
   beads demonstrates: hash-pin every shipped byte, verify reassembly, publish the manifest. **Fit:** frankensim_website's "same bytes the native build runs" demos have "no hash linkage" [Code-verified, High]; franken_node's honesty manifest is epoch-zero and unverifiable; frankensqlite_website's refresh shipped 12 commits undocumented in its CHANGELOG. **Expected payoff:** content-addressed deployment artifacts whose integrity is checkable independently of the repo — the exact gap each of those packets names.

3. **The candid-CHANGELOG honesty norm → frankensympy, frankenmermaid, franken_whisper.**
   beads' CHANGELOG admits orphan topology, removed features, and metric regressions in dated entries — the packet calls this "documentation honesty as a feature." **Fit:** frankensympy's README claims "green workspace tests" while "the build-and-test gate has failed 786 consecutive runs" [CI-observed, High]; frankenmermaid's README is "internally inconsistent and chronically stale"; franken_whisper's "Changelog (scope window ends 2026-08-24 — stale at HEAD)." **Expected payoff:** the drift ledger becomes explicit and dated at write time instead of being excavated by auditors months later.

4. **`triage.json` machine-readable agent command API → frankentui, franken_engine.**
   beads ships pre-computed triage (`recommendations`/`quick_wins`/`blockers_to_clear`) plus a `commands` contract (`claim_top`, `show_top`, `list_ready`, `list_blocked`, `refresh_triage`) — "the seed of a machine-readable agent API" [Code-verified, High]. **Fit:** frankentui's agent-driven program is the concrete workload the packet names ("an agent doing dependency-aware triage over a beads-tracked repo"); franken_engine is the upstream journal the sibling dashboard snapshots. **Expected payoff:** agents triage from computed, bounded data instead of shelling SQL against raw JSONL — with the negative-claim ledger (§6.4) bounding validity.

5. **Offline-first vendored stack (zero external URLs + CSP + COI service worker) → frankensqlite_website.**
   beads verifies end to end: "Zero external `src`/`href` URLs in `index.html`; all 15 vendor files local; a real CSP meta tag enforces `default-src 'self'`" [Code-verified, High], plus a COI service worker enabling sql.js WASM threading on Pages. **Fit:** frankensqlite_website markets a SQLite engine with a Next.js site; beads' pattern (chunked SQLite + sql.js + WASM, fully offline) would let the engine's own site host a live-queryable demo database with zero backend — the marketing claim made executable. **Expected payoff:** frankensqlite's demo becomes a self-contained artifact instead of a hosted service, inheriting beads' integrity and offline properties.

---

*Brief written 2026-09-22 from the 44 assessment packets at `~/workspace/franken-research/*-assessment.md`. All cross-packet claims quote or cite packet evidence with the packet's own evidence-tier labels; nothing is invented about any project.*
