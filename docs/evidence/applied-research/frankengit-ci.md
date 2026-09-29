# frankengit: historical CI evidence

Historical CI-only evidence; not a complete re-check, current upstream assessment, reviewer acceptance, or crossing resolution.

Recorded: 2026-09-25T04:02:38Z. Target point: recheck.

| Point | Commit | CI | Rule | Workflow files | Recorded runs |
|---|---|---|---|---:|---:|
| Baseline | 894585a35e23d31bb462de24c6691124054d9c9e | C3 | FR-C.2/C3 | 78 | 18 |
| Target | dfa5bb861e1f08802c72d33e96796a1aad9d5d06 | C5 | FR-C.2/C5-no-push-trigger | 8 | 0 |

Recording HEAD: 4c31ff4f367282d426b76b92c470e08271a9e3df; selected recording CI: none. Neither substitutes for the target.

Verified 86 unique workflow blob identities. Blob hashes verify source bytes. Recorded API facts and tree membership are trusted fixture data, not independently authenticated by these hashes.

## Target workflow evidence

| Path | Kind | Events | Default-branch trigger from source | Blob |
|---|---|---|---|---|
| [.github/workflows/docs-integrity.yml](https://github.com/Dicklesworthstone/frankengit/blob/dfa5bb861e1f08802c72d33e96796a1aad9d5d06/.github/workflows/docs-integrity.yml) | test | workflow_dispatch | false | 1e9dac56298f4416a9cce54e3f8df29b26022c91 |
| [.github/workflows/exact-patch.yml](https://github.com/Dicklesworthstone/frankengit/blob/dfa5bb861e1f08802c72d33e96796a1aad9d5d06/.github/workflows/exact-patch.yml) | test | workflow_dispatch | false | e65751f63e0a71098dce5fe1fc8da7bf1d5cc6c2 |
| [.github/workflows/gpt56pro-apply-format-20260904.yml](https://github.com/Dicklesworthstone/frankengit/blob/dfa5bb861e1f08802c72d33e96796a1aad9d5d06/.github/workflows/gpt56pro-apply-format-20260904.yml) | other | push | false | 43d707003783c52a2423aa3c9ed56e0527f976bc |
| [.github/workflows/index-maintenance.yml](https://github.com/Dicklesworthstone/frankengit/blob/dfa5bb861e1f08802c72d33e96796a1aad9d5d06/.github/workflows/index-maintenance.yml) | test | workflow_dispatch | false | 44a2e9bf4e042ac7ba6a3e207af9a39a7085fcbf |
| [.github/workflows/review-protection-activation-verify.yml](https://github.com/Dicklesworthstone/frankengit/blob/dfa5bb861e1f08802c72d33e96796a1aad9d5d06/.github/workflows/review-protection-activation-verify.yml) | test | workflow_dispatch | false | 6ed88afbd10d0bda0ecb4ef93c615a3fbd64b8d6 |
| [.github/workflows/source-snapshot.yml](https://github.com/Dicklesworthstone/frankengit/blob/dfa5bb861e1f08802c72d33e96796a1aad9d5d06/.github/workflows/source-snapshot.yml) | test | workflow_dispatch | false | da315fd0ab813383148dadf70124b3ac658f8def |
| [.github/workflows/source-symbols.yml](https://github.com/Dicklesworthstone/frankengit/blob/dfa5bb861e1f08802c72d33e96796a1aad9d5d06/.github/workflows/source-symbols.yml) | test | workflow_dispatch | false | 36dcc8c9e45b3e373e5f521391a76297bcedefc4 |
| [.github/workflows/symbol-index.yml](https://github.com/Dicklesworthstone/frankengit/blob/dfa5bb861e1f08802c72d33e96796a1aad9d5d06/.github/workflows/symbol-index.yml) | test | workflow_dispatch | false | a4cb1931c59c194451b701e40c5e6d02413e5aee |

## Review action

Independently inspect the pinned workflow sources and recorded run evidence; accept or reject CI C3 → C5 at dfa5bb861e1f08802c72d33e96796a1aad9d5d06. Verify test versus patch/deploy classification, triggers, and run exclusions. Do not infer product correctness or other matrix cells.

## Limits

- No upstream fetch or code execution.
- No run logs or job lists are present in this fixture.
- Other matrix cells and human effort are unmeasured.

The JSON form embeds every baseline and target workflow source and all recorded runs for offline inspection.
