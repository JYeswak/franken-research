# Daily executable research candidates

The daily acquisition watch measures upstream changes. `research-candidate.md`
adds a bounded cloud Codex worker that turns one concrete learning/application
need into runnable code and a draft PR. It does not auto-accept research or merge.
One open candidate pauses further runs; merging or closing it resumes the queue.

The workflow needs a repository `CODEX_API_KEY` or `OPENAI_API_KEY`. No key is
embedded, fabricated or borrowed. Absent a key the hosted worker fails visibly;
compilation and sandbox controls do not establish an actual model execution.
The engine timeout is 20 minutes. Upstream job limits remain 60 minutes for the
agent, 10 for detection and 45 for publication. Explicit agent limits are 500 AI
credits/run and/day, with 100 for detection. Credits are upstream accounting,
not a USD price promise. Prepaid inference still consumes resources.

## What the worker may deliver

Only new mode-100644 files under one `probes/daily-candidates/<slug>/` directory,
at most 20 files/256 KiB: baseline/candidate Python stdlib code, author-authored
assertions, two public fixtures, pinned sources/license, exact commands and
observed execution evidence, plus a recipe explaining application and limits.
The publisher refuses paths outside the candidate directory tree, including
production, workflow/evaluator code, accepted recipes, Beads and acceptance records.
The evaluator additionally rejects modifications of earlier candidate files or
changes spread across multiple candidate directories. Safe outputs enforce a draft PR and exclusive path
allowlist; prompt text is not the sole control. External text is untrusted data.

`research-candidate-evaluate.yml` follows the cloud workflow because PRs created
with `GITHUB_TOKEN` do not automatically trigger ordinary PR CI. It resolves only
this same-repo workflow's bot-created draft PR with its run URL, validates new
candidate paths, fetches exact Git objects, and extracts regular blobs without
checkout filters/hooks. A separate read-only job runs both implementations and
author tests in fresh, no-network containers with no host credentials, no Docker
socket mount, read-only input, dropped capabilities, no new privileges, CPU,
memory, process, time and host-output limits. Results bind the exact candidate SHA.
Raw output is captured as artifacts, never interpreted as workflow commands.

A successful evaluator means **author-authored execution reproduced**. It does
not validate the author's oracle, semantic truth, general transfer, human time,
or 100x VALUE. Independent source/outcome review and human acceptance remain
required before a recipe enters the approved learning page or downloadable kit.
The agent's second input is not a blinded held-out task. Failures remain failures.

`research-agent-tests.yml` runs actual Docker positive and planted-failure controls
on this PR without an inference key. Locally, run `python3 -B
ops/test_research_agent.py`; that suite is synthetic security/mechanics coverage,
not a hosted model run. Actual Docker controls require Docker and network access
to pull the pinned runtime image; no unavailable-runtime skip is accepted.

## Reproducible upstream integration

Compiler: github/gh-aw release v0.89.21, Linux amd64 SHA-256
`1c74ff5fc28b1891d32b67f4348a9b7f750946b6d4a721e909187a848868016b`.
Runtime actions: github/gh-aw-actions commit
`924af5fdc64061cfbf66fb584c8b07e2ac230c60` (v0.89.21 annotated tag resolves here).
Codex CLI version in the lock is 0.154.0. Container images carry digest pins.

```sh
gh aw compile .github/workflows/research-candidate.md --action-mode action --action-tag 924af5fdc64061cfbf66fb584c8b07e2ac230c60
python3 -B ops/research-agent-harden.py .github/workflows/research-candidate.lock.yml
python3 -B ops/test_research_agent.py
node ops/write-job.mjs
```

The checked-in lock is **locally derived**, not pristine upstream compiler output.
The deterministic hardener removes inherited OTLP export configuration and unused
magic-token references, pins the MCP gateway invocation to its manifest digest,
disables checkout credential persistence, and replaces three credential-bootstrap
steps with nonsecret Git identity configuration. It preserves all six generated
jobs and rejects changed compiler patterns. API-based signed commits and PR
creation retain explicit step-scoped `GITHUB_TOKEN`; public Git reads need no
persisted credential. Unsupported GraphQL fallback to authenticated Git push can
fail closed: this lane is intentionally limited to normal new regular files in
this public repo. No private/cross-repo push support is claimed.

`ops/research-agent-policy.json` binds the exact reviewed source, compiled lock,
hardener, evaluator and smoke files. `ops/write-job.mjs` admits exactly that one
lock through additional structural assertions. Every other workflow retains the
existing rules. Source/lock/runtime or policy changes need a new independent
review; do not automatically update admission hashes to make a gate green.
New secrets are the optional inference key aliases above; `GITHUB_TOKEN` has
read-only permissions during agent execution and write permissions only in the
pinned conclusion/safe-output runtime jobs. No OIDC or deployment secret is used.

## Activate and inspect

After merging, enable the repository Actions setting **Allow GitHub Actions to
create and approve pull requests** if PR creation is disabled. This workflow only
creates draft PRs; it exposes no approval/merge tool. If an inference key is not
already configured, add it interactively without putting its value in commands
or chat:

```sh
gh secret set CODEX_API_KEY -R JYeswak/franken-research
gh workflow run research-candidate.lock.yml --ref main -R JYeswak/franken-research
gh run list --workflow research-candidate.lock.yml -R JYeswak/franken-research
gh run list --workflow research-candidate-evaluate.yml -R JYeswak/franken-research
```

The first command requests a secret value privately; it is not needed when a
working CODEX_API_KEY or OPENAI_API_KEY is already present. Inspect the agent run,
its draft PR, then the evaluator's `candidate-evaluation-<exact SHA>` artifact.
A missing/failed evaluator is not validation. The workflow is dispatch-only:
the daily schedule trigger was removed 2026-10-03 (bead
fr-ghaw-dispatch-only-spare-ocj, DECISION fr-decision-ghaw-sunset), so the lane
runs only when manually dispatched and stands as a spare behind the local
launchd nightly. To resume after a candidate, review and merge or close its
open draft. Do not merge merely because its own
authored tests reproduce. Accepted recipes still need source/outcome review and
inclusion in the approved application catalog.
