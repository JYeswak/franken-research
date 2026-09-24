<!-- Review record, published as written. Review of 7 verdicts (author VerdictsTools) by ReviewTools, with re-checks until signing. Scratch paths refer to the reviewer's machine. -->

# Independent review: tools-and-environment and training-and-voice verdicts

- Reviewer: ReviewTools. Author under review: VerdictsTools. Commit: 36de0d4 (`stack/sandbox-exec.md`, `browser-use.md`, `computer-use.md`, `web-search-apis.md`, `fine-tuning.md`, `rl-envs.md`, `voice-agents.md`).
- Rules applied: stack/METHOD.md v2 (6d03cc1), RULEBOOK.md section 1.
- Review date: 2026-09-23. Read-only pass: no verdict file was edited, and `reviewed_by` is not signed.
- How to read this: severity **H** / **M** means fix before sign-off. **L** means recommended. Line numbers are the verdict file's lines at 36de0d4. Every replacement quote proposed below was checked mechanically against its line (45 of 45 match).

## Result

| File | Verdict | Verdict order | Confidence | Pack caveats carried | Findings (H/M/L) | Status |
|---|---|---|---|---|---|---|
| sandbox-exec | Adopt and wrap | correct | Medium, correct | all 6 relevant | 8 (0/3/5) | FAIL, fixes needed |
| browser-use | Adopt and wrap | correct | Medium, acceptable | all 6 | 4 (1/0/3) | FAIL, fixes needed |
| computer-use | Watch | correct | Low, correct | 1 missing (:42) | 5 (0/2/3) | FAIL, fixes needed |
| web-search-apis | Adopt and wrap | correct | Medium, correct | :38 in the wrong section | 5 (1/2/2) | FAIL, fixes needed |
| fine-tuning | Adopt and wrap | correct | Medium, correct | 1 missing (:79) | 6 (0/2/4) | FAIL, fixes needed |
| rl-envs | Adopt and wrap | correct, basis should be strengthened | **should be Low** | all 4 | 4 (0/2/2) | FAIL, fixes needed |
| voice-agents | Adopt and wrap | correct | Medium, correct | all relevant | 3 (0/2/1) | FAIL, fixes needed |
| cross-cutting X2 | | | | | 1 (0/1/0), 10 rows | |

**Files passing: 0 of 7. Findings: 36** (2 H, 14 M, 20 L).

### The three most important findings

1. **Licenses of the incumbents builders are told to adopt were never checked, and three of them restrict use** (W1, B1, V1). A fresh read of the GitHub API on 2026-09-23 returns AGPL-3.0 for Firecrawl and SearXNG and SSPL-or-commercial for browserless. TEN Framework's license is Apache-2.0 with added conditions: no hosting on end-user devices and no use that competes with Agora. web-search-apis.md:30 goes further and says a license constraint on Firecrawl is "none … evidenced", which reports an unchecked item as absent. METHOD:19 names a quoted license clause as a hard constraint, and METHOD:9 allows the author to do this fresh read.
2. **sandbox-exec.md:12 says the Cloudflare Sandbox SDK is built on Firecracker, gVisor or Kata** (S1). The pack says the SDKs delegate isolation to "Firecracker microVMs / Workers isolate / Docker" (pack:65), so Cloudflare's SDK uses its own edge substrate. A builder would assume microVM-grade isolation that the evidence does not show. The same file misreads the capsule packet (S2): it says the packet names V8's sandbox as an incumbent "to try first", but the packet says a from-scratch engine "cannot borrow it".
3. **rl-envs.md presents its only wrap gap as fact and grades confidence Medium** (R1, R2). The gap rests on a claim the pack calls thin (pack:29) and the companion marks CONTESTED (pickup-rl-envs.md:62). METHOD rule 3 then requires Low. The bottom line says no repository has tests "aimed at" reward hacking. The pack says only that none ships tests "by that name", and names TRL's and OpenRLHF's reward tests as the closest.

## Mechanical citation check

Method: an inline Python script, not committed. It read each verdict file from `git show 36de0d4:stack/<file>` and extracted every `path:line "quote"` with a regex. That count equals the loose count of `.md:\d+` references in each file, so no citation was missed. For each quote it confirmed the file exists, the line exists, the quote is at least 20 characters, and the normalised quote is a substring of the normalised line (`*` and backticks removed, whitespace collapsed). The cited corpus files have no diff between 36de0d4 and the working tree.

| File | Citations | Missing file/line | Quote not on line | Quote < 20 chars |
|---|---|---|---|---|
| sandbox-exec | 49 | 0 | 0 | 0 |
| browser-use | 35 | 0 | 0 | 0 |
| computer-use | 30 | 0 | 0 | 0 |
| web-search-apis | 30 | 0 | 0 | 0 |
| fine-tuning | 35 | 0 | 0 | 0 |
| rl-envs | 29 | 0 | 0 | 0 |
| voice-agents | 33 | 0 | 0 | 0 |
| **Total** | **241** | **0** | **0** | **0** |

All 241 pass the mechanical check. The support findings below are a different failure: the quote is on its line, but it does not carry the fact the bullet asserts.

## Fresh read-only license check (reviewer, 2026-09-23)

Command: `gh api repos/<owner>/<repo> --jq '.license.spdx_id'`. Where GitHub returned NOASSERTION, the reviewer also ran `gh api repos/<owner>/<repo>/license --jq '.content|@base64d'`. These are the reviewer's reads. Per METHOD:9 the author must rerun them and cite them with date and command. They must not be copied into the verdicts as [Verified] on the reviewer's word.

| Repo | License | Relevance |
|---|---|---|
| firecrawl/firecrawl | AGPL-3.0 | web-search-apis:15, :30 |
| searxng/searxng | AGPL-3.0 | web-search-apis:17 |
| browserless/browserless | Dual: "MongoDB Server-Side Public License OR the browserless commercial license". The license text continues: "If you want to use browserless to build commercial sites, applications, or in a continuous-integration system that's closed-source then you'll need to purchase a commercial license." | browser-use:12, :18 |
| TEN-framework/ten-framework | Apache-2.0 "with the following additional conditions". Clause 1: "You may not (i) host the TEN Framework or the Derivative Works on any End User devices, including but not limited to any mobile terminal devices or (ii) Deploy the TEN Framework in a way that competes with Agora's offerings" | voice-agents:18, :30 |
| microsoft/OmniParser | CC-BY-4.0 (an unusual license for code) | computer-use:16 (informational only) |
| Permissive (no action needed) | e2b-dev/E2B, cloudflare/sandbox-sdk, firecracker, gvisor, kata, playwright-mcp, trl, unsloth, LlamaFactory, axolotl, litgpt, verl, livekit/agents, livekit/livekit, OSWorld, BrowserGym, webarena: Apache-2.0. browser-use, stagehand, cua, ScreenSpot-Pro, Gymnasium, PettingZoo, openai-agents-js, ServiceNow/eva, Mind2Web, tavily-python, exa-py, serpapi-python: MIT. pipecat: BSD-2-Clause. | |

---

## stack/sandbox-exec.md: FAIL (8 findings)

Verdict order: **Adopt and wrap is correct.** The process files were read (Firecracker security suites and E2B tests), so rule 1 (Watch) does not apply. Pack:65 states the gap in so many words: "A clean-room project should treat 'adversarial escape test suite' as a gap to fill". The wrapper gates named in the bottom line (threat model, pinning by hash, red-then-green confinement suite) close it. Confidence Medium is correct. Caveats: pack:65, :66, :67, :68, :70 and :71 all appear under "What we cannot say". Pack:69 (modal-labs) concerns nothing the verdict names.

- **S1 (M) :12**: "or an agent SDK built on one (E2B, Cloudflare Sandbox SDK)". "One" refers to Firecracker, gVisor or Kata. Pack:65 maps the SDK substrates as "(Firecracker microVMs / Workers isolate / Docker)", and pack:12 places Cloudflare "on Cloudflare's edge". No line puts the Cloudflare SDK on Firecracker, gVisor or Kata. **Fix:** replace with "or an agent SDK that delegates isolation to a substrate (E2B on Firecracker microVMs; Cloudflare Sandbox SDK on Cloudflare's own edge substrate)". Also add to the :19 Cloudflare bullet: (ecosystem/pickup/_evidence/sandbox-exec.md:65 "they delegate isolation to the substrate (Firecracker microVMs / Workers isolate / Docker)").
- **S2 (M) :29**: "Even then the FrankenSuite capsule packet names V8's sandbox and Wasm runtimes as the incumbents to try first." Neither cited line says "try first". Packet:151 says the opposite for the from-scratch-engine case: "FrankenEngine is not V8 and cannot borrow it". A builder with an engine of their own would go looking for a V8 sandbox they cannot use. **Fix:** "Even then, the capsule packet names V8's in-process sandbox as the deployed reference, which a from-scratch engine cannot borrow, and Wasm runtimes as the way to avoid running native code at all" (packets/franken_native_capsule-assessment.md:151 "FrankenEngine is not V8 and cannot borrow it"; packets/franken_native_capsule-assessment.md:152 "is to not run native code at all — run Wasm through a validated compiler").
- **S3 (L) :22**: "Run them red on the unhardened setup and green after." The cited pack lines (:26 to :28) describe Firecracker's tests. None describes a red/green cycle, which is the companion's gate. **Fix:** make the source explicit: "The companion adds a red-then-green requirement" (ecosystem/pickup/pickup-sandbox-exec.md:204 "A port that cannot demonstrate a red-then-green cycle fails the gate").
- **S4 (L) :24**: the heading "Cold start measured as A/B against a baseline" covers Cloudflare, whose daily scenarios (pack:41) are scheduled runs, not A/B comparisons. Firecracker's A/B pipeline (pack:39) covers performance tests in general, not cold start specifically. **Fix:** heading "Performance compared against a baseline, and run on a schedule". Body: "Firecracker's PR performance pipeline is configured as A/B comparisons against a baseline; Cloudflare schedules named cold-start, burst and backup-restore scenarios daily."
- **S5 (L) :30**: "gVisor is the evidenced non-microVM paradigm" is offered as the answer for hosts without KVM. Neither pack:15 nor companion:138 records gVisor's platform requirements. **Fix:** append "(the pack does not record whether gVisor needs KVM; check its platform options before relying on it)".
- **S6 (L) :34**: the bullet asserts "the test file's existence was verified at the pin", but the quote from franken_remote:134 carries only "the plan demands …". The plan clause is [Maintainer claim, Medium] in the packet. **Fix:** add (packets/franken_remote-assessment.md:134 "decoder_sandbox_escape.rs — existence verified at pin"). Tier the plan clause [Maintainer claim] and the file-existence clause [Verified], or split the bullet.
- **S7 (M) :33**: the capsule row omits the packet's own disavowal. Packet:143 warns that "Any downstream citation that presents this repo as a sandbox … is misrepresenting the source", and the row also omits that the repository ships no license. Both are needed in a sandbox verdict. **Fix:** append "Its README says the path 'establishes no production containment or performance claim', and the repository ships no license text." (packets/franken_native_capsule-assessment.md:143 "establishes no production containment or performance claim"; packets/franken_native_capsule-assessment.md:13 "It ships no license text, no CI, no releases").
- **S8 (L) :45**: the only "not observed running" caveat covers Firecracker's Buildkite (:42). Bullets :19, :24 and :26 describe Cloudflare's scheduled performance workflow and its merge-queue/privileged-PR split, and :18 describes E2B's per-SDK workflows, all as running. Per METHOD:9 a workflow file that exists is [Verified] only for existence. **Fix:** add to :45 "Workflow files (Cloudflare performance.yml, merge-queue.yml, pr-privileged.yml; E2B per-SDK workflows) were read as files; none was observed running" (ecosystem/pickup/_evidence/sandbox-exec.md:3 "All repos verified 2026-09-23 via api.github.com and raw file fetches").
- Rows :34 (franken_remote), :35 (franken_engine) and :36 (frankenlibc) also lack the rider. See X2.

## stack/browser-use.md: FAIL (4 findings)

Verdict order: **Adopt and wrap is correct.** The incumbents' configs were read. Rule 2 lists nondeterminism as a wrap gap, and pack:33 states it flatly ("Nobody I verified ships recorded LLM responses"). Confidence Medium is acceptable. Pack:32 calls flakiness evidence "thin", but the second gap (pack:33) is not labeled thin and on its own supports the wrap. Caveats: pack:32 to :37 are all carried.

- **B1 (H) :12, :18**: browserless is recommended as "the infrastructure layer you would otherwise have to build", with no license condition. Its LICENSE is SSPL or a commercial license, and it requires the commercial license for closed-source commercial use or closed-source CI (see the fresh-read table). A builder following :18 would violate it. **Fix:** the author reruns `gh api repos/browserless/browserless/license --jq '.content|@base64d'` and appends to :18: "Licensed SSPL or commercial; closed-source commercial or CI use needs the commercial license. [Verified] (fresh read 2026-09-23, gh api repos/browserless/browserless/license)". Replace ":43 Licenses were not in the pack" with "Licenses were not in the pack; a fresh read found browserless SSPL-or-commercial; the others named here were not checked by the pack."
- **B2 (L) :19**: "writing a private benchmark would cut you off from the numbers everyone else reports". None of the three cited quotes carries this. **Fix:** reword to "a private benchmark would not be comparable with the datasets active projects vendor" and cite (ecosystem/pickup/_evidence/browser-use.md:36 "still current as benchmark standards (vendored into active projects' test data)").
- **B3 (L) :26**: "so flaky agent runs can be replayed as evidence". This is a CDP screencast video. The bottom line (:12) says the missing piece is replay of model responses. A reader can take "replayed" as the deterministic rerun the verdict says nobody has. **Fix:** "…so a flaky run leaves a video to inspect (a recording, not a deterministic rerun)".
- **B4 (L) :39**: "the only mechanisms seen were per-test retries and evaluation lanes kept off the unit path". Pack:32 lists four "clearest concrete mechanisms", adding weekly browser-binary caching and Stagehand's `--preview`/Braintrust run diffing. **Fix:** "the clearest mechanisms seen were per-test retries, evaluation lanes kept off the unit path, weekly browser-binary caching and run diffing" (ecosystem/pickup/_evidence/browser-use.md:32 "weekly browser-binary caching (browser-use), and --preview/Braintrust run-diffing (stagehand)").

## stack/computer-use.md: FAIL (5 findings)

Verdict order: **Watch is correct.** Rule 1 applies: the agent stacks (UI-TARS-desktop, Agent-S) had no CI, tests or conformance read, and pack:37 says adoption is "unproven beyond benchmarks". Adopt and wrap would need a process-evidenced incumbent for the core object. The process-evidenced repos (cua, OSWorld) are infrastructure and benchmark, and the verdict correctly offers them only for experiments. Confidence Low is correct (companion:59 CLAIM-07 is T3/Low "thin"; pack:38 says the scores are self-reported). The withdrawn CLAIM-14 (commercial parity) is not reintroduced.

- **C1 (M) :21**: "an infeasible task scores only when the agent's last action is FAIL, which blocks gaming the benchmark by refusing everything." The mechanism credits an explicit FAIL on infeasible tasks, so stalling until timeout earns nothing (companion:56). It does not stop an agent from refusing everything: that is stopped by feasible tasks scoring zero on FAIL, which no cited line states. **Fix:** "an infeasible task scores 1.0 only if the agent's last action is an explicit FAIL, so running out the clock on an impossible task earns nothing" (ecosystem/pickup/pickup-computer-use.md:56 "refusal-by-timeout scores 0, which blocks reward-hacking by refusal").
- **C2 (M) :12, :36**: ":36 The agent products (UI-TARS-desktop, Agent-S) were checked for activity and README scores". Pack:7 (UI-TARS-desktop) says nothing about README scores, so the cited :7 quote does not carry the claim. Agent-S also had its directory and eval-config layout read (pack:29), and :23 of this verdict copies that as a practice. Separately, ":12 … not by process evidence" overstates. The rule-1 basis still holds, because tests, CI and conformance were not read. **Fix :36:** "UI-TARS-desktop was checked for activity only; Agent-S for activity, README scores and its directory and eval-config layout; neither for tests or CI" (keep the :10 citation; add ecosystem/pickup/_evidence/computer-use.md:29 "per-generation dirs keep old configs reproducible"). **Fix :12:** "…not by test, CI or conformance evidence".
- **C3 (L) :40**: "a third-party observation not re-verified by the pack". The cited pack:33 quote ("community practice visible in the wild") does not carry "not re-verified", but the companion does. **Fix:** add (ecosystem/pickup/pickup-computer-use.md:194 "is a third-party observation not independently re-verified this pass").
- **C4 (L)**, rule 6: pack:42 is a caveat on ScreenSpot-Pro, which :16 names, and it is not carried. **Fix:** add to "What we cannot say": "Only the ScreenSpot-Pro harness was verified; the original ScreenSpot repositories were dropped" (ecosystem/pickup/_evidence/computer-use.md:42 "the original ScreenSpot paper repo name variants are low-star forks and were dropped").
- **C5 (L) :15**: "a private benchmark would cut you off from the numbers the field reports". The support sits on pack:12 but outside the quote. **Fix:** add (ecosystem/pickup/_evidence/computer-use.md:12 "Anthropic's Computer Use, OpenAI CUA, academic papers all report on it").
- Rows :32 (frankenterm) and :33 (franken_remote) lack the rider. See X2.

## stack/web-search-apis.md: FAIL (5 findings)

Verdict order: **Adopt and wrap is correct.** Pack:36 and :42 name the missing relevance benchmark and latency budget as "a gap to fill", and Firecrawl's scoring is undocumented (pack:37). Confidence Medium is correct. Caveats: :36, :37, :40, :42 and :44 are carried. :38 is carried only in the Adopt section (W5). :39, :41 and :43 concern repositories the verdict does not name.

- **W1 (H) :30**: "building would need a constraint Firecrawl fails, such as its license or footprint, and none is evidenced." The license was never read (the verdict's own :40 says "Licenses and pricing were not in the pack"), so "none is evidenced" reports an unchecked item as absent. The fresh read gives Firecrawl AGPL-3.0 and SearXNG (:17) AGPL-3.0. A builder shipping a modified Firecrawl as a network service takes on AGPL source obligations, which is the class of constraint METHOD:19 names. **Fix :30:** "A key-free, self-hosted requirement alone does not justify building, because Firecrawl ships a self-host path. Firecrawl is AGPL-3.0 [Verified] (fresh read 2026-09-23, gh api repos/firecrawl/firecrawl --jq .license.spdx_id); a builder who cannot accept AGPL obligations for a modified network service has a license constraint to weigh, and a clean-room verdict would still need the clause quoted." Add "AGPL-3.0 (fresh read, same command)" to :17 (SearXNG). Change :45 from a future check into a present fact.
- **W2 (M) :23**: "run the self-hosted suite per backend so swapping providers is proven, not assumed". The only evidenced matrix has one search-backend value (pack:24: `searxng`, with Google disabled), so no incumbent demonstrates a provider swap. **Fix:** "Firecrawl's self-hosted suite already makes the search backend a matrix axis, with one value today (SearXNG; Google disabled); add a second backend so a provider swap is proven, not assumed" (ecosystem/pickup/_evidence/web-search-apis.md:24 "search backend searxng (google disabled)").
- **W3 (L) :12, :25**: the bottom line says live vendor APIs are "never … a requirement for a green build". That comes from the companion, uncited. Pack:25 calls live-endpoint CI "the right default", and the :25 practice (Exa's examples) runs against live APIs with keys (pack:27), so a builder gets contradictory advice. **Fix:** add to :25 "(against live APIs with keys; keep that lane out of the required build)" with (ecosystem/pickup/_evidence/web-search-apis.md:27 "run with EXA_API_KEY/OPENAI_API_KEY secrets against live APIs"; ecosystem/pickup/pickup-web-search-apis.md:35 "as oracles and never required for a green build").
- **W4 (M) :33**: "Its latency is receipted against its own budget" leaves out that the receipts come from a synthetic 1,000-document corpus on one machine. A builder will read 0.4 ms as a real-world figure. The row also omits the rider. **Fix:** append "on a 1,000-document synthetic corpus on one machine" (packets/frankensearch-assessment.md:13 "the receipts come from a 1,000-document synthetic corpus on one Threadripper") and apply X2 (packets/frankensearch-assessment.md:3 "MIT + OpenAI/Anthropic rider (non-OSI, rider quoted verbatim in §4.8)").
- **W5 (L)**, rule 6: the pack:38 caveat (SearXNG is not an agent API) appears only in the Adopt section (:17). Rule 6 requires it under "What we cannot say". **Fix:** add a clause there: "SearXNG returns search-results JSON for humans, not agent-ready answers" (ecosystem/pickup/_evidence/web-search-apis.md:38 "its API returns SERP-style JSON for humans").

## stack/fine-tuning.md: FAIL (6 findings)

Verdict order: **Adopt and wrap is correct.** The gap is cited (companion:352 UNK-03: no conformance oracle for DPO/GRPO correctness), and exact-loss goldens exist only in sunset torchtune (pack:74). Confidence Medium is correct. The withdrawn CLAIM-14 (torchtune as an active trajectory) is respected: torchtune is used for its process only and is labeled "no longer maintained".

- **F1 (M) :26**: "every Axolotl smoke test calls the config validator before training" is tiered [Verified], but pack:75 says only "one full e2e test file" was read. "Every" is the pack's extrapolation. The ":22 … per model family" also rests only on file names (pack:37). **Fix:** "the one Axolotl e2e test file the pack read calls validate_config and normalize_config before training; the pack did not read the others" (ecosystem/pickup/_evidence/fine-tuning.md:52 "calls validate_config(cfg) + normalize_config(cfg) before training"; ecosystem/pickup/_evidence/fine-tuning.md:75 "did not read every e2e test").
- **F2 (L) :12, :32**: "no conformance oracle … beyond 'it ran and the loss is finite'" rests on companion UNK-03. Pack:30 records a TRL `tests/invariant` directory that nobody read. **Fix:** add to "What we cannot say": "What TRL's tests/invariant directory asserts was not read" (ecosystem/pickup/_evidence/fine-tuning.md:30 "tests/ has matching dir layout (tests/distributed, tests/invariant, per-trainer files)").
- **F3 (L) :25**: "reruns tests only on network, timeout, gateway and out-of-memory errors, so genuine failures still block merges". The filter matches OSError, Timeout, HTTP 502/504 and OOM messages. OSError is broader than network, so some genuine failures are retried up to five times. **Fix:** "reruns a failing test up to five times only when its message matches OSError, Timeout, HTTP 502/504 or out of memory; other failures block merges" (ecosystem/pickup/_evidence/fine-tuning.md:61 "--reruns 5 only for OSError/Timeout/HTTP 502/504/OOM messages").
- **F4 (M) :37**: franken_whisper is listed under "Where FrankenSuite touches this", but it does no fine-tuning. The METHOD template asks what the project "does here". Its result-class rule is a practice, and presenting it as a fine-tuning contact misstates the corpus. **Fix:** move it to "Copy these practices" as "A speed win needs the incumbent run side by side, with its binary hash recorded. Starter kit: A2." (A2's origin line cites franken_whisper.) Keep the :114 citation. If no FrankenSuite rows remain besides frankentorch and frankenjax, that is fine.
- **F5 (L) :35**: "the packet's reading of it as a reproducible-training base is inference" is uncited. "the license rider bars AI labs" is carried only by the overview's `Rider` token, and it is imprecise. **Fix:** add (packets/frankentorch-assessment.md:299 "is the reproducible-training workload: an agent team fine-tuning models"). Replace "bars AI labs" with "bars OpenAI, Anthropic, their affiliates and anyone acting for them" (packets/frankentorch-assessment.md:102 "License rider bars OpenAI, Anthropic, affiliates, and anyone acting for them").
- **F6 (L)**, rule 6: pack:79 (Axolotl's organisation moved; LlamaFactory renamed) concerns two named incumbents and is not carried. **Fix:** one clause in "What we cannot say": "Both repositories moved or were renamed; the pointers use the live paths" (ecosystem/pickup/_evidence/fine-tuning.md:79 "LLaMA-Factory is now hiyouga/LlamaFactory (case-renamed)").
- Row :36 (frankenjax) lacks the rider, which :35 states for frankentorch. See X2.

## stack/rl-envs.md: FAIL (4 findings)

Verdict order: **Adopt and wrap is defensible, but its basis is weak as written.** The cited gap line (pack:29) frames the gap as something the new project "could own", which reads as an opportunity, not a gap the adopter must close. Strengthen the basis with companion:150 (UNK-2: "None of the six repos ships one by that name") and the unresolved determinism coverage for RLHF trainers (companion:152, "where stochasticity is load-bearing"). Rule 2 lists nondeterminism as a wrap gap. Caveats: pack:26 to :29 are all carried.

- **R1 (M) :12**: "no repository in the evidence has tests aimed at reward hacking". Pack:29 says none "by that name", and names the closest: OpenRLHF's reward-shaping/KL-gradient tests and TRL's `tests/test_rewards.py`. The companion marks this claim CONTESTED ("exhaustive-negative claim from six-repo tree scan"). **Fix :12:** "no repository in the evidence ships tests named as reward-hacking checks; the closest are reward-shaping and reward unit tests, and the companion itself marks this finding contested". Add to :38 (ecosystem/pickup/_evidence/rl-envs.md:29 "the closest is reward-shaping/KL-estimator gradient testing (OpenRLHF) and reward unit tests (TRL tests/test_rewards.py)"; ecosystem/pickup/pickup-rl-envs.md:62 "thin: exhaustive-negative claim from six-repo tree scan").
- **R2 (M) :6, :12**: confidence. METHOD rule 3 says "Low when the pack says the evidence is thin". Pack:29 says "Evidence for a dedicated anti-reward-hacking test category is thin", and that is the only gap turning Adopt into Adopt and wrap. Companion:55 and :56 also mark the conformance and seeding practices "thin: 2 of 6 repos". This differs from browser-use, whose second gap is not thin. **Fix:** set `confidence: Low` and change the bottom line to "Inference, low confidence: …".
- **R3 (L) :17**: "PPO, DPO, GRPO and RLOO trainers with one test file per trainer". Pack:19 lists test files for DPO, GRPO, RLOO and SFT, and none for PPO. **Fix:** "…with per-trainer test files (DPO, GRPO, RLOO, SFT) and a fast/slow CI split" (ecosystem/pickup/_evidence/rl-envs.md:19 "huggingface/trl:tests/test_dpo_trainer.py, test_grpo_trainer.py, test_rloo_trainer.py, test_sft_trainer.py").
- **R4 (L) :21**: "its own CI runs it over every registered environment". Pack:16 shows a test file that runs the checker, and CI invoking that file was not observed (METHOD:9). **Fix:** "its test suite runs it over every registered environment" (ecosystem/pickup/_evidence/rl-envs.md:16 "tests/envs/test_env_implementation.py (runs checker over every registered env)").
- Row :35 (frankentorch, "an RL trainer could sit on") lacks the rider, which fine-tuning.md:35 states. See X2.

## stack/voice-agents.md: FAIL (3 findings)

Verdict order: **Adopt and wrap is correct.** Pack:36 says "Latency is tested, not gated", and companion:428 says interruption thresholds have no incumbent ground truth. Confidence Medium is correct. Caveats: pack:35 to :37 are carried. :38 and :39 concern repositories the verdict does not name.

- **V1 (M) :18, :30**: TEN-framework is offered as an alternative with no license note. Its license adds conditions to Apache-2.0: no hosting "on any End User devices, including … mobile terminal devices", and no deployment "that competes with Agora's offerings" (fresh read). :30 then routes on-device speech needs to "an incumbent's provider interface", which TEN's license forbids for TEN. **Fix :18:** append "its license adds conditions to Apache-2.0: no hosting on end-user devices and no deployment that competes with Agora [Verified] (fresh read 2026-09-23, gh api repos/TEN-framework/ten-framework/license)". **Fix :30:** "…plugged into Pipecat's or LiveKit Agents' provider interface (not TEN's, whose license bars hosting on end-user devices)".
- **V2 (M) :34**: franken_whisper's comparison refusal is called "the kind of latency gate the voice frameworks above lack". The refusal is a ledger doctrine applied to a manual campaign. The overview row this bullet already cites puts the project's CI at C4, "no test CI / deploy-only". A builder would read "gate" as automated. **Fix:** "…which is the comparison discipline the voice frameworks above lack; it is applied in the project's ledger, not in CI" (synthesis/00-overview.md:86 "franken_whisper | 5–6 | Explore | Rider | 1 | no | C4"; synthesis/00-overview.md:58 "C4 no test CI / deploy-only"). Apply X2 (packets/franken_whisper-assessment.md:15 "License (MIT + OpenAI/Anthropic rider, read verbatim)").
- **V3 (L) :12**: "in both, latency is measured by tests and never gated" turns a not-found into a fact. "test them with fake providers and a virtual clock" credits both frameworks with practices evidenced only for LiveKit Agents (pack:18, :22). **Fix:** "LiveKit Agents tests them with fake providers and a virtual clock … no latency regression gate was found in either" (ecosystem/pickup/_evidence/voice-agents.md:36 "I did not find a published time-to-first-audio benchmark dashboard or regression gate in either repo"). While there, make the :33 rider wording precise (packets/franken_tts-assessment.md:16 "License (MIT + OpenAI/Anthropic rider, read verbatim)"; name OpenAI, Anthropic and anyone acting for them instead of "AI labs").

## Cross-cutting

- **X1** (tracked in B1, W1 and V1, not counted again): incumbent licenses. Every file honestly says licenses were not in the pack. But in three files a restrictive license belongs to an incumbent the Adopt section presents without conditions. Fix each as above. Other incumbents came back permissive in the fresh read (see table), so no further license lines are needed.
- **X2 (M), rider and missing license on FrankenSuite rows**: the same author states the rider for frankentorch (fine-tuning:35) and franken_tts (voice:33). The rows below do not, although several point builders at code to copy or build on. The overview quote each row cites contains the `Rider` token, but the prose never explains it. Rows: sandbox-exec :34 franken_remote, :35 franken_engine, :36 frankenlibc; computer-use :32 frankenterm, :33 franken_remote; web-search-apis :33 frankensearch; fine-tuning :36 frankenjax; rl-envs :35 frankentorch; voice-agents :34 franken_whisper; plus sandbox-exec :33 capsule (no license text, S7). **Fix:** append "license: MIT with a rider barring OpenAI, Anthropic and anyone acting for them" with the packet's license line:
  - franken_remote: (packets/franken_remote-assessment.md:21 "the license rider names OpenAI and Anthropic as Restricted Parties")
  - franken_engine: (packets/franken_engine-assessment.md:3 "MIT License (with OpenAI/Anthropic Rider)")
  - frankenlibc: (packets/frankenlibc-assessment.md:3 "MIT + OpenAI/Anthropic rider (non-OSI; see §4.8)")
  - frankenterm: (packets/frankenterm-assessment.md:17 "License (MIT + OpenAI/Anthropic rider, read verbatim)")
  - frankensearch: see W4
  - frankenjax: (packets/frankenjax-assessment.md:21 "the license rider bars OpenAI/Anthropic and their agents from even")
  - frankentorch: see F5
  - franken_whisper: see V2
  - The browser-use website rows (:34, :35) and rl-envs :33 and :34 are optional, because the verdicts do not point builders at their code.

## FrankenSuite fairness check (point 5)

The TRL and NODUS ring in every row match synthesis/00-overview.md: capsule 3–4/Explore, franken_remote 3–4/Explore, franken_engine 4–5/Explore, frankenlibc 4/Explore, franken_markdown_website 8/Monitor, frankentui_website 9/Monitor, frankenterm 7/Explore, frankensearch 5–6/Explore, frankentorch 4/Explore, frankenjax 4/Explore, franken_whisper 5–6/Explore, franken_alignment 3/Explore, frankensim 4/Explore, franken_tts 7/Explore. The descriptions are otherwise fair. frankenlibc is correctly marked as analyst inference. franken_engine is correctly tiered [Maintainer claim]. franken_tts's real-time figure is correctly qualified with the loaded-run numbers. franken_alignment's stale description is correctly called out. The exceptions are S7, W4, F4, V2 and X2.

## Not reviewed / limits

- The site renderer (`site/scripts/make-stack.mjs`, untracked) and how it maps starter-kit ids to titles (METHOD rule 8) were not reviewed.
- Gate K was not run. The mechanical check above reimplements only its quote-on-line rule.
- The fresh license reads above are the reviewer's own and were not re-verified by a third party.
- Evidence levels used in this review: the mechanical check is a script run (N=241 citations, 7 files, 2026-09-23, at 36de0d4); the support, order, confidence and caveat findings are the reviewer's reads of the cited lines ([Inference] where they judge wording); the license facts are GitHub API responses (36 repos, 2026-09-23).
- Not run: no clones, installs, tests, benchmarks or CI observation for any incumbent or FrankenSuite project; no re-reading of packets beyond the lines cited or quoted here.

---

## Re-check at 0eb4488 (2026-09-23)

Scope: I re-read all seven files at 0eb4488, METHOD v3 rule 9 (stack/METHOD.md:79, from f55db78), and stack/licenses.tsv (b5eb9d8, plus 05de96d, which changed only the zep row). The seven files at 0eb4488 match the working tree, and so do the corpus files they cite.

### Mechanical check (rerun)

The same inline script, with fresh variables, run on `git show 0eb4488:stack/<file>`. **All 295 citations pass:** file and line exist, quote is at least 20 characters, and the normalised quote is on its line. Per file: sandbox-exec 59, browser-use 39, computer-use 41, web-search-apis 37, fine-tuning 46, rl-envs 35, voice-agents 38. The regex count equals the loose `.md|.tsv:\d+` count in every file. Every citation my first report asked for was checked by substring and is present (54 of 54).

### Rule 9 coverage

Every `owner/repo` named under "Adopt, do not rebuild" in the seven files (36 repos) has a row in stack/licenses.tsv. Seven of them are classed as non-permissive (browserless `source-available`; firecrawl and searxng `network-copyleft`; cua, unsloth, axolotl and TEN `permissive-with-conditions`; OmniParser is classed `permissive`), and each of those seven names its license in the Adopt bullet:

- browserless: SSPL-1.0 or commercial
- cua: `libs/python/som` is AGPL-3.0
- Firecrawl and SearXNG: AGPL-3.0
- Unsloth: Studio UI and `unsloth/kernels/moe/` are AGPL-3.0
- Axolotl: the Community License on `src/axolotl/integrations/`
- TEN: Apache-2.0 plus added conditions

Every file's "Build only if" section now says whether license could justify building. The license facts in the verdicts agree with the tsv rows and with my own reads from 2026-09-23. The OmniParser CC-BY-4.0 line agrees with `gh api repos/microsoft/OmniParser` as I read it.

### Status of the 36 findings

| Finding | Status | Where fixed |
|---|---|---|
| S1 | fixed | :12, :19 (Cloudflare on its own substrate, cites pack:65) |
| S2 | fixed | :29 (cites packet:151 "cannot borrow it") |
| S3 | fixed | :22 (red-then-green attributed to the companion, cites :204) |
| S4 | fixed | :24 (heading and body reworded) |
| S5 | fixed | :30 (gVisor/KVM caveat added) |
| S6 | fixed | :34 (tier split; cites packet:134 on the file's existence) |
| S7 | fixed | :33 (disavowal and no-license, cites :143 and :13) |
| S8 | fixed | :45 (workflows read as files, cites pack:3) |
| B1 | fixed | :12, :18 (Adopt bullet), :32 (Build only if), :44 |
| B2 | fixed | :19 (cites pack:36) |
| B3 | fixed | :26 |
| B4 | fixed | :40 (cites pack:32) |
| C1 | fixed | :21 (cites companion:56) |
| C2 | fixed | :12, :39 (cites pack:29) |
| C3 | fixed | :43 (cites companion:194) |
| C4 | fixed | :44 (cites pack:42) |
| C5 | fixed | :15 (cites pack:12) |
| W1 | fixed | :12, :15, :17, :30, :45 |
| W2 | fixed | :23 |
| W3 | fixed | :12, :25 |
| W4 | fixed | :33 |
| W5 | fixed | :40 |
| F1 | fixed | :22, :26 |
| F2 | fixed | :45 |
| F3 | fixed | :25 |
| F4 | fixed | moved to Copy :29, Starter kit A2 |
| F5 | fixed | :37 |
| F6 | fixed | :46 |
| R1 | fixed | :12, :38 |
| R2 | fixed | `confidence: Low`; bottom line says "low confidence" |
| R3 | fixed | :17 |
| R4 | fixed | :21 |
| V1 | fixed | :18 (TEN has its own bullet), :30, :32 |
| V2 | fixed | :34 (cites overview :86 and :58) |
| V3 | fixed | :12, :33, :38 |
| X2 | fixed | Rider stated on every required row, citing packet license lines. rl-envs franken_alignment and frankensim cite only the overview `Rider` token, which I had marked optional. |

**36 of 36 fixed.** The rl-envs basis also now cites companion:150 and :152, as I recommended.

### New findings in the changed bullets

All four are Low and none blocks sign-off (my standard: H and M block, L is recommended).

- **N1 (L) browser-use.md:32.** The bullet says running browsers under "Playwright (Apache-2.0 in the same fresh read)". The author's read and the tsv row cover `microsoft/playwright-mcp`, not the Playwright library, so whether the author read `microsoft/playwright` is UNVERIFIED. My own read today (`gh api repos/microsoft/playwright --jq .license.spdx_id`) returns Apache-2.0, so the fact is true; only the provenance claim is wrong. **Fix:** cite the read of `microsoft/playwright` with its command, or say "Playwright MCP".
- **N2 (L) web-search-apis.md:30.** This bullet says AGPL "could justify building". It does not name the adoption paths that still avoid AGPL:
  - the commercial APIs through their MIT SDKs
  - Jina Reader, Apache-2.0, for extraction
  - Firecrawl's own SDKs, which are MIT (licenses.tsv:27 note)
  - running Firecrawl unmodified

  **Fix:** add one clause naming them, so the bullet cannot be read as advice to build.
- **N3 (L) fine-tuning.md:16.** The Unsloth bullet says "shipping those parts inside a network service triggers AGPL source obligations". The AGPL network clause applies to modified versions offered over a network, which is how the Firecrawl and cua bullets word it. **Fix:** "running a modified copy of those parts in a network service, or distributing them, triggers AGPL source obligations."
- **N4 (L) computer-use.md:16.** The OmniParser tsv row notes that the README badge says MIT while LICENSE is CC-BY-4.0, and that "Earlier Ultralytics-based icon detectors retain their original AGPL license" (licenses.tsv:56). The bullet already says "read its terms", but it should name the AGPL on the older detector weights.

### Result

All seven files pass: every original finding is fixed, and no H or M finding is open. I signed all seven with `reviewed_by: ReviewTools` and `review_date: 2026-09-23`. N1–N4 remain open as recommendations for the author.

What this re-check did not do:
- Gate K was not run.
- No incumbent was cloned, installed or tested.
- The license facts rest on the author's tsv rows, cross-checked against my own GitHub API reads from 2026-09-23 (36 repos in the first pass, plus `microsoft/playwright` in this one).

## Re-check of N1–N4 at 4976010 (2026-09-23)

- **N1: fixed.** browser-use.md:32 now cites `gh api repos/microsoft/playwright --jq .license.spdx_id`. My own read of that repo returns Apache-2.0.
- **N2: fixed.** web-search-apis.md:30 now names the AGPL-free adoption paths before the build option:
  - the commercial APIs through their MIT SDKs
  - Jina Reader, Apache-2.0
  - Firecrawl's MIT SDKs, cited to licenses.tsv:27
  - running Firecrawl unmodified
- **N3: fixed.** fine-tuning.md:16 now reads "running a modified copy of those parts as a network service, or distributing them".
- **N4: fixed.** computer-use.md:16 now covers the MIT badge and the AGPL on the older detector weights, cited to licenses.tsv:56.

The quote check at 4976010 found no failures in the four edited files (browser-use 39, web-search-apis 38, fine-tuning 46, computer-use 42 citations). I re-signed those four files in b6a0c20 (4 files, 8 insertions; the pre-commit hook passed). sandbox-exec, rl-envs and voice-agents keep their signatures from d263aa8.
