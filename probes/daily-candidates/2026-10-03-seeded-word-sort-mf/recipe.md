# Task: Deterministic length-first word sort (seeded rehearsal, fr-656)

**Slug:** `seeded-word-sort-mf` (run date prefix added by the driver)
**Why it matters:**
This candidate is the controlled self-ship rehearsal for bead fr-656. It
is deliberately simple and known-good, seeded by the operator instead of
being drafted by the writer model, so a failure tonight can only be a
pipeline defect (sandbox, evaluator, gates, PR, merge) and never a
candidate defect. The underlying micro-task is real: downstream tooling
that groups words by length (compact indexes, length-bucketed displays)
needs a deterministic length-first ordering, and the alphabetical order
every off-the-shelf tool produces does not provide it.

**Contract**

Both scripts accept exactly one argument, the path to a JSON file of the
form `{"words": ["...", ...]}` (a list of strings), and write one JSON
object `{"sorted": [...]}` to stdout:

- `baseline.py` prints the words in plain alphabetical order — exactly
  what Python's built-in `sorted()` (or `sort` on the command line)
  gives a user today. It is the strongest practical existing approach
  for sorting words, but it has no length grouping.
- `candidate.py` prints the words ordered by ascending length, then
  ascending Python string order (Unicode code points, so uppercase
  letters sort before lowercase ones at equal length).

Duplicates are preserved by both. Invalid input (missing file,
malformed JSON, wrong shape, non-string entries) exits with code 2 and
a message on stderr.

**Installation / run steps**

```bash
cd probes/daily-candidates/<date>-seeded-word-sort-mf

# Baseline (current off-the-shelf behavior: alphabetical)
python3 baseline.py fixtures/input.json

# Candidate (specified ordering: length first, then alphabetical)
python3 candidate.py fixtures/input.json
```

**Expected results**

For `fixtures/input.json` the candidate prints exactly:

```json
{"sorted": ["fig", "fig", "date", "kiwi", "plum", "apple", "banana", "cherry", "Apricot", "elderberry"]}
```

while the baseline prints the alphabetical
`["Apricot", "apple", "banana", "cherry", "date", "elderberry", "fig", "fig", "kiwi", "plum"]`.

**Consumer integration**

The stdout JSON can be piped into any JSON consumer (`jq`, `json.load`,
a notebook). The candidate ordering is total and deterministic for any
list of strings, including the empty list (`{"sorted": []}`).

**Limits**

- Ordering is by Unicode code points, not locale or case-insensitive
  collation; the length key dominates, so `"Apricot"` (7 chars) sorts
  with the other 7-letter words, not with the capitalized block.
- Only the Python 3 standard library is used; no network, no external
  data. The word lists are synthetic, authored locally on 2026-10-03 for
  this rehearsal; there is no external source to pin.

**Falsification case**

The candidate is incorrect if, on either fixture, any of these hold:
(1) candidate output differs from the hardcoded expected list above (or
its transfer-fixture counterpart in test.py); (2) candidate output is
not a permutation of the input words; (3) candidate output's
(length, word) keys are not non-decreasing; (4) either script exits
nonzero on a valid fixture or exits 0 on malformed input.
