# S0 — localbench pattern (generalized for pickup)

Source: a local localbench checkout (Mac Studio), read 2026-09-23.
localbench = awareness/control harness for local model use: measures the path a harness
actually takes (harness → local server → model), records machine state next to every
number, gates regressions against A/A-derived goldens, host-only.

## Generalizable pattern (the "bench harness shape")

Every new project type's starting point should instantiate these slots:

1. **Spec format** — `backend:model` string naming exactly what is measured
   (e.g. `ollama:qwen3.6:35b-mlx`, `mlx-serve:<model dir>`). The harness starts/stops
   backends itself.
2. **Tier list** — named workload tiers (localbench: conf, micro, replay, e2e, rel,
   relcold, relfresh, mem). Goldens bind PER TIER; a component update invalidates
   only the tiers it touches (re-bank those tiers only).
3. **Golden schema** — JSON per spec: `conformance` (named checks, each with
   `level: MUST|SHOULD` and `verdict: PASS|FAIL`) + `metrics` (each with `value`,
   `spread` from A/A, `tol`, `tol_source` → banked receipt path, `better` direction).
   Tolerance rule: `tol = max(3 × A/A relative spread, floor)`.
4. **Only banking ceremony** — goldens are written ONLY by an A/A pair run
   (`aa <spec> --write-golden`: two runs → banked receipt + golden, refuses unsound
   A/A pairs), followed by `git diff goldens/` review in the same commit.
   Golden-regeneration-until-green is a named forbidden pattern.
5. **Host/generation binding** — `goldens/<host_id>/`; never compared across hosts
   or across generations (backend/harness updates = new generation; status reports
   CURRENT / GENERATION-MISMATCH / UNAVAILABLE per golden).
6. **Measurement law** — preflight refuses a busy machine (GPU/CPU > 25%, names the
   processes); runs are marked CONTENDED if any non-backend process exceeds 25% GPU
   in a second; one unit under test at a time; loopback/local-only endpoints
   (a failed local call is a finding, never a cloud fallback); park/unpark
   interfering residents during test windows.
7. **A/B discipline** — same-invocation A, B, A ordering; banked under a name.
8. **Receipts** — `docs/evidence/receipts/<kind>__<spec>__<timestamp>.json`
   (kinds: aa, ab, mem, run) + dated `.md` investigation notes; `runs/` is
   gitignored scratch with `<ts>__<kind>__<spec>` dirs.
9. **Incumbent pins** — `docs/evidence/incumbents.md`: exact versions + hashes of
   every external thing numbers depend on (server, harness, model weights, OS).
10. **Claims registry wiring** — `registries/claims.tsv`: every public claim
    sentence is registered and machine-checked against its receipt on every commit.
11. **Negative-evidence ledger** — `docs/evidence/NEGATIVE_EVIDENCE.md`,
    `DISCREPANCIES.md`, `break-tests.md`, `demotion-rules.md`
    (demotions always allowed; no self-grading without independent verification).
12. **Anti-reward-hacking law** — 12 forbidden patterns verbatim in AGENTS.md:
    gate self-weakening, proof-class inflation, golden regeneration reflex,
    commit-stream pumping, tautological tests, easy-lever cherry-picking,
    close-pump abuse, scope-splitting, spec-editing as progress,
    conformance metastasis, dependency smuggling, bench-path hardcoding.

## What the pickup playbook must do with this

For each of the ~20 tech types, the companion file's "localbench bench shape"
section instantiates slots 1–12: what the spec names, which tiers make sense,
which conformance checks are MUST vs SHOULD, what the incumbent pins are,
what the measurement law forbids, and where fixtures bind by hash.
Types that cannot run locally (e.g. sandbox-escape accounting, browser-use)
get a "remote-lab variant" note rather than a weakened local law.
