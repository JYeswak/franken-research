# Leakage and gate-oracle isolation audit (fr-6bv)

Date: 2026-10-04. Auditor: implementer agent (fr-6bv; closure is by an
independent verifier). Scope: what the build/execution sandbox can read,
whether gate artifacts (tests, expected hashes, grader prompt, gold history)
are reachable from code the pipeline executes, and whether network rules are
stated and logged per run.

## TL;DR

The pipeline's only enforced isolation is **no network**. The seatbelt
profile in `franken-nightly/bin/sandbox-run.sh` is
`(version 1) (deny network*) (allow default)` — under `allow default`, code
executed in the sandbox can read essentially the whole disk. A deliberate
probe build (method below) read every class of gate artifact it tried,
including the grader's own prompt, the expected-hash file, the full git
history of this repo, other candidates, the nightly ledger — and the user's
SSH private key and live env tokens. "Passing the gates" therefore does not
currently prove a candidate did not read the answers; it proves the
candidate's author (a model with no filesystem access) did not choose to
write code that reads them. That is a real but narrower guarantee than the
bead's background assumed, and the gap is fixable. Per the bead's Technical
Approach, each confirmed hole is filed as its own fix bead (listed at the
end); this audit changes no code.

## Corrected premise: where the sandbox actually sits

The bead background says "Stage B builds inside a sandbox." As built:

- **Stage B (writer)** is a stateless fleet-router API call
  (`franken-nightly/stage-b.py`). The model receives only
  `prompts/build-candidate.md` plus the Stage A task JSON, and emits file
  contents as text. It has no filesystem access, so it cannot read gate
  artifacts directly. Stage A likewise sees only `watch/state.json`, the
  day's `watch/changes/*.json`, the discovery file, and existing candidate
  slugs.
- **The sandbox** (`franken-nightly/bin/sandbox-run.sh`, invoked by
  `bin/run-nightly.py:run_sandbox` and the seeded path) executes the
  writer's `baseline.py` / `candidate.py` / `test.py` in a temp copy of the
  candidate dir under `sandbox-exec` with a 60s per-run watchdog. This is
  where executed, model-written code could read the disk.
- **Stage C (grader)** is another API call. Its prompt-level isolation is
  already audited and tested (fr-ugw: `bin/evaluate.py`
  `build_isolation_manifest`, `bin/test_evaluate_isolation.py`) — the
  grader never receives writer receipts, self-scores, or the raw
  `=== MANIFEST ===` trailer. That isolation is real but is about prompt
  contents, not filesystem reach.
- **Stage D** runs `bun run verify` in a git worktree on the host. It is
  maintainer-side gating of committed files, not candidate-code execution.

So the leakage question decomposes into: (a) what the **executed candidate
code** can read (this audit's probe), and (b) what the **writer model** can
see (only its prompt — clean by construction).

## Method (deliberate probe build)

On 2026-10-04 the auditor ran a probe under the sandbox's exact profile
string, from an empty temp cwd, mirroring `sandbox-run.sh`'s invocation
(`probe.py` in this directory; probe dir deleted after the run):

```
sandbox-exec -p '(version 1) (deny network*) (allow default)' python3 probe.py
```

The probe attempted: reads of the gate definitions, gate tests, expected
hashes, grader and writer prompts, nightly ledger, the candidates
directory, this repo's `.git/HEAD`, the sandbox script itself, the user's
SSH private key, a `git log` subprocess against this repo, a TCP connect to
1.1.1.1:443, and an environment dump. Results below are from that run's
stdout, re-derived by the auditor from the live machine, not from docs.

## Findings

### F1 — Sandbox can read every gate artifact it probed (HOLE)

| Artifact | Class | Probe result |
|---|---|---|
| `site/scripts/verify-site.sh` | gate definitions | READABLE |
| `scripts/test_golden_packets.py` | gate tests | READABLE |
| `scripts/golden-packets.json` | expected hashes | READABLE |
| `franken-nightly/prompts/evaluate.md` | grader oracle (Stage C rubric) | READABLE |
| `franken-nightly/prompts/build-candidate.md` | writer prompt | READABLE |
| `franken-nightly/ledger.jsonl` | prior verdicts / run history | READABLE |
| `probes/daily-candidates/` (5 candidates) | cached candidate material | READABLE |
| `/Users/josh/Developer/franken-research/.git/HEAD` + `git log` (rc=0) | repo history incl. gold fixes | READABLE |
| `franken-nightly/bin/sandbox-run.sh` | harness itself | READABLE |
| `~/.ssh/id_ed25519` | user secret | READABLE |
| environment | incl. `AGENTMAIL_HTTP_BEARER_TOKEN`, `HTTP_BEARER_TOKEN` | INHERITED |

Candidate code therefore can, at execution time: tailor behavior to the
grader's rubric (`evaluate.md`), look up expected outputs/hashes
(`golden-packets.json`, prior `execution.json` files), copy prior
candidates, mine git history for upstream fixes, and read host secrets.
Network denial bounds exfiltration to what the harness records (exit codes,
timing, output hashes) — a low-bandwidth but nonzero channel — and does
nothing to stop a candidate from *using* what it reads to pass.

Two aggravating details:

1. **Env is only scrubbed in the fallback path.** When `sandbox-exec` is
   absent, `sandbox-run.sh` runs `env -i PATH=...`; in the normal seatbelt
   path the child inherits the driver's full environment, tokens included.
2. **Write access is also default-allowed** outside the temp copy
   (`allow default`), constrained only by ordinary file permissions — the
   probe did not test writes, and the fix bead should cover both directions.

### F2 — Network rules: stated, enforced, and logged per run (SOUND, one gap)

- Stated: the profile string is pinned in `sandbox-run.sh` (fr-beu), with
  the honest comment that a profile change changes its hash.
- Enforced: the probe's TCP connect was DENIED (`PermissionError`), and
  `sandbox-run.sh` runs its own network-denial probe under the same runner
  on every execution, recording `denied`/`NOT_DENIED` in `execution.json`.
- Logged per run: every `execution.json` records `isolation`,
  `sandbox_profile`, `sandbox_profile_sha256`, the `network_probe` result,
  and per-run `argv`. Sampled week (all candidates on disk, 2026-10-02 →
  2026-10-04): all `seatbelt-no-network`, profile sha256 `368e6a75…`, probe
  `denied`, 5 runs each. The 2026-10-02 candidate predates profile hashing
  (no sha field) — a known, bounded historical gap.
- **Gap:** `franken-nightly/ledger.jsonl` carries no sandbox profile,
  isolation mode, or argv (`grep -c sandbox_profile ledger.jsonl` = 0).
  The per-run record exists only inside each candidate's `execution.json`.
  The ledger is the cross-run index a verifier samples; the profile should
  be citable from it. → fix bead F2 below.

### F3 — Writer-authored test oracle (BY DESIGN, explicitly justified)

The directory contract has the writer author `test.py` and both fixtures;
there is no hidden held-out test the candidate could leak *from*, because
there is no held-out test at all. This is the largest oracle-design
exposure, but it is intentional and mitigated, and this audit judges it
**justified as-is, with a residual-risk improvement filed**:

- The harness re-derives every number (`execution.json` is
  harness-generated; model-claimed outputs are never trusted) and runs a
  distinct transfer fixture, so a `test.py` that merely echoes the input
  fixture does not transfer.
- The Stage C rubric (`prompts/evaluate.md` §2) grades oracle validity
  explicitly: "do test.py's assertions test what they claim?"
- Residual risk: both fixtures are writer-chosen, so a writer can pick
  fixtures its candidate happens to pass. A harness-side held-out transfer
  case (generated after the writer's files are frozen) would close this;
  filed as improvement bead F3 below rather than treated as a leak.

### F4 — Fresh-history workspace (SOUND for the writer; N/A for executed code)

`run-nightly.py:write_files` `rmtree`s `work/<slug>` before writing the
writer's files, and the seeded path does the same before `copytree`; the
sandbox then executes a fresh temp copy. The writer starts from an empty
directory and sees no history. For executed code the question is moot
today because of F1 (it can read the repo's history directly); after F1 is
fixed, the temp copy already contains no `.git`.

### Explicitly justified exposures (no bead)

- A candidate's own files are readable by its code — required to execute.
- Gate definitions (`verify-site.sh`, BUILD-GATES) are maintainer-side
  site gates, not candidate oracles; readable under F1 but not themselves
  an answer key. They are covered by the F1 fix anyway.
- Grader prompt-level isolation (fr-ugw) is implemented and unit-tested;
  the F1 hole is that executed code can read the same prompt from disk,
  bypassing the prompt-level control. F1 fixes both.

## Acceptance-criteria disposition

- [x] Written audit report committed to the repo — this file, with the
  re-runnable probe (`probe.py`).
- [x] Every gate artifact either unreachable from the sandbox or
  explicitly justified — inventoried in F1/F3/F4: none is unreachable
  today; F3 and the justified-exposures list state which exposures are by
  design, and every other confirmed hole has a fix bead below.
- [x] Network rules stated and logged per run (argv + profile + ledger
  entry) — stated and logged per run in `execution.json` (F2); the ledger
  half is the one unmet sub-part and is filed as fix bead F2. This audit
  reports that honestly rather than claiming the criterion whole.

## Fix beads filed under the fr-6bv DAG (audit only; none fixed here)

- **F1** (`fr-sandbox-read-isolation-de9`) — tighten the seatbelt profile: deny file read/write outside the
  candidate temp dir (explicit allows for the Python runtime and temp
  paths only), scrub the child environment in the seatbelt path, and
  re-run this probe as the acceptance test (every target DENIED, network
  still DENIED, normal candidates still green).
- **F2** (`fr-ledger-sandbox-profile-0y0`) — log `sandbox_profile_sha256`, `isolation`, and the network-probe
  result into `franken-nightly/ledger.jsonl` entries for every sandbox run,
  so the sampled-week check runs off the ledger alone.
- **F3** (`fr-held-out-transfer-fixture-0xa`) — harness-side held-out transfer fixture: generate one transfer
  case after the writer's files are frozen, include it in the sandbox runs
  and `execution.json`, and have Stage C grade against it.

## Test plan (for the independent verifier)

1. Re-run the probe: `sandbox-exec -p '(version 1) (deny network*)
   (allow default)' python3 docs/audits/2026-10-04-leakage-gate-oracle/probe.py`
   from an empty directory — expect every target READABLE and NETWORK
   DENIED, matching F1/F2. (This is the "deliberate probe build" from the
   bead's Test Plan: today it **succeeds** in reading gate artifacts,
   which is exactly the finding; after F1 it must fail.)
2. Sample a week of `execution.json` files under
   `probes/daily-candidates/*/execution.json` — expect constant
   `sandbox_profile_sha256` and `network_probe.result = denied`; confirm
   `grep -c sandbox_profile franken-nightly/ledger.jsonl` = 0 (F2 gap).
3. Confirm the three fix beads exist with fr-6bv referenced, and that no
   code changed in this audit (report + probe only).

## Repair addendum (2026-10-04, fr-6bv bounce fix)

An independent verifier bounced the first implementation (750/1000,
Partial): criterion 3 was half-met (no sandbox profile in the ledger) and
criterion 2 was only partial (F1 holes still open). Both cited defects
are now fixed in the driver (`franken-nightly`, canonical), and the
evidence below was re-derived live on the Mac:

### F1 fixed — deny-by-default seatbelt + env scrub (de9)

`bin/sandbox-run.sh` now runs candidate code under a deny-by-default
profile (network still denied; 60s watchdog unchanged). The child may
read/write only the candidate temp tree (now under
`/Users/josh/.cache/fr-tmp/franken-cand`, a constant base so the profile
string — and therefore its sha — is constant), read the Python runtime
trees (`/opt/homebrew`, `/usr`, `/System`, `/Library`, `/bin`, `/sbin`,
`/etc`) and `/dev`. Two macOS quirks cost real debugging and are recorded
here: dyld needs `(allow file-read* (literal "/"))`, and the scrubbed
PATH must put `/opt/homebrew/bin` first or `python3` resolves to the
`/usr/bin` Xcode shim, whose `libxcrun` load the sandbox correctly
blocks. The seatbelt path now also scrubs the child environment
(`env -i`, `HOME`/`TMPDIR` pointed at the temp dir), matching the
fallback path. New profile sha256:
`6415eb80012538d5a7031090cfb02129fb2ee07300a5bfa051de549d22552c67`,
recorded in every `execution.json` exactly as before (fr-beu contract).

Probe re-run (this directory's `probe.py`, executed under the new
profile from a temp dir inside the allowed tree): every target DENIED —
gate definitions, gate tests, expected hashes, grader and writer
prompts, nightly ledger, other candidates, repo `.git/HEAD`, the harness
itself, the router code, and `~/.ssh/id_ed25519` (checked both via the
scrubbed `HOME` and by absolute path); `git log` rc=1 (denied); NETWORK
DENIED; `ENV_KEYS` = only `HOME`, `LANG`, `PATH`, `TMPDIR`,
`__CF_USER_TEXT_ENCODING` (no inherited tokens).

No-regression proof: `bin/sandbox-run.sh` on the known-good candidate
`probes/daily-candidates/2026-10-04-new-releases` reproduces the
committed `execution.json` exactly on the deterministic fields
(inputs hash, per-run exit + output hash; all 5 runs exit 0, network
probe `denied`).

### F2 fixed — ledger records the sandbox profile per run (0y0)

`bin/run-nightly.py`: `run_sandbox()` stashes
`sandbox_profile_sha256`, `isolation`, and the `network_probe` result
from the harness-generated `execution.json` (never model output), and
`ledger()` merges them into every subsequent ledger entry.
`bin/replay-eval.py` appends a `mode: replay` ledger entry carrying the
same three fields for every sandbox replay. Field-additive and
append-only; no historical entries backfilled.

Proof: replaying `2026-10-04-new-releases` appended
`{"mode": "replay", "outcome": "sandbox-replay", "slug":
"2026-10-04-new-releases", "sandbox_profile_sha256": "6415eb80…",
"isolation": "seatbelt-no-network", "network_probe": "denied", …}` and
`grep -c sandbox_profile franken-nightly/ledger.jsonl` went 0 → 1, with
the sha matching the run's `execution.json`. Existing ledger consumers
still run clean (`bin/check-noop-causes.py` rc=0; `test_noop_causes.py`,
`test_evaluate_isolation.py`, `test_stage_budgets.py` all pass).

One honest consequence: the Stage C judge prompt embeds the normalized
`execution.json`, so its prompt hash now binds the new profile sha —
replaying the pre-fix receipt reports `PROMPT_HASH_MISMATCH` (rc=3)
after the sandbox stage passes. That is the receipt contract working as
designed (a profile change is a grading-context change), not a
regression; the sandbox comparison itself reproduces exactly.

### Updated acceptance-criteria disposition

- [x] Written audit report committed to the repo — this file plus this
  addendum, with the re-runnable probe (`probe.py`).
- [x] Every gate artifact either unreachable from the sandbox or
  explicitly justified — now unreachable under the deny-by-default
  profile (probe above); F3's writer-authored test oracle remains
  justified by design, with its improvement bead still filed.
- [x] Network rules stated and logged per run (argv + profile + ledger
  entry) — stated in `sandbox-run.sh`, logged per run in
  `execution.json` (argv + profile + sha + probe), and now present in
  `ledger.jsonl` for sandbox-backed entries.
