# Maintained decisions (optional)

Use this only when an existing FR packet needs repeated review or transfer. The
consumer is the next investigator; the defect is lost evidence/context during a
handoff or update. Remove the record when its maintenance cost exceeds that use.
This is an optional file-based workflow, not a new research product or truth score.

The repository dogfoods it in `docs/evidence/fr-evolution/decisions.json`.

Start with the read-only, actionable review queue:

```sh
python3 scripts/review-decisions.py docs/evidence/fr-evolution/decisions.json
python3 scripts/review-decisions.py docs/evidence/fr-evolution/decisions.json --json
```

Current decisions are omitted by default (`--all` includes them). Each queued
decision shows its owner, authored priority, next check, affected claims and
transitive evidence/status causes. A deferred decision stays visible even with
current identities. No model calls, automatic dispatch or changes to records occur.
JSON is a single object on stdout; exit codes match the checker below. The starter
kit now installs both commands and [usage instructions](../starter-kit/DECISIONS.md)
into new projects; existing working files are preserved, not silently upgraded.

```sh
python3 scripts/check-decisions.py docs/evidence/fr-evolution/decisions.json
python3 scripts/check-decisions.py docs/evidence/fr-evolution/decisions.json --refresh
python3 scripts/check-decisions.py docs/evidence/fr-evolution/decisions.json --export /path/to/new-bundle
```

The first command prints the queue in priority order. Exit 0 means structure and
identities are consistent, even when decisions remain deferred. Exit 1 means a
claim is still labeled supported despite changed/unavailable dependencies. Exit 2
means malformed records, changed/missing evidence artifacts or unsafe paths.
`--refresh` can demote supported claims to review_required; it never promotes them.
A changed input needs review, not automatic rejection of the underlying claim.

Each decision has an owner, alternatives, disposition, priority and next check.
Each scoped claim names evidence and optional claim dependencies. Each evidence
entry binds an artifact hash, source-input hashes, scope and visibility. For
`kind: execution`, the artifact must also contain integer `exit_code: 0`. This
checks an admitted receipt; it cannot establish that a dishonest producer actually
ran the command or that the command tests the right property. Review remains
necessary for semantic support, provenance, coverage and authorization.

Only public evidence bytes and their declared inputs are copied on export. Private
and reference-only artifacts are omitted, marked unavailable, and their supported
claims become review_required. Conflicting rights on a shared path block export.
All metadata in the record must already be suitable for the recipient: this tool
does not sanitize sensitive claim prose or certify redistribution rights. Preserve
original records privately when those metadata cannot be shared.

Transfer instructions are in the generated TRANSFER.md. The bundle is an evidence
subset, not a complete checkout or a promise that all referenced project commands
will run. Validation on a new machine is distinct from re-executing the original
experiment. No model provider or external database is required by these commands.

Development checks:

```sh
python3 scripts/test_decisions.py
python3 scripts/test_review_decisions.py
python3 docs/evidence/fr-evolution/dogfood.py
```

The latter exports the actual dogfood record into a temporary directory, validates
it, changes one input deliberately, checks that only affected supported claims
require review, and saves a scoped receipt. Synthetic changes are never real
research findings. Net time savings and research-quality improvements remain
unmeasured; fresh paired tasks and an agreed effort cap are needed for that claim.
