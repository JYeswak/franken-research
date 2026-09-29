# Resume a research decision

Use this optional workflow when you already have a maintained FR decision record.
Python 3.9+ is required only for these commands, not installation or shell gates.
The installer creates no empty record and does not make this a readiness condition.

From the installed project, point to your record:

```sh
python3 scripts/review-decisions.py path/to/decisions.json
python3 scripts/review-decisions.py path/to/decisions.json --json
python3 scripts/review-decisions.py path/to/decisions.json --all
```

The default queue shows decisions with unsupported, provisional, retired or stale
dependencies, plus deferred decisions. It shows the owner, authored priority,
recorded next check, and the transitive evidence/status causes. Current decisions
are omitted unless `--all` is given. This is read-only; it does not invent the next
experiment, choose a model, approve work, or judge the meaning of evidence.

Input paths are relative to the installed project root, regardless of current
working directory. For an imported bundle, explicitly give `--root /path/to/bundle`.
JSON is one object on stdout. Diagnostics go to stderr. Exit 0 means consistent
identities (reviews may remain); 1 means supported labels need demotion; 2 means
invalid records/evidence. Automation must inspect both exit code and decision state.

After reviewing a change, the existing checker can demote stale labels or export:

```sh
python3 scripts/check-decisions.py path/to/decisions.json --refresh
python3 scripts/check-decisions.py path/to/decisions.json --export /path/to/new-bundle
```

`--refresh` writes the record and never promotes a claim. Export copies public
evidence and declared inputs; private/reference-only evidence is omitted. Metadata
must already be safe to share. Export is not a license or privacy classifier.
Transfers preserve receipts; they do not rerun experiments.

Version 1 record fields:

- `evidence`: `id`, `artifact` (relative path), `sha256`, `inputs` (path to hash
  mapping), `scope`, `visibility` (`public`, `private`, `reference-only`). Optional
  `kind: execution` additionally requires the artifact JSON to contain integer
  `exit_code: 0`. Hashes identify actual bytes; never fabricate receipts.
- `claims`: `id`, `text`, `status` (`supported`, `provisional`, `review_required`,
  `retired`), `evidence` (IDs), optional `depends_on` (claim IDs).
- `decisions`: `id`, `question`, `owner`, `priority` (0–3), `next_check`,
  `alternatives` (at least two), `disposition` (`adopt`, `combine`, `build`, `defer`,
  `kill`), `claims` (IDs).

The top-level object contains `version: 1` and the three arrays above. Full worked
records live in the FR repository under `docs/evidence/fr-evolution/decisions.json`;
those evidence paths require its checkout. Start with your own actual evidence,
not copied support labels. Remove a record if upkeep costs more than resuming it
saves. Research quality and total effort benefits remain unmeasured.

Re-running the kit installer preserves existing scripts and records; it is not an
upgrade command. To update an existing installation, review and copy the two Python
scripts together from one kit revision. Neither depends on the originating checkout.
