#!/usr/bin/env python3
"""selection_v2.py - fr-jga Selection v2: VoI scoring at Stage A.

Stage A used to pick tonight's candidate with no score tying the pick to
the decision it was supposed to inform, so selection quality was
unmeasurable. Selection v2 is arithmetic (no model call):

VoI(candidate) = decision_value x useful_negative x p_completion
                 / (1 + messiness) x horizon_discount
  decision_value   0..5  how much the informed decision matters
                         (material census change = 3, release = +1,
                          license/CI class change = +1, capped 5)
  useful_negative  0..1  value of a trustworthy negative result
                         (falsification defined = 1.0, else 0.4)
  p_completion     0..1  probability of trustworthy completion tonight
                         (stdlib-only, small patch, fair baseline named)
  messiness        0..2  discount: churn/noise (commits_since_pin scaled,
                         workflow churn), higher = messier
  horizon_discount 1/(1 + horizon_days/30): results that land sooner
                         inform sooner.

Feasibility is checked AT SELECTION (not discovered at Stage C): a
candidate with no fair baseline, no falsification criterion, a
non-stdlib requirement, or an oversized patch is rejected at selection
with the reason recorded in the emitted JSON.

Weekly family bandit: rewards come from fr-x5h downstream events
(state/artifact-events.jsonl): per artifact family,
reward = (citation + re-run + import - 2*revert) / max(1, merged)
over the trailing 30 days. `update-bandit` rewrites
state/bandit-rewards.json. Exploration: 1-in-7 nights (night_index % 7
== 6) the pick is the least-sampled family instead of the top VoI.

Usage:
  selection_v2.py score --census watch/census/<day>.tsv [--night N]
                        [--bandit state/bandit-rewards.json]
  selection_v2.py update-bandit [--events state/artifact-events.jsonl]
                                [--out state/bandit-rewards.json]
                                [--now ISO]
"""
import argparse
import json
import math
import os
import sys
from datetime import datetime, timedelta, timezone

MAX_PATCH_KIB = 256
MAX_FILES = 20


def parse_ts(value):
    if not value:
        return None
    text = str(value).strip()
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    try:
        dt = datetime.fromisoformat(text)
    except ValueError:
        return None
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def feasibility(candidate):
    """Return list of rejection reasons (empty = feasible)."""
    reasons = []
    if not candidate.get("baseline_approach"):
        reasons.append("no fair baseline named at selection")
    if not candidate.get("falsification"):
        reasons.append("no falsification criterion (useful negative undefined)")
    if candidate.get("requires_network") or candidate.get("requires_packages"):
        reasons.append("not stdlib-only / requires network or packages")
    if (candidate.get("patch_kib") or 0) > MAX_PATCH_KIB:
        reasons.append("patch over %d KiB" % MAX_PATCH_KIB)
    if (candidate.get("files") or 0) > MAX_FILES:
        reasons.append("over %d files" % MAX_FILES)
    return reasons


def voi(candidate):
    dv = float(candidate.get("decision_value", 1.0))
    un = 1.0 if candidate.get("falsification") else 0.4
    un = float(candidate.get("useful_negative", un))
    p = float(candidate.get("p_completion", 0.7))
    mess = float(candidate.get("messiness", 0.5))
    horizon = float(candidate.get("horizon_days", 7))
    discount = 1.0 / (1.0 + horizon / 30.0)
    return round(dv * un * p / (1.0 + mess) * discount, 4)


def census_candidates(tsv_path):
    """Turn a watch census TSV into scored candidate dicts."""
    out = []
    with open(tsv_path) as f:
        header = None
        for line in f:
            if line.startswith("#") or not line.strip():
                continue
            parts = line.rstrip("\n").split("\t")
            if header is None:
                header = parts
                continue
            row = dict(zip(header, parts))
            material = row.get("material_since_pin", "no")
            is_material = material.startswith("yes")
            dv = 1.0
            if is_material:
                dv = 3.0
                if "release" in material or "tag" in material:
                    dv += 1.0
                if "license" in material:
                    dv += 1.0
            commits = int(row.get("commits_since_pin") or 0)
            mess = min(2.0, commits / 250.0)
            out.append({
                "repo": row.get("repo"),
                "family": row.get("repo"),
                "decision_value": min(5.0, dv),
                "useful_negative": 1.0 if is_material else 0.4,
                "p_completion": 0.85 if not row.get("archived") == "yes" else 0.2,
                "messiness": round(mess, 3),
                "horizon_days": 7,
                "material_since_pin": material,
                "baseline_approach": "watch census class comparison at pin vs HEAD",
                "falsification": "no class change on re-check",
            })
    return out


def is_exploration_night(night_index):
    return night_index is not None and night_index % 7 == 6


def select(candidates, bandit=None, night_index=None):
    scored, rejected = [], []
    for c in candidates:
        reasons = feasibility(c)
        rec = dict(c)
        rec["voi"] = voi(c)
        if reasons:
            rec["rejected"] = reasons
            rejected.append(rec)
        else:
            scored.append(rec)
    # bandit prior: small additive bonus from downstream reward
    rewards = (bandit or {}).get("families", {})
    for rec in scored:
        r = rewards.get(rec.get("family") or "", {})
        rec["bandit_reward"] = r.get("reward", 0.0)
        rec["bandit_n"] = r.get("merged", 0)
        rec["score"] = round(rec["voi"] + 0.25 * rec["bandit_reward"], 4)
    scored.sort(key=lambda r: (-r["score"], r.get("repo") or ""))
    pick = None
    mode = "exploit"
    if scored:
        if is_exploration_night(night_index):
            mode = "explore"
            pick = min(scored, key=lambda r: (r["bandit_n"], -r["score"]))
        else:
            pick = scored[0]
    return {"pick": pick, "mode": mode, "scored": scored,
            "rejected": rejected}


def compute_bandit(events, now=None):
    now = now or datetime.now(timezone.utc)
    fams = {}
    for e in events:
        ts = parse_ts(e.get("ts"))
        if not ts or now - ts > timedelta(days=30) or ts > now:
            continue
        fam = e.get("family") or "unknown"
        d = fams.setdefault(fam, {"merged": 0, "citation": 0, "re-run": 0,
                                  "import": 0, "revert": 0})
        kind = e.get("event")
        if kind in d:
            d[kind] += 1
        elif kind == "merge":
            d["merged"] += 1
    for d in fams.values():
        d["reward"] = round((d["citation"] + d["re-run"] + d["import"]
                             - 2 * d["revert"]) / max(1, d["merged"]), 4)
    return {"generated_at": now.isoformat(timespec="seconds"),
            "window_days": 30, "families": fams}


def load_events(path):
    events = []
    if os.path.exists(path):
        with open(path) as f:
            for line in f:
                line = line.strip()
                if line:
                    try:
                        events.append(json.loads(line))
                    except ValueError:
                        pass
    return events


def main(argv=None):
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("score")
    s.add_argument("--census", required=True)
    s.add_argument("--night", type=int, default=None)
    s.add_argument("--bandit", default=None)
    u = sub.add_parser("update-bandit")
    u.add_argument("--events", default="state/artifact-events.jsonl")
    u.add_argument("--out", default="state/bandit-rewards.json")
    u.add_argument("--now", default=None)
    args = ap.parse_args(argv)
    if args.cmd == "score":
        bandit = None
        if args.bandit and os.path.exists(args.bandit):
            bandit = json.load(open(args.bandit))
        result = select(census_candidates(args.census), bandit, args.night)
        result["census"] = args.census
        print(json.dumps(result, indent=2, sort_keys=True))
        return 0
    if args.cmd == "update-bandit":
        now = parse_ts(args.now) if args.now else None
        table = compute_bandit(load_events(args.events), now)
        with open(args.out, "w") as f:
            json.dump(table, f, indent=2, sort_keys=True)
            f.write("\n")
        print(json.dumps(table, sort_keys=True))
        return 0
    return 2


if __name__ == "__main__":
    sys.exit(main())
