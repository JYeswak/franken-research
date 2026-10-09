# Calibration fixture — intentional drift (fr-y3s)

This directory is a NEGATIVE calibration fixture for the candidate-shape
gate, not a nightly candidate that must conform. Its test.py re-executes
exit 0 while execution.json records exit 1 by design, so
`scripts/candidate-shape.py` reports DRIFT here on purpose.

`find_candidates()` excludes any directory containing this marker file;
`cmd_verify` reports excluded fixtures in its summary line. Do not "fix"
the drift — the drift is the fixture.
