# Self-verification fixtures

Bead: fr-tww. Agent work carries its own proof: three fixture
surfaces with golden oracles, runnable locally in minutes, so the
independent-verify gate no longer waits on a full site build
(`bun run verify`, 2.5–5 min) or on Josh.

## One command

From anywhere:

```bash
python3 scripts/fixtures.py          # per-surface PASS/FAIL + timings
python3 scripts/fixtures.py --json   # machine-readable summary
```

Exit 0 only if every surface passes and the total stays inside the
300-second budget. Every fixture subprocess runs in its own process
group with a timeout and is killed whole on expiry — a hung fixture
never orphans a child.

## The three surfaces

| Surface | Oracle | Entry points |
|---|---|---|
| packet-verifier | banked golden derivations in `scripts/golden-packets.json`; a one-character packet edit fails until the reviewed `emit` ceremony | `scripts/golden-packets.py verify`, `scripts/test_golden_packets.py`, `scripts/test_packet_receipts.py` |
| kit-install-paths | synthetic installed-kit regression cases (missing registries, staged proofs, ledger checks, reinstall preservation) | `starter-kit/tests/test_gates.py` |
| nightly-candidate-shape | the committed candidates under `probes/daily-candidates/` are the golden fixtures: contract files, size limits, distinct fixtures, and every `execution.json` run re-executes to the recorded exit code and stdout sha256 | `scripts/candidate-shape.py verify`, `scripts/test_candidate_shape.py` |

The candidate-shape surface is the one this bead adds. Before it, the
nightly's directory contract (recipe.md, baseline.py, candidate.py,
fixtures/input.json, fixtures/transfer.json, test.py, harness-made
execution.json; ≤20 files, ≤256 KiB) was only enforced at write time
by the sandbox harness. `candidate-shape.py` re-derives the recorded
evidence from the bytes on disk, so post-merge drift — an edited
candidate.py, a tampered fixture, a hand-written execution.json —
fails locally in seconds. Its unit tests plant each defect in a temp
copy and require failure, then green on revert. Candidate code is
re-executed locally without the sandbox; it is committed, already
gated code, run with a 60-second per-run timeout.

## How the verify pass cites fixtures

The independent verifier for a bead runs `python3 scripts/fixtures.py`
(or the single surface that matches the change) and cites the surface
lines and total in the bead's close reason, e.g.:

```
fixtures: PASS packet-verifier 1.2s, kit-install-paths 27.4s,
nightly-candidate-shape 4.6s; total 33.2s of 300s budget
```

Gate FX in `site/scripts/verify-site.sh` also runs the candidate-shape
surface inside the full battery, so a drifted candidate cannot merge
even if nobody ran the fixtures by hand. Gates U and GP already cover
the other two surfaces there.

## Changing a golden

- Packets: re-bank only with the reviewed change, via
  `python3 scripts/golden-packets.py emit` (see
  [golden-packets.md](golden-packets.md)).
- Candidates: `execution.json` is harness output; never hand-edit it.
  A candidate whose recorded runs no longer reproduce is drift to
  investigate, not a golden to re-bank.
- Kit: fixtures are synthetic and live in
  `starter-kit/tests/test_gates.py`; extend them with the kit change
  they protect.
