# Golden-packet regression suite

Bead: fr-itk. Gate U's kit-regression pattern applied to packets: a
small set of golden packets carries known-good derivations banked in
`scripts/golden-packets.json`; the suite re-derives them on every
corpus change and fails on unexplained deltas. The stale site page
incident (2026-10-03) is the failure class this guards one level down:
44 packets edited over weeks drift silently unless a frozen oracle
says otherwise.

## Commands

From the repo root:

```bash
# CI gate (also Gate GP in site/scripts/verify-site.sh): exit 1 on drift
python3 scripts/golden-packets.py verify

# Banking ceremony: re-bank after a reviewed packet change
python3 scripts/golden-packets.py emit

# Tests (include the planted one-character edit contract)
python3 scripts/test_golden_packets.py
```

## The golden set

Six packets, chosen for diversity of size, header style, and name
shape: `asupersync`, `beads-for-frankentui`, `franken_lean`,
`frankenfs`, `frankenredis`, `frankensim`. Each derivation is the
receipt that `scripts/packet-receipts.py` (bead fr-1pq) builds from
the packet's pinned inputs: packet sha256/bytes/lines, pinned repo
and commit, assessment date, the RULEBOOK grader-protocol pin, and
the claim-set count and hash.

## Why receipts alone are not enough

`packet-receipts.py verify` proves a packet matches its receipt, but
a receipt can be re-emitted after an edit, silently re-pinning the
drifted packet. The golden file is banked independently: re-banking
requires the explicit `emit` ceremony in the same commit as the
reviewed packet change, so `git diff scripts/golden-packets.json`
is the audit trail of every accepted derivation change. A planted
one-character edit fails the suite even with fresh receipts;
reverting the edit restores green.

## Changing the golden set

Add or remove a stem in `GOLDEN_STEMS` in
`scripts/golden-packets.py`, re-bank with `emit`, and commit both
together. Suite runtime is seconds (six packets), far under the
10-minute budget.
