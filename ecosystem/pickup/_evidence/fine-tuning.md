# Fine-tuning infrastructure - evidence

Verified 2026-09-23 via GitHub API (`api.github.com/repos/<owner>/<repo>`) and raw workflow/test files. No repo cited from memory.

## Trend (one line per repo: owner/repo | stars | last push | why it evidences the trend)

- **unslothai/unsloth** | 76,631 | 2026-09-23T16:00:29Z | Fastest-growing fine-tuning stack (LoRA/QLoRA/GRPO kernels); ~50 workflow files show CI at industrial scale.
- **hiyouga/LlamaFactory** | 74,993 | 2026-09-14T08:09:48Z | "Unified Efficient Fine-Tuning of 100+ LLMs & VLMs (ACL 2024)"; CLI/GUI/data-driven YAML launcher; star count puts it among the largest ML repos on GitHub.
- **huggingface/trl** | 19,369 | 2026-09-23T15:43:37Z | HF's canonical post-training library (SFTTrainer, DPOTrainer, GRPO, reward trainers); TRL is the reference the others test against (Unsloth's Kaggle T4 CI runs a canary SFT leg on TRL+transformers PyPI latest).
- **Lightning-AI/litgpt** | 13,680 | 2026-09-14T10:24:06Z | Hackable pretrain/finetune/eval (LoRA, adapters, full) for every major OSS LLM family; actively maintained.
- **axolotl-ai-cloud/axolotl** | 12,494 | 2026-09-23T15:26:24Z | YAML-config SFT/DPO/LoRA/QLoRA launcher with DeepSpeed/FSDP, many model families; daily commits (pushed same day as verification).
- **OpenRLHF/OpenRLHF** | 10,040 | 2026-09-17T05:49:37Z | Distributed RLHF/RLHF suite (PPO/GRPO, Ray); still pushed within the last week.
- **microsoft/LMOps** | 4,475 | 2026-09-15T03:52:32Z | Microsoft's LLM operations collection (training/Inference) — evidences enterprise interest in the category even at lower star counts.
- **meta-pytorch/torchtune** | 5,811 | 2026-09-09T11:38:33Z | Process goldmine but TREND-CAVEAT: README carries a "Torchtune is no longer actively maintained — development wound down in 2025" banner. Include for process only, not for the active-trend claim.

## Process practices worth copying (practice | repos exhibiting it | file pointers)

**1. Tiered test pyramid: CPU unit tests on every PR, GPU e2e gated/scheduled**
| Repos | Pointers |
|---|---|
| axolotl-ai-cloud/axolotl | `.github/workflows/tests.yml` (CPU pytest on ubuntu-latest), `.github/workflows/docker-e2e.yml` (GPU e2e in Docker, gated behind `run-gpu-tests` PR label — the `gate-skip-e2e` job; runs unconditionally on main/merge queue) |
| huggingface/trl | `.github/workflows/tests.yml` (`pytest -n auto -m "not slow and not low_priority"` on AWS g6e GPU runners via `Makefile`), `.github/workflows/slow-tests.yml` (push-to-main only: single-GPU, multi-GPU, `TEST_TYPE` envs) |
| hiyouga/LlamaFactory | `.github/workflows/tests.yml` (3 OS × 3 Python × transformers-compat matrix on CPU), `.github/workflows/tests_cuda.yml` (self-hosted `linux-x86_64-gpu-2` runner), `.github/workflows/tests_npu.yml` |
| meta-pytorch/torchtune | `.github/workflows/unit_test.yaml` (CPU-only runners, python 3.9–3.11) vs `.github/workflows/gpu_test.yaml` (g5.12xlarge GPU runners, stable+nightly torch matrix, nightly excluded on PRs) |
| Lightning-AI/litgpt | `.github/workflows/cpu-tests.yml` only (explicitly CPU; env `UV_TORCH_BACKEND: cpu`) |

**2. Pytest markers/flags to split fast vs slow vs integration tests**
| Repos | Pointers |
|---|---|
| huggingface/trl | `Makefile` targets: `test: pytest -n auto -m "not slow and not low_priority" --reruns 5 --only-rerun '<OSError|Timeout|HTTP 502/504|out of memory>'`; `slow_tests: pytest -m "slow"`; `test_experimental: tests/experimental` — tests/ has matching dir layout (`tests/distributed`, `tests/invariant`, per-trainer files) |
| meta-pytorch/torchtune | `tests/conftest.py` `pytest_configure`: `--with-integration` / `--with-slow-integration` flags plus `integration_test` and `slow_integration_test` markers; README-level contract: `pytest tests` = unit only, `-m integration_test` = recipe tests only, `-m slow_integration_test` = regression tests only |
| axolotl-ai-cloud/axolotl | `pytest -m "not slow"` per `.github/CONTRIBUTING.md` for the CPU suite |

**3. Tiny-model smoke trains as the standard unit of correctness (steps in the single digits)**
| Repos | Pointers |
|---|---|
| axolotl-ai-cloud/axolotl | `tests/e2e/test_lora_llama.py`: full `validate_config` → `load_datasets` → `train` round-trip on `HuggingFaceTB/SmolLM2-135M` with `max_steps: 5`, then `check_model_output_exists`; pattern repeated per model family (`test_gemma2.py`, `test_qwen.py`, `test_dpo.py`, ... in `tests/e2e/`) |
| huggingface/trl | `tests/test_sft_trainer.py` parametrized over `trl-internal-testing/tiny-RemoteForCausalLM` / `tiny-Qwen2ForCausalLM-2.5` fixtures — private tiny checkpoints per architecture |
| meta-pytorch/torchtune | `tests/recipes/test_full_finetune_single_device.py`: tiny `llama3_hf_138m` checkpoint, `max_steps_per_epoch=2`, fp32, `dummy_alpaca_dataset_config()`; recipe test mirrors (`test_lora_finetune_single_device.py`, `test_qat_single_device.py`, ...) |
| Lightning-AI/litgpt | `tests/test_lora.py`: `Config(n_layer=2, n_head=4, n_embd=8, block_size=8, vocab_size=8, ...)` — synthetic micro-configs, no checkpoint download at all |
| hiyouga/LlamaFactory | `tests/e2e/test_train.py` (e2e train), unit tests run CPU-friendly with `CUDA_VISIBLE_DEVICES=` via `make test` (`WANDB_DISABLED=true pytest -vv --import-mode=importlib tests/ tests_v1/`) |

**4. Numerics/determinism regression: exact loss golden values and fixed seeds**
| Repos | Pointers |
|---|---|
| meta-pytorch/torchtune | `tests/recipes/test_full_finetune_single_device.py::_fetch_expected_loss_values` — `loss_values_map = {"llama3_hf_138m": [11.8934, 11.9444, 11.8903, 11.8915]}` asserted against the run's metric logger; `seed=9`, `dtype=fp32` overrides; compile=True/False both run |
| meta-pytorch/torchtune | `.github/workflows/regression_test.yaml` — nightly cron (midnight) on GPU, stable + nightly torch, separate from PR CI |

**5. Config validation as its own testable surface**
| Repos | Pointers |
|---|---|
| axolotl-ai-cloud/axolotl | `tests/e2e/test_lora_llama.py` calls `validate_config(cfg)` + `normalize_config(cfg)` before training — config-validation is an API, exercised in every smoke test; `tests/recipes`-analog config tests exist per recipe |
| meta-pytorch/torchtune | `tests/recipes/test_configs.py` + `tests/test_args.py`-style config tests (litgpt: `tests/test_config.py`, `tests/test_args.py`, `tests/test_config_hub.py`) |

**6. Keeping GPU CI tractable: caching + model-cache priming + free external GPU legs**
| Repos | Pointers |
|---|---|
| axolotl-ai-cloud/axolotl | `tests.yml` `prime-cdn-s3-cache` job restores a pre-bundled HF Hub cache (`hf-cache.tar.zst`) from S3/CDN into every runner; `nf4-cpu.yml` runs DeepSpeed distributed tests on **CPU** via `DS_ACCELERATOR: "cpu"` — distributed-logic coverage without GPUs |
| hiyouga/LlamaFactory | CPU matrix installs `torch --index-url https://download.pytorch.org/whl/cpu` and runs the full suite with GPUs hidden; cached HF hub (`Cache files` step, `HF_HOME` under runner cache) |
| unslothai/unsloth | `.github/workflows/kaggle-t4-notebook-ci.yml` — notebook regression tests on **free Kaggle T4 hardware** (explicit rationale in the file header: "Kaggle gives us that card free"), with canary-vs-control legs (tiny Qwen2.5-0.5B SFT pinned vs latest libs) |
| huggingface/trl | Transient-infra auto-retry (`--reruns 5` only for OSError/Timeout/HTTP 502/504/OOM messages) so flaky hub/GPU noise doesn't block merges; PyTorch CUDA alloc-conf tuned in workflow env |
| Lightning-AI/litgpt | `cpu-tests.yml` splits `testing-imports` (fast, 4 OSes, `--no-dev`) from heavier tests, `HF_HOME`/dataset caches, locked-down permissions |

**7. Eval-after-train / generate-after-train smoke coverage**
| Repos | Pointers |
|---|---|
| axolotl-ai-cloud/axolotl | `tests/e2e/test_evaluate.py`, `test_generate` flows after train; `check_model_output_exists` verifies checkpoints actually materialize |
| meta-pytorch/torchtune | `tests/recipes/test_eleuther_eval.py` — eleuther-eval recipe run in CI (`lm-eval==0.4.8` pinned in gpu_test.yaml) |
| hiyouga/LlamaFactory | `tests/eval/` dir + `tests/e2e/test_sglang.py` (serve/eval path) |
| Lightning-AI/litgpt | `tests/test_evaluate.py`, `tests/test_chat.py`, `tests/test_cli.py` |

## Notes / caveats (be honest about thin evidence)

- **torchtune is sunset** (2025) — its process evidence (integration markers, golden-loss regression tests) is excellent but a clean-room project should not copy its bus-factor trajectory; weight it as process-only evidence.
- **Axolotl process depth unverified in detail**: I verified the workflow inventory (`tests.yml`, `nf4-cpu.yml`, `docker-e2e.yml`, `multi-gpu-e2e.yml`, `tests-nightly.yml`) and one full e2e test file, but did not read every e2e test or the `cicd/cicd.sh` GPU run order. The CONTRIBUTING.md CPU-vs-GPU guidance was read via search index (6-day-old crawl of the new org) — paths in `tests/` and `cicd/` are consistent with it.
- **Unsloth evidence skews toward installer/compat CI**: its `tests/` is ~200 tiny unit files (import guards, version floors, device-spoof stubs) plus notebook/Kaggle legs; I did not verify a full smoke-train test file beyond the documented CI legs. Its value for the playbook is the free-GPU-Kaggle trick and the pinned-vs-latest canary leg.
- **OpenRLHF / LMOps are trend-only**: CI for OpenRLHF is a single `python-package.yml` (publish-on-release only) — no process evidence; LMOps's `tests/` were not enumerated. They're included for category-breadth (distributed RLHF, enterprise) not process depth.
- **Star counts are snapshot**: verified 2026-09-23; fine-tuning repos re-rank frequently (Unsloth and LlamaFactory are neck-and-neck at ~75k+).
- **Axolotl org moved** (`axolotl-ai-cloud/axolotl`, formerly under a different org name); LLaMA-Factory is now `hiyouga/LlamaFactory` (case-renamed). Pointers above use the live paths.
