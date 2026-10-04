# Quarterly refresh Q4-2026 — currency drift triage for 5 skills (fr-6rv)

Date: 2026-10-03 (America/Denver). Triage of the 5 `changed` flags from
`pipeline/bin/sweep-currency.sh --slice 50` (fr-m5m first quarterly pass).
Source rows: `skill-library-growth/runs/2026-10-03/sweep/proposals.json`
(skill-library-growth repo). Wave 1 measures-and-alerts only: no skill
under `/Users/josh/.claude/skills` was modified by this triage; only
reads (`grep`/`sed`/version probes and one upstream `git ls-remote`)
were performed. Publishing OFF.

## How the sweep flags a skill (why triage is needed)

`sweep-currency.sh` picks a skill's "primary tool" as the first known
tool named in a code span, shell line, or bare-word mention, then takes
the first version-like number (`\d+\.\d+(\.\d+)?`) within 120 characters
after the first tool mention that has one, and compares its major.minor
to `tool --version`. Any nearby number — an IP address, a gamma value,
an example argument — becomes the "cited version". Each flag below was
reproduced by re-running that exact heuristic against the live
`SKILL.md` and then reading the cited window in context.

Observed tool versions at triage time (2026-10-03): python3 3.14.5,
curl 8.7.1, git 2.50.1, ffmpeg 8.1.1 — matching the sweep's observed
values, so the sweep inputs are reproducible today; the question is
only what the cited numbers mean.

## Dispositions

### 1. agent-lifecycle — FALSE POSITIVE (no drift)

- proposals.json: tool `python3`, cited `2.1.0` != observed `3.14.5`,
  `primary_tool_source: bare-word mention`, status `changed`.
- What `2.1.0` actually is: an example deployed-agent version in
  `/Users/josh/.claude/skills/agent-lifecycle/SKILL.md:63` —
  `python3 .../lifecycle_manager.py --deploy --agent-id agent-007
  --version 2.1.0 --strategy canary`. The same example recurs in the
  version-schema illustration (`agent-007@2.1.0`, line 95).
- No python3 version is cited or required anywhere in the skill (the
  frontmatter `version: 1.0.0` is the skill's own version). Python
  3.14.5 contradicts nothing. **No refresh proposal.**

### 2. agent-mail — FALSE POSITIVE (no drift)

- proposals.json: tool `curl`, cited `127.0.0` != observed `8.7.1`,
  `primary_tool_source: code span curl http://127.0.0.1:8765/health`,
  status `changed`.
- What `127.0.0` actually is: the first three octets of the loopback
  IP in the health-check URL (`curl http://127.0.0.1:8765/health`,
  SKILL.md lines 132, 139, 227). The heuristic's version regex matched
  the IP address, not a curl version.
- No curl version is cited anywhere in the skill. **No refresh
  proposal.**

### 3. agentic-coding-flywheel-setup — TRUE DRIFT (misattributed by the sweep)

- proposals.json: tool `curl`, cited `0.6.0` != observed `8.7.1`,
  `primary_tool_source: code span curl | bash`, status `changed`.
- The curl comparison is meaningless (0.6.0 is not a curl version), but
  the number itself is a real pin — of the skill's own subject, ACFS:
  `ACFS_REF=v0.6.0` is the pinned-release example at SKILL.md lines 20,
  41 (`.../agentic_coding_flywheel_setup/v0.6.0/install.sh`), and 171.
- Upstream has moved: `git ls-remote --tags
  https://github.com/Dicklesworthstone/agentic_coding_flywheel_setup.git`
  and the GitHub tags API (both checked 2026-10-03) list v0.7.0,
  v0.8.0, v0.9.0, and v0.10.0 after v0.6.0. A user following the
  pinned-install example today installs a four-releases-old ACFS.
- **Refresh proposal recorded:** bead **fr-gmj** — review ACFS
  v0.7.0–v0.10.0 for install-flow impact and propose an updated pin;
  library untouched until Josh approves (Wave 1).

### 4. ai-model-into-rust-mega-fused-hyper-kernel — FALSE POSITIVE (no drift)

- proposals.json: tool `git`, cited `0.7.2` != observed `2.50.1`,
  `primary_tool_source: code span git ls-remote`, status `changed`.
- What `0.7.2` actually is: a provenance tag of the source corpus the
  skill was distilled from — SKILL.md lines 529–530: "franken_ocr git
  history (591 commits through 2026-08-04; kickoff `9b38939`, v0.7.2
  `c22653e`)". The word `git` in that sentence is what put `v0.7.2`
  inside the heuristic's 120-character window.
- This is an intentional historical pin (the corpus snapshot the skill
  was distilled from), not a claim about the git tool's version, and it
  should stay as-is for provenance. **No refresh proposal.**

### 5. ascii-video — FALSE POSITIVE (no drift)

- proposals.json: tool `ffmpeg`, cited `0.75` != observed `8.1.1`,
  `primary_tool_source: bare-word mention`, status `changed`.
- What `0.75` actually is: the default gamma of the `tonemap()`
  function — SKILL.md line 167 `def tonemap(canvas, gamma=0.75)` and
  line 177 "Per-scene gamma: default 0.75, solarize 0.55, …". It fell
  within 120 characters after the `ffmpeg` mention at the end of the
  pipeline line (line 175).
- No ffmpeg version is cited or required anywhere in the skill; the
  only version floor in the skill is Python 3.10+ (line 52), satisfied
  by the observed Python 3.14.5. **No refresh proposal.**

## Summary

| Skill | Sweep claim | Triage | Action |
|---|---|---|---|
| agent-lifecycle | python3 2.1.0 != 3.14.5 | False positive — example agent version | none |
| agent-mail | curl 127.0.0 != 8.7.1 | False positive — loopback IP octets | none |
| agentic-coding-flywheel-setup | curl 0.6.0 != 8.7.1 | True drift, misattributed — ACFS pin v0.6.0 vs upstream v0.10.0 | refresh proposal bead fr-gmj |
| ai-model-into-rust-mega-fused-hyper-kernel | git 0.7.2 != 2.50.1 | False positive — franken_ocr provenance tag | none |
| ascii-video | ffmpeg 0.75 != 8.1.1 | False positive — tonemap gamma default | none |

4 of 5 flags are heuristic false positives; 1 is true drift in the
skill's subject matter that the sweep happened to surface under the
wrong tool name. The one true-drift skill has a refresh proposal
recorded (fr-gmj). Heuristic note for future sweeps: version-like
tokens that are IP octets, example arguments, or non-tool parameters
will keep producing this class of flag — the 120-character
cited-version window is the root cause.
