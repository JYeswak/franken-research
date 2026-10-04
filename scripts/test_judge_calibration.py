#!/usr/bin/env python3
"""Unit tests for scripts/judge-calibration.py (fr-o8i)."""
import importlib.util
import json
import os
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))


def _load():
    spec = importlib.util.spec_from_file_location(
        "judge_calibration", os.path.join(HERE, "judge-calibration.py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


JC = _load()


def test_frozen_set_shape():
    data = JC.frozen_set()
    items = data["items"]
    assert 30 <= len(items) <= 50
    assert any(i["category"] == "edge" for i in items)
    assert {i["label"] for i in items} == {"green", "revise"}


def test_kappa_extremes():
    labels = ["green", "revise", "green", "revise", "green"]
    assert JC.cohens_kappa(labels, labels) == 1.0
    flipped = ["revise", "green", "revise", "green", "revise"]
    assert JC.cohens_kappa(labels, flipped) < -0.9


def test_kappa_chance_level():
    labels = ["green", "green", "revise", "revise"] * 4
    preds = ["green", "revise", "green", "revise"] * 4
    assert abs(JC.cohens_kappa(labels, preds)) < 0.05


def test_perfect_lane_scores_full_bar():
    data = JC.frozen_set()
    preds = {i["id"]: i["label"] for i in data["items"]}
    _l, _p, s = JC.score_set(preds, data)
    assert s["kappa"] == 1.0 and s["passes_bar"]
    assert s["precision"] == {"green": 1.0, "revise": 1.0}
    assert s["recall"] == {"green": 1.0, "revise": 1.0}


def test_always_revise_lane_fails_bar():
    data = JC.frozen_set()
    preds = {i["id"]: "revise" for i in data["items"]}
    _l, _p, s = JC.score_set(preds, data)
    assert not s["passes_bar"]


def test_edge_items_present_from_receipts():
    data = JC.frozen_set()
    edges = [i for i in data["items"] if i["category"] == "edge"]
    assert any("inconsistent" in i["label_rationale"] or
               "deterministic" in i["label_rationale"] or
               "Grader-bug" in i["label_rationale"] or
               "trap" in i["label_rationale"].lower() for i in edges)


def test_judge_version_is_content_pinned():
    a = JC.judge_version(prompt_text="prompt A")
    b = JC.judge_version(prompt_text="prompt A")
    c = JC.judge_version(prompt_text="prompt B")
    assert a == b and a != c and a.startswith("judge-v1-")


def test_gate_blocks_needs_calibration():
    g = JC.can_auto_merge({"lanes": {}}, "groq/openai/gpt-oss-20b",
                          JC.judge_version(prompt_text="p"))
    assert not g["auto_merge_allowed"]
    assert g["default_action"] == "revise/escalate"


def test_gate_allows_calibrated_lane():
    v = JC.judge_version(prompt_text="p")
    reg = {"lanes": {"groq/openai/gpt-oss-20b":
                     {"judge_version": v, "kappa": 0.9}}}
    g = JC.can_auto_merge(reg, "groq/openai/gpt-oss-20b", v)
    assert g["auto_merge_allowed"] and g["default_action"] == "auto-merge"


def test_gate_blocks_stale_version():
    v_new = JC.judge_version(prompt_text="p2")
    reg = {"lanes": {"groq/openai/gpt-oss-20b":
                     {"judge_version": JC.judge_version(prompt_text="p1"),
                      "kappa": 0.99}}}
    g = JC.can_auto_merge(reg, "groq/openai/gpt-oss-20b", v_new)
    assert not g["auto_merge_allowed"]


def test_gate_blocks_below_bar():
    v = JC.judge_version(prompt_text="p")
    reg = {"lanes": {"groq/openai/gpt-oss-20b":
                     {"judge_version": v, "kappa": 0.5}}}
    g = JC.can_auto_merge(reg, "groq/openai/gpt-oss-20b", v)
    assert not g["auto_merge_allowed"]


def test_stamp_verdict_fields():
    v = JC.stamp_verdict({"verdict": "green"}, "groq/openai/gpt-oss-20b",
                         "judge-v1-abc")
    assert v["judge_version"] == "judge-v1-abc"
    assert v["serving_lane"] == "groq/openai/gpt-oss-20b"


def test_registry_roundtrip():
    data = JC.frozen_set()
    preds = {i["id"]: i["label"] for i in data["items"]}
    v = JC.judge_version(prompt_text="p")
    _l, _p, sc = JC.score_set(preds, data)
    sc["judge_version"] = v
    sc["prediction_kind"] = JC.PREDICTION_KIND
    reg = {"schema": "franken-research/judge-calibration-registry@1",
           "bead": "fr-o8i", "judge_version": v,
           "prediction_kind": JC.PREDICTION_KIND,
           "frozen_set": "judge-calibration-set.json",
           "lanes": {"groq/openai/gpt-oss-20b": sc}}
    f = tempfile.NamedTemporaryFile("w", suffix=".json", delete=False)
    json.dump(reg, f)
    f.close()
    g = JC.can_auto_merge(JC.load_json(f.name), "groq/openai/gpt-oss-20b", v)
    assert g["auto_merge_allowed"]

def test_lane_scores_groq_below_bar():
    report = JC.lane_scores_from_set()
    groq = report["lanes"]["groq/openai/gpt-oss-20b"]
    # Verifier-reproduced headline: n=19, kappa 0.406, below the 0.6 bar.
    assert groq["n"] == 19
    assert abs(groq["kappa"] - 0.4062) < 0.001
    assert groq["precision"]["green"] == 0.7647
    assert groq["recall"]["revise"] == 0.3333
    assert not groq["passes_bar"] and not groq["kappa_meets_bar"]
    sens = groq["sensitivity_excluding_expected_decision"]
    assert sens["n"] == 14 and sens["kappa"] < JC.KAPPA_BAR


def test_lane_scores_partial_coverage_never_grants():
    report = JC.lane_scores_from_set()
    nvidia = report["lanes"]["nvidia/z-ai/glm-5.3-flash"]
    assert nvidia["n"] == 1 and nvidia["kappa"] == 1.0
    assert not nvidia["coverage_complete"] and not nvidia["passes_bar"]
    assert "fleet/bulk-tier" in report["non_lane_groups"]
    assert "fleet/bulk-tier" not in report["lanes"]
    assert report["excluded_missing_raw_verdict"] == 4


def test_gate_blocks_partial_coverage_entry():
    v = JC.judge_version(prompt_text="p")
    reg = {"lanes": {"nvidia/z-ai/glm-5.3-flash":
                     {"judge_version": v, "kappa": 1.0,
                      "coverage_complete": False, "n": 1, "n_set": 32}}}
    g = JC.can_auto_merge(reg, "nvidia/z-ai/glm-5.3-flash", v)
    assert not g["auto_merge_allowed"]
    assert any("partial frozen-set coverage" in r for r in g["reasons"])

