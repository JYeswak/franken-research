#!/usr/bin/env python3
"""judge-calibration.py - Judge calibration harness (fr-o8i).

A Stage C verdict decides auto-merge, but judge trust is lane-dependent:
the same rubric on a different fleet lane can disagree. This harness
freezes a labelled reference set of real past verdicts, scores each
fleet lane against it (Cohen's kappa, precision, recall), pins a judge
version, and gates auto-merge on current calibration.

Pieces:
  * frozen set        scripts/judge-calibration-set.json (committed)
  * judge version     `judge_version()` - a hash of judge prompt +
                      decoding; any change bumps the version and
                      invalidates prior calibration
  * metrics           kappa / per-class precision / recall, computed
                      from labels in the set vs lane predictions
  * registry          scripts/judge-calibration-registry.json (the repo
                      copy) and, driver-side, FN/judge-calibration.json
                      where the nightly reads lane grants
  * gate              `can_auto_merge(lane, judge_version)`: only a
                      lane whose current calibration kappa >= 0.6 may
                      auto-merge; anything else defaults revise/escalate

The nightly driver (franken-nightly/bin/evaluate.py) imports nothing
from here - it carries the same gate rule inline - but every Stage C
verdict is stamped via the same version derivation so the stamps agree.
No network, no model calls: calibration runs offline against the frozen
set or replays; re-runs are deterministic.

Usage:
  python3 scripts/judge-calibration.py validate
  python3 scripts/judge-calibration.py stats  --predictions P.json
  python3 scripts/judge-calibration.py report --predictions P.json \
      [--registry PATH] [--grant PATH]
  python3 scripts/judge-calibration.py judger [--raw] [--stamp] FILE.json
  python3 scripts/judge-calibration.py gate --lane L [--judge-version V]
      [--registry PATH]
"""
import argparse
import hashlib
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_SET = os.path.join(HERE, "judge-calibration-set.json")
DEFAULT_REGISTRY = os.path.join(HERE, "judge-calibration-registry.json")

KAPPA_BAR = 0.6  # bead starting bar; tightening is a later decision bead
CLASSES = ("green", "revise")
PREDICTION_KIND = "deterministic-rules (evaluate.md rules 1-4)"


def load_json(path):
    with open(path) as f:
        return json.load(f)


def sha256_text(text):
    return hashlib.sha256(text.encode()).hexdigest()


def judge_version(prompt_text=None, prompt_sha=None, decoding=None):
    """Pinned judge version: a hash of everything that defines the
    instrument. Change the prompt, rubric, or decoding and every prior
    calibration is invalidated by construction."""
    if prompt_sha is None:
        if prompt_text is None:
            raise ValueError("judge_version needs prompt_text or prompt_sha")
        prompt_sha = sha256_text(prompt_text)
    dec = decoding or {"temperature": 0, "max_tokens": 16000}
    payload = json.dumps({"prompt_sha256": prompt_sha, "decoding": dec},
                         sort_keys=True)
    return "judge-v1-" + hashlib.sha256(payload.encode()).hexdigest()[:12]


def frozen_set(path=DEFAULT_SET):
    data = load_json(path)
    items = data.get("items") or []
    if not 30 <= len(items) <= 50:
        raise ValueError("frozen set must hold 30-50 items, has %d" % len(items))
    seen = set()
    for it in items:
        if it["id"] in seen:
            raise ValueError("duplicate frozen item id " + it["id"])
        seen.add(it["id"])
        if it["label"] not in CLASSES:
            raise ValueError("item %s has bad label %r" % (it["id"], it["label"]))
        for f in ("reproduced", "fair_baseline"):
            if f not in it["features"]:
                raise ValueError("item %s missing feature %s" % (it["id"], f))
    return data


def derived_verdict(features):
    """evaluate.md deterministic decision rules 1-4 (the label rubric)."""
    if features["reproduced"] and features["fair_baseline"] \
            and not features.get("blocking_issue_count"):
        return "green"
    return "revise"


def cohens_kappa(labels, preds, classes=CLASSES):
    """Cohen's kappa. Degenerate single-class case: perfect agreement is
    1.0, disagreement with no chance-agreement signal is 0.0."""
    n = len(labels)
    if n == 0:
        return 0.0
    po = sum(1 for a, b in zip(labels, preds) if a == b) / n
    pe = 0.0
    for c in classes:
        pe += (labels.count(c) / n) * (preds.count(c) / n)
    if pe >= 1.0:
        return 1.0 if po >= 1.0 else 0.0
    return (po - pe) / (1.0 - pe)


def class_metrics(labels, preds, cls):
    tp = sum(1 for a, b in zip(labels, preds) if a == cls and b == cls)
    fp = sum(1 for a, b in zip(labels, preds) if a != cls and b == cls)
    fn = sum(1 for a, b in zip(labels, preds) if a == cls and b != cls)
    return {"precision": 0.0 if tp + fp == 0 else tp / (tp + fp),
            "recall": 0.0 if tp + fn == 0 else tp / (tp + fn)}


def disagreement_verdict():
    return "revise"


def score(lane, labels, preds):
    kappa = cohens_kappa(labels, preds)
    return {
        "lane": lane,
        "n": len(labels),
        "agreement": sum(1 for a, b in zip(labels, preds) if a == b) / max(1, len(labels)),
        "kappa": round(kappa, 4),
        "bar": KAPPA_BAR,
        "passes_bar": kappa >= KAPPA_BAR,
        "precision": {c: round(class_metrics(labels, preds, c)["precision"], 4) for c in CLASSES},
        "recall": {c: round(class_metrics(labels, preds, c)["recall"], 4) for c in CLASSES},
    }


def score_set(predmap, data=None):
    """predmap: {item_id: predicted_verdict}; returns the score block."""
    data = data or frozen_set()
    labels, preds = [], []
    for it in data["items"]:
        labels.append(it["label"])
        preds.append(predmap.get(it["id"], disagreement_verdict()))
    return labels, preds, score("frozen-set", labels, preds)


def lane_registry(registry):
    """Registry lanes keyed by provider/model lane string."""
    return {lane: rec for lane, rec in (registry.get("lanes") or {}).items()}


def current_entry(registry, lane):
    return lane_registry(registry).get(lane)


def can_auto_merge(registry, lane, version):
    """The enforcement rule: a lane with no current calibration under
    the serving judge version - or a calibration below the kappa bar -
    cannot auto-merge; its verdicts default to revise/escalate."""
    e = current_entry(registry, lane)
    reasons = []
    if not e:
        reasons.append("no calibration on file for lane %s" % lane)
    else:
        if e.get("judge_version") != version:
            reasons.append("calibration pins judge version %s, serving %s"
                           % (e.get("judge_version"), version))
        if (e.get("kappa") or 0) < KAPPA_BAR:
            reasons.append("kappa %.4f below bar %.1f" % (e.get("kappa") or 0, KAPPA_BAR))
    return {"lane": lane, "judge_version": version,
            "auto_merge_allowed": not reasons,
            "default_action": "auto-merge" if not reasons else "revise/escalate",
            "reasons": reasons}


def stamp_verdict(verdict, lane, version, registry_entries=None):
    """Stamp a Stage C verdict dict with judge-version + serving lane,
    in place, and apply the calibration gate to its mergeability."""
    stamped = dict(verdict or {})
    stamped["judge_version"] = version
    stamped["serving_lane"] = lane
    stamped["calibration"] = dict((registry_entries or {}).get(lane) or {})
    return stamped


def cmd_validate(args):
    data = frozen_set(args.set)
    items = data["items"]
    print(json.dumps({
        "items": len(items),
        "green": sum(1 for i in items if i["label"] == "green"),
        "revise": sum(1 for i in items if i["label"] == "revise"),
        "edge": sum(1 for i in items if i["category"] == "edge"),
        "categories": sorted({i["category"] for i in items}),
        "sources": sorted({i["source"].split(":")[0] for i in items}),
    }, indent=2))
    return 0


def _predictions(args):
    pred = load_json(args.predictions)
    if isinstance(pred, dict):
        return pred
    raise ValueError("predictions must be a {item_id: verdict} map")


def cmd_stats(args):
    preds = _predictions(args)
    _labels, _preds, s = score_set(preds, frozen_set(args.set))
    print(json.dumps(s, indent=2))
    return 0


def cmd_report(args):
    data = frozen_set(args.set)
    preds = _predictions(args)
    labels, preds_list, s = score_set(preds, data)
    reg = {"schema": "franken-research/judge-calibration-registry@1",
           "bead": "fr-o8i", "judge_version": args.judge_version,
           "prediction_kind": PREDICTION_KIND,
           "frozen_set": os.path.basename(args.set), "lanes": {}}
    sc = dict(s)
    sc["judge_version"] = args.judge_version
    sc["prediction_kind"] = PREDICTION_KIND
    reg["lanes"][args.lane] = sc
    out = args.registry or DEFAULT_REGISTRY
    with open(out, "w") as f:
        json.dump(reg, f, indent=2)
    if args.grant:
        with open(args.grant, "w") as f:
            json.dump({"lanes": {args.lane: sc}}, f, indent=2)
    print(json.dumps(sc, indent=2))
    print("registry written to", out)
    return 0


def cmd_gate(args):
    reg = load_json(args.registry) if args.registry else {"lanes": {}}
    print(json.dumps(can_auto_merge(reg, args.lane, args.judge_version),
                     indent=2))
    return 0


def cmd_judge_version(args):
    text = args.text
    if args.raw and text:
        print(sha256_text(text))
    else:
        print(judge_version(prompt_text=text) if text else
              judge_version(prompt_sha=args.prompt_sha))
    return 0


def main():
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = p.add_subparsers(dest="cmd", required=True)
    for name in ("validate", "stats", "report", "gate"):
        sp = sub.add_parser(name)
    sub.choices["validate"].add_argument("--set", default=DEFAULT_SET)
    sub.choices["stats"].add_argument("--predictions", required=True)
    sub.choices["stats"].add_argument("--set", default=DEFAULT_SET)
    r = sub.choices["report"]
    r.add_argument("--predictions", required=True)
    r.add_argument("--lane", required=True)
    r.add_argument("--judge-version", required=True)
    r.add_argument("--registry")
    r.add_argument("--grant")
    r.add_argument("--set", default=DEFAULT_SET)
    g = sub.choices["gate"]
    g.add_argument("--lane", required=True)
    g.add_argument("--judge-version", required=True)
    g.add_argument("--registry")
    jv = sub.add_parser("judger")
    jv.add_argument("--text")
    jv.add_argument("--prompt-sha")
    jv.add_argument("--raw", action="store_true")
    args = p.parse_args()
    return {"validate": cmd_validate, "stats": cmd_stats,
            "report": cmd_report, "gate": cmd_gate,
            "judger": cmd_judge_version}[args.cmd](args)


if __name__ == "__main__":
    sys.exit(main())
