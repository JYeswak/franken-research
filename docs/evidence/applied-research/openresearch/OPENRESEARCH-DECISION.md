# Applied decision: alphaXiv/OpenResearch

29 September 2026 UTC. Exact inspected commit: `7cc3251d91eca4e98b5e4edd7d4b85f5decb2902`, package version 0.2.12. Public repository: https://github.com/alphaXiv/OpenResearch . MIT LICENSE and Cargo metadata agree. Source clone is inspection-only; no FR production edits, model calls, install, publication, or paid compute.

**Decision: defer installing OpenResearch for FR's missing recurring analyst. Keep the current agent + FR, and retain the already-prepared GPTR arm for a real source/report-quality gap. Do not build another research engine.** OpenResearch is a credible adopt candidate for a different, concrete need: managing several executable experiment branches and their compute runs. Today's work did not demonstrate that need or any gain in accepted decisions per human hour. It supplied an actual tested boundary on its experiment evidence and rejected a tempting no-install literature shortcut in this environment.

## What the code actually does

Its existing coding agent does the reasoning. `src/local/harness/codex.rs` launches a Codex app-server session (legacy exec fallback); `src/local/opencode.rs:ensure_playbook` creates a session worktree and injects the playbook and skills. The alternative local-model path requires OpenCode plus an existing tool-capable LM Studio/oMLX/Ollama or OpenAI-compatible server. It does not supply a new model or free inference. Managed compute requires account/token and resources; the ordinary local project/run path does not. CLI Rust dependencies include Tokio, Reqwest, bundled SQLite, Axum and PTYs. Desktop Linux dependencies are optional. Rust was unavailable on PATH here, and building/installing the product was unnecessary for this decision.

The concrete compute path is `orx exp run` → `compute::submit`/`SourceSnapshot::create` → resolve experiment branch SHA → `git archive --format=tar <revision>` → SHA-256-addressed payload → local adapter → extracted run directory → recorded command → detached supervisor. `SourceSnapshot::from_run` checks retained archive digest/size. `local/localrun.rs` records commit and source descriptor but runs in the machine's current environment. Code snapshots do not freeze interpreter, libraries, downloaded data or all runtime environment. The skill asks agents to keep environment and command constant; that instruction is not itself enforcement.

The default paper path is also specific: `commands/paper.rs` detects source, then for alphaXiv fetches a generated `/overview/<id>.md` report, falling back to `/abs/<id>.md` only on a 404. `--full` goes directly to `/abs/<id>.md`; linked GitHub metadata is best effort. OpenAlex/bioRxiv/PubMed paths expose metadata/abstract, not extracted full text. `client.rs:fetch_paper_markdown` propagates non-success statuses other than 404. A convenient `orx paper` response must not automatically be classified as primary full-text evidence.

`commands/discover.rs` and the literature skill expose direct public search primitives; the main coding agent still ranks results, reads evidence and decides follow-ups. This can complement FR, but it is not a completed scheduler-to-accepted-research loop. The `--scheduler` occurrence inspected in the CLI concerns live Slurm accounting, not daily investigative work. We did not establish a recurring daily analyst in this product.

## Executed screen and counterexample

`TRIAL-PREDECLARED.md` was written before requests; its offline extension was written before the snapshot probe. The primary metric was accepted useful outcomes per total human hour. Its baseline and review denominator remain unknown. No speedup is calculated.

1. **Literature capability:** requested versioned full-text Markdown for the already-relevant AgentRxiv (`2503.18102v1`) and GEPA (`2507.19457v2`) papers, plus nonexistent `0000.00000v1`. All three returned HTTP 403, after 6.173, 4.271 and 4.005 seconds respectively. A web retrieval attempt also reported the positive and negative URLs inaccessible. This establishes an access failure here, not that the papers lack text or that alphaXiv globally fails. The invalid-id condition is inconclusive because access failed before differentiated content behavior. No body/title/primary-passage acceptance check could pass; **zero accepted full-text acquisitions**. Do not install orx hoping to cure an unexplained endpoint block.
2. **Offline positive path:** `snapshot-probe.py` reads the pinned source, extracts the exact `snapshot_script` shell template, runs its `git archive`/tar/bash recipe on a temporary repository, and executes a real two-input evaluator. Committed values 2+3 returned **5**, exit 0, despite the live working copy containing 999. That verifies useful isolation from uncommitted worktree changes at this primitive boundary.
3. **Offline counterexample:** for the *same commit*, a local `.git/info/attributes` rule `data.txt export-ignore` changed the archive digest and removed the evaluator's committed input. The same command failed with **FileNotFoundError**, exit 1. Therefore a commit ID alone is not enough to recreate this run source; retain the actual archive/digest. This is not a claim that OpenResearch promises hash-identical archives from commit alone: its retained digest is a good design. It is an experimentally demonstrated limit on reading “immutable recorded commit” as a complete repository/environment contract.

The whole offline probe took 0.1175 seconds here, excluding setup, investigation and review. That is fixture execution time, not researcher productivity. This is a primitive-level reproduction of its actual command template, **not execution of compiled orx**, model inference, store writes or run supervision. No quality comparison was performed.

## Tests and limits inspected

Upstream CI specifies Rust format, Clippy, locked build, tests, UI typecheck/unit tests and bundle consistency. `commands/paper.rs` includes tests for source detection, version/citation/old-style identifier parsing, disabled sources and the 404 fallback condition. `compute.rs` tests inspected cover SSH option precedence and Tinker capability/option rejection. Their presence is not evidence that the full suite passes at this pin; we did not run it. We chose the bounded source-execution probe because it answered a material claim without installing dependencies, rather than run unrelated UI tests to raise a check count.

## Compare with what already exists

| Choice | Incremental capability | Present blocking fact | Action now |
|---|---|---|---|
| Current agent + FR | Already performs source search, code inspection and bounded execution; FR preserves findings and triggers | Daily analyst assignment/execution remains missing; today's investigation is one real manual use | Keep and use; adopt this candidate rejection as a real decision, pending owner review |
| Prepared GPTR | Existing query-to-report wrapper with captured sources/context/cost information | Previous actual preflight: no Ollama server, no B report; source/report-quality superiority unmeasured | Retain prepared arm; do not write another wrapper |
| OpenResearch | Existing agent workspaces, experiment tree, committed archives, local/remote run supervision and literature commands | Same reasoning-agent requirement; no demonstrated recurring accepted FR outcome; full-text endpoint inaccessible here | Defer installation; revisit when multi-branch experiments are a measured operational bottleneck |

The recurring practice worth using immediately is narrow: when comparing executable upstream methods, execute the archived evaluator and its required inputs, retain archive identity, and test at least one material failure condition. For literature retrieval, explicitly distinguish generated overview from extracted full text and handle unavailable endpoints as unavailable. These practices fit the current agent/FR; they do not justify a new framework, scheduler, or validator platform. This is candidate research with an actionable stop decision, not evidence of a functioning daily learning service or a 1000× breakthrough.

## Runnable contribution and sources

Run `python3 snapshot-probe.py` from this directory; it uses only Python, git, tar and bash, reads the pinned clone and removes its temporary repository. It writes `snapshot-results.json`. If the inspection clone is absent, obtain the exact source first:

```sh
git clone https://github.com/alphaXiv/OpenResearch.git openresearch-inspect
git -C openresearch-inspect checkout 7cc3251d91eca4e98b5e4edd7d4b85f5decb2902
python3 snapshot-probe.py
```

This contribution makes the candidate's execution assumption reviewable now; it is not a production integration. `source-manifest.json` identifies the source bytes used. Inspect these immutable primary locators:

- https://github.com/alphaXiv/OpenResearch/blob/7cc3251d91eca4e98b5e4edd7d4b85f5decb2902/src/compute.rs
- https://github.com/alphaXiv/OpenResearch/blob/7cc3251d91eca4e98b5e4edd7d4b85f5decb2902/src/local/localrun.rs
- https://github.com/alphaXiv/OpenResearch/blob/7cc3251d91eca4e98b5e4edd7d4b85f5decb2902/src/commands/paper.rs
- https://github.com/alphaXiv/OpenResearch/blob/7cc3251d91eca4e98b5e4edd7d4b85f5decb2902/src/client.rs
- https://github.com/alphaXiv/OpenResearch/blob/7cc3251d91eca4e98b5e4edd7d4b85f5decb2902/src/local/harness/codex.rs
- https://github.com/alphaXiv/OpenResearch/blob/7cc3251d91eca4e98b5e4edd7d4b85f5decb2902/docs/local-models.md
- https://github.com/alphaXiv/OpenResearch/blob/7cc3251d91eca4e98b5e4edd7d4b85f5decb2902/LICENSE
- https://github.com/alphaXiv/OpenResearch/blob/7cc3251d91eca4e98b5e4edd7d4b85f5decb2902/.github/workflows/ci.yml

The GPTR comparator status above comes from the existing weekly_research pilot, not a new trial in this change. No quality comparison or accepted human-time benefit was measured.
