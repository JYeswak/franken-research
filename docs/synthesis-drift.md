# Synthesis drift monitor

Bead: fr-gsm. The synthesis documents make cross-packet claims —
counts, tallies, named membership lists — that were counted from the
44 assessment packets on 2026-09-22. Packets keep changing (receipt
re-pins, corrections, new pins); every such change can silently stale
a synthesis claim, and the v2 ZIP already needed one full rebuild from
exactly this. The monitor re-derives every machine-checkable claim
from the current packets and compares it against the claim as
written. It never edits anything: drift is reported (and, on request,
filed as beads) for a human or agent to resolve on the merits.

## Commands

From the repo root:

```bash
# The check: exit 0 iff every checked claim reproduces
python3 scripts/synthesis-drift.py check

# Machine-readable report (findings + full n/44 claim inventory)
python3 scripts/synthesis-drift.py check --report /tmp/synthesis-drift.json
python3 scripts/synthesis-drift.py check --json

# File one bead per drifted claim (dedupe via br search on the claim
# id in the title). Main checkout only: .beads/ lives there, never in
# a worktree. Run by a person/agent, never from CI.
python3 scripts/synthesis-drift.py check --file-beads

# Tests (planted packet edit, planted tally edit, dropped claim row)
python3 scripts/test_synthesis_drift.py
```

Runtime is seconds. Stdlib only.

## What is checked (22 findings)

Packet-derived facts, extracted from each packet's own verdict line,
§4.9 factsheet, license statements and contribution-policy statements:
TRL, NODUS ring, license class (rider / plain MIT / no operative
grant), bus factor, no-contributions policy.

Against `synthesis/00-overview.md`:

- the master matrix covers exactly the 44 packets (`corpus-set`);
- every packet yields all four structured fields
  (`extract-coverage`) — an unparseable packet is a finding, never a
  silent pass;
- every matrix TRL/NODUS/license/bus/no-contrib cell matches its
  packet (`matrix-vs-packets`);
- aggregate tallies re-counted from the packets: NODUS, TRL, license,
  no-contrib count, bus factor (`nodus-tally`, `trl-tally`,
  `license-tally`, `nocontrib-tally`, `bus-tally`);
- named membership lists against the derived sets: Pilot, Monitor,
  per-TRL groups, the plain-MIT exception, the five no-LICENSE
  exceptions, the 19-name no-contributions list (`pilot-named`,
  `monitor-named`, `trl-detail`, `license-plain-named`,
  `license-none-named`, `nocontrib-named`);
- matrix-internal tallies: CI codes C1–C6 and release codes R1–R3
  against the aggregate row, the `Count checks:` line against the
  matrix, and finding 1's named green-at-pin pair against the C1 set
  (`ci-tally`, `rel-tally`, `count-checks-line`, `ci-green-named`).

Against `synthesis/negative-patterns.md`: the P1 bus-factor header,
the P2 license restatement with its exception lists, the P3
no-contributions header and named list (must equal the overview's,
name for name), and the P4 named-instance list, which must cover
exactly the 44-packet corpus (`negpat-p1-bus`, `negpat-p2-rider`,
`negpat-p3-nocontrib`, `negpat-p4-corpus`).

## What is not checked, on purpose

The report inventories every `n/44` claim in every top-level
`synthesis/*.md` (59 at the time of writing) so the unchecked residue
is explicit. Semantic pattern counts — most of `hurdles-issues.md`,
`ci-requirements.md`, the uniqueness catalog's mechanism claims —
have no structured per-packet field to re-derive from; they are
inventoried, not verified. CI and release classes are synthesis
judgments coded C1–C6 / R1–R3 in the matrix, so the monitor checks
their tallies for internal consistency and against the matrix, not
against a packet field (packets carry CI prose, not codes). The
known site-side divergence (README: `site/` data classifies
frankenjax C6 where the matrix says C4) is out of scope here; the
site has its own verify gates.

## Cadence

- **Weekly**, as part of the morning DAG pass: run the check; if it
  exits 1, run it again with `--file-beads` from the main checkout so
  each drifted claim becomes a bead in the DAG, then work the beads.
- **On any packet or synthesis change**: any commit touching
  `packets/` or `synthesis/` gets a check run before the commit is
  pushed; a synthesis fix and the packet change that forced it land
  together.
- **Before any ZIP or site rebuild that republishes synthesis
  numbers**: a green check is the precondition, the same way the
  golden-packet suite (docs/golden-packets.md) gates packet drift.

## Resolving drift

A DRIFT finding cites the claim as written and the value re-derived
from the packets. Decide which side is wrong and fix that side:

- packet changed deliberately (new pin, corrected verdict) → update
  the synthesis claim, its named lists and the `Count checks:` line
  together, in the same commit as the packet change;
- synthesis claim was miscounted → correct the synthesis text;
- packet field unextractable (`extract-coverage`) → the packet's
  verdict/factsheet format drifted from the corpus conventions;
  either restore the conventional field or extend the extractor
  patterns in `scripts/synthesis-drift.py` with a test.

Never edit the monitor's expectations to match drift: the monitor
has no banked expectations. Every number it checks is parsed out of
the synthesis documents themselves and re-derived from the packets,
so a green run is a reproduction, not a re-pinning. (Contrast with
golden-packets, whose banked file is the oracle; here the packets
are the oracle and the synthesis is the artifact under test.)
