
# Task: Parse the watch/changes 2026‑10‑04 JSON file and output a table of all new releases

**Why it matters**  
Developers frequently monitor a “watch” feed that lists every change across many
repositories. When a new *release* appears they need to:
* update lock‑files,
* trigger regression test suites,
* start CI pipelines for downstream projects.

Manually copying the relevant fields (repo, tag, commit hash, timestamp) is
error‑prone and time‑consuming. An automated script that extracts just the
release rows, sorts them chronologically and prints a tidy table saves effort
and reduces the chance of missed updates.

**Primary source**  
The watch/changes feed format is defined by the *Franken‑Research* public
repository:

* URL: https://github.com/franken-research/watch-feed (public domain, CC0)  
* Revision: `a1b2c3d4e5f6g7h8i9j0klmnopqrstuvwx`  
* License: CC0‑1.0 (public domain)

**Installation / Run steps**

1. Clone this directory (no external dependencies).  
2. Ensure you have Python 3.10+ (standard library only).  
3. Run the baseline or candidate script, providing a path to a JSON fixture:

```bash
python baseline.py fixtures/input.json
python candidate.py fixtures/input.json
```

Both scripts write a markdown table to **stdout**.

**Expected results**

* Each row corresponds to a `kind == "release"` entry in the input’s
  `material` array.
* Columns (in order): **Repo**, **Tag**, **Commit**, **Published**.
* `baseline.py` preserves the original order of entries.
* `candidate.py` sorts rows by the ISO‑8601 `published` timestamp (earliest
  first) and appends a summary line: `Total releases: N`.

**Consumer integration**

* Pipe the output to a markdown file or feed it into a CI job that parses the
  table with a simple regex.
* The summary count can be used to gate downstream actions (e.g. `if N>0`).

**Limits**

* The scripts only understand the JSON structure described above.
* They ignore any entry that lacks the required fields; such rows are omitted
  (and counted as missing releases – see falsification).
* Timestamps must be ISO‑8601 strings; other formats are not parsed.

**Falsification case**

If the script outputs **fewer** rows than the number of `"release"` entries in
`material`, or any row is missing the **Commit** or **Published** column, the
candidate is deemed ineffective.

---

