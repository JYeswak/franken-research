#!/usr/bin/env python3
"""Show what needs review and why, without changing evidence or claim status.

Python 3.9+; standard library only. Priority is authored, not an AI value score.
Exit codes match check-decisions.py: 0 consistent, 1 stale supported labels,
2 invalid evidence/record. An empty queue is not research authorization.
"""
import argparse
import importlib.util
import json
from pathlib import Path
import sys

spec = importlib.util.spec_from_file_location(
    "fr_decisions", Path(__file__).with_name("check-decisions.py"))
checker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(checker)


def review(data, root, include_current=False):
    bad, evidence_reasons = checker.inspect(data, root)
    claims = {c["id"]: c for c in data["claims"]}
    evidence = {e["id"]: e for e in data["evidence"]}
    rows = []
    for decision in sorted(data["decisions"], key=lambda d: (d["priority"], d["id"])):
        affected = [cid for cid in decision["claims"] if bad[cid]]
        if not include_current and not affected and decision["disposition"] != "defer":
            continue
        seen = set()
        def collect(cid):
            if cid in seen:
                return
            seen.add(cid)
            for dependency in claims[cid].get("depends_on", []):
                collect(dependency)
        for cid in affected:
            collect(cid)
        causes = []
        for cid in sorted(seen):
            claim = claims[cid]
            if claim["status"] != "supported":
                causes.append({"claim": cid, "status": claim["status"]})
            for eid in claim["evidence"]:
                if evidence_reasons[eid]:
                    causes.append({"claim": cid, "evidence": eid,
                                   "scope": evidence[eid]["scope"],
                                   "changes": evidence_reasons[eid]})
        rows.append({**{k: decision[k] for k in
                       ("id", "question", "owner", "priority", "disposition", "next_check", "alternatives")},
                     "state": "review" if affected else "deferred" if decision["disposition"] == "defer" else "current_identities",
                     "affected_claims": affected, "causes": causes})
    unsupported = sorted(cid for cid, c in claims.items()
                         if bad[cid] and c["status"] == "supported")
    return {"scope": "Identity and declared dependency review; not semantic verification or automatic dispatch.",
            "decisions": rows, "unsupported_current_labels": unsupported}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("record", type=Path)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--json", action="store_true", help="one JSON object on stdout")
    parser.add_argument("--all", action="store_true", help="also show current decisions")
    args = parser.parse_args()
    try:
        result = review(json.loads(args.record.read_text()), args.root, args.all)
        if args.json:
            print(json.dumps(result, indent=2))
        else:
            for row in result["decisions"]:
                print(f"P{row['priority']} {row['id']} [{row['state']}; {row['disposition']}] — {row['question']}")
                print(f"  owner: {row['owner']} | next: {row['next_check']}")
                for cause in row["causes"]:
                    detail = (cause['evidence'] + ': ' + ', '.join(cause['changes'])) if 'evidence' in cause else cause['status']
                    print(f"  because {cause['claim']}: {detail}")
            if not result["decisions"]:
                print("No declared reviews pending. Use --all to inspect current decisions.")
            print(result["scope"])
        return 1 if result["unsupported_current_labels"] else 0
    except (ValueError, KeyError, TypeError, OSError) as error:
        print(f"INVALID: {error}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
