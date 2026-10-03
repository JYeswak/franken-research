# Citation verifier: every checkable number re-derived before shipping

Bead: fr-brn. Model-written numbers are untrusted text (standing doctrine
in AGENTS.md; the 2026-10-02 dry run fabricated sequential sha256s). This
harness recomputes — from pinned sources inside this repo, never from the
model's prose — every cited quantity that can be recomputed, and blocks
shipping on any mismatch.

## Commands

From the repo root:

```bash
# Verify every packet (exit 1 on any failed derivation)
python3 scripts/citation-verifier.py verify

# One packet, with a Markdown per-number derivation log
python3 scripts/citation-verifier.py verify --only asupersync \
    --report docs/evidence/citation-verification-2026-10-03.md

# Tests (includes the planted-false-citation cases)
python3 scripts/test_citation_verifier.py
```

## What is re-derived, and from what

| Cited number | Re-derived from |
|---|---|
| `packet_sha256`, `packet_bytes`, `packet_lines` (in the receipt) | The packet file's bytes |
| `pins.pinned_commit`, `pins.repository` | The packet header pin/Repository labels (all labelled pin occurrences must agree) |
| `pins.grader_protocol.sha256` / `.version` | `RULEBOOK.md` bytes and its Version line |
| `claim_set.count`, `claim_set.sha256` | A recount / re-hash of the claim-inventory table (Rulebook §4.3) |
| Claim numbering, status tally and shares | The claim-inventory first column and Status column |
| Prose `claim inventory … N claims/rows`, `N of M claims`, `P% of claims` | Checked against the recount / tally above |
| 64-hex strings and blob/commit URLs | PASS iff pin- or hash-equal to a re-derived value |

Numbers with no in-repo pinned source (download counts, star counts,
external benchmark rows, other-commit URLs) are logged **UNVERIFIABLE** in
the per-number derivation log — listed, never silently passed. They do
not block: this repo cannot recompute them offline, and blocking on them
would fail every real packet. Every **FAIL** blocks (exit 1).

## Shipping path

Gate **CV** in `site/scripts/verify-site.sh` (run by `bun run verify`)
runs the verifier's unit tests and then the verifier over every packet
in the canon. A packet with a failed derivation cannot pass the gate
battery, so it cannot ship. Sampled-real-packet evidence (asupersync,
per-number derivation log) is committed at
`docs/evidence/citation-verification-2026-10-03.md`.
