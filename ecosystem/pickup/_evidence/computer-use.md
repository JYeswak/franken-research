# Computer-use agents - evidence

All repos below verified live via `api.github.com/repos/<owner>/<repo>` on 2026-09-23. Nothing cited from memory.

## Trend (one line per repo: owner/repo | stars | last push | why it evidences the trend)

- `bytedance/UI-TARS-desktop` | 39,099 stars | pushed 2026-09-11 | A native GUI-agent desktop app + agent stack (Agent TARS) from ByteDance with its own GUI-grounding VLMs — shows big tech ships open-source computer-use products, not just papers.
- `trycua/cua` | 26,076 stars | pushed 2026-09-23 (today) | Cross-OS (macOS/Windows/Linux/Android) VM-based computer-use infra "for training, evaluation, and data generation" — the category's infrastructure layer is a starred, actively built product.
- `microsoft/OmniParser` | 25,444 stars | pushed 2026-07-20 | Microsoft's screen-parsing tool "towards pure vision based GUI agent" — the dominant building block (parse screenshot into structured UI elements) that grounding models and agents alike depend on.
- `simular-ai/Agent-S` | 12,360 stars | pushed 2026-09-05 | Open agent framework driving computers via screenshot + pyautogui; README reports OSWorld/WindowsAgentArena scores — research-grade agent with sustained multi-year maintenance (S1→S3 generations).
- `bytedance/UI-TARS` | 11,518 stars | pushed 2026-01-27 | The grounding model itself (paper arXiv:2501.12326): vision-language models trained specifically to locate UI elements from screenshots — the "grounding layer" that most agents plug in.
- `xlang-ai/OSWorld` | 3,155 stars | pushed 2026-09-14 | NeurIPS 2024 benchmark of 369 tasks in a real Ubuntu/Windows desktop VM — the de-facto desktop-agent benchmark (Anthropic's Computer Use, OpenAI CUA, academic papers all report on it).
- `xlang-ai/OSWorld-V2` | 329 stars | pushed 2026-09-16 | Follow-up benchmark of 108 long-horizon workflows (~1.6 hr human median, ~318 tool calls/task) with fine-grained partial rewards + safety reports — the trend is moving from binary pass/fail to partial-credit, longer-horizon evaluation.
- `showlab/ShowUI` | 1,905 stars | pushed 2026-04-24 | CVPR 2025 end-to-end vision-language-action GUI model — research-lab open-sourcing of a full CUA model.
- `inclusionAI/AWorld` | 1,236 stars | pushed 2026-09-23 (today) | General agent framework shipping `examples/osworld/` with an OSWorld-targeting GUI agent — adopters integrate OSWorld as a standard harness outside the benchmark's own repo.
- `microsoft/WindowsAgentArena` | 901 stars | pushed 2026-04-13 | Microsoft's Windows-side counterpart benchmark (Azure/VM-based), less active than OSWorld but the Windows-half of the standard eval pair.

## Process practices worth copying

| Practice | Repos exhibiting it | File pointers |
|---|---|---|
| **State-based evaluation (score VM state, not chat)** | xlang-ai/OSWorld | `desktop_env/desktop_env.py::_evaluate_with_evaluator`, `desktop_env/evaluators/` (`getters/` + `metrics/` split — result/expected getters then metric functions) |
| **Per-task JSON configs (instruction + setup + evaluator)** | xlang-ai/OSWorld, xlang-ai/OSWorld-V2 | `evaluation_examples/` (`test_all.json` v1, `test_v2.json` v2), `run.py`, `lib_run_single.py` |
| **Explicit FAIL-action for infeasible tasks** | xlang-ai/OSWorld | infeasible tasks score 1.0 iff the agent's last action is `FAIL` (evaluator func `"infeasible"`) — prevents reward-hacking by refusal |
| **Reproducible container/VM infra + run scripts** | microsoft/WindowsAgentArena | `scripts/build-container-image.sh`, `scripts/run.sh`, `scripts/run-local.sh`, `scripts/run_azure.py`, `scripts/experiments.json`, `scripts/azure_files/` |
| **Benchmark harness as a first-class library with CI** | trycua/cua | `libs/cua-bench/` (`cua_bench/`, `tasks/`, `example_tasks/`, `datasets/`), `.github/workflows/ci-py-bench.yml` + `ci-cold-start-benchmark.yml`; pattern: bench package built/tested in CI, benchmark-regression as CI jobs |
| **Per-package CI matrix (100+ workflows, reusable build/publish)** | trycua/cua | `.github/workflows/`: `py-reusable-build.yml`, `py-reusable-publish.yml`, `ts-reusable-*`, `docker-reusable-build.yml`, `ci-*`/`cd-*`/`e2e-*` per package (drivers, fleet, bench, lume, som, etc.); `ci-spdx-headers.yml` for license headers |
| **Grounding accuracy eval script (ScreenSpot protocol)** | microsoft/OmniParser, likaixin2000/ScreenSpot-Pro-GUI-Grounding | OmniParser: `eval/ss_pro_gpt4o_omniv2.py` (+ results logs `eval/logs_sspro_omniv2.json`); ScreenSpot-Pro: `eval_screenspot_pro.py` (filters by platform/language/instruction-style/gt-type, fixed seed) — copy the "predicted point inside ground-truth box" accuracy protocol |
| **Multi-generation agent structure with versioned eval configs** | simular-ai/Agent-S | `gui_agents/{s1,s2,s2_5,s3}/`, `osworld_setup/{s1,s2,s2_5,s3}/`, `evaluation_sets/test_all.json`, `evaluation_sets/test_small_new.json`; `gui_agents/s2/WAA_setup.md` documents WindowsAgentArena setup — per-generation dirs keep old configs reproducible |
| **E2E driver CI on real OS runners** | trycua/cua | `e2e-rust-linux.yml`, `e2e-rust-macos.yml`, `e2e-rust-windows.yml`, `e2e-rust-linux-wayland.yml`, `e2e-rust-standalone-browsers.yml`, `ci-driver-mcp-candidate.yml` — OS-level agent actions validated on real runners per OS |
| **Result logging / experiment infrastructure** | xlang-ai/OSWorld | `lib_results_logger.py`, `show_result.py`, `logs/` — run manifests + result display as first-class citizens |
| **Live infra smoke tests (fleets)** | trycua/cua | `infra/fleets-wif-smoke/`, `.github/workflows/infra-fleets-wif-smoke.yml`, `periodic-cua-sandbox-live.yml` — scheduled live-environment smokes catch infra drift, not just unit failures |
| **Pin upstream benchmark commit in run manifests** | community practice visible in the wild (e.g. ouroboros' `devtools/benchmarks/osworld/METHODOLOGY.md` aligns to OSWorld-V2 commit `c261cb57…`) | record the exact benchmark commit in every run manifest — prevents silent harness drift |

## Notes / caveats (be honest about thin evidence)

- **Research-heavy category.** Of the trend repos, only `trycua/cua` and `bytedance/UI-TARS-desktop` are products; the rest are research artifacts (papers + code). Maintainers of OSWorld (3,155 stars) vs. Agent-S (12,360) show interest, but adoption of any single agent stack is unproven beyond benchmarks.
- **The benchmark IS the market signal.** There is no equivalent of "downloads" here — success is reported as OSWorld/WindowsAgentArena percentages on READMEs, which are self-reported and deserve discounting.
- **WindowsAgentArena is the thinner half.** 901 stars, last pushed 2026-04-13 (5 months ago), no visible CI workflows in its `.github/` listing beyond default — the Windows harness lags OSWorld in maintenance cadence.
- **OSWorld itself has no GitHub CI visible** (`.github/workflows` 404s) — its quality control is in the harness design and the community reproducing it, not in repo-level CI. `trycua/cua` is the model to copy for CI, not the benchmarks themselves.
- **WindowsAgentArena tree listing failed** for `scripts/win-arena-container` (404) despite being shown in the parent listing — treat that single pointer as unverified; the other `scripts/` pointers (build-container-image.sh, run.sh, run_azure.py, experiments.json, azure_files/) verified fine.
- **ScreenSpot-Pro eval repo** (`likaixin2000/ScreenSpot-Pro-GUI-Grounding`, 397 stars, pushed 2026-06-17) is the verified grounding-accuracy benchmark harness; the original ScreenSpot paper repo name variants are low-star forks and were dropped.
- **OS-Copilot** (1,794 stars) verified but last pushed 2024-09-09 — dead; excluded from trend evidence. `showlab/ShowUI`'s last push is 2026-04-24 (5 months) — maintained but slower than the 2026-pushed set.
- **Unverifiable claims skipped:** any repo I couldn't find via the API (e.g. my first guesses at `WindowsAgentArena/WindowsAgentArena`, `microsoft/OmniParser-NexT`, `ByteDance-Seed/UI-TARS-desktop`, `OS-Copilot/OS-Copilot` naming variants) were corrected to the verified paths above or dropped.
