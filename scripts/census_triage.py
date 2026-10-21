#!/usr/bin/env python3
"""census_triage.py - fr-census-triage: fleet drift triage between the
daily watch census and the nightly candidate.

Deterministic, stdlib-only, no model call and no agent turn: diffs the
fresh census day (watch/changes/<date>.json, already the day's diff
against the previous census, enriched by watch/census/<date>.tsv pin
context), ranks the drift, and emits the ranked artifact the nightly
Stage A seed queue is built from:

  franken-nightly/state/census-triage-<date>.json   (ranked artifact)
  franken-nightly/state/stage-a-drift-seed-<date>.json (seed queue)
  one receipt line appended to franken-nightly/ledger.jsonl
  ({"mode": "census-triage", ...}) when --ledger is passed.

Ranking (arithmetic only, reproducible from the pinned inputs):
  tier base   material entry in changes/<date>.json .... 100
              informational entry ......................  10
  kind bonus  license/archived/renamed/deleted ......... +40
              release/tag .............................. +30
              other named kind ......................... +20
              workflows/ci ............................. +10
  context     + min(commits_since_pin, 500)/50 (0..10, from census TSV)
              + 5 if the census row is material_since_pin=yes
Ties break on repo name so the artifact is byte-stable for equal inputs.

The launchd installation that fires this at ~05:45 MDT (between the
05:23 census and the 06:20 nightly) is NOT done by this script; it is
gated on Josh's go-ahead for new launchd jobs (same gate holding
fr-canary-drain-stale-8qo's scheduler restore). Stage A consumption of
the seed queue is fr-9jw.
"""
import argparse
import hashlib
import json
import os
import sys
from datetime import datetime

FN = "/Users/josh/Developer/franken-nightly"
FR = "/Users/josh/Developer/franken-research"

KIND_BONUS = {
    "license": 40, "archived": 40, "renamed": 40, "deleted": 40,
    "release": 30, "tag": 30,
    "workflows": 10, "ci": 10,
}
DEFAULT_KIND_BONUS = 20


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def parse_census_tsv(path):
    """repo -> row dict from watch/census/<date>.tsv (comment lines #)."""
    rows = {}
    if not path or not os.path.exists(path):
        return rows
    with open(path, encoding="utf-8") as f:
        header = None
        for line in f:
            line = line.rstrip("\n")
            if not line or line.startswith("#"):
                continue
            cells = line.split("\t")
            if header is None:
                header = cells
                continue
            row = dict(zip(header, cells))
            if row.get("repo"):
                rows[row["repo"]] = row
    return rows


def _int(value):
    try:
        return int(str(value).strip())
    except (TypeError, ValueError):
        return 0


def rank_entries(changes, census_rows):
    """Ranked drift list from one day's changes doc + census context."""
    ranked = []
    for tier, base in (("material", 100), ("informational", 10)):
        for entry in changes.get(tier) or []:
            repo = entry.get("repo") or ""
            kind = (entry.get("kind") or entry.get("label") or "").lower()
            score = base + KIND_BONUS.get(kind, DEFAULT_KIND_BONUS)
            ctx = census_rows.get(repo) or {}
            commits = _int(ctx.get("commits_since_pin"))
            score += min(commits, 500) / 50.0
            if (ctx.get("material_since_pin") or "").lower() == "yes":
                score += 5
            ranked.append({
                "repo": repo,
                "tier": tier,
                "kind": kind,
                "score": round(score, 3),
                "title": entry.get("title") or "",
                "summary": entry.get("summary") or "",
                "affects": entry.get("affects") or [],
                "evidence": entry.get("evidence") or [],
                "commits_since_pin": commits,
                "releases_since_pin": ctx.get("releases_since_pin"),
            })
    ranked.sort(key=lambda r: (-r["score"], r["repo"], r["kind"]))
    for i, row in enumerate(ranked, 1):
        row["rank"] = i
    return ranked


def build_artifact(date, changes_path, census_path):
    with open(changes_path, encoding="utf-8") as f:
        changes = json.load(f)
    census_rows = parse_census_tsv(census_path)
    ranked = rank_entries(changes, census_rows)
    return {
        "schema": 1,
        "bead": "fr-census-triage",
        "date": date,
        "generated_by": "scripts/census_triage.py (deterministic, no model)",
        "sources": {
            "changes_path": os.path.relpath(changes_path, FR),
            "changes_sha256": sha256_file(changes_path),
            "census_path": (os.path.relpath(census_path, FR)
                            if census_path and os.path.exists(census_path)
                            else None),
            "census_sha256": (sha256_file(census_path)
                              if census_path and os.path.exists(census_path)
                              else None),
            "changes_since": changes.get("since"),
        },
        "counts": {
            "material": len(changes.get("material") or []),
            "informational": len(changes.get("informational") or []),
            "ranked": len(ranked),
        },
        "ranked": ranked,
        "seed_queue": [
            {"rank": r["rank"], "repo": r["repo"], "tier": r["tier"],
             "kind": r["kind"], "score": r["score"], "title": r["title"]}
            for r in ranked
        ],
    }


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--date", required=True, help="census day YYYY-MM-DD")
    ap.add_argument("--changes", default=None)
    ap.add_argument("--census", default=None)
    ap.add_argument("--out", default=None,
                    help="ranked artifact path (default FN/state/...)")
    ap.add_argument("--seed-out", default=None)
    ap.add_argument("--ledger", default=None,
                    help="append one census-triage receipt to this ledger")
    args = ap.parse_args(argv)

    changes_path = args.changes or os.path.join(
        FR, "watch", "changes", args.date + ".json")
    census_path = args.census or os.path.join(
        FR, "watch", "census", args.date + ".tsv")
    if not os.path.exists(changes_path):
        print("NO_CHANGES: %s" % changes_path)
        return 2
    artifact = build_artifact(args.date, changes_path, census_path)

    out = args.out or os.path.join(
        FN, "state", "census-triage-%s.json" % args.date)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(artifact, f, indent=2, sort_keys=True)
        f.write("\n")
    seed_out = args.seed_out or os.path.join(
        FN, "state", "stage-a-drift-seed-%s.json" % args.date)
    with open(seed_out, "w", encoding="utf-8") as f:
        json.dump({"date": args.date, "bead": "fr-census-triage",
                   "artifact": os.path.basename(out),
                   "seed_queue": artifact["seed_queue"]},
                  f, indent=2, sort_keys=True)
        f.write("\n")
    if args.ledger:
        receipt = {"mode": "census-triage", "date": args.date,
                   "ts": datetime.now().astimezone().isoformat(
                       timespec="seconds"),
                   "artifact": out, "seed": seed_out,
                   "ranked": artifact["counts"]["ranked"],
                   "material": artifact["counts"]["material"],
                   "top": (artifact["ranked"][0]["repo"]
                           if artifact["ranked"] else None)}
        with open(args.ledger, "a", encoding="utf-8") as f:
            f.write(json.dumps(receipt, sort_keys=True) + "\n")
    print("CENSUS_TRIAGE_OK date=%s ranked=%d material=%d top=%s" % (
        args.date, artifact["counts"]["ranked"],
        artifact["counts"]["material"],
        artifact["ranked"][0]["repo"] if artifact["ranked"] else "-"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
