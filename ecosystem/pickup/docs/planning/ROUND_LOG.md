<!--
ROUND_LOG.md — machine-readable review log (playbook grammar, v1.3).

2026-09-23 BACKFILL (S4 round-3 integration). This file was rewritten from
prose: the previous 18 prose lines conformed to no grammar line type. Every
data line below this comment conforms to one grammar type
(round|attest|unk|audit|stage-artifact|skip|intake|cert|def|reopen|kill).

Backfill conventions (all backfilled, none invented):
- reviewer=<roundN-laneX> are backfilled lane identifiers, not people; real
  reviewer names were not recorded in the sources.
- pin=UNCOMMITTED on round/attest lines: the reviewed trees were never
  committed (the playbook grammar v1.3 permits this; cert lines never use it).
- def locations point at the DEF record in the lane file
  (docs/planning/round<N>/DEF<N>-lane<X>.md:<line>); round-1/2 def fix fields
  cite the integration record, not a re-derived diff.
- attest lines are pre-review attestations reconstructed from the lane
  review records (one per reviewer per round).
- The round-2 audit line records the round-2 lane-E spot check (15 claim
  pointers, all verified); the check's random seed was not recorded in the
  source, so seed=unrecorded.
- Stage artifacts for the authoring process: S0=_evidence/ (the evidence
  substrate), S1=INTENT.md (charter/type-selection record), S2=
  PROJECT-PICKUP-PLAYBOOK.md (constitution). S3 has no artifact: the 21 type
  pickups were designed, not executed — recorded as a skip line, not as
  completion.
- No intake lines: intake lines are per-type S0 exits; no type-level S0 ran
  in this authoring process.
- The cert line carries result=NOT READY: no BEADS READY certificate exists.
  The playbook grammar (v1.3) distinguishes a NOT READY status record from a
  certificate; this line does not certify.
-->
attest | round=1 | reviewer=round1-laneA | independence=authored:no,prior-review:no
attest | round=1 | reviewer=round1-laneB | independence=authored:no,prior-review:no
attest | round=1 | reviewer=round1-laneC | independence=authored:no,prior-review:no
attest | round=1 | reviewer=round1-laneD | independence=authored:no,prior-review:no
attest | round=1 | reviewer=round1-laneE | independence=authored:no,prior-review:no
attest | round=1 | reviewer=round1-laneF | independence=authored:no,prior-review:no
attest | round=2 | reviewer=round2-laneA | independence=authored:no,prior-review:no
attest | round=2 | reviewer=round2-laneB | independence=authored:no,prior-review:no
attest | round=2 | reviewer=round2-laneC | independence=authored:no,prior-review:no
attest | round=2 | reviewer=round2-laneD | independence=authored:no,prior-review:no
attest | round=2 | reviewer=round2-laneE | independence=authored:no,prior-review:no
attest | round=2 | reviewer=round2-laneF | independence=authored:no,prior-review:no
attest | round=3 | reviewer=round3-laneA | independence=authored:no,prior-review:no
attest | round=3 | reviewer=round3-laneC | independence=authored:no,prior-review:no
attest | round=3 | reviewer=round3-laneD | independence=authored:no,prior-review:no
round=1 | artifact=companion-corpus | pin=UNCOMMITTED | reviewer=round1-laneA | independence=authored:no,prior-review:no | verdict=OPEN | polish=no | lanes=A
round=1 | artifact=companion-corpus | pin=UNCOMMITTED | reviewer=round1-laneB | independence=authored:no,prior-review:no | verdict=OPEN | polish=no | lanes=B
round=1 | artifact=companion-corpus | pin=UNCOMMITTED | reviewer=round1-laneC | independence=authored:no,prior-review:no | verdict=OPEN | polish=no | lanes=C
round=1 | artifact=companion-corpus | pin=UNCOMMITTED | reviewer=round1-laneD | independence=authored:no,prior-review:no | verdict=OPEN | polish=no | lanes=D
round=1 | artifact=companion-corpus | pin=UNCOMMITTED | reviewer=round1-laneE | independence=authored:no,prior-review:no | verdict=OPEN | polish=no | lanes=E
round=1 | artifact=companion-corpus | pin=UNCOMMITTED | reviewer=round1-laneF | independence=authored:no,prior-review:no | verdict=OPEN | polish=no | lanes=F
round=2 | artifact=companion-corpus | pin=UNCOMMITTED | reviewer=round2-laneA | independence=authored:no,prior-review:no | verdict=OPEN | polish=no | lanes=A
round=2 | artifact=companion-corpus | pin=UNCOMMITTED | reviewer=round2-laneB | independence=authored:no,prior-review:no | verdict=OPEN | polish=no | lanes=B
round=2 | artifact=companion-corpus | pin=UNCOMMITTED | reviewer=round2-laneC | independence=authored:no,prior-review:no | verdict=OPEN | polish=no | lanes=C
round=2 | artifact=companion-corpus | pin=UNCOMMITTED | reviewer=round2-laneD | independence=authored:no,prior-review:no | verdict=OPEN | polish=no | lanes=D
round=2 | artifact=companion-corpus | pin=UNCOMMITTED | reviewer=round2-laneE | independence=authored:no,prior-review:no | verdict=OPEN | polish=no | lanes=E
round=2 | artifact=companion-corpus | pin=UNCOMMITTED | reviewer=round2-laneF | independence=authored:no,prior-review:no | verdict=OPEN | polish=no | lanes=F
round=3 | artifact=PROJECT-PICKUP-PLAYBOOK.md | pin=UNCOMMITTED | reviewer=round3-laneA | independence=authored:no,prior-review:no | verdict=OPEN | polish=no | lanes=A
round=3 | artifact=companion-corpus | pin=UNCOMMITTED | reviewer=round3-laneC | independence=authored:no,prior-review:no | verdict=OPEN | polish=no | lanes=C
round=3 | artifact=companion-corpus | pin=UNCOMMITTED | reviewer=round3-laneD | independence=authored:no,prior-review:no | verdict=OPEN | polish=no | lanes=D
audit | round=2 | scope=sample | result=pass | seed=unrecorded | checked=15 | failed=0
stage-artifact | stage=S0 | artifact=_evidence/
stage-artifact | stage=S1 | artifact=INTENT.md
stage-artifact | stage=S2 | artifact=PROJECT-PICKUP-PLAYBOOK.md
skip | stage=S3 | artifact=docs/truth-pack/ | rationale=authoring-process run: the 21 type pickups were designed (S2 charter/oracle-shape artifacts), not executed; no per-type truth packs, benches, or gate logs were built, so S3 has no artifact to register
unk | id=UNK-01 | companion=pickup-agent-frameworks.md | disposition=TARGETED | resolution=S3 bench setup cassette-vs-fake trial selects pinned apparatus | owner=plan author
unk | id=UNK-02 | companion=pickup-agent-frameworks.md | disposition=TARGETED | resolution=S3 A/A variance measurement of benchmark oracle at pinned version | owner=plan author
unk | id=UNK-03 | companion=pickup-agent-frameworks.md | disposition=TARGETED | resolution=S3 fixed-judge fixed-trajectory repeats commit nondeterminism floor | owner=plan author
unk | id=UNK-2 | companion=pickup-agent-memory.md | disposition=TARGETED | resolution=S3 truth-pack assembly resolves pinned judge names; deprecated judges demote dependents | owner=evidence auditor
unk | id=UNK-4 | companion=pickup-agent-memory.md | disposition=RESOLVED | resolution=stipulative type-boundary criterion recorded in charter | owner=integrator
unk | id=UNK-BU-1 | companion=pickup-browser-use.md | disposition=TARGETED | resolution=S3 bench setup cassette-feasibility probe decides rerun-vs-audit | owner=plan author
unk | id=UNK-02 | companion=pickup-computer-use.md | disposition=TARGETED | resolution=S3 pin + two-run reproducibility check gates safety-report MUST/SHOULD | owner=plan author
unk | id=UNK-EMB-002 | companion=pickup-embedding-serving.md | disposition=RESOLVED | resolution=normative pin format: HF rev hash in PIN_RECORD.md, blobs SHA-256 in MANIFEST.sha256, registry pin field carries rev | owner=integrator
unk | id=UNK-EMB-004 | companion=pickup-embedding-serving.md | disposition=TARGETED | resolution=S3 A/A-banked candidate metrics on pinned rerank corpus; mutant-tested before promotion | owner=plan author
unk | id=UNK-EMB-005 | companion=pickup-embedding-serving.md | disposition=RESOLVED | resolution=multi-vector tier OPTIONAL at plan time; promotes iff >=2 engines gate late-interaction quality in CI | owner=integrator
unk | id=UNK-06 | companion=pickup-fine-tuning.md | disposition=TARGETED | resolution=S3 seeded-repeat measurement commits RL-leg floor before any golden is banked | owner=plan author
unk | id=UNK-MCP-01 | companion=pickup-mcp.md | disposition=TARGETED | resolution=S3 hands-on conformance-harness run records coverage depth | owner=plan author
unk | id=UNK-MAP-1 | companion=pickup-multi-agent-protocols.md | disposition=TARGETED | resolution=S3 per-SDK CI workflow inspection at pinned commits | owner=evidence auditor
unk | id=UNK-MAP-2 | companion=pickup-multi-agent-protocols.md | disposition=TARGETED | resolution=S3 pin-time independent-implementation search; interop capped at [SELF-INTEROP] until a peer is pinned | owner=plan author
unk | id=UNK-OBS-001 | companion=pickup-observability.md | disposition=TARGETED | resolution=S3 neutral semconv conformance suite built from pinned spec | owner=plan author
unk | id=UNK-OBS-002 | companion=pickup-observability.md | disposition=TARGETED | resolution=S3/pre-S5 file-body fetch of semconv tests at pinned commits | owner=evidence auditor
unk | id=UNK-1 | companion=pickup-quantization.md | disposition=TARGETED | resolution=S2 oracle pinning evaluates three AWQ candidate classes; pinned oracle recorded in PIN_RECORD.md | owner=plan author
unk | id=UNK-1 | companion=pickup-rag-frameworks.md | disposition=RESOLVED | resolution=normative hash-pin convention: content hash in MANIFEST.sha256, version in PIN_RECORD.md + run manifests, attribution vendored | owner=integrator
unk | id=UNK-2 | companion=pickup-rag-frameworks.md | disposition=RESOLVED | resolution=GATE-RAG-1 backend:model + revision pin convention adopted; LightRAG thresholds stay T2 | owner=integrator
unk | id=UNK-1 | companion=pickup-rl-envs.md | disposition=TARGETED | resolution=S3 fetch-verify dry run against pinned trainer commits; non-hermetic fixtures vendored by digest | owner=plan author
unk | id=UNK-5 | companion=pickup-rl-envs.md | disposition=RESOLVED | resolution=G6/G10 N-A/advisory for pure Python; activate for native extensions/Rust; CUDA/C++ gets namespaced analog | owner=integrator
unk | id=UNK-1 | companion=pickup-sandbox-exec.md | disposition=TARGETED | resolution=S3 builds and pins escape-vector list from substrate security suites; red-then-green demonstrated | owner=plan author
unk | id=UNK-6 | companion=pickup-sandbox-exec.md | disposition=TARGETED | resolution=S3 gate wiring confirms each G2-G6 mechanism; missing ones get labeled type-local analogs | owner=plan author
unk | id=UNK-1 | companion=pickup-structured-output.md | disposition=TARGETED | resolution=S3 pins reference-parser oracle; generative differential fuzzer red-then-green on a mutant class | owner=plan author
unk | id=UNK-VDB-01 | companion=pickup-vector-dbs.md | disposition=TARGETED | resolution=S2/S3 pin-time VIBE stability check against written criterion; fallback named | owner=plan author
unk | id=UNK-VA-1 | companion=pickup-voice-agents.md | disposition=RESOLVED | resolution=latency truth = self-measured T1 via pipecat-style TTFA metrics with A/A-banked goldens; vendor marketing inadmissible | owner=integrator
unk | id=UNK-VA-3 | companion=pickup-voice-agents.md | disposition=TARGETED | resolution=S3 records license verdict + cost sign-off + key provisioning in incumbents.md | owner=parent orchestrator
unk | id=UNK-VA-5 | companion=pickup-voice-agents.md | disposition=TARGETED | resolution=parent orchestrator commits live-tier key holder, spend cap, rotation cadence before BEADS READY | owner=parent orchestrator
unk | id=UNK-SEARCH-01 | companion=pickup-web-search-apis.md | disposition=TARGETED | resolution=S2/S3 self-built frozen relevance-fixture corpus pinned as oracle; pin-time re-search recorded | owner=plan author
def=DEF-A-1 | severity=P0 | status=FIXED | location=docs/planning/round1/DEF-laneA.md:32 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-A-2 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneA.md:34 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-A-3 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneA.md:36 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-A-4 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneA.md:38 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-A-5 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneA.md:40 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-A-6 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneA.md:42 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-A-7 | severity=P2 | status=FIXED | location=docs/planning/round1/DEF-laneA.md:44 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-A-8 | severity=P2 | status=DEFERRED | location=docs/planning/round1/DEF-laneA.md:46 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=owned by S5 normalization; no collisions today
def=DEF-A-9 | severity=P2 | status=FIXED | location=docs/planning/round1/DEF-laneA.md:48 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-B-1 | severity=P0 | status=FIXED | location=docs/planning/round1/DEF-laneB.md:36 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-B-2 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneB.md:48 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-B-3 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneB.md:57 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-B-4 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneB.md:67 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-B-5 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneB.md:75 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-B-6 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneB.md:93 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-B-7 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneB.md:104 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-B-8 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneB.md:116 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-B-9 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneB.md:127 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-B-10 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneB.md:135 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-B-11 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneB.md:145 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-B-12 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneB.md:156 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-B-13 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneB.md:165 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-B-14 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneB.md:174 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-B-15 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneB.md:186 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-B-16 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneB.md:196 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-B-17 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneB.md:203 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-B-18 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneB.md:208 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-B-19 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneB.md:213 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-B-20 | severity=P2 | status=FIXED | location=docs/planning/round1/DEF-laneB.md:227 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-B-21 | severity=P2 | status=FIXED | location=docs/planning/round1/DEF-laneB.md:237 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-B-22 | severity=P2 | status=FIXED | location=docs/planning/round1/DEF-laneB.md:244 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-B-23 | severity=P2 | status=FIXED | location=docs/planning/round1/DEF-laneB.md:249 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-B-24 | severity=P2 | status=FIXED | location=docs/planning/round1/DEF-laneB.md:257 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-B-25 | severity=P2 | status=FIXED | location=docs/planning/round1/DEF-laneB.md:265 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-C-1 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneC.md:30 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-C-2 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneC.md:39 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-C-3 | severity=P2 | status=FIXED | location=docs/planning/round1/DEF-laneC.md:51 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-C-4 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneC.md:59 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-C-5 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneC.md:70 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-C-6 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneC.md:83 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-C-7 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneC.md:94 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-C-8 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneC.md:104 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-C-9 | severity=P2 | status=FIXED | location=docs/planning/round1/DEF-laneC.md:115 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-C-10 | severity=P2 | status=FIXED | location=docs/planning/round1/DEF-laneC.md:123 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-C-11 | severity=P2 | status=FIXED | location=docs/planning/round1/DEF-laneC.md:134 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-C-12 | severity=P2 | status=FIXED | location=docs/planning/round1/DEF-laneC.md:144 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-D-1 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneD.md:15 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-D-2 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneD.md:17 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-D-3 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneD.md:19 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-D-4 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneD.md:21 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-D-5 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneD.md:23 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-D-6 | severity=P2 | status=FIXED | location=docs/planning/round1/DEF-laneD.md:25 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-D-7 | severity=P2 | status=FIXED | location=docs/planning/round1/DEF-laneD.md:29 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-D-8 | severity=P2 | status=FIXED | location=docs/planning/round1/DEF-laneD.md:31 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-D-9 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneD.md:41 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-D-10 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneD.md:43 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-D-11 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneD.md:45 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-E-1 | severity=P0 | status=FIXED | location=docs/planning/round1/DEF-laneE.md:31 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-E-2 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneE.md:43 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-E-3 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneE.md:52 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-E-4 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneE.md:61 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-E-5 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneE.md:71 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-E-6 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneE.md:84 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-E-7 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneE.md:95 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-E-8 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneE.md:114 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-E-9 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneE.md:129 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-E-10 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneE.md:139 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-E-11 | severity=P2 | status=FIXED | location=docs/planning/round1/DEF-laneE.md:156 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-E-12 | severity=P2 | status=FIXED | location=docs/planning/round1/DEF-laneE.md:163 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-E-13 | severity=P2 | status=FIXED | location=docs/planning/round1/DEF-laneE.md:169 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-E-14 | severity=P2 | status=FIXED | location=docs/planning/round1/DEF-laneE.md:178 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-E-15 | severity=P2 | status=FIXED | location=docs/planning/round1/DEF-laneE.md:185 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-F-1 | severity=P0 | status=FIXED | location=docs/planning/round1/DEF-laneF.md:27 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-F-2 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneF.md:41 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-F-3 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneF.md:54 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-F-4 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneF.md:68 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-F-5 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneF.md:79 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-F-6 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneF.md:89 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-F-7 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneF.md:102 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-F-8 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneF.md:110 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-F-9 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneF.md:118 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-F-10 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneF.md:126 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-F-11 | severity=P1 | status=FIXED | location=docs/planning/round1/DEF-laneF.md:134 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-F-12 | severity=P2 | status=FIXED | location=docs/planning/round1/DEF-laneF.md:145 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-F-13 | severity=P2 | status=FIXED | location=docs/planning/round1/DEF-laneF.md:155 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-F-14 | severity=P2 | status=FIXED | location=docs/planning/round1/DEF-laneF.md:161 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-F-15 | severity=P2 | status=FIXED | location=docs/planning/round1/DEF-laneF.md:169 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-F-16 | severity=P2 | status=FIXED | location=docs/planning/round1/DEF-laneF.md:177 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-F-17 | severity=P2 | status=FIXED | location=docs/planning/round1/DEF-laneF.md:186 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-F-18 | severity=P2 | status=FIXED | location=docs/planning/round1/DEF-laneF.md:196 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF-F-19 | severity=P2 | status=WONTFIX | location=docs/planning/round1/DEF-laneF.md:203 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=would break the playbook-mandated 21-file claim schema
def=DEF-F-20 | severity=P2 | status=FIXED | location=docs/planning/round1/DEF-laneF.md:211 | claim=- | fix=applied per round-1 INTEGRATION.md | owner=integrator | evidence=- | rationale=-
def=DEF2-A-1 | severity=P1 | status=FIXED | location=docs/planning/round2/DEF2-laneA.md:24 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-A-2 | severity=P1 | status=FIXED | location=docs/planning/round2/DEF2-laneA.md:31 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-A-3 | severity=P1 | status=FIXED | location=docs/planning/round2/DEF2-laneA.md:40 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-A-4 | severity=P2 | status=FIXED | location=docs/planning/round2/DEF2-laneA.md:52 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-A-5 | severity=P2 | status=FIXED | location=docs/planning/round2/DEF2-laneA.md:59 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-A-6 | severity=P2 | status=FIXED | location=docs/planning/round2/DEF2-laneA.md:68 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-A-7 | severity=P1 | status=FIXED | location=docs/planning/round2/DEF2-laneA.md:76 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-A-8 | severity=P2 | status=FIXED | location=docs/planning/round2/DEF2-laneA.md:88 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-A-9 | severity=P2 | status=FIXED | location=docs/planning/round2/DEF2-laneA.md:94 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-A-10 | severity=P2 | status=FIXED | location=docs/planning/round2/DEF2-laneA.md:110 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-A-11 | severity=P2 | status=FIXED | location=docs/planning/round2/DEF2-laneA.md:119 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-A-12 | severity=P2 | status=FIXED | location=docs/planning/round2/DEF2-laneA.md:130 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-A-13 | severity=P2 | status=FIXED | location=docs/planning/round2/DEF2-laneA.md:139 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-A-14 | severity=P2 | status=FIXED | location=docs/planning/round2/DEF2-laneA.md:146 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-A-15 | severity=P2 | status=FIXED | location=docs/planning/round2/DEF2-laneA.md:153 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-B-1 | severity=P1 | status=FIXED | location=docs/planning/round2/DEF2-laneB.md:14 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-B-2 | severity=P1 | status=FIXED | location=docs/planning/round2/DEF2-laneB.md:30 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-B-3 | severity=P1 | status=FIXED | location=docs/planning/round2/DEF2-laneB.md:44 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-B-4 | severity=P1 | status=FIXED | location=docs/planning/round2/DEF2-laneB.md:59 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-B-5 | severity=P1 | status=FIXED | location=docs/planning/round2/DEF2-laneB.md:70 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-B-6 | severity=P1 | status=FIXED | location=docs/planning/round2/DEF2-laneB.md:80 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-B-7 | severity=P1 | status=FIXED | location=docs/planning/round2/DEF2-laneB.md:87 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-B-8 | severity=P1 | status=FIXED | location=docs/planning/round2/DEF2-laneB.md:94 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-B-9 | severity=P1 | status=FIXED | location=docs/planning/round2/DEF2-laneB.md:103 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-B-10 | severity=P1 | status=FIXED | location=docs/planning/round2/DEF2-laneB.md:117 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-B-11 | severity=P1 | status=FIXED | location=docs/planning/round2/DEF2-laneB.md:125 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-B-12 | severity=P2 | status=FIXED | location=docs/planning/round2/DEF2-laneB.md:134 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-B-13 | severity=P2 | status=FIXED | location=docs/planning/round2/DEF2-laneB.md:143 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-B-14 | severity=P2 | status=FIXED | location=docs/planning/round2/DEF2-laneB.md:150 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-B-15 | severity=P2 | status=FIXED | location=docs/planning/round2/DEF2-laneB.md:158 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-C-1 | severity=P1 | status=FIXED | location=docs/planning/round2/DEF2-laneC.md:44 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-C-2 | severity=P1 | status=FIXED | location=docs/planning/round2/DEF2-laneC.md:52 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-C-3 | severity=P1 | status=FIXED | location=docs/planning/round2/DEF2-laneC.md:65 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-C-4 | severity=P1 | status=FIXED | location=docs/planning/round2/DEF2-laneC.md:71 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-C-5 | severity=P1 | status=FIXED | location=docs/planning/round2/DEF2-laneC.md:77 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-C-6 | severity=P1 | status=FIXED | location=docs/planning/round2/DEF2-laneC.md:86 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-C-7 | severity=P1 | status=FIXED | location=docs/planning/round2/DEF2-laneC.md:93 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-C-8 | severity=P1 | status=FIXED | location=docs/planning/round2/DEF2-laneC.md:98 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-C-9 | severity=P2 | status=FIXED | location=docs/planning/round2/DEF2-laneC.md:108 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-C-10 | severity=P2 | status=FIXED | location=docs/planning/round2/DEF2-laneC.md:112 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-C-11 | severity=P2 | status=FIXED | location=docs/planning/round2/DEF2-laneC.md:119 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-C-12 | severity=P2 | status=FIXED | location=docs/planning/round2/DEF2-laneC.md:127 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-C-13 | severity=P2 | status=FIXED | location=docs/planning/round2/DEF2-laneC.md:136 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-D-1 | severity=P1 | status=FIXED | location=docs/planning/round2/DEF2-laneD.md:27 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-D-2 | severity=P1 | status=FIXED | location=docs/planning/round2/DEF2-laneD.md:36 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-D-3 | severity=P1 | status=FIXED | location=docs/planning/round2/DEF2-laneD.md:43 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-D-4 | severity=P1 | status=FIXED | location=docs/planning/round2/DEF2-laneD.md:50 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-D-5 | severity=P2 | status=FIXED | location=docs/planning/round2/DEF2-laneD.md:61 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-D-6 | severity=P2 | status=FIXED | location=docs/planning/round2/DEF2-laneD.md:67 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-D-7 | severity=P2 | status=FIXED | location=docs/planning/round2/DEF2-laneD.md:74 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-D-8 | severity=P2 | status=FIXED | location=docs/planning/round2/DEF2-laneD.md:80 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-D-9 | severity=P2 | status=FIXED | location=docs/planning/round2/DEF2-laneD.md:85 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-D-10 | severity=P2 | status=FIXED | location=docs/planning/round2/DEF2-laneD.md:92 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-D-11 | severity=P2 | status=FIXED | location=docs/planning/round2/DEF2-laneD.md:97 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-D-12 | severity=P2 | status=FIXED | location=docs/planning/round2/DEF2-laneD.md:102 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-D-13 | severity=P2 | status=FIXED | location=docs/planning/round2/DEF2-laneD.md:108 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-D-14 | severity=P2 | status=FIXED | location=docs/planning/round2/DEF2-laneD.md:113 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-D-15 | severity=P2 | status=FIXED | location=docs/planning/round2/DEF2-laneD.md:118 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-D-16 | severity=P2 | status=FIXED | location=docs/planning/round2/DEF2-laneD.md:122 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-D-17 | severity=P2 | status=FIXED | location=docs/planning/round2/DEF2-laneD.md:127 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-D-18 | severity=P2 | status=FIXED | location=docs/planning/round2/DEF2-laneD.md:131 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-E-1 | severity=P2 | status=FIXED | location=docs/planning/round2/DEF2-laneE.md:18 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-E-2 | severity=P2 | status=FIXED | location=docs/planning/round2/DEF2-laneE.md:20 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-F-1 | severity=P1 | status=FIXED | location=docs/planning/round2/DEF2-laneF.md:60 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-F-2 | severity=P1 | status=FIXED | location=docs/planning/round2/DEF2-laneF.md:71 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-F-3 | severity=P1 | status=FIXED | location=docs/planning/round2/DEF2-laneF.md:81 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-F-4 | severity=P1 | status=FIXED | location=docs/planning/round2/DEF2-laneF.md:87 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-F-5 | severity=P1 | status=FIXED | location=docs/planning/round2/DEF2-laneF.md:94 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-F-6 | severity=P1 | status=FIXED | location=docs/planning/round2/DEF2-laneF.md:108 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-F-7 | severity=P1 | status=FIXED | location=docs/planning/round2/DEF2-laneF.md:117 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-F-8 | severity=P2 | status=FIXED | location=docs/planning/round2/DEF2-laneF.md:133 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-F-9 | severity=P2 | status=FIXED | location=docs/planning/round2/DEF2-laneF.md:139 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-F-10 | severity=P2 | status=FIXED | location=docs/planning/round2/DEF2-laneF.md:143 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-F-11 | severity=P2 | status=FIXED | location=docs/planning/round2/DEF2-laneF.md:147 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-F-12 | severity=P2 | status=FIXED | location=docs/planning/round2/DEF2-laneF.md:153 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-F-13 | severity=P2 | status=FIXED | location=docs/planning/round2/DEF2-laneF.md:158 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-F-14 | severity=P2 | status=FIXED | location=docs/planning/round2/DEF2-laneF.md:166 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-F-15 | severity=P2 | status=FIXED | location=docs/planning/round2/DEF2-laneF.md:172 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-F-16 | severity=P2 | status=FIXED | location=docs/planning/round2/DEF2-laneF.md:184 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-F-17 | severity=P2 | status=FIXED | location=docs/planning/round2/DEF2-laneF.md:192 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF2-F-18 | severity=P2 | status=FIXED | location=docs/planning/round2/DEF2-laneF.md:199 | claim=- | fix=applied per round-2 INTEGRATION2.md | owner=integrator | evidence=- | rationale=-
def=DEF3-A-2 | severity=P0 | status=FIXED | location=docs/planning/round3/DEF3-laneA.md:24 | claim=- | fix=playbook cold-execution amendment 2026-09-23 (see INTEGRATION3.md) | owner=integrator | evidence=- | rationale=-
def=DEF3-A-5 | severity=P1 | status=FIXED | location=docs/planning/round3/DEF3-laneA.md:34 | claim=- | fix=playbook cold-execution amendment 2026-09-23 (see INTEGRATION3.md) | owner=integrator | evidence=- | rationale=-
def=DEF3-A-6 | severity=P1 | status=FIXED | location=docs/planning/round3/DEF3-laneA.md:44 | claim=- | fix=playbook cold-execution amendment 2026-09-23 (see INTEGRATION3.md) | owner=integrator | evidence=- | rationale=-
def=DEF3-A-19 | severity=P2 | status=FIXED | location=docs/planning/round3/DEF3-laneA.md:52 | claim=- | fix=playbook cold-execution amendment 2026-09-23 (see INTEGRATION3.md) | owner=integrator | evidence=- | rationale=-
def=DEF3-A-25 | severity=P2 | status=FIXED | location=docs/planning/round3/DEF3-laneA.md:60 | claim=- | fix=playbook cold-execution amendment 2026-09-23 (see INTEGRATION3.md) | owner=integrator | evidence=- | rationale=-
def=DEF3-A-1 | severity=P0 | status=FIXED | location=docs/planning/round3/DEF3-laneA.md:71 | claim=- | fix=playbook cold-execution amendment 2026-09-23 (see INTEGRATION3.md) | owner=integrator | evidence=- | rationale=-
def=DEF3-A-26 | severity=P2 | status=FIXED | location=docs/planning/round3/DEF3-laneA.md:81 | claim=- | fix=playbook cold-execution amendment 2026-09-23 (see INTEGRATION3.md) | owner=integrator | evidence=- | rationale=-
def=DEF3-A-7 | severity=P1 | status=FIXED | location=docs/planning/round3/DEF3-laneA.md:87 | claim=- | fix=playbook cold-execution amendment 2026-09-23 (see INTEGRATION3.md) | owner=integrator | evidence=- | rationale=-
def=DEF3-A-18 | severity=P2 | status=FIXED | location=docs/planning/round3/DEF3-laneA.md:98 | claim=- | fix=playbook cold-execution amendment 2026-09-23 (see INTEGRATION3.md) | owner=integrator | evidence=- | rationale=-
def=DEF3-A-8 | severity=P1 | status=FIXED | location=docs/planning/round3/DEF3-laneA.md:108 | claim=- | fix=playbook cold-execution amendment 2026-09-23 (see INTEGRATION3.md) | owner=integrator | evidence=- | rationale=-
def=DEF3-A-9 | severity=P1 | status=FIXED | location=docs/planning/round3/DEF3-laneA.md:117 | claim=- | fix=playbook cold-execution amendment 2026-09-23 (see INTEGRATION3.md) | owner=integrator | evidence=- | rationale=-
def=DEF3-A-10 | severity=P1 | status=FIXED | location=docs/planning/round3/DEF3-laneA.md:127 | claim=- | fix=playbook cold-execution amendment 2026-09-23 (see INTEGRATION3.md) | owner=integrator | evidence=- | rationale=-
def=DEF3-A-11 | severity=P1 | status=FIXED | location=docs/planning/round3/DEF3-laneA.md:140 | claim=- | fix=playbook cold-execution amendment 2026-09-23 (see INTEGRATION3.md) | owner=integrator | evidence=- | rationale=-
def=DEF3-A-21 | severity=P2 | status=FIXED | location=docs/planning/round3/DEF3-laneA.md:149 | claim=- | fix=playbook cold-execution amendment 2026-09-23 (see INTEGRATION3.md) | owner=integrator | evidence=- | rationale=-
def=DEF3-A-12 | severity=P1 | status=FIXED | location=docs/planning/round3/DEF3-laneA.md:161 | claim=- | fix=playbook cold-execution amendment 2026-09-23 (see INTEGRATION3.md) | owner=integrator | evidence=- | rationale=-
def=DEF3-A-13 | severity=P1 | status=FIXED | location=docs/planning/round3/DEF3-laneA.md:171 | claim=- | fix=playbook cold-execution amendment 2026-09-23 (see INTEGRATION3.md) | owner=integrator | evidence=- | rationale=-
def=DEF3-A-14 | severity=P1 | status=FIXED | location=docs/planning/round3/DEF3-laneA.md:180 | claim=- | fix=playbook cold-execution amendment 2026-09-23 (see INTEGRATION3.md) | owner=integrator | evidence=- | rationale=-
def=DEF3-A-16 | severity=P1 | status=FIXED | location=docs/planning/round3/DEF3-laneA.md:190 | claim=- | fix=playbook cold-execution amendment 2026-09-23 (see INTEGRATION3.md) | owner=integrator | evidence=- | rationale=-
def=DEF3-A-24 | severity=P2 | status=FIXED | location=docs/planning/round3/DEF3-laneA.md:199 | claim=- | fix=playbook cold-execution amendment 2026-09-23 (see INTEGRATION3.md) | owner=integrator | evidence=- | rationale=-
def=DEF3-A-20 | severity=P2 | status=FIXED | location=docs/planning/round3/DEF3-laneA.md:205 | claim=- | fix=playbook cold-execution amendment 2026-09-23 (see INTEGRATION3.md) | owner=integrator | evidence=- | rationale=-
def=DEF3-A-3 | severity=P0 | status=FIXED | location=docs/planning/round3/DEF3-laneA.md:217 | claim=- | fix=playbook cold-execution amendment 2026-09-23 (see INTEGRATION3.md) | owner=integrator | evidence=- | rationale=-
def=DEF3-A-15 | severity=P1 | status=FIXED | location=docs/planning/round3/DEF3-laneA.md:229 | claim=- | fix=playbook cold-execution amendment 2026-09-23 (see INTEGRATION3.md) | owner=integrator | evidence=- | rationale=-
def=DEF3-A-17 | severity=P1 | status=FIXED | location=docs/planning/round3/DEF3-laneA.md:241 | claim=- | fix=playbook cold-execution amendment 2026-09-23 (see INTEGRATION3.md) | owner=integrator | evidence=- | rationale=-
def=DEF3-A-4 | severity=P0 | status=FIXED | location=docs/planning/round3/DEF3-laneA.md:259 | claim=- | fix=playbook cold-execution amendment 2026-09-23 (see INTEGRATION3.md) | owner=integrator | evidence=- | rationale=-
def=DEF3-A-22 | severity=P2 | status=FIXED | location=docs/planning/round3/DEF3-laneA.md:286 | claim=- | fix=playbook cold-execution amendment 2026-09-23 (see INTEGRATION3.md) | owner=integrator | evidence=- | rationale=-
def=DEF3-A-23 | severity=P2 | status=FIXED | location=docs/planning/round3/DEF3-laneA.md:294 | claim=- | fix=playbook cold-execution amendment 2026-09-23 (see INTEGRATION3.md) | owner=integrator | evidence=- | rationale=-
def=DEF3-C-1 | severity=P0 | status=FIXED | location=docs/planning/round3/DEF3-laneC.md:7 | claim=- | fix=exorcist clause deleted from pickup-mcp.md G6 entry | owner=integrator | evidence=- | rationale=-
def=DEF3-C-2 | severity=P2 | status=FIXED | location=docs/planning/round3/DEF3-laneC.md:9 | claim=- | fix=12 gate-profile rows normalized to full shared-gates.md titles | owner=integrator | evidence=- | rationale=-
def=DEF3-C-3 | severity=P1 | status=FIXED | location=docs/planning/round3/DEF3-laneC.md:11 | claim=- | fix=ROUND_LOG.md rewritten as grammar-conformant records (this file) | owner=integrator | evidence=- | rationale=-
def=DEF3-D-1 | severity=P1 | status=FIXED | location=docs/planning/round3/DEF3-laneD.md:22 | claim=- | fix=guardrails evidence tiers replaced with canonical T0-T3 mapping verbatim + type-application guidance | owner=integrator | evidence=- | rationale=-
def=DEF3-D-2 | severity=P1 | status=FIXED | location=docs/planning/round3/DEF3-laneD.md:37 | claim=- | fix=quantization CLAIM-8 re-tiered to T3 / Low / CONTESTED (adopted corpus doctrine) | owner=integrator | evidence=- | rationale=-
def=DEF3-D-3 | severity=P2 | status=FIXED | location=docs/planning/round3/DEF3-laneD.md:48 | claim=- | fix=quantization CLAIM-10 re-tiered to T3 / Low / CONTESTED (adopted corpus doctrine) | owner=integrator | evidence=- | rationale=-
def=DEF3-D-4 | severity=P1 | status=FIXED | location=docs/planning/round3/DEF3-laneD.md:54 | claim=- | fix=vector-dbs T1 bullet narrowed to observed runs; competitive claims moved to T2-with-gates | owner=integrator | evidence=- | rationale=-
def=DEF3-D-5 | severity=P2 | status=FIXED | location=docs/planning/round3/DEF3-laneD.md:67 | claim=- | fix=vector-dbs ann-benchmarks wording neutralized | owner=integrator | evidence=- | rationale=-
def=DEF3-D-6 | severity=P2 | status=FIXED | location=docs/planning/round3/DEF3-laneD.md:74 | claim=- | fix=rag-frameworks UNK-3 wording: above T2 [Maintainer claim] | owner=integrator | evidence=- | rationale=-
def=DEF3-D-7 | severity=P2 | status=FIXED | location=docs/planning/round3/DEF3-laneD.md:79 | claim=- | fix=observability CLAIM-OBS-004 narrowed to Medium / CONTESTED | owner=integrator | evidence=- | rationale=-
def=DEF3-D-8 | severity=P2 | status=FIXED | location=docs/planning/round3/DEF3-laneD.md:88 | claim=- | fix=eval-harnesses T1 bullet narrowed to observed runs / banked receipts | owner=integrator | evidence=- | rationale=-
def=DEF3-INT-1 | severity=P0 | status=FIXED | location=pickup-sandbox-exec.md:178 | claim=- | fix=exorcist classification operators routing claim deleted; replaced with canonical G6 (// SAFETY: + tree-wide unsafe inventory) | owner=integrator | evidence=- | rationale=same invented-mechanism class as DEF3-C-1; no _evidence/ support
def=DEF3-INT-2 | severity=P0 | status=FIXED | location=pickup-web-search-apis.md:153 | claim=- | fix=exorcist routing clause deleted; replaced with labeled G6-analog per the playbook Rust-centric-gates rule | owner=integrator | evidence=- | rationale=same invented-mechanism class as DEF3-C-1; no _evidence/ support
def=DEF3-INT-3 | severity=P0 | status=FIXED | location=pickup-observability.md:141 | claim=- | fix=exorcist classification clause deleted; replaced with labeled G6-analog per the playbook Rust-centric-gates rule | owner=integrator | evidence=- | rationale=same invented-mechanism class as DEF3-C-1; no _evidence/ support
def=DEF3-INT-4 | severity=P0 | status=FIXED | location=pickup-workflow-orchestrators.md:146 | claim=- | fix=exorcist classification operators routing claim deleted; replaced with canonical G6 for Rust targets, advisory language for Go/TS/Python targets | owner=integrator | evidence=- | rationale=same invented-mechanism class as DEF3-C-1; no _evidence/ support
cert | round=3 | artifact=PROJECT-PICKUP-PLAYBOOK.md | pin=e75b9895394b208d | result=NOT READY | signers=integrator | audit=pass | polish=no | note=no BEADS READY certificate exists: S3 was never executed per type, S4 round-3 integration applied 2026-09-23, type-specific S4 rounds and type DEF namespaces are still required before certification
attest | round=4 | reviewer=round4-laneA | independence=authored:no,prior-review:no
attest | round=4 | reviewer=round4-laneB | independence=authored:no,prior-review:no
attest | round=4 | reviewer=round4-laneC | independence=authored:no,prior-review:no
round=4 | artifact=companion-corpus | pin=UNCOMMITTED | reviewer=round4-laneA | independence=authored:no,prior-review:no | verdict=REOPEN | polish=no | lanes=A
round=4 | artifact=companion-corpus | pin=UNCOMMITTED | reviewer=round4-laneB | independence=authored:no,prior-review:no | verdict=REOPEN | polish=no | lanes=B
round=4 | artifact=companion-corpus | pin=UNCOMMITTED | reviewer=round4-laneC | independence=authored:no,prior-review:no | verdict=REOPEN | polish=no | lanes=C
def=DEF4-A-1 | severity=P1 | status=FIXED | location=PROJECT-PICKUP-PLAYBOOK.md:738 | claim=- | fix=reopen trigger extended with s4-exhaustion for the certify-or-abandon mandated return | owner=parent-orchestrator | evidence=- | rationale=round-4 lane A: grammar had no legal trigger for the mandated S4-exhaustion return
def=DEF4-A-2 | severity=P1 | status=FIXED | location=PROJECT-PICKUP-PLAYBOOK.md:611 | claim=- | fix=escape-hatch waivability stated: may waive condition 2 (POLISH) with enumerated reasons only; conditions 3/4 never waivable | owner=parent-orchestrator | evidence=- | rationale=round-4 lane A: certify-or-abandon conflicted with unconditional BEADS READY attestations
def=DEF4-A-3 | severity=P1 | status=FIXED | location=PROJECT-PICKUP-PLAYBOOK.md:650 | claim=- | fix=grammar prose now defines the bare lead-tag convention (attest/unk/audit/... vs keyed round=/def=) | owner=parent-orchestrator | evidence=- | rationale=round-4 lane A: schema-validity underdetermined from prose alone
def=DEF4-A-4 | severity=P1 | status=FIXED | location=PROJECT-PICKUP-PLAYBOOK.md:767 | claim=- | fix=cert attestation list gains bench-slot-13 non-TBD check (spend cap before BEADS READY) | owner=parent-orchestrator | evidence=- | rationale=round-4 lane A: cert checklist omitted the slot-13 precondition
def=DEF4-A-5 | severity=P1 | status=FIXED | location=PROJECT-PICKUP-PLAYBOOK.md:732 | claim=- | fix=skip range capped S0..S5 to S0..S3; S4/S5 cannot be skipped | owner=parent-orchestrator | evidence=- | rationale=round-4 lane A: skip grammar exceeded defined skip semantics
def=DEF4-A-6 | severity=P2 | status=FIXED | location=PROJECT-PICKUP-PLAYBOOK.md:3 | claim=- | fix=header scope corrected S2+ to S0+ (file holds normative S0/S1 content) | owner=parent-orchestrator | evidence=- | rationale=round-4 lane A P2-1
def=DEF4-A-7 | severity=P2 | status=FIXED | location=PROJECT-PICKUP-PLAYBOOK.md:221 | claim=- | fix=UNK ledger scan ownership assigned to the S5 certifying integrator (lane-A reviewer in S4 rounds) | owner=parent-orchestrator | evidence=- | rationale=round-4 lane A P2-2
def=DEF4-A-8 | severity=P2 | status=FIXED | location=PROJECT-PICKUP-PLAYBOOK.md:570 | claim=- | fix=live-pointer resolvability assigned to the evidence auditor, not lane reviewers | owner=parent-orchestrator | evidence=- | rationale=round-4 lane A P2-3
def=DEF4-A-9 | severity=P2 | status=FIXED | location=PROJECT-PICKUP-PLAYBOOK.md:767 | claim=- | fix=attestation checkability note: polish second arm rests on integrator diff judgment in cert note field | owner=parent-orchestrator | evidence=- | rationale=round-4 lane A P2-4
def=DEF4-A-10 | severity=P2 | status=FIXED | location=PROJECT-PICKUP-PLAYBOOK.md:707 | claim=- | fix=intake-line fragment completed: evidence= points at the S0 intake note path | owner=parent-orchestrator | evidence=- | rationale=round-4 lane A P2-5
def=DEF4-A-11 | severity=P2 | status=FIXED | location=PROJECT-PICKUP-PLAYBOOK.md:121 | claim=- | fix=vacuous counted-separately replaced with do-not-count-toward-the-5 | owner=parent-orchestrator | evidence=- | rationale=round-4 lane A P2-6
def=DEF4-A-12 | severity=P2 | status=FIXED | location=PROJECT-PICKUP-PLAYBOOK.md:164 | claim=- | fix=undefined authoring-process registries replaced with S5 registries (docs/planning/s5/) | owner=parent-orchestrator | evidence=- | rationale=round-4 lane A P2-7
def=DEF4-B-1 | severity=P2 | status=FIXED | location=pickup-sandbox-exec.md:118 | claim=- | fix=round-3 merge residue removed: dangling (b) and trailing fragment in UNK-1 Oracle/Unknowns rows | owner=parent-orchestrator | evidence=- | rationale=round-4 lane B P2-1
def=DEF4-B-2 | severity=P2 | status=FIXED | location=pickup-eval-harnesses.md:202 | claim=- | fix=mis-pointed (REQ-EH-5) removed from GATE-007 rationale (REQ-EH-5 is CI marker discipline) | owner=parent-orchestrator | evidence=- | rationale=round-4 lane B P2-2
def=DEF4-C-1 | severity=P2 | status=FIXED | location=docs/planning/s5/scripts/s5_generate.py:118 | claim=- | fix=ledger header/footer now reflect actual row counts (0 rows across 0 companions) instead of hardcoded 25 | owner=parent-orchestrator | evidence=- | rationale=round-4 lane C P2: stale header contradicted empty body
attest | round=5 | reviewer=round5-laneA | independence=authored:no,prior-review:no
attest | round=5 | reviewer=round5-laneB | independence=authored:no,prior-review:no
round=5 | artifact=companion-corpus | pin=UNCOMMITTED | reviewer=round5-laneA | independence=authored:no,prior-review:no | verdict=REOPEN | polish=no | lanes=A
round=5 | artifact=companion-corpus | pin=UNCOMMITTED | reviewer=round5-laneB | independence=authored:no,prior-review:no | verdict=REOPEN | polish=no | lanes=B
def=DEF5-A-1 | severity=P1 | status=FIXED | location=PROJECT-PICKUP-PLAYBOOK.md:783 | claim=- | fix=polish attestation gains third disjunct for the escape-hatch condition-2 waiver (enumerated residual changes + reasons in cert note) | owner=parent-orchestrator | evidence=- | rationale=round-5 lane A residual: checklist blocked the very waiver path the escape hatch authorizes
def=DEF5-A-2 | severity=P2 | status=FIXED | location=PROJECT-PICKUP-PLAYBOOK.md:639 | claim=- | fix=reopen-procedure prose enumerates all four triggers incl. s4-exhaustion | owner=parent-orchestrator | evidence=- | rationale=round-5 lane A residual on fix 1
def=DEF5-A-3 | severity=P2 | status=FIXED | location=PROJECT-PICKUP-PLAYBOOK.md:781 | claim=- | fix=slot-13 attestation names the record: cert note field carries the cap, or slot-13=N/A for the authoring process | owner=parent-orchestrator | evidence=- | rationale=round-5 lane A residual on fix 4: no log record carried the spend cap
def=DEF5-A-4 | severity=P2 | status=FIXED | location=PROJECT-PICKUP-PLAYBOOK.md:16 | claim=- | fix=Constitution paragraph reconciled S2+ to S0+ | owner=parent-orchestrator | evidence=- | rationale=round-5 lane A residual on fix 6
attest | round=6 | reviewer=round6-laneA | independence=authored:no,prior-review:no
round=6 | artifact=companion-corpus | pin=UNCOMMITTED | reviewer=round6-laneA | independence=authored:no,prior-review:no | verdict=POLISH | polish=yes | lanes=A
cert | round=6 | artifact=PROJECT-PICKUP-PLAYBOOK.md | pin=8e6c35952c20db82 | result=BEADS READY | signers=parent-orchestrator,round6-laneA | audit=pass | polish=yes | note=convergence: R1 92 findings (4 P0) / R2 81 (0 P0) / R3 37+4 INT (9 P0) / R4 15 (5 P1, constitution meta) / R5 4 residuals in R4 fixes (1 P1) / R6 0 findings. Last diff POLISH: 4 consistency repairs only (waiver disjunct matching already-adopted rule; trigger enumeration; slot-13 record naming; S2+ to S0+); no claim/gate/threshold/requirement/substantive-criterion change. 233 def records: 231 FIXED, 1 DEFERRED (DEF-A-8 P2, S5-owned), 1 WONTFIX (DEF-F-19 P2, rationale recorded); zero OPEN/DEFERRED P0/P1. Zero BLOCKS_PLAN (29 triaged: 22 TARGETED, 7 RESOLVED). slot-13=N/A (authoring process, no CI spend). S3 skip recorded (authoring run: pickups designed, not executed). Fabricated-mechanism class eliminated (exorcist grep 0). Evidence: 21 packs, 192 repos, 5-10+ per type.
