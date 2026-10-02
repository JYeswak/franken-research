
# Task: Top‑10 Rust repositories (2026‑W40)

**Slug:** `2026-10-02-top-agent-repos`  
**Why it matters:**  
Researchers building AI agents need a quick, reproducible ranking of high‑value Rust projects. A CSV file containing the ten best candidates (by discovery‑score) can be fed directly into notebooks, notebooks, or downstream triage tools without manual spreadsheet work.

**Primary source**  
- Discovery JSON: `watch/discovery/2026-W40.json` (public GitHub repository, revision `a1b2c3d4`, CC‑BY‑4.0).  
  The file contains a top‑level `"candidates"` array; each entry holds  
  `repo` (string), `stars` (int), `score` (float), and a `"signals"` object whose values are booleans indicating the presence of various quality signals.

**Installation / run steps**  

```bash
# clone the candidate directory (the harness does this automatically)
cd probes/daily-candidates/2026-10-02-top-agent-repos

# Baseline (manual‑style): just extracts the first ten entries, no sorting
python3 baseline.py fixtures/input.json > baseline.csv

# Candidate (automated, sorted by score, signal count computed)
python3 candidate.py fixtures/input.json > candidate.csv
```

Both scripts accept a single argument – the path to a discovery JSON – and write a CSV to **stdout**.

**Expected results (for `fixtures/input.json`)**

| repo               | stars | score | signal_count |
|--------------------|-------|-------|--------------|
| owner12/repo12     |  500  | 9.9   | 3 |
| owner3/repo3       |  300  | 9.6   | 2 |
| …                  | …     | …     | … |
| owner4/repo4       |  120  | 8.2   | 1 |

*Exactly ten rows (plus a header) sorted by `score` descending.*  
`signal_count` is the number of **true** entries inside the `signals` object.

**Consumer integration**  
The CSV conforms to RFC 4180 and can be imported directly with `pandas.read_csv`, SQLite’s `.import`, or any spreadsheet program.

**Limits**  

- The script assumes the input JSON follows the schema described above.  
- Only the Python 3 standard library is used; no external data sources are accessed.  
- If fewer than ten candidates exist, the output contains as many rows as are present.  
- Non‑boolean values inside `"signals"` are ignored when counting true signals.

**Falsification case**  

The candidate is considered **incorrect** if **any** of the following holds for a valid input containing ≥10 candidates:

1. Fewer than ten data rows (excluding the header) are emitted.  
2. The rows are not sorted strictly descending by the numeric `score` column.  
3. The `signal_count` column does **not** equal the count of entries whose value is `true` in the original `"signals"` object.

---  

