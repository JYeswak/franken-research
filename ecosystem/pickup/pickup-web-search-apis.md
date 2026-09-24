# Pickup companion: Web-search API layers

S2 companion for the pickup planning arc. Covers: agent-facing web-search /
extraction / crawl-map API layers (the Tavily/Exa/SerpApi/Firecrawl category)
and their open-source substrates (SDK wrappers, SearXNG aggregation, Jina
Reader-style extraction). All repos, paths, and star counts come from
`_evidence/web-search-apis.md` (verified 2026-09-23). Nothing here is invented.

## Charter seed

**What this type is.** A clean-room implementation of the *agent-facing*
web-search API layer: HTTP endpoints (or SDK clients against them) that give an
agent `search` (query → ranked results/snippets), `extract` (URL → LLM-usable
markdown), and optionally `crawl`/`map`, with pinned self-host deployability,
fixture-based conformance, and a quality-eval pipeline that runs per commit.
The reference shape is the Tavily-style JSON surface plus the Firecrawl
self-host + eval plumbing.

**In scope.** Search/extract/crawl/map endpoints and their SDK clients;
multi-backend aggregation with provider swap (SearXNG as the open backend
primitive); self-hosted deployment (containers, pinned digests); quality-eval
benchmarking against a frozen fixture corpus; latency budgets and
regression gating; polyglot SDK parity once a second client exists.

**Out of scope.** Building a web index or crawler at internet scale (a
different type); ranking-model R&D; the browser-use stack underneath fetch
engines; vendor-side closed ranking (cannot be clean-roomed from the open
evidence — there is none).

**What "a good starting point" means for this type.** From day one the project
can run its full default test path offline against a frozen, hashed fixture
corpus with a pinned self-host backend, execute every code example in CI, and
produce per-commit labeled quality-eval runs with a documented scoring method.
Live vendor APIs are treated as *behavioral references behind secrets*, never
as oracles and never required for a green build.

### Requirements

- REQ-SEARCH-01 — Self-host path: the project ships a deployable local backend
  (pinned container image digest or source commit), never a vendor-key-only
  design.
- REQ-SEARCH-02 — Keyless-green CI: the default suite passes with zero vendor
  API keys; key-dependent tests are quarantined in a separate integration tier
  with explicit skip-honesty (XFAIL≠SKIP, skips named).
- REQ-SEARCH-03 — Frozen fixtures: a committed, SHA-256-manifested query/
  response corpus backs all acceptance tests; live calls are opt-in behind a
  `--live` flag with a freshness-decay warning. Corpus captures pass a
  secrets/PII scrub per the GATE-010-style classification before commit
  (hashing does not sanitize); the scrub step and classification version are
  recorded in the capture metadata.
- REQ-SEARCH-04 — Per-commit eval plumbing: every merge to main produces a
  labeled quality-eval run (experiment ID, per-SHA label) against the frozen
  corpus, with the scoring methodology documented in-tree.
- REQ-SEARCH-05 — Docs-as-tests: every shipped example executes in CI (against
  fixtures or live secrets); no unexecuted example code.
- REQ-SEARCH-06 — Latency budget declared and regress-gated in CI (p50/p95
  per endpoint). *Inference-labeled: no incumbent in the evidence set does
  this; this REQ fills the gap rather than copying a practice.*

- REQ-CI-COST — CI provisioning + cost ownership (bench slot 13, per
  PROJECT-PICKUP-PLAYBOOK.md). The S3 plan names: runner class/host (self-hosted
  GPU runner vs cloud vs CPU-only), provisioning owner (who stands up the
  runners), funding owner/account (who pays), schedule (PR / nightly / weekly /
  scheduled), and a spend cap before BEADS READY. Any field left `TBD` blocks S5.
  GPU-hour/lab spend is metered and recorded against the cap (see shared-gates.md
  GATE-007).

## Oracle candidates + integrity checks

There is no authoritative public quality oracle in this category: no
NDCG@k dashboard, no public FreshQA-style vendor eval, no latency SLO exists
in any evidence repo. Oracle candidates are therefore *substrate oracles* plus
the frozen corpus itself:

- **Pinned SearXNG** (backend primitive, not an agent API) — integrity:
  container image digest pinned in PIN_RECORD.md, not a floating tag.
- **Jina Reader-style extraction reference** (jina-ai/reader; keyless
  `r.jina.ai` endpoint) — integrity: pinned source commit; the *keyless*
  endpoint is a convenience, not an oracle (no SLA, can change without notice).
- **Frozen fixture corpus** (the de-facto oracle) — recorded
  query→response captures with capture date; integrity via MANIFEST.sha256
  and re-capture diffing (any corpus regeneration is a new truth-pack
  generation, re-banked, never silently refreshed).
- **Live vendor endpoints** (Tavily/Exa/SerpApi) — behavioral references only;
  admissible for integration tests behind CI secrets, never as oracles.

Truth-pack shape (from the model-guides pattern, type-instantiated):

- `docs/truth-pack/PIN_RECORD.md` — backend pins (SearXNG version/commit or
  image digest, reader commit), fixture capture date, corpus schema version.
- `docs/truth-pack/MANIFEST.sha256` — every fixture file hashed.
- `docs/truth-pack/ACCEPTANCE_SURFACE.json` — break-even quality thresholds
  (e.g. extract fidelity vs recorded markdown, citation-presence rate) and the
  declared latency budgets (REQ-SEARCH-06).
- `docs/truth-pack/NONDETERMINISM_FLOOR.md` — live web changes under any
  recording; freshness windows; why live is never the acceptance surface.
- `fetch-truth-pack.sh --verify` — verifies fixture hashes, replays recorded
  corpus against the local backend, refuses to touch the live network;
  `--live` is opt-in, records capture metadata, and marks results
  informational-only.

Invocation-time integrity: for any measured run, record the SHA-256 /
container digest of the backend under test at invocation time (whisper
doctrine: no un-recorded executable is admissible — a backend image digest is
the analog here).

UNK-SEARCH-01 — No public, vendor-independent relevance benchmark usable as an
oracle was found in any evidence repo. Whether one exists (or can be built
from press-claimed vendor evals like FreshQA) is unresolved; until then the
frozen corpus is the only oracle and relevance claims stay T3.

## Initial claims (CLAIM-*)

Type-level process norms, not any single repo's marketing. Tiers (canonical, per PROJECT-PICKUP-PLAYBOOK.md): T0 [Verified] (repo-verified) / T1 [CI-observed] / T2 [Maintainer claim]/[External] / T3 [Inference].

| ID | Statement | Evidence pointer | Tier | Confidence | Status |
|----|-----------|------------------|------|--------|---|
| CLAIM-SEARCH-01 | The category's open surface is thin SDK wrappers plus Firecrawl; the actual relevance machinery (index, ranking, evals) is closed. | Evidence file repo set: tavily-ai/tavily-python, exa-labs/exa-py, serpapi/serpapi-python are thin clients; firecrawl/firecrawl is the sole quality-eval exception; Brave/Perplexity Sonar have no open SDK repo found; linkupapi/linkup 404s | T0 | High | ADMISSIBLE |
| CLAIM-SEARCH-02 | For vendor SDKs, the norm is live-API integration tests wired to CI secrets, with unit tests separated and transport-mocked. | tavily-ai/tavily-python/.github/workflows/tests.yml (`TAVILY_API_KEY` secret, pytest 3.9–3.11); exa-labs/exa-py/.github/workflows/run_tests.yml (`EXA_API_KEY`, `--cov=exa_py`); serpapi/serpapi-python/.github/workflows/ci.yml (`API_KEY`, `-k "not example"`); tavily-ai/tavily-python/tests/request_intercept.py; exa-labs/exa-py tests/unit/ vs tests/integration/ | T0 | High | ADMISSIBLE |
| CLAIM-SEARCH-03 | Every shipped example must execute in CI (docs-as-tests); unexecuted example code rots and must not ship. | exa-labs/exa-py/.github/workflows/run_examples.yml (`find examples -name "*.py"`, 3 batches, live secrets); exa-labs/exa-py/examples/ (13+) | T0 | High | ADMISSIBLE |
| CLAIM-SEARCH-04 | Firecrawl's per-commit-labeled prod-eval plumbing (deploy-triggered benchmark with per-SHA labels and experiment IDs) is the only in-repo model for automated quality eval; its scoring methodology is not publicly documented, so a clean-room project must invent its own ground truth. | firecrawl/firecrawl/.github/workflows/eval-prod.yml; firecrawl/firecrawl/.github/scripts/eval_run.py; evidence-file caveat | T0 | High | ADMISSIBLE |
| CLAIM-SEARCH-05 | Parameterizing the search backend as a CI matrix axis proves provider-swap correctness and is copy-worthy. | firecrawl/firecrawl/.github/workflows/test-server.yml (engine playwright, no-proxy × search `searxng` (google disabled) × redis/rabbitmq, `TEST_SUITE_SELF_HOSTED=true`) | T1 | Medium | ADMISSIBLE |
| CLAIM-SEARCH-06 | Extraction endpoints admit a deterministic-ish booted-server e2e harness with per-option fixture coverage (fidelity, chunking, budgets, error handling). | jina-ai/reader tests/run-unit.ts vs tests/run.ts (boots build/stand-alone/crawl.js, ~28 e2e files, 10s timeouts); tests/e2e/ (content-fidelity, markdown-chunking, token-budget, summaries, error-handling, cache-control, option-interactions); package.json test:unit / test:e2e / test:coverage | T0 | High | ADMISSIBLE |
| CLAIM-SEARCH-07 | No public latency SLO and no public relevance benchmark exist in any repo of this set. | Verified absence across all 10 evidence repos; evidence-file caveat ("no workflow or doc asserts p50/p99 budgets"; "no public relevance benchmark was found") | T0 | High | ADMISSIBLE |
| CLAIM-SEARCH-08 | A clean-room project should declare and CI-gate latency budgets — this would put it ahead of the open incumbents; it is a gap to fill, not a practice to copy. | Inference from CLAIM-SEARCH-07; no repo to point at — labeled as such | T3 | Low | ADMISSIBLE |
| CLAIM-SEARCH-09 | SearXNG is aggregation infrastructure (human-SERP JSON), not an agent API; it must not be cited as a Tavily equivalent. | searxng/searxng as Firecrawl's CI search backend; evidence-file caveat | T0 | High | ADMISSIBLE |
| CLAIM-SEARCH-10 | Coverage reporting should fail CI on error (Jina strictness), not warn-and-continue (Exa leniency). | jina-ai/reader/.github/workflows/_test.yml (`fail_ci_if_error: true`) vs exa-labs/exa-py/.github/workflows/run_tests.yml (`fail_ci_if_error: false`) | T0 | High | ADMISSIBLE |
| CLAIM-SEARCH-11 | Comment-triggered, membership-gated on-demand evals are the copyable pattern for explicit review-time quality checks. | firecrawl/firecrawl/.github/workflows/scrape-evals.yml (`#scrape-quality-eval` trigger, org-membership gate) | T0 | High | ADMISSIBLE |
| CLAIM-SEARCH-12 | Press funding/acquisition claims (Tavily/Nebius, Exa $85M) are not repo-verified and must not support category-health claims. | Evidence-file caveat ("press claims, not repo-verified") | T0 | High | ADMISSIBLE |
| CLAIM-SEARCH-13 | Star counts and per-language SDK test matrices are structural adoption signals (vendors ship SDKs because agents embed them), not customer proof; named-adopter lists need marketing pages, out of scope. | firecrawl/firecrawl test-{js,py,go,rust,java,php,ruby,dotnet}-sdk.yml matrices; evidence-file caveat on thin adopter evidence | T0 | High | ADMISSIBLE |
| CLAIM-SEARCH-14 | Thin commit history on vendor SDK repos is normal cadence (ship when the API changes), not a red flag. | serpapi/google-search-results-nodejs (95 stars, last push 2025-12-03); evidence-file caveat | T0 | High | ADMISSIBLE |

No WITHDRAWN rows; no CONTESTED rows — contested would require disputing
evidence, and the evidence here is thin-but-consistent. CLAIM-SEARCH-08 is
explicitly T3 inference.

## Gate profile

G1–G14 applicability (names from the starter-kit gate registry):

- **G1 ORACLE** — applies as-is, type-parameterized: oracle inventory =
  frozen fixture corpus + pinned backend (image digest / source commit). Live
  vendor APIs are entered as behavioral references, never as oracles.
  Post-pin corpus changes need the two-party waiver.
- **G2 PAIR** — applies as-is: differential validation = implementation under
  test vs fixture replay / reference endpoint in the same invocation.
- **G3 OWN** — applies as-is: every claim row carries an owning bead.
- **G4 CONTRACT** — applies as-is: claim artifacts conform to
  ACCEPTANCE_SURFACE.json thresholds.
- **G5 HOST** — applies as-is: self-host deploy is host-parity; backend image
  digests pinned, no floating tags.
- **G6 UNSAFE** — N/A by default for an API layer (network/JSON code);
  advisory — if a native extension appears, its new unsafe sites are declared
  in the same diff as a labeled G6-analog per the playbook's Rust-centric-gates rule.
- **G7 REVIEW** — advisory: the type-specific analog is split-context adversarial review (default-refute); quality-eval and relevance claims get the hostile reading. Recorded as a review parameter, not a claim that canonical G7 applies as-is.
- **G8 RULEBOOK** — applies as-is, **load-bearing**: relevance/quality claims
  carry the heaviest burden in this category (no NDCG@k or "X% on FreshQA"
  without in-tree ground truth).
- **G9 IOU** — applies as-is: zero unresolved at close; key-dependent tests
  are quarantined-and-named, never silently skipped.
- **G10 MIRI** — N/A unless unsafe Rust ships; advisory.
- **G11 LAYOUT** — N/A for this type; advisory.
- **G12 AUDIT** — applies as-is: class-fix then instance re-audit (fixture
  staleness and transport-mock drift are named failure classes).
- **G13 NOSTUB** — applies as-is: no unimplemented endpoints; a `/search`
  returning canned JSON without the backing aggregation path is a stub.
- **G14 REJECT** — applies as-is, **load-bearing**: any quality/relevance
  claim above its evidence tier is rejected (press-claimed benchmarks,
  vendor marketing numbers).

Proposed new type-specific gates:

- GATE-SEARCH-01 FROZEN-FIXTURE — *Acceptance:* the default test path makes
  zero live network calls; `fetch-truth-pack.sh --verify` passes fully
  offline; any live call is behind an explicit `--live` flag that records
  capture metadata and marks results informational-only.
- GATE-SEARCH-02 LATENCY-BUDGET — *Acceptance:* p50/p95 budgets per endpoint
  are declared in ACCEPTANCE_SURFACE.json; a CI job measures against the
  frozen backend and fails on regression beyond the banked tolerance; the
  optional live probe is informational, never gating.
- GATE-SEARCH-03 EVAL-PER-SHA — *Acceptance:* every merge to main produces a
  quality-eval artifact in receipts with an experiment ID and per-SHA label;
  the scoring methodology is committed in-tree (copy the Firecrawl trigger
  shape, not its closed scoring).
- GATE-SEARCH-04 NO-KEY-GREEN — RETIRED into shared GATE-014 (S4 round 1, dedup). GATE-014 acceptance (3) already requires the unit tier to run with zero credentials and zero network. Retained as a type-specific parameter: the full CI suite passes with no vendor API key in the environment; key-dependent tests live in the quarantined integration tier with named, honest skips.

### Shared-gate declarations (load-bearing vs advisory)

| Shared gate | Disposition | Rationale |
|---|---|---|
| GATE-002 (Model truth-pack / oracle integrity) | Advisory | Relevance claims rest on the frozen fixture corpus + pinned backend digests; live vendor APIs are behavioral references, never oracles (G1) |
| GATE-009 (Retrieval relevance/recall) | Advisory | Per-SHA quality-eval vs frozen corpus mirrors the frozen-oracle + pre-committed-threshold discipline (REQ-SEARCH-04) |
| GATE-010 (Trace completeness / privacy) | Advisory | Corpus captures pass a GATE-010-style secrets/PII scrub before commit; scrub step + classification version recorded (REQ-SEARCH-03) |
| GATE-014 (Deterministic test doubles / offline CI) | Universal | Applies to all types; keyless-green CI, zero live calls by default (REQ-SEARCH-02, GATE-SEARCH-01/04) |
| GATE-015 (Tiered CI separation) | Universal | Applies to all types; quarantined integration tier + scheduled fresh-probe tier |
| GATE-016 (Dependency / toolchain pinning) | Universal | Applies to all types; backend image digests pinned, no floating tags (G5) |
| GATE-018 (Flake quarantine) | Universal | Applies to all types; live excluded from A/A by construction |

## Evidence tiers

Canonical pickup tiers (per PROJECT-PICKUP-PLAYBOOK.md), type-mapped:

- **T0 [Verified]**: direct inspection of a fresh clone; our own
  recorded fixture and manifest hashes; a CI run we observed executing on
  our fork. Includes flavors [Code-verified], [Counted], [Git-observed],
  [Verified absence] (CLAIM-SEARCH-07's "no latency SLO found" is a verified
  absence, not an inference).
- **T1 [CI-observed]**: a vendor workflow observed running on live
  CI (e.g. run_tests.yml executing pytest) — attests the suite *runs*, not
  that it is green or correct.
- **T2 [Maintainer claim]**: README/docs
  assertions, unreproduced; SDK docs; *all* vendor marketing numbers
  (FreshQA-style percentages) live here and cannot leave it.
- **T2 [External]** (thin): press on funding/acquisitions — admissible as
  "press claims X", never as "X is true".
- **T3 [Inference]**: analyst judgment, always labeled
  (REQ-SEARCH-06, CLAIM-SEARCH-08).

Every row carries tier + confidence; G14 rejects anything filed above its tier.

## Localbench bench shape

- **Spec format:** `api:<endpoint>+<backend>@<digest>` — e.g.
  `api:search/v1+searxng@sha256:<digest>`,
  `api:extract/v1+reader@<commit>`. The harness starts/stops the local
  backend itself (compose with pinned digests); backend image digest is
  recorded per run at invocation time.
- **Tiers:** `conf` (endpoint conformance vs recorded corpus: schema,
  field presence, citation structure); `micro` (single-query p50/p95
  latency vs budget); `replay` (response-body hash vs recorded fixture —
  determinism of the stack, not of the web); `e2e` (agent research loop:
  search→extract→cite, scored against ACCEPTANCE_SURFACE.json);
  `fresh` (live probe, informational only, never gated, never banked).
- **Golden schema:** per-tier `conformance` (named checks, MUST/SHOULD,
  PASS/FAIL) + `metrics` (value, A/A spread, tol, tol_source, better).
  Tolerance rule: `tol = max(3 × A/A relative spread, floor)`; A/A spread
  is measured against the *frozen* backend/corpus only — live is excluded
  from A/A by construction.
- **Banking ceremony:** only `aa <spec> --write-golden` on the frozen
  stack; corpus re-capture = new generation (host/generation binding under
  `goldens/<host_id>/`); golden-regeneration-until-green is the named
  forbidden pattern.
- **Measurement law:** preflight refuses a busy machine (GPU/CPU > 25%,
  names processes); runs marked CONTENDED on interference; one endpoint
  under test at a time; loopback/local-only default — a failed local call
  is a finding, never a cloud fallback; the `fresh` tier is the only
  sanctioned live contact and it runs as a scheduled remote-lab job with
  CI secrets, not in local A/A.
- **Receipts:** `docs/evidence/receipts/<kind>__<spec>__<timestamp>.json`
  (kinds: aa, ab, run, eval); eval artifacts carry experiment ID +
  per-SHA label; `runs/` gitignored scratch; dated `.md` investigation
  notes for any eval regression.
- **Incumbent pins:** `docs/evidence/incumbents.md` — SearXNG image digest,
  reader commit, fixture corpus MANIFEST hash, harness version, OS.
- **Claims wiring:** `registries/claims.tsv` — every public claim sentence
  registered and machine-checked against its receipt on every commit.
- **Negative evidence:** `NEGATIVE_EVIDENCE.md` (e.g. live-probe divergence
  from corpus, recorded not buried), `DISCREPANCIES.md`,
  `break-tests.md`, `demotion-rules.md`; fixture-staleness kills carry
  resurrection predicates (re-capture criteria).

## Starter-kit deltas

- **Files:** `docs/truth-pack/` template for search-API types
  (`PIN_RECORD.md`, `MANIFEST.sha256`, `ACCEPTANCE_SURFACE.json` with
  latency-budget + quality-threshold fields, `NONDETERMINISM_FLOOR.md`,
  `fetch-truth-pack.sh --verify [--live]`); fixture-corpus directory
  layout + capture/diff scripts; eval-harness skeleton
  (`eval_run.py --label <sha> --experiment-id`, scoring method committed
  in-tree); comment-trigger eval workflow template (Firecrawl
  `#scrape-quality-eval` shape with org-membership gate); example-runner
  workflow template (exa `run_examples.yml` shape); booted-backend e2e
  harness template (jina-ai/reader `tests/run.ts` shape); unit/integration
  split + request-interception template (tavily `tests/request_intercept.py`
  shape); per-language SDK test-matrix template (one workflow per client,
  activated with the second client).
- **Gates:** register GATE-SEARCH-01..03 (FROZEN-FIXTURE, LATENCY-BUDGET,
  EVAL-PER-SHA) in the gate registry (GATE-SEARCH-04 / NO-KEY-GREEN retired
  into shared GATE-014; see Gate profile); G8 and G14 flagged
  load-bearing for this type.
- **Harness shapes:** truth-pack `--verify` must refuse network by default;
  localbench spec parser must accept the `api:<endpoint>+<backend>@<digest>`
  form; the `fresh` live-probe tier must be expressible as
  informational-only (banked: never).

- **CI provisioning + cost ownership (bench slot 13):** runner class/host, provisioning
  owner, funding owner/account, schedule, and spend cap — TBD acceptable pre-S5
  (any TBD blocks S5 per Bench slot 13); current: TBD (owner: parent orchestrator
  assigns at S3).

## Trend + process citations

Star counts and push dates verified via the GitHub REST API on 2026-09-23.
One-line process takeaway each:

- `firecrawl/firecrawl` — 183,735 stars, pushed 2026-09-23 — the only repo
  here with real quality-eval CI plumbing (`eval-prod.yml` per-SHA prod
  evals, `scrape-evals.yml` comment-triggered evals, `test-server.yml`
  provider-swap matrix); copy the plumbing, invent your own ground truth.
- `searxng/searxng` — 37,549 stars, pushed 2026-09-23 — the open
  aggregation primitive Firecrawl's CI actually uses as its search backend;
  infrastructure, not an agent API.
- `jina-ai/reader` — 12,036 stars, pushed 2026-05-22 — keyless
  URL→markdown extraction with the best e2e fixture discipline in the set
  (`tests/e2e/` per-option files, strict Codecov fail policy); freshness
  weaker than the vendor SDKs (~4 months).
- `tavily-ai/tavily-python` — 1,406 stars, pushed 2026-09-18 — commercial
  agent-search API with the unit/integration + request-interception split
  worth copying; live-API CI via `TAVILY_API_KEY` secret.
- `exa-labs/exa-py` — 234 stars, pushed 2026-09-22 — docs-as-tests done
  right (`run_examples.yml` executes all 13+ examples against live APIs);
  lenient Codecov policy (`fail_ci_if_error: false`) is the anti-pattern.
- `serpapi/serpapi-python` — 173 stars, pushed 2026-09-15 — old-guard
  SERP vendor still shipping; 7-version Python matrix; `API_KEY`-secret CI.
- `exa-labs/exa-js` — 130 stars, pushed 2026-09-22 — pushed same day as
  exa-py: multi-language SDK parity is the vendor norm.
- `tavily-ai/tavily-js` — 95 stars, pushed 2026-09-18 — same story as
  exa-js: parity clients maintained in lockstep.
- `serpapi/google-search-results-nodejs` — 95 stars, pushed 2025-12-03 —
  thin commit history is normal cadence for SDK wrappers, not a red flag.
- `VanessaCorentin/WebSearchFree` — 0 stars, pushed 2026-08-17 —
  one-person MIT keyless clone (DDG/Brave HTML, Wikipedia, optional
  SearXNG, Tavily-style JSON); evidences only that clones keep appearing —
  verify any claim before citing it.

Honest caveats carried over: the category is mostly closed-source — the
index, ranking, relevance evals, and latency SLOs of Tavily/Exa/SerpApi/
Brave/Perplexity are not open; what is open is thin SDK wrappers whose CI
only integration-tests the HTTP surface. No public relevance benchmark
(FreshQA-style, NDCG@k) was found in any repo; press-claimed vendor scores
are marketing, not evidence. Firecrawl's eval scripts run against its own
prod with secrets and their scoring method is not publicly documented. No
latency-SLO evidence exists anywhere in the set — declaring and CI-gating
latency budgets would be genuinely ahead of the open incumbents. Jina
Reader's last push is ~4 months old. Linkup has no discoverable open SDK
repo (404). Adopter evidence is thin at repo level (stars and SDK matrices
are structural signals, not customer proof).

## Unknowns (UNK-*)

- UNK-SEARCH-01 — Does any public, vendor-independent relevance benchmark
  usable as an oracle exist? None found in the evidence; press-claimed
  vendor evals are not repo-verifiable. Unresolved before S5.
  **Disposition: TARGETED.** [Round 3 triage, 2026-09-23] Relevance-benchmark oracle parked: self-built frozen fixture corpus pinned as the oracle at S2/S3; pin-time re-search recorded; vendor evals inadmissible. Promotion predicate: at S2/S3 truth-pack assembly, construct the frozen relevance-fixture corpus (queries + judged documents with provenance) as the self-built oracle, hash-pinned in MANIFEST.sha256; re-run the public-benchmark search at pin time and record the (negative) result; vendor press-claimed evals remain inadmissible. Owner: plan author. S3 step: truth-pack assembly.
- UNK-SEARCH-02 — Can live web search ever be an admissible quality
  measurement, given result decay? The nondeterminism floor is not yet
  quantified; default answer is no.
  **Disposition: TARGETED.**
- UNK-SEARCH-03 — What is the freshness decay window for the frozen fixture
  corpus — how often must it be re-captured before acceptance tests go
  stale? No evidence; needs a measurement program.
  **Disposition: TARGETED.**
- UNK-SEARCH-04 — Do closed vendors (Brave Search API, Perplexity Sonar,
  Linkup) offer evaluable endpoints that could serve as behavioral
  references? No official open SDK repos were found; Linkup's repo 404s.
  **Disposition: TARGETED.**
- UNK-SEARCH-05 — Is `VanessaCorentin/WebSearchFree` (0 stars, single
  author) anything more than "clones keep appearing"? Its claims are
  unverified.
  **Disposition: ADVISORY.**
- UNK-SEARCH-06 — Is Jina Reader (last push 2026-05-22) still the keyless
  extraction reference, or has freshness decayed past usefulness? The
  keyless endpoint has no SLA.
  **Disposition: WATCH.**
