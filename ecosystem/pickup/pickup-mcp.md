# Pickup companion: MCP clients/servers

Type: projects that implement or interoperate with the Model Context Protocol —
servers exposing tools/resources/prompts, client SDKs consuming them, SDKs and
frameworks in any language, and ecosystem tooling (conformance, registry, inspector).

Evidence base: `_evidence/mcp.md` (GitHub API-verified 2026-09-23). Every
owner/repo, star count, and file pointer below comes from that file. Inference
is labeled explicitly as such.

## Charter seed

**What this type is.** A clean-room or assessment project targeting the MCP
wire: a server that a client (Claude, a framework, the inspector) can connect
to and use; a client/SDK that can talk to any conformant server; or tooling
that exercises the protocol (conformance harnesses, debuggers, registries).

**In scope.** MCP servers (reference and production), SDK implementations in
any language, client-side adapters, conformance/registry/inspector-class
tooling, and the transport layers the spec versions (stdio, SSE, Streamable HTTP).

**Out of scope.** The MCP spec itself — it is the oracle, not the project.
LLM model serving and inference internals (separate type). Agent orchestration
logic that merely *consumes* MCP (that's agent-frameworks / workflow territory).
Any proprietary registry content or hosted service behavior.

**"A good starting point" for this type.** A pinned spec revision plus a pinned
official conformance harness running in CI per shipped wire revision; a
kitchen-sink reference server (`everything`-class) as the protocol-exercise
fixture; conformance failures recorded in named per-revision expected-failures
baselines; a tool-surface diff gate on server PRs; and a truth-pack pinning the
oracle side (conformance package, spec commit, fixture server commit) before
any competitive claim is made.

### Requirements

- REQ-MCP-01: Pin the spec revision(s) the project supports; conformance runs
  every shipped wire revision, not just latest.
- REQ-MCP-02: Adopt the official conformance harness rather than hand-rolled
  protocol checks; pin the harness package version in CI.
- REQ-MCP-03: Ship a kitchen-sink reference server exercising all protocol
  primitives (tools, resources, prompts) as the protocol-exercise fixture.
- REQ-MCP-04: Record every failing conformance scenario in a named
  per-spec-revision expected-failures baseline file — no silent skips.
- REQ-MCP-05: Gate server PRs on a base-vs-head diff of the exposed MCP tool
  surface (names and schemas reviewable).
- REQ-MCP-06: For any SDK, generate or diff-check protocol types against the
  pinned spec revision in CI so types can't drift from the wire.

- REQ-CI-COST — CI provisioning + cost ownership (bench slot 13, per
  PROJECT-PICKUP-PLAYBOOK.md). The S3 plan names: runner class/host (self-hosted
  GPU runner vs cloud vs CPU-only), provisioning owner (who stands up the
  runners), funding owner/account (who pays), schedule (PR / nightly / weekly /
  scheduled), and a spend cap before BEADS READY. Any field left `TBD` blocks S5.
  GPU-hour/lab spend is metered and recorded against the cap (see shared-gates.md
  GATE-007).

## Oracle candidates + integrity checks

| # | Oracle candidate | Integrity check (truth-pack shape) |
|---|---|---|
| O1 | Official conformance suite (`@modelcontextprotocol/conformance`) | PIN_RECORD.md pins package version (evidence shows `0.2.0-alpha.11` in python-sdk's CI env) + tarball SHA-256; MANIFEST.sha256 over the installed package; `fetch-truth-pack.sh --verify` installs the pinned version and refuses unpinned installs. |
| O2 | Pinned spec revision (dated: 2025-11-25, 2026-07-28) | PIN_RECORD.md pins the spec commit in `modelcontextprotocol/modelcontextprotocol`; conformance leg names bind to the revision; invocation-time record of `--spec-version <rev>` in every receipt. |
| O3 | `everything` reference server (src/everything in modelcontextprotocol/servers) | Fixture server commit pinned in PIN_RECORD.md; its SHA-256 recorded at every conformance invocation (whisper-pattern: un-recorded binary = inadmissible). |
| O4 | Official SDKs as differential peers (python-sdk, typescript-sdk) | Pin the SDK commit/version in `docs/evidence/incumbents.md`; differential conformance runs python-sdk-vs-typescript-sdk where behavior (not just the harness) is the claim. |
| O5 | Official inspector as client-oracle | Inspector release pinned; used only as a connectivity oracle (does the server behave under a real client), never as a conformance substitute. |

Integrity mechanics modeled on the model-project truth pack: `docs/truth-pack/`
ships PIN_RECORD.md, MANIFEST.sha256, ACCEPTANCE_SURFACE.json (conformance
tiers, expected-failures budget, transport latency floors), NONDETERMINISM_FLOOR.md
(transport jitter floor), and `fetch-truth-pack.sh --verify`.

- UNK-MCP-01: See UNK-MCP-01 in Unknowns below (not redefined here).
- UNK-MCP-06: See UNK-MCP-06 in Unknowns below (not redefined here).

## Initial claims (CLAIM-*)

Tiers (canonical, per PROJECT-PICKUP-PLAYBOOK.md): T0 [Verified] — direct
inspection (GitHub API metadata, workflow files read live); T1 [CI-observed];
T2 [Maintainer claim]/[External] — artifact owner's own statements, repo
docs/claims where CI was not inspected; T3 [Inference] — proposed norms with
no observed precedent. Statements are about the *type's* process norms, not
one repo's marketing.

| ID | Statement | Evidence pointer | Tier | Confidence | Status |
|---|---|---|---|---|---|
| CLAIM-01 | MCP is a living, versioned-wire protocol; the spec evolves as dated revisions with wire-level differences between them. | modelcontextprotocol/modelcontextprotocol (spec at 2025-11-25; revisions 2025-11-25, 2026-07-28 differ: stateful handshake vs stateless per-request `_meta`) | T0 | High | ADMISSIBLE |
| CLAIM-02 | The official conformance suite is wired into both official SDKs' CI, run as a job separate from unit tests. | modelcontextprotocol/python-sdk `.github/workflows/conformance.yml`; modelcontextprotocol/typescript-sdk `.github/workflows/conformance.yml` | T0 | High | ADMISSIBLE |
| CLAIM-03 | Conformance CI legs test every shipped wire revision (2025-11-25, 2026-07-28, default), not just latest. | modelcontextprotocol/python-sdk `.github/workflows/conformance.yml` (three legs); ts-sdk per-revision (`...:2026`) + extensions legs | T0 | High | ADMISSIBLE |
| CLAIM-04 | Hard conformance failures are recorded in named per-revision expected-failures baselines instead of skipped. | modelcontextprotocol/python-sdk `.github/actions/conformance/expected-failures{,.2025-11-25,.2026-07-28}.yml`; tier-check scores per revision | T0 | High | ADMISSIBLE |
| CLAIM-05 | The canonical reference server collection is educational and explicitly not recommended for direct production use. | modelcontextprotocol/servers docs page ("not recommended for direct production use") | T0 | High | ADMISSIBLE |
| CLAIM-06 | A kitchen-sink reference server exercising all protocol primitives is the standard protocol-exercise fixture. | modelcontextprotocol/servers `src/everything` ("Reference / test server with prompts, resources, and tools"); python-sdk conformance boots `mcp-everything-server` as the server under test | T0 | High | ADMISSIBLE |
| CLAIM-07 | Production server projects gate PRs on a diff of the exposed MCP tool surface. | github/github-mcp-server `.github/workflows/mcp-diff.yml` (builds base and head, diffs tool surface); companion `pkg/toolvalidation` | T0 | High | ADMISSIBLE |
| CLAIM-08 | SDK projects regenerate or diff-check protocol types against the pinned spec revision in CI. | modelcontextprotocol/typescript-sdk `.github/workflows/update-spec-types.yml` | T0 | High | ADMISSIBLE |
| CLAIM-09 | Monorepo server collections fan out per-server CI via dynamic package discovery. | modelcontextprotocol/servers `.github/workflows/typescript.yml` (`detect-packages` job → per-server test matrix) | T0 | High | ADMISSIBLE |
| CLAIM-10 | Testing tooling dogfoods by shipping fixture test servers, and justifies CI hygiene in-tree (timeouts sized from measured run history; least-privilege token defaults). | modelcontextprotocol/inspector `test-servers/`; `main.yml` timeout-minutes commentary ("roughly TWICE the slowest run observed"), `permissions: contents: read` with per-job overrides | T0 | High | ADMISSIBLE |
| CLAIM-11 | A client-side adapter ecosystem exists — frameworks consume MCP tools, not just build servers. | langchain-ai/langchain-mcp-adapters | T0 | High | ADMISSIBLE |
| CLAIM-12 | The official conformance harness is mature enough to serve as the sole protocol gate. | thin: harness is `0.2.0-alpha.11` with 127 stars; the evidence author never executed it | T3 | — | WITHDRAWN |

## Gate profile

### G1–G14 applicability

Shared gates GATE-006 (Protocol conformance + interop matrix) and GATE-017
(Spec / schema surface drift) are **load-bearing** for this type and bind
before any local gate: no "supports wire revision X" claim survives a
GATE-006 failure, and GATE-017 governs every spec-revision bump.

- **G1 ORACLE** — as-is, load-bearing. Oracle inventory: spec revision pin,
  conformance package pin, `everything`-server pin, inspector release. Post-pin
  changes need the two-party waiver; oracle shielded from the implementing agent.
- **G2 PAIR** — as-is. Differential validation: conformance legs across spec
  revisions, and SDK-vs-SDK differential where behavior (not just the harness)
  is the claim.
- **G3 OWN** — as-is. Binds to the owner field on every claim row.
- **G4 CONTRACT** — as-is. Claim artifacts conform to the registry schema.
- **G5 HOST** — as-is, with type-specific parameters. Canonical contract
  (ambient/host reads + new unsafe declared in the same diff) applies;
  parameters: transport-latency numbers are host-bound; conformance
  pass/fail is not exempt (flake attribution needs host state).
- **G6 UNSAFE** — advisory / N-A by language. This type is any-language; the gate
  is load-bearing only for implementations with unsafe/FFI code (Rust SDKs,
  native transports). Pure-managed implementations record N/A with evidence.
- **G7 REVIEW** — advisory; the type-specific analog is adversarial review of conformance-completeness claims (default-refute on "supports spec revision X"), recorded as a review parameter, not a claim that canonical G7 applies as-is.
- **G8 RULEBOOK** — as-is.
- **G9 IOU** — as-is; zero unresolved at close.
- **G10 MIRI** — as-is *conditionally*: fires only for Rust implementations of
  this type (transports and SDKs have unsafe-adjacent code); N/A for other languages.
- **G11 LAYOUT** — advisory / N-A by language. Load-bearing only for Rust
  components (layout assertions on wire-format structs); pure-managed
  implementations record N/A with evidence.
- **G12 AUDIT** — as-is. Conformance-failure classes fixed class-wide, then
  instance re-audit across servers/legs.
- **G13 NOSTUB** — as-is.
- **G14 REJECT** — as-is, load-bearing. A claim of "supports wire revision X"
  with conformance failures outside the named baseline is rejected; WITHDRAWN
  status on CLAIM-12 is this gate's shape in action.

### New type-specific gates

- **GATE-MCP-01 / GATE-MCP-02 — RETIRED into shared GATE-006** (S4 round 1,
  dedup per the playbook's local-gate rule). GATE-006 acceptance (1)–(3)
  already cover the pinned conformance harness, per-revision legs, and named
  expected-failures baselines with no silent skips. Retained as a
  type-specific parameter of GATE-006: baseline additions require explicit
  reviewer sign-off; tier-check scores conformance per revision.
- **GATE-MCP-03 / GATE-MCP-04 — RETIRED into shared GATE-017** (S4 round 1,
  dedup). GATE-017 acceptance (1)–(2) already cover base-vs-head tool-surface
  diffs and spec-type sync. No local delta retained.

### Shared-gate declarations (load-bearing vs advisory)

| Shared gate | Disposition | Rationale |
|---|---|---|
| GATE-004 (Structured-output grammar conformance + fuzz) | Advisory | Tool schemas are covered by GATE-017's type-generation checks |
| GATE-006 (Protocol conformance + interop matrix) | Load-bearing | Applies to this slug; pinned conformance harness is core |
| GATE-014 (deterministic test doubles / offline CI) | Universal | Applies to all types |
| GATE-015 (tiered CI separation) | Universal | Applies to all types |
| GATE-016 (dependency / toolchain pinning) | Universal | Applies to all types |
| GATE-017 (Spec / schema surface drift) | Load-bearing | Applies to this slug; tool/schema surface diff is core |
| GATE-018 (flake quarantine) | Universal | Applies to all types |

## Evidence tiers

Canonical pickup tiers (per PROJECT-PICKUP-PLAYBOOK.md), mapped to localbench
conventions ([Verified] flavors, [Maintainer claim], [External],
[Inference]):

- **T2 [Maintainer claim]** — statements from the artifact owner about their
  own artifact: spec dates and wire differences (modelcontextprotocol org),
  the docs note that the reference collection is not for direct production
  use. Admissible for oracle-definition claims; never for quality claims.
- **T0 [Verified]** — live GitHub API verification of metadata (stars,
  `pushed_at` 2026-09-22/23) and workflow/file contents read live
  (conformance.yml, expected-failures baselines, mcp-diff.yml,
  update-spec-types.yml, detect-packages, test-servers/, timeout commentary)
  — [Counted], [Git-observed], [Code-verified]. This is the only tier
  admissible for process claims.
- **T2 [Maintainer claim]/[External]** — repo README/docs claims about their
  own testing rigor where CI was not inspected or executed (context7,
  langchain-mcp-adapters: existence/activity verified only). Admissible only
  for existence/activity claims, never for process claims; [External] vs
  [Maintainer claim] depending on who wrote the README.
- **T3 [Inference]** — proposed norms with no observed precedent. Labeled
  [TARGETED] per the model-project claim vocabulary; admissible only inside
  requirements and starter-kit deltas, never as evidence of the type's
  norms. CLAIM-12 (conformance-harness maturity) is the example of a T3
  claim that had to be WITHDRAWN.

Inference rule for this type: any claim of the form "supports spec revision
X" is at most T2 until a pinned-harness leg for X is CI-observed (T1).

## Localbench bench shape

- **Spec identity.** Protocol bench: `conformance:<pkg>@<version>:spec-<rev>`
  (e.g. `conformance@0.2.0-alpha.11:spec-2025-11-25`). Server-under-test and
  client identity ride alongside: `server:<sdk-or-impl>@<commit>:<runtime>@<version>`.
  The harness starts/stops the fixture server (`everything`-class) itself and
  records the fixture binary's SHA-256 at invocation (whisper pattern: no
  un-recorded binary is admissible).
- **Anti-reward-hacking law (slot 12).** The 12 forbidden patterns carried
  verbatim into AGENTS.md at kit creation; for this type the
  conformance-harness is the attack surface — adding EXPECTED-FAIL carve-outs
  without a baseline file pointer, or weakening an EXPECTED-FAIL into a
  skip, counts as pattern-class tampering and fails G4.
- **Tiers.** Named per spec revision and never re-banked across them:
  `conf-2025-11-25`, `conf-2026-07-28`, `conf-default`; plus `unit`, `e2e`
  (isolated package per the typescript-sdk pattern), `surface` (tool-surface
  diff artifacts), `transport` (stdio/SSE/Streamable HTTP round-trip). A new
  spec revision adds a tier; an SDK/runtime update invalidates only the tiers
  it touches.
- **Golden schema.** Per spec: `conformance` — named scenarios, each
  `level: MUST|SHOULD` and `verdict: PASS|FAIL|EXPECTED-FAIL` (expected-fail
  entries carry the baseline file pointer); `metrics` — handshake p50/p99 and
  tool-call round-trip p50/p99, each with `value`, `spread` from A/A,
  `tol`, `tol_source` → banked receipt path, `better` direction.
- **Tolerance rule.** `tol = max(3 × A/A relative spread, floor)`; floor set
  per metric in ACCEPTANCE_SURFACE.json at bank time. Floor-selection
  criteria per metric class: transport metrics — the transport-jitter floor
  from NONDETERMINISM_FLOOR.md measured at bank time; conformance pass/fail
  metrics — floor = 0 (a pass/fail has no sub-unit tolerance).
- **Ordering.** Same-invocation A, B, A for transport metrics. Conformance
  pass/fail legs run as A/A pairs first to rule out flake before any
  cross-implementation comparison is banked.
- **Measurement law.** Loopback/local-only transports (stdio, localhost
  SSE/Streamable HTTP) — a failed local call is a finding, never a cloud
  fallback. Preflight refuses a busy machine (GPU/CPU > 25%, naming the
  processes); runs marked CONTENDED if any non-backend process exceeds 25%
  GPU in a second; one unit under test at a time; park/unpark interfering
  residents during test windows. Inference: MCP transport latency is jitter-
  sensitive, so the NONDETERMINISM_FLOOR.md for this type must carry a
  transport-jitter floor measured at bank time.
- **Receipts.** `docs/evidence/receipts/<kind>__<spec>__<timestamp>.json`,
  kinds: `conformance`, `aa`, `ab`, `surface`, `run`; dated `.md`
  investigation notes. `runs/` is gitignored scratch.
- **Incumbent pins.** `docs/evidence/incumbents.md`: conformance package
  version + tarball SHA-256, spec revision commit, fixture-server commit,
  SDK/runtime versions, OS, host id. Goldens bind per host
  (`goldens/<host_id>/`); never compared across hosts or generations.
- **Claims wiring.** `registries/claims.tsv`: every public claim sentence
  registered and machine-checked against its receipt on every commit.
  Negative-evidence ledger holds retracted claims in-tree (CLAIM-12 is the
  first entry).

## Starter-kit deltas

1. **Truth-pack template for MCP** (`docs/truth-pack/` variant): PIN_RECORD.md
   (spec revision commit + conformance package version + fixture-server commit),
   MANIFEST.sha256, ACCEPTANCE_SURFACE.json (per-revision conformance tiers,
   expected-failures budget, transport latency floors), NONDETERMINISM_FLOOR.md
   (transport-jitter floor), `fetch-truth-pack.sh --verify` (installs pinned
   conformance pkg + fixture server, refuses unpinned installs).
2. **CI template — conformance.yml**: per-spec-revision legs (2025-11-25,
   2026-07-28, default), harness package pinned in workflow env, separate from
   unit tests, per-leg expected-failures file. (shared GATE-006)
3. **CI template — mcp-diff.yml**: server PRs build base and head and diff the
   exposed tool surface; companion `toolvalidation` equivalent. (shared GATE-017)
4. **CI template — update-spec-types.yml**: regenerate or diff-check protocol
   types against the pinned spec. (shared GATE-017)
5. **Expected-failures baseline skeleton**: `expected-failures.<rev>.yml`
   template with per-revision tier-check scoring shape.
6. **Fixture template**: `everything`-class kitchen-sink server (tools +
   resources + prompts) wired as the conformance target.
7. **Gate registry entries**: shared GATE-006 and GATE-017 (load-bearing for this
   type) with acceptance criteria, logged PASS/FAIL/N-A with evidence per
   playbook step 22.
8. **CI hygiene defaults**: `concurrency: cancel-in-progress` on PRs,
   all-green required-status gate, per-job `timeout-minutes` sized from
   measured run history with inline commentary, default
   `permissions: contents: read` with documented per-job overrides.

- **CI provisioning + cost ownership (bench slot 13):** runner class/host, provisioning
  owner, funding owner/account, schedule, and spend cap — TBD acceptable pre-S5
  (any TBD blocks S5 per Bench slot 13); current: TBD (owner: parent orchestrator
  assigns at S3).

## Trend + process citations

All verified via GitHub API 2026-09-23. Stars are snapshots, not rankings;
`jlowin/fastmcp` was dropped (404 under that owner — unverifiable, not guessed
at a new location).

- modelcontextprotocol/servers | 90,565 | pushed 2026-09-22 — the canonical
  reference set (everything, fetch, filesystem, git, memory, sequentialthinking,
  time); its durable lesson is per-server matrix CI, not code quality (docs say
  not for direct production use).
- upstash/context7 | 62,361 | pushed 2026-09-23 — most-starred server found;
  evidence of broad community building. Existence/activity only — no CI inspected.
- github/github-mcp-server | 33,149 | pushed 2026-09-22 — first-party production
  Go server; the mcp-diff.yml tool-surface gate + `pkg/toolvalidation` is the
  highest-value MCP-specific CI practice found.
- modelcontextprotocol/python-sdk | 24,374 | pushed 2026-09-23 — official Python
  SDK; richest process evidence: pinned conformance pkg, per-revision
  expected-failures baselines, multi-wire conformance legs.
- modelcontextprotocol/typescript-sdk | 13,444 | pushed 2026-09-23 — official
  TypeScript SDK; runtime matrix + separate e2e package, client+server
  conformance incl. extensions legs, spec-type regeneration workflow.
- modelcontextprotocol/inspector | 10,933 | pushed 2026-09-23 — official
  debugging tool; dogfooded fixture servers, measured-history timeout sizing,
  least-privilege token defaults.
- modelcontextprotocol/modelcontextprotocol | 9,284 | pushed 2026-09-23 —
  spec + docs; dated wire revisions make this a living standard, not a frozen API.
- modelcontextprotocol/registry | 7,280 | pushed 2026-09-22 — official
  registration/discovery; a registry existing at all evidences ecosystem scale.
- langchain-ai/langchain-mcp-adapters | 3,658 | pushed 2026-09-16 — client-side
  adapters; evidence of the client ecosystem, trend only (no CI inspected).
- modelcontextprotocol/conformance | 127 | pushed 2026-09-21 — official
  conformance suite (`action.yml`, `SDK_INTEGRATION.md`); authority comes from
  being wired into both official SDKs' CI, not from stars; alpha and never
  executed by the evidence author.

**Caveats carried over.** The conformance harness is alpha (`0.2.0-alpha.11`)
with 127 stars — copy the harness practice, not a maturity claim (CLAIM-12
withdrawn). The `servers` 90k star count measures the org's flagship, not
per-server quality. context7 and langchain-mcp-adapters were verified for
existence/activity only and support no process claim. Python SDK's exact
unit-test matrix lives in `shared.yml`, of which only the caller was read —
verify before citing specifics. Other-language SDKs (Rust, Go, Java, Kotlin,
PHP, Ruby, Swift) were not individually verified. The spec's 2026-07-28
revision exists in CI legs and dated-revision lists; its full wire delta was
not re-read for this file.

## Unknowns (UNK-*)

- UNK-MCP-01: Conformance-harness coverage depth — alpha (`0.2.0-alpha.11`), 127 stars,
  never executed by the evidence author. Copying the harness is warranted; claiming
  its coverage is not. Cannot be resolved from the evidence; needs a hands-on run
  before any project relies on it as the sole protocol gate.
  **Disposition: TARGETED.** [Round 3 triage, 2026-09-23] Conformance-harness coverage depth parked: S3 hands-on run measures and records coverage; sole-gate status gated on PASS + coverage record. Promotion predicate: at S3 gate wiring, execute the pinned conformance harness hands-on against the reference server, record coverage depth (protocol surface exercised vs spec) in the gate log; the harness becomes the sole protocol gate only after a PASS verdict with the coverage record attached. Owner: plan author. S3 step: gate wiring.
- UNK-MCP-02: Python SDK's unit-test matrix dimensions (`shared.yml` only read
  via its caller). Resolve by reading the file before citing specifics.
  **Disposition: TARGETED.**
- UNK-MCP-03: Process practices of high-profile servers (upstash/context7) and
  client adapters (langchain-mcp-adapters) — uninspected; process evidence for
  these is thin by design of the verification pass.
  **Disposition: ADVISORY.**
- UNK-MCP-04: Whether expected-failures baseline entries are revisited on a
  schedule or expire — no expiry/revisit policy observed in the evidence.
  **Disposition: TARGETED.**
- UNK-MCP-05: Policy for intentional tool-surface breaking changes under a
  diff-gated server (versioning/deprecation path) — not observed.
  **Disposition: TARGETED.**
- UNK-MCP-06: Rust SDK CI practices — unverified (only TypeScript and Python SDKs
  were API-checked), yet the FrankenSuite clean-room path is Rust, so it has no
  confirmed differential peer.
  **Disposition: TARGETED.**
- UNK-MCP-07: Registry governance rules (listing/delisting criteria for
  modelcontextprotocol/registry) — affects what "ecosystem scale" may be
  claimed from its existence.
  **Disposition: ADVISORY.**
