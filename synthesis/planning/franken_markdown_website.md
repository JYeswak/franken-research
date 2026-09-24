# Planning-Methodology Analysis: franken_markdown_website

**Repo:** `Dicklesworthstone/franken_markdown_website` · **Cloned:** 2026-09-22 (`git clone --depth 1`) · **Commit:** `c9574d3` ("style(dev): format dev verification, smoke, and snapshot test scripts", 2026-09-22)

**Scoping note [Verified]:** This is NOT a Rust clean-room reimplementation. It is the static marketing/demo website (single `index.html`, Tailwind CSS, vanilla JS) for the `franken_markdown` engine, live at franken-markdown.com, embedding the engine as prebuilt WASM artifacts under `assets/wasm/<version>/`. The planning-machinery pattern observed in engine repos does not appear here at all — this repo is an outlier, and the correct finding is near-total absence.

---

## 1. Artifact inventory

| Path | Role | One-line summary |
|---|---|---|
| `README.md` (326 lines) | Operational runbook + marketing spec | Deploy, wasm-refresh, caching-sharp-edges, troubleshooting, FAQ; the repo's only procedure documentation [Verified] |
| `dev/e2e.mjs` | Headless acceptance suite | 28-check Chromium e2e of playground, toggles, downloads, share round-trips, visualizations, no console errors [Verified] |
| `dev/failure-and-stress.mjs` | Negative-path suite | Blocks the wasm binary (must surface `WASM FAILED`, never hang); 12 rounds interleaved typing + toggles must end consistent [Verified] |
| `dev/verify-live-assets.mjs` | Deploy-integrity check | sha256-compares every asset the live page references against local tree [Verified] |
| `dev/firefox-smoke.mjs`, `dev/webkit-smoke.mjs`, `dev/live-smoke.mjs`, `dev/live-ots-check.mjs`, `dev/share-debug*.mjs`, etc. | Smoke/debug/shots tooling | Browser-matrix smoke tests and screenshot generators [Verified] |
| `dev/refresh-engine-wasm.sh` | Artifact promotion procedure | Copies a *verified* engine wasm package into `assets/wasm/<version>/`, rewrites worker import + `?v=` cache-busts [Verified] |
| `package.json` | Test entry points | `test`, `test:live`, `test:stress`, `verify:live`, `smoke:firefox`, `smoke:webkit` scripts [Verified] |
| `index.html:826` | Stray usage of "roadmap" | "full widow/orphan control is roadmap." — the word used as marketing copy, not a roadmap artifact [Verified] |

**Explicit absences [Absent], verified by case-insensitive filename search over the whole tree plus greps for `roadmap|bead|definition of done|red.?team|falsif|dialectic|checkpoint|sign.?off` in all text files:** no `docs/` directory at all; no `docs/planning/`; no `.beads/` or any JSONL task database; no `ROADMAP.md`, `BEADS.md`, `TODO.md`, `PLAN.md`; no `AGENTS.md`, `CLAUDE.md`, `MUSE.md`, `.muse/`; no `docs/research/`; no ADRs; no `.github/` workflows; no `CHANGELOG.md`.

**Git-history caveat [Inference]:** the clone is depth-1 with a single squashed commit, so planning artifacts that existed and were deleted (or commits carrying planning discussion) are unverifiable from this snapshot. The public history on GitHub would be needed to rule that out; from the working tree, nothing planning-related exists.

---

## 2. Execution-readiness gates

No plan-approval gates exist because no plans exist. What does exist are **promotion/verification gates** — procedures that must pass before artifacts go live. These are release gates, not planning gates:

**Engine-parity gate (lives in the engine repo, cited here):**
> "It is built and verified by the engine repo's official gate (native ↔ wasm byte parity + size budget)" — `README.md` [Maintainer claim]
> "Never copy an unverified build; the whole point of the playground is that it runs the parity-gated engine." — `README.md` [Maintainer claim]
> "The official parity gate is scripts/check-wasm-package.sh in that repo. This script never runs wasm-opt: on the 0.3.5 module, -Oz/-O4/-Os grew gzip and brotli even though they shrank raw bytes." — `dev/refresh-engine-wasm.sh` [Verified]

**Deploy verification procedure:**
> "After deploying, verify **content**, not headers — a header poll is satisfied by the previous deployment during the propagation window:
> `until bun run verify:live; do sleep 10; done   # sha-compares every live asset`
> `bun dev/e2e.mjs https://franken-markdown.com/  # then the full suite`" — `README.md` [Maintainer claim]

**Cache-invalidation discipline:**
> "**whenever an asset's content changes, bump its `?v=` query in `index.html`** (and in module import specifiers if the file is imported)." — `README.md` [Maintainer claim]

The only multi-step checklists in the repo are these operational procedures. No planning gate, agent sign-off, or readiness checklist of the suite's kind appears anywhere [Absent].

---

## 3. Honesty guardrails (negative-evidence / claim-matrix / demotion)

**Nothing of this kind exists in this repo [Absent].** No negative-evidence ledger, no claim matrix, no auto-demotion rules, no receipt-bound evidence, no falsification artifacts were found by filename search or full-text grep.

The closest analogues — all operational, all verifying *rendered output* rather than *claims about the work* — are:

- The engine-parity CI gate (native ↔ wasm byte-identical output), referenced from this repo but implemented in `franken_markdown`, not here [Maintainer claim, via `README.md` and `index.html:727` "yes, CI-enforced"]
- `dev/verify-live-assets.mjs`: sha256 comparison of live vs. local assets (integrity, not honesty) [Verified]
- `dev/failure-and-stress.mjs`: the wasm binary must surface `WASM FAILED` rather than hang (failure-mode honesty in the UI) [Verified]
- `README.md` "Limitations" section: explicitly lists what the site cannot do (share links bounded by URL length, `zdoc=` is not encryption, visualizations are "faithful but simplified") — the repo's only instance of stated-limitation candor, aimed at end users, not at agents [Verified]

When in the lifecycle such guardrails were installed: unknowable from the squashed history [Absent/Inference].

---

## 4. Plan → agent execution

No task graphs, no phases, no verification loops beyond the test scripts, no dialectical review, and no drift prevention exist as artifacts [Absent].

The only two sentences in the repo that touch how agents do the work:

1. > "The helper also writes a local staging copy under `dev/engine-wasm/<version>/` (gitignored) so a later agent can finish the `assets/wasm/` copy if that tree is locked." — `README.md` [Maintainer claim] — an **agent-handoff mechanism**: staging unfinished work in a gitignored directory for a subsequent agent session.
2. > "I'll have Claude or Codex review submissions via `gh` and independently decide whether and how to address them." — `README.md`, "About Contributions" [Maintainer claim] — models used as **reviewers of human-proposed fixes**, never merging PRs directly.

[Inference]: The site's content (marketing narrative, visualizations, 3133-line stylesheet, 75 KB `index.html`) is far too authored to have been generated by an ad-hoc agent session, yet the repo carries no record of how it was produced — no planning docs, no prompts, no session notes. Either planning happened in a private channel and was never committed, or it was built in one or two direct sessions. The staging-copy note in (1) is the sole evidence that agent sessions are part of this repo's workflow at all.

---

## 5. State-of-the-art coverage (research / competitor / literature mechanisms)

No `docs/research/`, no literature notes, no competitor-analysis artifacts [Absent]. The site's narrative *demonstrates* domain knowledge (Knuth–Plass line breaking, font subsetting, OTS parsing, CommonMark spec examples — `index.html:824` cites "379/652 examples"), but the research process behind it left no artifacts in this repo. The authoritative sources all live in the engine repo; this repo consumes them as compiled binaries.

---

## 6. Anti-satisficing (red-team / falsification / campaign mechanisms)

**Absent as planning artifacts.** The `dev/` tooling is, however, unusually adversarial *as engineering test design* for a marketing site:

- `failure-and-stress.mjs` deliberately blocks the wasm binary and demands a surfaced failure, never a hang; 12 rounds of interleaved input must end consistent [Verified]
- `e2e.mjs` (30 `check(` calls) asserts no console errors, no font rejects, intact desktop chrome — designed to catch a stale stylesheet from the Cloudflare edge cache [Verified]
- `verify-live-assets.mjs` exists specifically because of a production incident ("one stylesheet URL got pinned for a day with stale content") [Verified, `README.md`]

This is adversarial *testing*, not adversarial *planning* — there is no red-teaming of the work plan, no falsification pass over claims, no multi-round campaign structure recorded anywhere [Absent].

---

## 7. Explicit absences

Everything in the suite's planning vocabulary is absent from the working tree: `docs/planning/**`, `.beads/` JSONL databases, `ROADMAP.md`/`BEADS.md`/`TODO.md`/`PLAN.md`, `AGENTS.md`/`CLAUDE.md`/`MUSE.md`/`.muse/`, `docs/research/**`, ADRs, definition-of-done docs, negative-evidence ledgers, claim matrices, auto-demotion rules, task graphs, dialectical review records, drift-prevention notes, and any CI/workflow configuration (no `.github/`). The word "roadmap" occurs once, as marketing copy about a feature (`index.html:826`). CI gates are discussed but belong to the *engine* repo (`franken_markdown`); this repo only consumes their outputs.

---

## 8. Maturity verdict

**Verdict: thin — planning methodology is absent; what exists is an unusually rigorous operational runbook.**

Why: the repo contains zero planning artifacts of any kind and no evidence of plan-first, dialectical, or swarm-based development — even though the parent agent's context describes those as Emanuel's suite-wide method. What it does contain is a dense, scar-tissue-rich operational README (deploy procedures, caching sharp edges learned from production incidents, a wasm-refresh script that refuses to run `wasm-opt` and enforces the parity gate) plus an adversarially-designed test suite (30-check e2e, stress/failure suites, live-asset sha256 verification, multi-browser smoke). This reads as a directly-authored artifact — a hand-tended site where Emanuel's rigor shows up in *verification procedures* rather than in *planning documents*. The single squashed commit prevents any claim about planning that happened off-repo. For the cross-suite synthesis: this repo is the counter-example proving the planning apparatus is attached to the *engine* work, not to every repo the maintainer touches.
