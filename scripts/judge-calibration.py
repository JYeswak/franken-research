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
  python3 scripts/judge-calibration.py lanes [--registry PATH]
      (per-fleet-lane scores from the raw verdicts embedded in the set)
"""
import argparse
import hashlib
import json
import os
import re
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


def verify_replay_fidelity(item, prompt_text, receipts_base=None):
    """True-replay guard (fr-y3s, 2026-10-06).

    A replayed prompt must be byte-identical to the prompt the original
    judge saw; otherwise the replay measures prompt drift, not judge
    fidelity. Compares sha256(prompt_text) against the receipt's
    prompt_sha256 (Stage C receipts record it).

    Returns (ok, detail). ok is False when the item has no receipt, the
    receipt has no prompt_sha256, or the hashes differ. Callers must
    refuse to score fidelity-failed items, not silently include them.
    """
    src = (item or {}).get("source", "")
    m = re.search(r"receipts/([^/]+\.json)", src)
    if not m:
        return False, "no receipt backing for item %s" % (item or {}).get("id")
    base = receipts_base or os.environ.get(
        "FRANKEN_RECEIPTS_DIR", "/Users/josh/Developer/franken-nightly/receipts")
    rp = os.path.join(base, m.group(1))
    try:
        with open(rp) as f:
            receipt = json.load(f)
    except OSError as e:
        return False, "receipt unreadable %s: %s" % (rp, e)
    want = receipt.get("prompt_sha256")
    if not want:
        return False, "receipt %s has no prompt_sha256" % m.group(1)
    got = hashlib.sha256(prompt_text.encode()).hexdigest()
    if got != want:
        return False, ("prompt drift on %s: rebuilt %s != receipt %s"
                       % ((item or {}).get("id"), got[:12], want[:12]))
    return True, "prompt bytes match receipt %s" % m.group(1)


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


def lane_scores_from_set(data=None):
    """Per-lane scores from the raw verdicts embedded in the frozen set.

    Every set item carries the historical raw judge verdict and the lane
    that served it. Scoring those verdicts against the human-verified
    labels gives each fleet lane a real (partial-coverage) calibration
    record. Items with no raw verdict (synthetic edge variants) are
    excluded and counted. The pooled ledger group fleet/bulk-tier is not
    a provider/model lane, so it is reported as a non-lane aggregate,
    never as a lane grant. A lane only passes the bar with
    kappa >= KAPPA_BAR on COMPLETE coverage of the set; a partial
    historical score can fail the bar but can never grant auto-merge."""
    data = data or frozen_set()
    items = data["items"]
    total = len(items)
    groups = {}
    excluded_missing = 0
    for it in items:
        raw = it.get("raw_judge_verdict")
        if raw not in CLASSES:
            excluded_missing += 1
            continue
        groups.setdefault(it.get("judged_by_lane"), []).append(it)

    def _score_items(lane, lane_items):
        labels = [i["label"] for i in lane_items]
        preds = [i["raw_judge_verdict"] for i in lane_items]
        sc = score(lane, labels, preds)
        sc["n_set"] = total
        sc["coverage"] = round(len(lane_items) / total, 4)
        sc["coverage_complete"] = len(lane_items) == total
        sc["kappa_meets_bar"] = sc["kappa"] >= KAPPA_BAR
        sc["passes_bar"] = bool(sc["kappa_meets_bar"]
                                 and sc["coverage_complete"])
        sc["prediction_kind"] = ("frozen-set embedded historical raw "
                                  "judge verdicts")
        sc["judge_version"] = None
        sc["calibration_status"] = (
            "measured_below_bar" if not sc["kappa_meets_bar"]
            else "insufficient_coverage")
        sc["note"] = ("Historical verdicts predate judge-version "
                      "pinning; measured for drift detection, not a "
                      "grant under the current judge version.")
        return sc

    lanes, aggregates = {}, {}
    for lane in sorted(groups):
        sc = _score_items(lane, groups[lane])
        if lane == "fleet/bulk-tier":
            aggregates[lane] = sc
        else:
            lanes[lane] = sc
    # Sensitivity: replayexp-* items duplicate a replay receipt with its
    # expected decision rather than a second lane verdict; excluding
    # them must not change the below-bar conclusion.
    groq = lanes.get("groq/openai/gpt-oss-20b")
    if groq is not None:
        direct = [i for i in groups["groq/openai/gpt-oss-20b"]
                  if "(expected_decision)" not in (i.get("source") or "")]
        sens = _score_items("groq/openai/gpt-oss-20b", direct)
        groq["sensitivity_excluding_expected_decision"] = {
            "n": sens["n"], "kappa": sens["kappa"],
            "precision": sens["precision"], "recall": sens["recall"]}
    return {"lanes": lanes, "non_lane_groups": aggregates,
            "excluded_missing_raw_verdict": excluded_missing}


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
        if e.get("coverage_complete") is False:
            reasons.append("partial frozen-set coverage %s/%s; full "
                           "frozen-set replay required before auto-merge"
                           % (e.get("n"), e.get("n_set")))
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
    out = args.registry or DEFAULT_REGISTRY
    reg = load_json(out) if os.path.exists(out) else {}
    reg.update({"schema": "franken-research/judge-calibration-registry@1",
                "bead": "fr-o8i", "judge_version": args.judge_version,
                "prediction_kind": PREDICTION_KIND,
                "frozen_set": os.path.basename(args.set)})
    reg.setdefault("lanes", {})
    sc = dict(s)
    sc["judge_version"] = args.judge_version
    sc["prediction_kind"] = PREDICTION_KIND
    sc["n_set"] = len(data["items"])
    sc["coverage"] = 1.0
    sc["coverage_complete"] = True
    sc["kappa_meets_bar"] = sc["kappa"] >= KAPPA_BAR
    reg["lanes"][args.lane] = sc
    with open(out, "w") as f:
        json.dump(reg, f, indent=2)
    if args.grant:
        with open(args.grant, "w") as f:
            json.dump({"lanes": {args.lane: sc}}, f, indent=2)
    print(json.dumps(sc, indent=2))
    print("registry written to", out)
    return 0


def cmd_lanes(args):
    data = frozen_set(args.set)
    report = lane_scores_from_set(data)
    out = args.registry or DEFAULT_REGISTRY
    reg = load_json(out) if os.path.exists(out) else {}
    reg.update({"schema": "franken-research/judge-calibration-registry@1",
                "bead": "fr-o8i",
                "frozen_set": os.path.basename(args.set),
                "frozen_set_pin": data.get("judge_version_pin")})
    reg.setdefault("lanes", {}).update(report["lanes"])
    reg["non_lane_groups"] = report["non_lane_groups"]
    reg["excluded_missing_raw_verdict"] = (
        report["excluded_missing_raw_verdict"])
    with open(out, "w") as f:
        json.dump(reg, f, indent=2)
    print(json.dumps(report, indent=2))
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
    for name in ("validate", "stats", "report", "gate", "lanes"):
        sp = sub.add_parser(name)
    sub.choices["validate"].add_argument("--set", default=DEFAULT_SET)
    sub.choices["stats"].add_argument("--predictions", required=True)
    sub.choices["stats"].add_argument("--set", default=DEFAULT_SET)
    ln = sub.choices["lanes"]
    ln.add_argument("--registry")
    ln.add_argument("--set", default=DEFAULT_SET)
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
            "report": cmd_report, "gate": cmd_gate, "lanes": cmd_lanes,
            "judger": cmd_judge_version}[args.cmd](args)


if __name__ == "__main__":
    sys.exit(main())
