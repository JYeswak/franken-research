# Packet receipts: deterministic regeneration from pinned inputs

Bead: fr-1pq. Every assessment packet in `packets/` carries a hash receipt
next to it — `packets/<name>-assessment.receipt.json` — recording the pinned
inputs the packet was assessed from and the packet's own sha256. A packet
nobody can regenerate is an assertion, not evidence; the receipt makes each
packet re-derivable from its pins, and any later drift explainable line by
line.

## Regeneration command

From the repo root:

```bash
# (Re)generate every receipt from the packets' pinned inputs
python3 scripts/packet-receipts.py emit

# Check that packets still regenerate identically (exit 1 on any drift)
python3 scripts/packet-receipts.py verify

# Check a sample, and write a Markdown report of the run
python3 scripts/packet-receipts.py verify --only asupersync --only frankenfs --only frankensim \
    --report docs/evidence/packet-regeneration-2026-10-03.md

# Tests
python3 scripts/test_packet_receipts.py
```

Receipts contain no timestamps and are rendered with sorted keys and a fixed
indent, so `emit` run twice over the same packets produces byte-identical
receipt files. `verify` exits 0 only when every checked packet's freshly
derived receipt matches the committed receipt byte-for-byte.

## What a receipt records

| Field | Meaning |
|---|---|
| `packet`, `packet_sha256`, `packet_bytes`, `packet_lines` | The packet file and its exact bytes. |
| `pins.repository` | The assessed repo (`Dicklesworthstone/…`), from the packet header. |
| `pins.pinned_commit` | The full 40-hex commit the assessment froze on (Rulebook §3). |
| `pins.assessment_date` | The packet's recorded assessment date, when it states one. |
| `pins.grader_protocol` | `RULEBOOK.md` path, version, and sha256 — the grading protocol the packet was written and graded against. |
| `claim_set.count`, `claim_set.sha256` | The packet's claim inventory (Rulebook §4.3): data-row count and a sha256 over the whitespace-normalized rows, so table reflow does not churn the hash but any claim edit does. |
| `schema`, `tool` | Receipt format and generator versions. |

Pin extraction is deterministic and reads only the packet header: `Repository:`
/ `Repo:` line, then `Pinned commit` / `Pinned revision` / `Pinned HEAD commit`
/ `Pin:` labels, then a `commit/<sha>` URL, with the packet filename as the
repo fallback. Packets whose headers state no assessment date record
`"assessment_date": null` rather than inventing one.

## When verify reports DRIFT

`verify` explains the drift instead of just failing: which receipt fields
changed (packet hash, pin, claim set, or the Rulebook itself), then a
line-by-line unified diff of the packet against its git-committed baseline
(`git show HEAD:packets/<file>`). Typical causes: a packet edited after its
receipt was emitted (re-run `emit` to re-pin), a Rulebook amendment (receipts
re-emit against the new protocol hash), or a claim-table edit (claim-set hash
moves while the pin stays). Unexplained drift is a defect; explained drift is
the audit trail.

## Scope note

Regeneration reproduces the *receipt* from the packet's pinned inputs and
proves the packet on disk is exactly the packet the receipt describes. It does
not re-run the original assessment: the prose was written by an analyst at the
pin, and the receipt is what makes that prose auditable after the fact.
Cited-number re-derivation is a separate harness (bead fr-brn); golden-packet
regression is bead fr-itk.
