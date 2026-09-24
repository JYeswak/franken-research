# Review records

Every agent-stack verdict and every self-claim in this directory's parent was checked by someone other than its author before release (see [../METHOD.md](../METHOD.md), Independence). Authors and reviewers were separate AI agent sessions (named in each record), coordinated by a human maintainer; no outside party has reviewed this layer yet. These are those reviews, published as written, including the rounds where the reviewer refused to sign. One edit was made after the fact: the repository history was rewritten on 2026-09-23 to remove email addresses (see [../../CHANGELOG.md](../../CHANGELOG.md)), which renamed commits, so commit hashes cited in these records were updated to the published ones.

| Record | What was reviewed | Outcome |
|---|---|---|
| [method-v1-stress-test.md](method-v1-stress-test.md) | The verdict method itself, before any verdict relied on it | 8 findings, all adopted in METHOD v2 |
| [orchestration-eval-safety.md](orchestration-eval-safety.md) | 7 orchestration and eval/safety verdicts | 12 findings, then 4 still open, then signed; re-signed after license edits |
| [tools-training-voice.md](tools-training-voice.md) | 7 tools/environment and training/voice verdicts | 36 findings, then 4 more, then signed |
| [serving-memory-retrieval.md](serving-memory-retrieval.md) | 7 model-serving and memory/retrieval verdicts | 36 findings, then 9 residual, then signed |
| [rigor-index-adopted-audit.md](rigor-index-adopted-audit.md) | Every practice this repository claimed to have adopted | 36 claimed; 12 confirmed, 24 partial, 2 mislabeled; the index now claims 15 adopted and 21 partial |
| [franken_code_browser-recheck.md](franken_code_browser-recheck.md) | The dated re-check of franken_code_browser after its v0.1.0 release | 1 finding, fixed |
| [frankengit-recheck.md](frankengit-recheck.md) | The dated re-check of frankengit after 71 of its 78 workflow files were removed | Accepted with corrections: 10 required (9 in the addendum, 1 in the proposed RP-136 row); the C3 to C5 call, TRL and re-pin counts hold |
| [history-rewrite-2026-09-23.tsv](history-rewrite-2026-09-23.tsv) | The commit history, after email addresses were removed from every commit | Old and new commit hash for all 44 pre-rewrite commits, so CI runs and links from before the rewrite stay traceable |
