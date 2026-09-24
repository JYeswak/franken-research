# Round 1 — Lane C (failure / security / privacy / resources) findings

Reviewer: fresh-context S4, Lane C. Reviewed cold; no prior context on these files.
Date: 2026-09-23.

Files reviewed:
- `PROJECT-PICKUP-PLAYBOOK.md` (constitution)
- `shared-gates.md` (18 shared gates)
- `_s0/g1-g14-reference.md` (G1–G14 definitions)
- `pickup-sandbox-exec.md`, `pickup-browser-use.md`, `pickup-computer-use.md`, `pickup-web-search-apis.md`

Severity tally: P0 × 0 · P1 × 7 · P2 × 5 · total 12.

Summary judgment: the four companions' threat models are strong where the type's
product IS isolation (sandbox-exec, computer-use VM containment) but thin where
the product *handles untrusted content* (browser-use agents on hostile pages,
web-search fixture corpora). GATE-007's acceptance criteria are mostly real
checks for the Firecracker-derived items but the escape-suite clause is
checkbox-shaped, and the "resource accounting" half of its title is missing
from its criteria. GATE-010 demands redaction tests without a redaction policy.
The bench spec covers machine-state and contention receipts but not cost.
Secrets policy is coherent on quarantine but diverges on the PR path
(browser-use REQ-BU-4 vs GATE-014). No companion waves away a security
unknown with an explicit non-blocking disposition — but sandbox-exec's UNK-1,
the most security-relevant unknown of the set, carries no disposition at all,
which is worse than waving it away.

---

DEF-C-1 [P1] shared-gates.md:GATE-007 — The gate title promises "Sandbox escape
+ resource accounting", but acceptance criteria (1)–(5) are all isolation and
limit *enforcement*; no criterion addresses resource *accounting* (GPU/runner
hours, lab cost, budget). A pickup following this gate gets enforcement tests
and zero cost discipline for the remote-lab work the playbook makes normative.
Fix: add criterion (6) — heavy tiers declare a per-run resource budget
(GPU-hours, lab cost) recorded in the receipt; runs exceeding budget are
flagged like CONTENDED and cannot bank a golden.

DEF-C-2 [P1] shared-gates.md:GATE-007 — Criterion (5) ("[Inference] a dedicated
adversarial escape-attempt suite exists — see below") is checkbox-shaped:
"exists" with no minimum vector coverage, no maintained vector-list
requirement, and no negative-control/mutation demonstration, so a weak sandbox
passes by shipping a trivial escape suite. The gate's own anti-pattern section
honestly admits no surveyed repo demonstrates one, but honesty does not make
the criterion enforceable. Fix: require (a) the suite to reference a
version-pinned, maintained escape-vector list as oracle; (b) each vector check
to demonstrate a red-then-green cycle (relax the boundary, watch it go red —
the sandbox companion's GATE-SB-1 already has this; lift it into the shared
gate); (c) unattempted vectors registered as UNK-*, per GATE-SB-2.

DEF-C-3 [P2] shared-gates.md:GATE-007 — Criterion (2) (seccomp/BPF forbidden
syscall set "actually blocked") never requires the forbidden set to have
provenance: no derivation from the charter threat model, no pinning as a
fixture, no review date when the kernel interface changes. Fix: require the
forbidden set to be derived from the REQ-1-style threat model, pinned as a
truth-pack fixture with a review date, and diff-reviewed on any substrate
generation change.

DEF-C-4 [P1] shared-gates.md:GATE-010 — Criterion (2) requires span
masking/redaction unit tests but provides no secret/PII classification policy
and no default-on requirement: it says *what* to test, not *what must be
masked*, so a suite passes with a masking function that masks one hardcoded
field. PII appears only in the anti-patterns ("PII/secrets in exported spans"),
never in the acceptance criteria. Fix: require (a) a named classification
(API keys, tokens, credentials, PII classes) in the charter or docs;
(b) masking on by default for prompt/response with an explicit opt-out
inventory; (c) recorded cassettes/fixtures scanned for unmasked secrets as a
CI check, not just unit tests of the masking function.

DEF-C-5 [P1] pickup-browser-use.md:Charter seed — No trust-boundary section for
the agent itself operating on untrusted web content. Prompt injection via page
content, session/credential handling inside the browser, and data exfiltration
to attacker-controlled domains are never named. REQ-BU-2 (live-web embargo)
constrains only the *test suite*; the product will browse hostile pages and
the plan has no requirement about what it may not do there. The playbook
constitution requires a "trust boundaries" charter element; this companion's
charter has scope/non-goals but no trust boundaries at all. Fix: add a
trust-boundary subsection (untrusted parties: page content, extensions,
network; credentials/session state never injected into page context; untrusted
content never treated as instructions) and a REQ that agent actions on
untrusted content pass through a declared policy point.

DEF-C-6 [P1] pickup-browser-use.md:REQ-BU-4 — "Agent benchmarks trigger on
every PR against the PR commit" directly conflicts with shared GATE-014
("live-provider tests, where they exist, are secrets-gated, path-triggered,
and excluded from the PR path") and GATE-015 (expensive tiers separated from
PR): agent-task/eval tiers require judge-model API keys and spend real money
per run. browser-use is the only reviewed companion whose policy puts
secrets-gated, expensive evals on the PR path. Fix: change REQ-BU-4 to trigger
benchmarks on merge-queue/scheduled/labeled runs only, with per-PR execution
opt-in behind an explicit label, and record judge-model spend in the run
receipt.

DEF-C-7 [P1] pickup-sandbox-exec.md:Unknowns — UNK-1 ("no maintained
sandbox-escape vector list; no admissible pentest oracle") carries no
disposition. For the type whose product IS isolation, this is the single most
security-relevant unknown, and the S4 exit condition ("no UNK-* with
disposition BLOCKS_PLAN") is vacuously satisfiable without it. Fix: mark UNK-1
disposition BLOCKS_PLAN until an admissible adversarial oracle (maintained
vector list + red-then-green suite) is registered; likewise disposition
BLOCKS_PLAN on UNK-2 if the local-vs-remote-lab boundary determines whether
escape accounting can ever be banked locally.

DEF-C-8 [P1] PROJECT-PICKUP-PLAYBOOK.md:Bench spec — Slots 6/8 mandate preflight
refusal and CONTENDED marking (machine-state and contention receipts are
covered), but no slot addresses cost accounting for GPU runners or the
normative remote-lab variant: no per-run cost recording, no cost budget, no
policy for who funds scheduled heavy tiers (nightly GPU CI, browser-farm
leak checks, VM fleets). GATE-013 already admits voice latency is "tested,
not gated" on cost-adjacent grounds. Fix: add a 13th bench-spec slot (or
extend slot 8): heavy-tier receipts record estimated GPU/lab cost, runs carry
a declared cost budget, and scheduled heavy tiers require a named funding
owner.

DEF-C-9 [P2] pickup-web-search-apis.md:Requirements — No redaction/PII policy
for the frozen fixture corpus. REQ-SEARCH-03 commits SHA-256-manifested
query→response captures; hashing does not sanitize, and recorded captures
from live vendor calls can embed user PII, leaked keys, or proprietary
content. Fix: add a REQ that corpus captures pass a secrets/PII scrub per the
GATE-010-style classification before commit, with the scrub step and
classification version recorded in the capture metadata.

DEF-C-10 [P2] pickup-computer-use.md:Localbench bench shape — The remote-lab
variant (full/long tiers on trycua-style fleets) marks receipts REMOTE-LAB and
invokes GATE-CUA-01, but states no credential policy for the fleet
(provisioning keys, VM access tokens) and no attestation requirement for
lab-side contention/machine state — receipts say "lab-side contention
recorded" without saying who attests it when the lab is third-party
infrastructure. Fix: require the remote-lab variant to name its credential
scopes (least-privilege provisioning tokens), secret-hygiene rules, and a
lab-side attestation mechanism (signed contention report or operator-stamped
preflight) before REMOTE-LAB receipts can bank goldens.

DEF-C-11 [P2] pickup-computer-use.md, pickup-web-search-apis.md,
pickup-sandbox-exec.md:Unknowns — UNK-* rows lack the explicit typed
dispositions the constitution requires ("UNK-* — typed unknowns with
dispositions (BLOCKS_PLAN blocks S5)"): browser-use and web-search use prose
("must be resolved before S5") instead of the label; sandbox-exec and
computer-use use no disposition at all. The S4 exit check is therefore
un-auditable across companions. Fix: require every UNK-* row to carry
disposition ∈ {BLOCKS_PLAN, ACCEPTED, MONITOR} with a revisit trigger, in the
companion template, before S4 sign-off.

DEF-C-12 [P2] shared-gates.md:GATE-014 — The secrets-gated live-test policy
("secrets-gated, path-triggered, and excluded from the PR path") is coherent on
quarantine, but no companion states least-privilege expectations or rotation:
GATE-015 mentions least-privilege token scoping only for heavy jobs, and
nothing requires read-only-scoped keys, masked logging in receipts, or a
rotation/expiry note. Fix: extend GATE-014 criterion (4) to require named key
scopes (read-only where possible), secret masking in all receipt/CI logs, and
a rotation or expiry note alongside the PIN_RECORD.md secret inventory.
