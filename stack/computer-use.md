---
type: computer-use
title: Computer-use agents
group: Tools and environment
verdict: Watch
confidence: Low
evidence_date: 2026-09-23
author: VerdictsTools
---

## Bottom line
Inference, low confidence: watch computer-use agents (software that operates a desktop from screenshots, keyboard and mouse) and do not commit a product to one agent stack yet. The agent stacks you would adopt are evidenced by activity and by benchmark scores their own READMEs report, not by process evidence, and the category is mostly research code. If you experiment now, use the existing benchmark harness, grounding evaluation and VM infrastructure rather than building your own, and score the machine's end state, never the agent's own account of what it did.

## Adopt, do not rebuild
- **xlang-ai/OSWorld**: the desktop-agent benchmark of 369 tasks in real Ubuntu and Windows VMs, scoring VM state rather than chat; a private benchmark would cut you off from the numbers the field reports. [Verified] (ecosystem/pickup/_evidence/computer-use.md:12 "NeurIPS 2024 benchmark of 369 tasks in a real Ubuntu/Windows desktop VM"; ecosystem/pickup/_evidence/computer-use.md:22 "State-based evaluation (score VM state, not chat)")
- **likaixin2000/ScreenSpot-Pro-GUI-Grounding and microsoft/OmniParser**: the grounding layer (turning a screenshot into located UI elements) and its accuracy protocol; use them to measure grounding instead of inventing a metric. [Verified] (ecosystem/pickup/_evidence/computer-use.md:9 "parse screenshot into structured UI elements"; ecosystem/pickup/_evidence/computer-use.md:28 "Grounding accuracy eval script (ScreenSpot protocol)")
- **trycua/cua**: cross-OS VM infrastructure for computer-use training, evaluation and data generation, with a benchmark library built and tested in CI; the VM fleet you would otherwise stand up yourself. [Verified] (ecosystem/pickup/_evidence/computer-use.md:8 "Cross-OS (macOS/Windows/Linux/Android) VM-based computer-use infra"; ecosystem/pickup/_evidence/computer-use.md:26 "Benchmark harness as a first-class library with CI")

## Copy these practices
- **Score the machine, not the transcript**: OSWorld evaluates the VM's end state through getter functions that read state and separate metric functions that score it. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/computer-use.md:22 "State-based evaluation (score VM state, not chat)")
- **Infeasible tasks that must be refused explicitly**: an infeasible task scores only when the agent's last action is FAIL, which blocks gaming the benchmark by refusing everything. Starter kit: A10. [Verified] (ecosystem/pickup/_evidence/computer-use.md:24 "prevents reward-hacking by refusal")
- **Pin the benchmark commit in every run manifest**: a run recorded without the exact harness commit cannot be compared after the harness moves. Starter kit: A2. [External] (ecosystem/pickup/_evidence/computer-use.md:33 "record the exact benchmark commit in every run manifest — prevents silent harness drift")
- **One directory per agent generation, each with its own eval config**: Agent-S keeps S1 through S3 and their OSWorld setups side by side so older results stay reproducible. Starter kit: B3. [Verified] (ecosystem/pickup/_evidence/computer-use.md:29 "Multi-generation agent structure with versioned eval configs")
- **Per-task JSON configs**: each task carries its instruction, setup and evaluator, so tasks are portable across harnesses. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/computer-use.md:23 "Per-task JSON configs (instruction + setup + evaluator)")
- **Scheduled live smoke tests of the VM fleet**: cua runs periodic live-environment smokes to catch infrastructure drift that unit tests miss. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/computer-use.md:32 "Live infra smoke tests (fleets)")

## Build only if
- A Windows-first project may have to invest in harness work itself: the Windows benchmark shows thinner maintenance than OSWorld and one of its container pointers failed verification. That is harness investment, not a reason to build an agent stack. [Verified] (ecosystem/pickup/_evidence/computer-use.md:39 "WindowsAgentArena is the thinner half."; ecosystem/pickup/_evidence/computer-use.md:41 "WindowsAgentArena tree listing failed")
- Otherwise no hard constraint is evidenced; a new desktop benchmark or VM fleet would duplicate OSWorld and cua. [Inference] (ecosystem/pickup/_evidence/computer-use.md:12 "NeurIPS 2024 benchmark of 369 tasks in a real Ubuntu/Windows desktop VM"; ecosystem/pickup/_evidence/computer-use.md:8 "Cross-OS (macOS/Windows/Linux/Android) VM-based computer-use infra")

## Where FrankenSuite touches this
- No FrankenSuite packet builds a screenshot-driven desktop agent. frankenterm controls fleets of coding agents through terminal panes (Robot Mode API, MCP surface, policy-gated actions), a text channel rather than pixels, for terminal work. TRL 7, Explore. [Verified] (packets/frankenterm-assessment.md:9 "a WezTerm-derived terminal runtime (absorbed in-tree, September 2026) plus an agent-swarm control plane"; synthesis/00-overview.md:102 "frankenterm | 7 | Explore | Rider")
- franken_remote is a remote-workstation daemon and client with a screen capture and media pipeline, the kind of substrate a desktop agent would drive; it has no complete application and no hardware-qualified capture path yet. TRL 3–4, Explore. [Maintainer claim] (packets/franken_remote-assessment.md:19 "A Tailscale-identity-based remote workstation"; packets/franken_remote-assessment.md:19 "no hardware-qualified capture/codec path"; synthesis/00-overview.md:81 "franken_remote | 3–4 | Explore | Rider")

## What we cannot say
- Whether any agent stack works outside benchmarks: the category is research-heavy and adoption is unproven (ecosystem/pickup/_evidence/computer-use.md:37 "adoption of any single agent stack is unproven beyond benchmarks"). The agent products (UI-TARS-desktop, Agent-S) were checked for activity and README scores, not for tests or CI (ecosystem/pickup/_evidence/computer-use.md:7 "A native GUI-agent desktop app + agent stack (Agent TARS)"; ecosystem/pickup/_evidence/computer-use.md:10 "README reports OSWorld/WindowsAgentArena scores").
- Benchmark percentages on READMEs are self-reported (ecosystem/pickup/_evidence/computer-use.md:38 "self-reported and deserve discounting"), and a small eval set drawn from the full set is a cherry-picking risk (ecosystem/pickup/pickup-computer-use.md:196 "a small eval set drawn from the full set is a cherry-picking risk surface").
- OSWorld's own quality control is not visible as CI (ecosystem/pickup/_evidence/computer-use.md:40 "OSWorld itself has no GitHub CI visible"); cua's workflows were read as a listing, which shows they exist, not that they pass.
- The Windows half is thinner and partly unverified (ecosystem/pickup/_evidence/computer-use.md:39 "no visible CI workflows in its .github/ listing beyond default"; ecosystem/pickup/_evidence/computer-use.md:41 "treat that single pointer as unverified").
- The benchmark-pinning practice is a third-party observation not re-verified by the pack (ecosystem/pickup/_evidence/computer-use.md:33 "community practice visible in the wild"). Licenses were not in the pack; stars measure popularity.

## Revisit when
- An independent party reproduces an agent stack's OSWorld or OSWorld-V2 score from a pinned harness commit.
- A computer-use agent product publishes its test and CI evidence, or is deployed by someone other than its maker.
- WindowsAgentArena resumes maintenance or is archived; revisit six months after 2026-09-23 either way.
