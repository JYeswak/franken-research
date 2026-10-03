#!/bin/sh
# init.sh — the single starting point for a FrankenSuite-style project.
# Usage: sh /path/to/starter-kit/scripts/init.sh [target-dir]
#        (target-dir defaults to the current directory)
#        KIT_NO_GIT=1 sh .../init.sh [target-dir]   # skip the automatic git init
# Creates the folder layout, evidence ledgers, checklist beads, the
# honesty pre-commit hook, and the CI backstop workflow. POSIX sh only;
# no dependencies beyond sh, awk, grep, sed, cp, mkdir, chmod, date, cat,
# printf (git optional but strongly recommended, beads CLI optional).
# Re-run preserves working files; the live Git hook is reinstalled from the tracked copy.
set -eu

KIT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
TARGET_IN="${1:-.}"
mkdir -p "$TARGET_IN"
TARGET=$(CDPATH= cd -- "$TARGET_IN" && pwd)

say() { printf '%s\n' "$*"; }

# copy kit file $1 to target-relative $2, unless it already exists
# or source and destination are the same file (running inside the kit itself)
copy_new() {
  if [ "$KIT_DIR/$1" = "$TARGET/$2" ]; then return 0; fi
  if [ -f "$TARGET/$2" ]; then
    say "  keep: $2 already exists"
  else
    cp "$KIT_DIR/$1" "$TARGET/$2"
  fi
}

say "starter-kit: initializing in $TARGET"

# 0. git: the pre-commit honesty gate is inert without a repository.
#    Initialize one when safe; the user can opt out with KIT_NO_GIT=1.
if [ ! -d "$TARGET/.git" ]; then
  if [ "${KIT_NO_GIT:-}" = "1" ]; then
    say "  KIT_NO_GIT=1: skipping git init — the honesty hook will be inert until you init a repo."
  elif command -v git >/dev/null 2>&1; then
    git -C "$TARGET" init -q
    say "  git init (the pre-commit honesty gate needs a repo; KIT_NO_GIT=1 to skip)"
  else
    say "  WARNING: git not found; the pre-commit honesty gate is inert without a repository."
  fi
fi

# 0b. A repo without an identity cannot commit: warn before the user finds
#     out from git's "Author identity unknown" on their first commit.
if command -v git >/dev/null 2>&1 && [ -d "$TARGET/.git" ]; then
  if ! git -C "$TARGET" config user.name >/dev/null 2>&1 || \
     ! git -C "$TARGET" config user.email >/dev/null 2>&1; then
    say "  WARNING: git user.name/user.email are not set — your first commit will fail."
    say '           Set them, e.g.: git config --global user.name "Your Name"'
    say '                           git config --global user.email "you@example.com"'
  fi
fi

# 1. Folder layout
for d in docs/planning docs/evidence docs scripts .beads .githooks registries templates .github/workflows; do
  mkdir -p "$TARGET/$d"
done

# 2. The executable part of the kit
for s in check-readiness.sh check-claim-discipline.sh check-ledger.sh; do
  copy_new "scripts/$s" "scripts/$s"
  chmod +x "$TARGET/scripts/$s"
done
# Optional maintained decisions: installed without executing Python or creating
# empty records. Existing user-owned scripts/docs remain untouched on re-run.
for s in check-decisions.py review-decisions.py; do
  copy_new "scripts/$s" "scripts/$s"
done
copy_new DECISIONS.md docs/DECISIONS.md

# 3. Pre-commit honesty hook: tracked copy + live install.
#    (franken_whisper: the hook lives in the repo; frankensearch/frankenscipy:
#    hooks are enforced, exit 2 blocks.)
#    Design: .githooks/pre-commit is the TRACKED source of truth — edit this
#    one. .git/hooks/pre-commit is the LIVE copy git actually executes.
#    Re-running this script reinstalls the live copy (idempotent).
copy_new scripts/hooks/pre-commit .githooks/pre-commit
chmod +x "$TARGET/.githooks/pre-commit"
if [ -d "$TARGET/.git" ]; then
  cp "$TARGET/.githooks/pre-commit" "$TARGET/.git/hooks/pre-commit"
  say "  hook installed live in .git/hooks/pre-commit (tracked source of truth: .githooks/pre-commit)"
else
  say "  note: no .git here (KIT_NO_GIT=1 or git missing); tracked hook is at .githooks/pre-commit"
  say "        copy it to .git/hooks/pre-commit after 'git init' — until then the honesty gate is inert"
fi

# 3b. Agent instructions + Definition of Done (CHECKLIST.md A9, A8).
#     Installed as working copies; tailor them, but keep the 12 patterns
#     verbatim and the command-evidence rule intact.
copy_new templates/agents.md AGENTS.md
copy_new templates/definition-of-done.md docs/definition-of-done.md

# 4. Templates -> working copies, plus reference copies under templates/
copy_new templates/planning-packet.md docs/planning/packet.md
copy_new templates/claims.tsv registries/claims.tsv
copy_new templates/demotion-rules.md docs/evidence/demotion-rules.md
copy_new templates/negative-evidence-entry.md templates/negative-evidence-entry.md
copy_new templates/agents.md templates/agents.md
copy_new templates/definition-of-done.md templates/definition-of-done.md
copy_new templates/planning-packet.md templates/planning-packet.md
copy_new templates/claims.tsv templates/claims.tsv
copy_new templates/demotion-rules.md templates/demotion-rules.md
# CI backstop: re-runs every gate where --no-verify cannot reach.
copy_new templates/kit-gates.yml .github/workflows/kit-gates.yml
copy_new CHECKLIST.md docs/CHECKLIST.md
copy_new REFERENCES.md docs/REFERENCES.md

# 5. Negative-evidence ledger: schema header; agents append rows as they work.
if [ ! -f "$TARGET/docs/evidence/NEGATIVE_EVIDENCE.md" ]; then
  cat > "$TARGET/docs/evidence/NEGATIVE_EVIDENCE.md" <<'LEDGER_EOF'
# Negative Evidence Ledger

Rejected hypotheses, falsified claims, and dead ends — recorded so future
agents do not relitigate them. A ledger nobody writes to is decoration;
a ledger nobody reads is a graveyard. Both failure modes are the
maintainer's problem, not the format's.

Row schema (copy the block from templates/negative-evidence-entry.md):

    ## YYYY-MM-DD — VERDICT: one-line summary
    - **Bead:** <bead id>
    - **Surface:** <subsystem/area>
    - **Hypothesis:** <what you believed>
    - **A/B:** <measured ratio vs baseline, with units>
    - **A/A null:** <same-invocation null control, or VOID-<class> if none>
    - **Verdict:** KEEP | REJECT | SURVEY | UNKNOWN | RESURRECTED
    - **Retry predicate:** <testable condition for re-attempting — never "later">
    - **Lesson:** <one line>

Rules:
- Every REJECT row must carry a retry predicate. (frankensearch)
- A REJECT without a measured same-invocation null control is VOID, not a
  result — record the class of the missing evidence. (frankenscipy)
- The pre-commit hook lints staged rows: a row without a retry predicate
  blocks the commit.

Origin: frankenscipy docs/NEGATIVE_EVIDENCE.md + docs/LEDGER_RESURRECTION.md;
frankensearch docs/evidence/e8h-hypothesis-ledger.md; frankenfs
docs/LEDGER_RESURRECTION.md.
LEDGER_EOF
  say "  created docs/evidence/NEGATIVE_EVIDENCE.md"
fi

# 6. Beads: seed the graph with the checklist items as the first beads.
# The tracker is the native beads CLI ('br'): its store is the working copy
# and .beads/issues.jsonl is the committed sync export — never hand-edit it.
# When br is absent at init time the seed is still written in native format;
# `br sync --import-only` adopts it unchanged the day br arrives.
if [ ! -f "$TARGET/.beads/issues.jsonl" ]; then
  STAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  awk -v stamp="$STAMP" -f "$KIT_DIR/scripts/checklist2beads.awk" \
    "$TARGET/docs/CHECKLIST.md" > "$TARGET/.beads/issues.jsonl"
  n=$(grep -c '"status":"open"' "$TARGET/.beads/issues.jsonl" || true)
  say "  seeded $n checklist beads (native br format) in .beads/issues.jsonl"
  if [ "$n" -lt 20 ]; then
    say "ERROR: bead seeding produced only $n beads; expected the full checklist. Aborting."
    exit 1
  fi
else
  say "  keep: .beads/issues.jsonl already exists"
fi
if command -v br >/dev/null 2>&1; then
  if [ ! -f "$TARGET/.beads/beads.db" ]; then
    if (cd "$TARGET" && br init --prefix kit >/dev/null 2>&1) && \
       (cd "$TARGET" && br sync --import-only >/dev/null 2>&1) && \
       (cd "$TARGET" && br sync --flush-only >/dev/null 2>&1); then
      say "  br tracker initialized; seeded beads imported (work them with br list / br ready)."
    else
      say "  WARNING: br adoption failed; the seed stays native-format — adopt it with:"
      say "    br init --prefix kit && br sync --import-only"
    fi
  else
    say "  br tracker already initialized (beads.db present); left untouched."
  fi
elif [ ! -f "$TARGET/.beads/config.yaml" ]; then
  say "  beads CLI ('br') not found — seed written in native format; adopt it later with:"
  say "    br init --prefix kit && br sync --import-only"
  cat > "$TARGET/.beads/config.yaml" <<'YAML_EOF'
# Beads tracker config (starter-kit, written before br adoption).
# Tracker format is the native beads CLI (br); issues.jsonl is its committed
# sync export — never hand-edit it. Adopt with:
#   br init --prefix kit && br sync --import-only
# issue_prefix: kit
# default_priority: 2
YAML_EOF
fi
if [ ! -f "$TARGET/.beads/README.md" ]; then
  cat > "$TARGET/.beads/README.md" <<'BEADS_EOF'
# Beads (native br tracker)

The task tracker is the beads CLI (`br`); `.beads/issues.jsonl` is its
committed sync export. Never hand-edit that file — br owns its format.
`br sync --flush-only` before committing `.beads/`; close with
`br close <id> --reason "<evidence>"` so every close cites its proof.

If br was not installed at init time, the seed here is already in native
format. Adopt it with:

    br init --prefix kit && br sync --import-only

Rules that apply whether or not a beads CLI is installed:
- This seed is a checklist with no dependency edges; encode and review phase
  dependencies (`br dep add`) before dispatch. Prose documents are
  the rationale of record. (frankensearch)
- A bead whose acceptance criteria can be satisfied by believing it is not
  a bead. (frankentui: "A step you can satisfy by believing you did it
  is not a step.")
- Demotions are always allowed; promotions require the named gate.
  (frankensim)
BEADS_EOF
fi

say ""
say "Done. The one rule: a step you can satisfy by believing you did it is not a step."
say ""
say "Next steps:"
say "  1. Fill docs/planning/packet.md (working copy of templates/planning-packet.md)."
say "     templates/ holds READ-ONLY reference copies — always edit the installed"
say "     working copy (docs/planning/packet.md, registries/claims.tsv), never the template."
say "  2. Run ./scripts/check-readiness.sh — it reports NOT READY until every section is filled."
say "     Each packet section's guidance names the vocabulary the checker requires."
say "  3. Build your first proofs, then register every public claim in registries/claims.tsv"
say "     (set enforce=yes once the proof exists; readme_pattern must match README prose exactly)."
say "  4. Write the README LAST: the claim gate blocks any non-empty README until at least"
say "     one claim is enforced with a real proof (CHECKLIST.md B6)."
say "  5. Record falsified hypotheses in docs/evidence/NEGATIVE_EVIDENCE.md as you work."
say "  6. Review AGENTS.md (the 12 forbidden patterns) and docs/definition-of-done.md —"
say "     both installed for you; tailor them but keep the patterns verbatim."
say "  7. Work Phase A of docs/CHECKLIST.md; close the seeded beads with cited evidence:"
say "     br close <bead-id> --reason \"<evidence citation>\"   (br list shows the ids)."
say "  8. Make your first commit — the pre-commit hook self-tests with a canary false"
say "     claim before it checks anything real."
say "  9. When Phase A is green, sign the packet and start Phase B."
say "  10. Read docs/REFERENCES.md to see where every mechanism came from."
say "  Optional recurring research: docs/DECISIONS.md explains the Python 3.9+"
say "  review queue. No record is required by the shell gates."
say ""
say "CI backstop: .github/workflows/kit-gates.yml re-runs the readiness, ledger and"
say "claim-discipline gates on every push — that is the gate 'git commit"
say "--no-verify' cannot bypass. Fill in the commented toolchain steps per"
say "your language (fmt/lint/test/build)."
