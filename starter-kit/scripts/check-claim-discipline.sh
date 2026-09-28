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
#     is not forced: set enforce=no and mark notes retired; retain the claim id.
#   - proof_path must exist and be non-empty, and expected_substr (if set)
#     must appear inside the proof artifact.
# Rows with enforce=no are skipped and counted, as before.
# Exit 0: every enforced row passes. Exit 1: any enforced row fails.
# Also exit 1 when zero rows are enforced while README.md exists and is
# non-empty: a public README with an unenforced registry is undecorated
# discipline (CHECKLIST.md B6). With no README yet, that state is a warning.
# Also exit 1 when a claims file passed as an argument does not exist: a
# hook or CI step pointing at a wrong path must not pass silently. With no
# argument, a missing registry also fails closed.
# Paths in claims.tsv are relative to the repository root; absolute paths are
# rejected to keep proofs portable and snapshot-bound.
set -u

CLAIMS="${1:-registries/claims.tsv}"
README_F="${2:-README.md}"
ROOT=${KIT_ROOT:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}

if [ ! -f "$CLAIMS" ] || [ -L "$CLAIMS" ]; then
  echo "FAIL: claims registry missing or symlink: $CLAIMS"
  exit 1
fi

# Check parent components too; a registry or README may not borrow external bytes.
for checked_path in "$CLAIMS" "$README_F"; do
  part="$checked_path"
  while [ "$part" != . ] && [ "$part" != / ]; do
    [ ! -L "$part" ] || { echo "FAIL: symlink path: $checked_path"; exit 1; }
    part=$(dirname "$part")
  done
done

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
  # Portable proof artifacts must stay within this snapshot. Reject traversal
  # and symlinks so a staged claim cannot borrow unstaged/external bytes.
  case "$proof" in
    /*|..|../*|*/../*|*/..)
      echo "FAIL  $label: proof must be repository-relative without traversal: $proof"
      fail=$((fail + 1)); continue ;;
  esac
  p="$ROOT/$proof"
  part="$p"; linked=0
  while [ "$part" != "$ROOT" ] && [ "$part" != / ]; do
    [ ! -L "$part" ] || linked=1
    part=$(dirname "$part")
  done
  if [ "$linked" -ne 0 ]; then
    echo "FAIL  $label: proof path contains a symlink: $proof"
    fail=$((fail + 1)); continue
  fi
  if [ -z "$proof" ] || [ ! -f "$p" ] || [ ! -s "$p" ]; then
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
