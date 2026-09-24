#!/bin/sh
# check-claim-discipline.sh [claims.tsv] [README.md]
# Adapted from franken_markdown scripts/check-claim-discipline.sh.
# For every row with enforce=yes:
#   - readme_pattern, if set, must appear in the README. A pattern that misses
#     the README FAILS and names the row: the usual cause is a pattern that
#     doesn't match the README prose EXACTLY (case-sensitive, same line breaks).
#     franken_markdown only warned here and left the row unchecked; the kit
#     fails instead (2026-09-24), because a warning left the gate green while
#     an enforced claim went unverified. A claim the README no longer makes
#     is not forced: set that row to enforce=no, or delete it.
#   - proof_path must exist and be non-empty, and expected_substr (if set)
#     must appear inside the proof artifact.
# Rows with enforce=no are skipped and counted, as before.
# Exit 0: every enforced row passes. Exit 1: any enforced row fails.
# Also exit 1 when zero rows are enforced while README.md exists and is
# non-empty: a public README with an unenforced registry is undecorated
# discipline (CHECKLIST.md B6). With no README yet, that state is a warning.
# Also exit 1 when a claims file passed as an argument does not exist: a
# hook or CI step pointing at a wrong path must not pass silently. With no
# argument and no registries/claims.tsv, there is nothing to check (exit 0).
# Paths in claims.tsv are relative to the repository root; absolute paths are
# honored as-is.
set -u

CLAIMS="${1:-registries/claims.tsv}"
README_F="${2:-README.md}"
ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)

if [ ! -f "$CLAIMS" ]; then
  if [ $# -ge 1 ]; then
    echo "FAIL: claims file $CLAIMS not found. Fix the path, or create it from templates/claims.tsv."
    exit 1
  fi
  echo "check-claim-discipline: $CLAIMS not found; nothing to check."
  exit 0
fi

# Rows are split on tabs with awk, one field at a time. Tab is IFS whitespace,
# so IFS=<tab> read would collapse empty columns; the earlier workaround (read
# with IFS set to \001) read zero rows under macOS /bin/sh, which is bash 3.2
# and cannot split on \001. awk -F'\t' keeps empty columns in every POSIX sh.
# A line with no tab yields label = the whole line and empty other fields.
field() { printf '%s\n' "$line" | awk -F'\t' -v n="$1" '{ print $n }'; }
pass=0; fail=0; skipped=0; enforced=0; checked=0; unmatched=0
rowlist=""

while IFS= read -r line || [ -n "$line" ]; do
  case "$line" in ''|\#*) continue ;; esac
  label=$(field 1); pattern=$(field 2); substr=$(field 4); proof=$(field 5); enforce=$(field 6)
  [ "$label" = "label" ] && continue   # header row
  [ -z "$label" ] && continue          # blank row
  rowlist="${rowlist}${label}=>${enforce} "
  if [ "$enforce" != "yes" ]; then
    skipped=$((skipped + 1))
    continue
  fi
  enforced=$((enforced + 1))
  if [ -n "$pattern" ]; then
    if [ ! -f "$README_F" ] || ! grep -qF -- "$pattern" "$README_F"; then
      echo "FAIL  $label: enforce=yes but readme_pattern was NOT found in $README_F: $pattern"
      echo "      The pattern must match README prose EXACTLY (case-sensitive, same line breaks)."
      echo "      If the README no longer makes this claim, set enforce=no or delete the row."
      unmatched=$((unmatched + 1))
      fail=$((fail + 1))
      continue
    fi
  fi
  checked=$((checked + 1))
  # Proof paths are relative to the repo root; absolute paths are honored
  # as-is (an absolute path that silently resolved under $ROOT used to
  # false-FAIL — now it resolves to itself).
  case "$proof" in
    /*) p="$proof" ;;
    *)  p="$ROOT/$proof" ;;
  esac
  if [ -z "$proof" ] || [ ! -s "$p" ]; then
    echo "FAIL  $label: proof artifact missing or empty: ${proof:-<none>}"
    fail=$((fail + 1))
    continue
  fi
  if [ -n "$substr" ] && ! grep -qF -- "$substr" "$p"; then
    echo "FAIL  $label: proof $proof lacks expected text: $substr"
    fail=$((fail + 1))
    continue
  fi
  echo "PASS  $label -> $proof"
  pass=$((pass + 1))
done < "$CLAIMS"

if [ "$enforced" -eq 0 ]; then
  if [ -f "$README_F" ] && [ -s "$README_F" ]; then
    echo "FAIL: no enforced claims (enforce=yes) in $CLAIMS while $README_F exists and is non-empty."
    echo "A public README with zero enforced claims is undecorated discipline (CHECKLIST.md B6)."
    echo "Rows seen (label => enforce): ${rowlist:-<none>}"
    echo "Fix ONE of:"
    echo "  (a) set enforce=yes on at least one real claim whose proof artifact exists;"
    echo "  (b) keep the README empty/absent until your first claim has a proof."
    echo "Note: trimming prose cannot help — ANY non-empty README requires an enforced claim."
    fail=$((fail + 1))
  else
    echo "WARNING: no enforced claims (enforce=yes) in $CLAIMS; the registry is decorative until rows are enforced."
  fi
fi
echo "check-claim-discipline: $pass passed, $fail failed, $skipped skipped ($enforced enforced, $checked actually checked, $unmatched pattern-unmatched)."
[ "$fail" -eq 0 ]
