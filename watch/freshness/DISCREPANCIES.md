# Known conformance divergences

Each entry records where this repository's machine classifier (SPEC.md FR-C) and the analysts' master matrix (`synthesis/00-overview.md`) disagree at the pin, or where the implementation departs from SPEC.md on purpose. A case that fails for one of these reasons returns `xfail: 'DISC-NNN'`, and the harness reports it as XFAIL, not as a pass.

Format, one block per entry (the harness parses the Resolution and Review date lines):

```
## DISC-NNN: short title
- **Clause:** FR-...
- **Repositories:** ...
- **Machine:** what the classifier computed, with evidence
- **Matrix:** what the analysts recorded, with the line number
- **Why they differ:** facts first, then any inference, labelled
- **Resolution:** ACCEPTED | INVESTIGATING | WILL-FIX (and what that means here)
- **Cases affected:** case ids
- **Review date:** YYYY-MM-DD
```

The matrix is never edited to match the machine. Where the matrix disagrees with its own legend, the entry says so, and the finding goes to a dated note under `updates/`.
