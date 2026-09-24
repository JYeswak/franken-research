# Pickup companion: Multi-agent protocols

Category: A2A/ACP-class protocols — standardized discovery, messaging, and task
delegation between agents. All repos, paths, and star counts below come from
`_evidence/multi-agent-protocols.md` (verified 2026-09-23 via `api.github.com/repos/<owner>/<repo>`).

## Charter seed

**What this project type is.** A clean-room implementation of a published
agent-to-agent protocol: the wire format, message semantics, discovery/registration,
task delegation primitives, and security features (signing, auth schemes,
encryption) as defined by a spec. The reference point is A2A v1.x
(the category's center of gravity), with ANP as the main non-A2A alternative.

**In scope.** One protocol's client + server implementation in one language;
a pinned wire corpus; a conformance harness that runs the protocol's own TCK
(if one exists) plus cross-implementation wire-diff against a reference SDK;
per-transport parity (JSON-RPC, gRPC, REST, SSE where the spec mandates them);
per-spec-version backward-compat suites.

**Out of scope.** New protocol design (the charter is conformance, not invention);
agent-to-tool protocols (MCP is explicitly excluded — agent-to-tool ≠ agent-to-agent);
building an LLM-driven agent to *use* the protocol (that is agent-frameworks work);
claiming cross-org interop from self-interop runs.

**Assignment rule (binding).** Reference agent implementations used as protocol
harnesses — the official reference SDKs (e.g. `a2a-python`, `a2a-js`) when run
as conformance/interop peers — are assigned to **this type** (protocols), not
to agent-frameworks. The same codebase used as an LLM-driven agent under test
is assigned to **agent-frameworks**. The assignment follows the *role in the
claim*, not the repo name: harness role ⇒ protocols; agent-under-test role ⇒
frameworks.

**"A good starting point" means:** the spec version is pinned; the TCK (if any)
is pinned at a commit and shielded from the implementing agent; a wire corpus
exists with known-broken cases as must-flip markers (never skips); the first
interop run is local loopback, A/B/A against a reference SDK, with receipts.

### Requirements

- **REQ-MAP-1** — Pin the protocol spec version, the TCK commit (or note its absence), and the reference SDK commits before any conformance or interop claim is registered (feeds G1).
- **REQ-MAP-2** — Ship a shared wire corpus where every known-broken case is a must-flip marker test (the `it.fails` pattern: the marker starts failing when the bug is fixed), never a skip or TODO.
- **REQ-MAP-3** — Test every transport/binding the spec mandates with the same operation surface and the same test plan; one binding green is not a protocol conformance verdict.
- **REQ-MAP-4** — Label interop scope honestly: runs against the same org's SDKs are [SELF-INTEROP]; full INTEROP requires ≥1 independent peer implementation, otherwise the claim carries UNK.
- **REQ-MAP-5** — Unit-test the protocol machinery (handshake, verify, sign, register, discovery, Agent Card canonicalization) independently of any LLM; security features get their own spec files, not incidental coverage.

- REQ-CI-COST — CI provisioning + cost ownership (bench slot 13, per
  PROJECT-PICKUP-PLAYBOOK.md). The S3 plan names: runner class/host (self-hosted
  GPU runner vs cloud vs CPU-only), provisioning owner (who stands up the
  runners), funding owner/account (who pays), schedule (PR / nightly / weekly /
  scheduled), and a spend cap before BEADS READY. Any field left `TBD` blocks S5.
  GPU-hour/lab spend is metered and recorded against the cap (see shared-gates.md
  GATE-007).

## Oracle candidates + integrity checks

Oracle selection truth-pack shape (from model-guides): `docs/truth-pack/` holds
`PIN_RECORD.md`, `MANIFEST.sha256`, `ACCEPTANCE_SURFACE.json`, `NONDETERMINISM_FLOOR.md`,
`fetch-truth-pack.sh --verify`, with invocation-time oracle binary SHA-256 recording
(the whisper pattern: un-recorded executable = diagnostic only).

| Oracle candidate | Role | Integrity check |
|---|---|---|
| `a2aproject/a2a-tck` (commit-pinned, e.g. ≥ 2026-09-01 state) | Technology Compatibility Kit — the conformance bar | PIN_RECORD.md pins the TCK commit; `fetch-truth-pack.sh --verify` clones it at the pin, records its tree SHA-256 in every receipt; post-pin change needs a two-party waiver (G1) |
| `a2aproject/A2A` spec v1.0.1 (tagged 2026-05-28) | Normative text + `specification/a2a.proto` | Spec text pinned by tag; proto lint reproduced locally (buf config in-repo at `specification/buf.yaml`); acceptance surface = TCK pass, not prose agreement |
| Official SDKs as reference SUTs (`a2a-python`, `a2a-go`, `a2a-js`, `a2a-dotnet`) | Differential oracle: expected wire bytes and behaviors | Each reference SDK pinned by commit in PIN_RECORD.md; oracle binary/SDK SHA-256 recorded at invocation (whisper CAMPAIGN WIN rule) |
| `a2a-python:tests/compat/v0_3/` + `a2a-go:e2e/compat/` | Backward-compat regression oracle (older spec versions) | Frozen as wire fixtures with per-file SHA-256 in MANIFEST.sha256; vN server must pass vN-1 client cases |
| `agent-network-protocol/anp` `testdata/` (`did_transition/`, `direct_e2ee/`, `group_e2ee/`) + `tests/e2e/`, `tests/system/` | ANP-target projects: crypto/handshake fixtures | Fixture hashes banked; ACCEPTANCE_SURFACE.json declares pass thresholds per fixture dir |
| `fetchai/uAgents` `python/tests/` message-layer suite | Protocol-machinery unit oracle (verify, register) | Run locally; MANIFEST.sha256 covers input fixtures; results are integrity records only (whisper asymmetry applies — a valid receipt ≠ origin attestation) |

`NONDETERMINISM_FLOOR.md` for this type: streaming/SSE timing jitter, network
retransmission, clock skew in signed tokens, and any LLM-in-the-loop component
(if the SUT embeds one, it is isolated from the protocol conformance surface —
protocol claims never rest on model output).

**UNK-MAP-2** — No second fully independent A2A implementation outside the
a2aproject org was found in this sweep, so the differential oracle is
self-interop by construction; treat accordingly (REQ-MAP-4).
**UNK-MAP-1** — No evidence yet that all four A2A SDKs run the TCK in CI, so
"TCK-passing" is a weaker claim than it looks.

## Initial claims (CLAIM-*)

Claims are about the TYPE's process norms, not any single repo's marketing.
Tiers (canonical, per PROJECT-PICKUP-PLAYBOOK.md): T0 [Verified] — direct inspection of a fresh clone, API, live page, or a measurement at a pinned oracle with invocation-time SHA-256 recorded; T1 [CI-observed] — executed and observed on CI / banked receipt; T2 [Maintainer claim]/[External] — asserted by repo docs or an independent source, not reproduced by us; T3 [Inference] — analyst judgment, always labeled as such. Confidence: High (T0 ADMISSIBLE) / Medium (T0 CONTESTED, T1, T2 ADMISSIBLE) / Low (T2 CONTESTED, T3); WITHDRAWN rows carry --.

| ID | Statement | Evidence pointer | Tier | Confidence | Status |
|---|---|---|---|---|---|
| CLAIM-MAP-1 | The category consolidated from two competing specs to one: ACP was archived after merging into A2A; a new project should target A2A v1.x and treat ACP as historical | `i-am-bee/acp` (1,016 stars, archived 2025-08-25); corroborated by two independent third-party research docs cited in evidence | T0 | High | ADMISSIBLE |
| CLAIM-MAP-2 | Multi-language SDK matrix is the expected process norm: the protocol org maintains four official SDKs (`a2a-python` 2,155, `a2a-js` 627, `a2a-go` 470, `a2a-dotnet` 263) — a real interop surface to test against | `a2aproject/a2a-{python,js,go,dotnet}` | T0 | High | ADMISSIBLE |
| CLAIM-MAP-3 | The conformance suite lives in its own repo, separate from every SDK, so all implementations test against the same bar (`a2a-tck`; a2a-go runs it via `e2e/tck/run_tck.sh` + `orchestrate_tck.py` cloning `a2aproject/a2a-tck` against a local SUT) | `a2aproject/a2a-go:e2e/tck/run_tck.sh`, `e2e/tck/sut.go` | T0 | High | ADMISSIBLE |
| CLAIM-MAP-4 | Wire-format conformance corpora are generated by round-tripping a shared corpus through two implementations and diffing output (`a2a-js:test/proto_json_conformance.spec.ts`); known-broken cases use must-flip markers, not skips | `a2aproject/a2a-js:test/proto_json_conformance.spec.ts` | T0 | High | ADMISSIBLE |
| CLAIM-MAP-5 | Multi-transport parity is a process norm: JSON-RPC, gRPC, REST, SSE expose and test the same operations (`a2a-go:a2asrv/jsonrpc_test.go`, `rest_test.go`, `sse_test.go`, `a2agrpc/v0/`, `a2agrpc/v1/`; `a2a-python:tests/integration/` 25 files + `scripts/docker-compose.test.yml`) | `a2aproject/a2a-go`, `a2a-python` | T0 | High | ADMISSIBLE |
| CLAIM-MAP-6 | Backward-compat suites are pinned per spec version so vN servers keep working with vN-1 clients (`a2a-python:tests/compat/v0_3/` 15 files; `a2a-go:e2e/compat/`; `a2acrypto/sign_test.go` for Agent Card canonicalization) | `a2aproject/a2a-python:tests/compat/v0_3/`, `a2a-go:e2e/compat/` | T0 | High | ADMISSIBLE |
| CLAIM-MAP-7 | Auth/signature features are first-class conformance: JWS-signed Agent Cards get dedicated spec files (`a2a-js:test/signature.spec.ts`; `a2a-python:tests/auth/`, `tests/server/` 39 files) — not incidental coverage | `a2aproject/a2a-js:test/signature.spec.ts` | T0 | High | ADMISSIBLE |
| CLAIM-MAP-8 | The spec repo itself runs machine-checked lint (protobuf via buf: `specification/a2a.proto`, `buf.yaml`, `buf.lock`, `.api-linter.yaml`; 11 workflows incl. `linter.yaml`, `spelling.yaml`, conventional-commits) before human review | `a2aproject/A2A:specification/`, `.github/workflows/` | T0 | High | ADMISSIBLE |
| CLAIM-MAP-9 | Cross-language interop is named explicitly in CI with checked-in wire fixtures (ANP `rust-python-interop.yml`, `tests/rust_interop_config.json`, `testdata/`, `scripts/run_all_tests.py`) | `agent-network-protocol/anp:.github/workflows/rust-python-interop.yml`, `testdata/` | T0 | High | ADMISSIBLE |
| CLAIM-MAP-10 | Protocol machinery is unit-tested at the message layer independently of any LLM (uAgents `test_protocol.py`, `test_protocol_spec.py`, `test_msg_verify.py`, `test_agent_registration.py`; ANP `anp/unittest/` 74 files incl. `direct_e2ee/`, `e2e_encryption_hpke/`) | `fetchai/uAgents:python/tests/`, `agent-network-protocol/anp:anp/unittest/` | T0 | High | ADMISSIBLE |
| CLAIM-MAP-11 | The "interop" tested in this category is mostly self-interop: no second fully independent A2A implementation outside the a2aproject org was found in this sweep — a thin-category caveat any new project inherits | sweep negative result, evidence file caveats | T0 | High | ADMISSIBLE |
| CLAIM-MAP-12 | The TCK is the least-maintained piece of the A2A testing story (51 stars, pushed 2026-09-01; no evidence all four SDKs run it in CI) — treat "passes TCK" as partial conformance, not full | `a2aproject/a2a-tck`, evidence file caveats | T0 | Medium | CONTESTED |
| CLAIM-MAP-13 | The protocol class is scoped by message direction: agent-to-tool (MCP) is out, agent-to-agent is in — per the protocol maintainers' own distinction, not reviewer inference | ANP docs distinction, evidence file | T2 | Medium | ADMISSIBLE |

## Gate profile

G1–G14 (from `_s0/ecosystem-digest.md` §3; "as-is" = semantics unchanged,
"type-specific parameters" = what gets pinned for protocol work):

| Gate | Applicability |
|---|---|
| G1 ORACLE | As-is. Oracle inventory = spec tag + TCK commit + reference SDK pins + wire fixtures; post-pin changes need the two-party waiver; the oracle (TCK, corpus) is shielded from the implementing agent. |
| G2 PAIR | As-is, type param: the paired/differential contract is cross-implementation wire-diff (clean-room vs pinned reference SDK) and cross-transport parity, not just self-A/B. |
| G3 OWN | As-is. Every CLAIM-MAP row binds ATLAS R7 `owner`. |
| G4 CONTRACT | As-is, type param: claim artifacts = wire corpora + TCK receipts + transport-matrix results. |
| G5 HOST | As-is. Latency/timing numbers bind per host (`goldens/<host_id>/`); cross-host comparison of timing claims is N/A. |
| G6 UNSAFE | Advisory. Crypto/signing/canonicalization code paths get classification review, but the gate's Rust-UB machinery is out of scope unless the SUT is Rust. |
| G7 REVIEW | As-is. Adversarial split-context review of spec-facing claims (protocol conformance claims are exactly the class that fails by invention). |
| G8 RULEBOOK | As-is. |
| G9 IOU | As-is. Zero unresolved at close — including must-flip markers with no flip predicate. |
| G10 MIRI | Advisory; applies only if the SUT is Rust (ANP's rust component is the in-category precedent). |
| G11 LAYOUT | Advisory/N-A unless the SUT is Rust. |
| G12 AUDIT | As-is. Class-fix → instance re-audit (e.g. a canonicalization bug found in one transport re-audited in all). |
| G13 NOSTUB | As-is, type param: `it.fails`-style must-flip markers and known-broken lists are permitted and are explicitly NOT stubs; skips/TODOs in the corpus suite fail the gate. |
| G14 REJECT | As-is. Claims violating their tier burden are rejected (e.g. a SELF-INTEROP result dressed as INTEROP). |

Proposed new type-specific gates (GATE-* IDs):

- **GATE-MAP-1 — RETIRED into shared GATE-006** (S4 round 1, dedup). GATE-006
  acceptance (1) already pins the official conformance harness (the TCK) by
  version in CI. Retained as a type-specific parameter: the receipt names
  `tck_commit` + `tck_sha256`, and any run against an unpinned TCK is
  diagnostic only, never a gate pass.
- **GATE-MAP-2 — RETIRED into shared GATE-017** (S4 round 1, dedup). GATE-017
  acceptance (4) already requires known-broken cases as must-flip markers,
  never skips. No local delta retained.
- **GATE-MAP-3 (TRANSPORT-PARITY)** — The same test plan passes on every spec-mandated binding. *Acceptance:* per-binding results matrix (JSON-RPC/gRPC/REST/SSE as applicable) with all MUST checks green on all bindings; one binding green ≠ gate pass. Genuine local delta (GATE-006 does not name per-binding parity); kept.
- **GATE-MAP-4 — RETIRED into shared GATE-006** (S4 round 1, dedup). GATE-006
  acceptance (4) plus its anti-patterns already require cross-implementation
  interop and reject self-interop dressed as interop. Retained as a
  type-specific parameter: a full INTEROP verdict requires ≥1 peer
  implementation outside the originating org; peer provenance (repo + commit
  + org) is named in the receipt; without it the verdict is [SELF-INTEROP]
  and any public "interoperable" claim fails G14.

### Shared-gate declarations (load-bearing vs advisory)

| Shared gate | Disposition | Rationale |
|---|---|---|
| GATE-006 (Protocol conformance + interop matrix) | Load-bearing | Applies to this slug; TCK pinning is the type's core |
| GATE-017 (Spec / schema surface drift) | Load-bearing | Applies to this slug; protocol-type sync is core |
| GATE-014 (deterministic test doubles / offline CI) | Universal | Applies to all types |
| GATE-015 (tiered CI separation) | Universal | Applies to all types |
| GATE-016 (dependency / toolchain pinning) | Universal | Applies to all types |
| GATE-018 (flake quarantine) | Universal | Applies to all types |

## Evidence tiers

Mapped to the localbench/program vocabulary ([Verified] flavors, [Maintainer claim], [External], [Inference]; [CI-observed] attests the suite *runs*, not that it is green):

- **T0 [Verified]:** spec tags and releases from the protocol org (A2A v1.0.0/v1.0.1); the TCK's own pass/fail output when run pinned; official SDK test suites as expected-behavior references. Vendor *claims about maturity* stay T2 and do not upgrade by repetition.
- **T0 [Verified] / T1 [CI-observed]:** GitHub API-observed facts (star counts, push dates, archived status, release tags — [Git-observed]); locally run TCK/conformance receipts with pinned inputs and recorded SHA-256s ([Counted]/[Code-verified]); CI-observed green runs on named workflows; third-party corroboration of consolidation (the two independent research docs on the ACP→A2A merge — [External]).
- **T2 [Maintainer claim]:** maintainer merge/history narratives; ANP docs' MCP-vs-A2A distinction; "tested interop" claims made inside a single org's SDK matrix — admissible but auto-labeled [SELF-INTEROP] per shared GATE-006 (GATE-MAP-4 retired into it).
- **T3 [Inference]:** roadmaps, planned SDKs, claimed future TCK coverage, "will support vNext" — registered as TARGETED, never as observed. Unverified-via-API material (e.g. the Coral Protocol staleness note) is excluded entirely, not parked at T3.

## Localbench bench shape

Slots per `_s0/localbench-pattern.md`, instantiated for protocol work:

1. **Spec format** — `protocol:impl@<commit-sha>[:transport]` naming exactly what is measured, e.g. `a2a:cleanroom-go@<sha>:jsonrpc`, `a2a:a2a-python@<sha>:grpc`. The harness starts/stops both SUT endpoints itself (local loopback).
2. **Tier list** — named workload tiers: `conform` (TCK run), `compat` (per-spec-version compat suite), `interop` (cross-implementation wire corpus diff), `auth` (signing/auth conformance), `latency` (round-trip timing, SHOULD-tier). Goldens bind PER TIER; a binding change re-banks only the tiers it touches.
3. **Golden schema** — JSON per spec: `conformance` (named checks, `level: MUST|SHOULD`, `verdict: PASS|FAIL`; TCK all-pass = MUST; cross-SDK wire-diff zero = MUST for `interop`); `metrics` (each with `value`, `spread` from A/A, `tol`, `tol_source` → banked receipt path, `better` direction). Tolerance rule: `tol = max(3 × A/A relative spread, floor)`; the floor for `latency` is declared in NONDETERMINISM_FLOOR.md.
4. **Only banking ceremony** — goldens written ONLY by an A/A pair run (`aa <spec> --write-golden`: two runs → banked receipt + golden, refuses unsound A/A pairs), followed by `git diff goldens/` review in the same commit. Golden-regeneration-until-green is a named forbidden pattern.
5. **Host/generation binding** — `goldens/<host_id>/`; never compared across hosts. Wire-format goldens (byte-exact) are host-independent and may be shared; timing goldens never leave their host.
6. **Measurement law** — preflight refuses a busy machine (GPU/CPU > 25%, names the processes); runs marked CONTENDED if any non-backend process exceeds 25% GPU in a second; one SUT pair under test at a time; loopback/local-only endpoints (a failed local call is a finding, never a cloud fallback); wire bytes captured before any interpretation.
7. **A/B discipline** — same-invocation A, B, A ordering, banked under a name: reference SDK (A) → clean-room (B) → reference SDK (A), same corpus, same invocation window.
8. **Receipts** — `docs/evidence/receipts/<kind>__<spec>__<timestamp>.json` (kinds: `tck`, `wirecorpus`, `transport`, `aa`, `ab`, `run`) + dated `.md` investigation notes; `runs/` is gitignored scratch. Every receipt records TCK commit, wire-corpus SHA-256, both SUT commits, and oracle binary SHA-256s.
9. **Incumbent pins** — `docs/evidence/incumbents.md`: exact commits + tree hashes of spec, TCK, reference SDKs, fixture dirs, OS, harness.
10. **Claims registry wiring** — `registries/claims.tsv`: every public conformance/interop claim sentence registered and machine-checked against its receipt on every commit; [SELF-INTEROP] claims carry the label in the registry.
11. **Negative-evidence ledger** — `docs/evidence/NEGATIVE_EVIDENCE.md`: failed interop runs, must-flip markers that stayed broken, transport-parity gaps; retractions stay in-tree with the lesson.
12. **Anti-reward-hacking law** — the 12 forbidden patterns verbatim in AGENTS.md; protocol-specific watchlist: gate self-weakening via skipped bindings, conformance metastasis (counting TCK *runs* as TCK *passes*), bench-path hardcoding (testing the SUT against itself through the reference SDK's test helpers).

Remote-lab variant: none required — protocol conformance runs locally by construction.

## Starter-kit deltas

Concrete additions the franken starter kit needs for this type:

- **Files:** `docs/truth-pack/WIRE_CORPUS.json` (shared message corpus with per-case SHA-256 and `must_flip` flags); `docs/truth-pack/TCK_PIN.md` (TCK commit + tree hash + fetch recipe); `docs/truth-pack/TRANSPORT_MATRIX.md` (mandated bindings × test plan, pinned per spec version); extend `fetch-truth-pack.sh --verify` to record TCK SHA-256 and per-reference-SDK pins.
- **Harness shapes:** `e2e/tck/run_tck.sh` pattern — a harness that clones the pinned TCK into scratch and runs it against a local System Under Test (copy `a2a-go:e2e/tck/`'s shape: `run_tck.sh`, `sut.go`-equivalent adapter, `sut_test.go`-equivalent smoke); `wirecorpus-diff.py` — runs the corpus through two implementations and diffs wire bytes, with must-flip marker support and zero-skip enforcement; `scripts/run_all_tests.py` equivalent — one script that runs the full matrix (copy ANP's `scripts/run_all_tests.py`).
- **Gates:** GATE-MAP-3 kept as a type-specific gate; GATE-MAP-1/GATE-MAP-4 retired into shared GATE-006 and GATE-MAP-2 into shared GATE-017 (above) added to the gate registry; G13's NOSTUB semantics extended with the must-flip-marker carve-out.
- **Evidence-tier convention:** [SELF-INTEROP] label for within-org interop results; [CI-observed] keeps its narrow meaning (suite runs ≠ suite green).

- **CI provisioning + cost ownership (bench slot 13):** runner class/host, provisioning
  owner, funding owner/account, schedule, and spend cap — TBD acceptable pre-S5
  (any TBD blocks S5 per Bench slot 13); current: TBD (owner: parent orchestrator
  assigns at S3).

## Trend + process citations

Repos verified 2026-09-23; stars are the 2026-09-23 snapshot. One-line process takeaway each.

- `a2aproject/A2A` | 25,905 | last push 2026-09-22 | The spec repo itself — tagged v1.0.0 (2026-03-12), v1.0.1 (2026-05-28), vendor-neutral stewardship; copy the machine-checked spec lint (`buf`) before any new protocol text.
- `a2aproject/a2a-python` | 2,155 | pushed 2026-09-23 | Reference SDK + `tests/compat/v0_3/` (15 files): per-spec-version compat dirs are the backward-compat pattern to copy.
- `a2aproject/a2a-js` | 627 | pushed 2026-09-23 | `test/proto_json_conformance.spec.ts`: wire corpus generated by diffing two implementations, known-broken as must-flip `it.fails` — the single best practice in the category.
- `a2aproject/a2a-go` | 470 | pushed 2026-09-23 | `e2e/tck/` (run_tck.sh + orchestrate_tck.py + sut adapter): the standalone-TCK wiring pattern; plus multi-transport parity tests (`a2asrv/*_test.go`, `a2agrpc/v0|v1`).
- `a2aproject/a2a-dotnet` | 263 | pushed 2026-09-22 | Fourth official SDK — the interop surface is a matrix, not a pair; any claim should name which SDKs were in the room.
- `agent-network-protocol/AgentNetworkProtocol` | 1,435 | pushed 2026-09-20 | The non-A2A spec with a real community (W3C community group); three-layer stack (DID identity + encrypted comms, meta-protocol negotiation, JSON-LD app layer).
- `agent-network-protocol/anp` | 351 | pushed 2026-09-23 | Five languages in one repo with `testdata/` wire fixtures and a named cross-language interop CI workflow (`rust-python-interop.yml`) — copy the named-matrix + checked-in-fixtures shape.
- `fetchai/uAgents` | 1,640 | pushed 2026-09-23 | Alternative ecosystem with a full pytest suite at the message layer (`test_protocol.py`, `test_msg_verify.py`, `test_agent_registration.py`): protocol-machinery unit tests independent of any LLM.
- `a2aproject/a2a-tck` | 51 | pushed 2026-09-01 | Standalone Technology Compatibility Kit — the right architecture, but the youngest and least-maintained piece; verify SDK CI wiring before trusting it.
- `i-am-bee/acp` | 1,016 | archived 2025-08-25 | IBM's ACP merged into A2A: consolidation evidence — treat A2A v1.x as the target and ACP as historical.

**Honest caveats (carried over verbatim in substance):** thin category — interop work is concentrated inside one project's SDK matrix; ANP's impl repo is strong on unit tests (74 files) but its cross-language interop CI covers only rust-python, not the full five-language matrix; no second fully independent A2A implementation outside the a2aproject org was found, so tested "interop" is mostly self-interop; the TCK exists but there is no evidence all four SDKs run it in CI; Coral Protocol surfaced but was excluded (abandonment flag not API-verified — negative evidence, not cited); MCP deliberately excluded (agent-to-tool, not agent-to-agent).

## Unknowns (UNK-*)

Open questions that must be resolved before S5:

- **UNK-MAP-1** — Do all four official A2A SDKs actually run the TCK in CI? Without this, "passes TCK" cannot be treated as full conformance (CLAIM-MAP-12 is CONTESTED pending).
  **Disposition: TARGETED.** [Round 3 triage, 2026-09-23] TCK-in-CI parked: S3 per-SDK workflow inspection at pinned commits; CLAIM-MAP-12 stays CONTESTED until all four SDKs run it. Promotion predicate: at S3 truth-pack assembly / gate wiring, inspect each of the four A2A SDKs' CI workflow files at their pinned commits for TCK invocation; record per-SDK verdicts. Owner: evidence auditor (CI/pointer verification). S3 step: truth-pack assembly / gate wiring.
- **UNK-MAP-2** — Does any fully independent A2A implementation outside the a2aproject org exist? Until one is found and pinned, shared GATE-006 (with the GATE-MAP-4 independent-peer parameter) caps every interop verdict at [SELF-INTEROP].
  **Disposition: TARGETED.** [Round 3 triage, 2026-09-23] Independent A2A implementation parked: pin-time search at S3; interop verdicts capped at [SELF-INTEROP] until an independent peer is found and pinned. Promotion predicate: at S3 bench setup (interop tier wiring), re-run the independent-implementation search at pin time; pin whatever interop peers exist in PIN_RECORD.md; set GATE-MAP-4's independent-peer parameter to the pinned peer, or record the [SELF-INTEROP] cap in the gate log if the search is still empty. Owner: plan author. S3 step: bench setup.
- **UNK-MAP-3** — What is the exact acceptance surface for the wire corpus: which messages must byte-match vs merely semantic-match? The TCK's scope vs the SDKs' `proto_json_conformance` corpora may differ; resolve by reading the pinned TCK at S3.
  **Disposition: TARGETED.**
- **UNK-MAP-4** — What is ANP's actual interop matrix? The repo holds five languages but named CI covers rust-python only — resolve whether the other pairs have any conformance story.
  **Disposition: TARGETED.**
- **UNK-MAP-5** — Which A2A v1.0 behaviors are frozen under the v1.x compat policy, and does a written v0.x→v1.x migration/compat contract exist beyond the `tests/compat/v0_3/` dirs?
  **Disposition: TARGETED.**
- **UNK-MAP-6** — Is JWS-signed Agent Card support normative (REQUIRED) or optional in the A2A v1.x spec? The SDKs test it, but the charter needs the spec's requirement level to set GATE-MAP-3's MUST list.
  **Disposition: TARGETED.**
