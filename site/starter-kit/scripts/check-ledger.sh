#!/bin/sh
# Shared negative-evidence row lint. Structure only, not scientific validity.
set -eu
LEDGER="${1:-docs/evidence/NEGATIVE_EVIDENCE.md}"
[ -f "$LEDGER" ] || { echo "FAIL: ledger missing: $LEDGER"; exit 1; }
part="$LEDGER"
while [ "$part" != . ] && [ "$part" != / ]; do
  [ ! -L "$part" ] || { echo "FAIL: ledger path contains symlink: $LEDGER"; exit 1; }
  part=$(dirname "$part")
done
bad_rows=$(awk -v ledger="$LEDGER" '

          BEGIN {
            nl = 0
            while ((getline line < ledger) > 0) l[++nl] = line
          }
          END {
            for (s = 1; s <= nl; s++) {
              if (l[s] !~ /^## /) continue
              e = nl
              for (i = s + 1; i <= nl; i++) if (l[i] ~ /^## /) { e = i - 1; break }
              pred = ""
              for (i = s; i <= e; i++) {
                if (l[i] ~ /[Rr]etry [Pp]redicate:/) {
                  v = l[i]
                  sub(/.*[Rr]etry [Pp]redicate:[ \t]*/, "", v)
                  sub(/^\*\*[ \t]*/, "", v)
                  sub(/^[ \t]+|[ \t]+$/, "", v)
                  pred = v
                }
              }
              wl = pred
              # Weasel test: the WHOLE value must be a weasel word (after
              # trimming whitespace), or contain "later" as a standalone word.
              # Substantive values like "n/a — shipped; ..." pass because they
              # carry real content beyond the weasel word.
              gsub(/^[ \t]+|[ \t]+$/, "", wl)
              wll = tolower(wl)
              weasel = (wl == "" || wll == "later" || wll == "tbd" || wll == "t.b.d." || \
                        wll == "todo" || wll == "n/a" || wll == "n.a." || wll == "na" || \
                        wll == "none" || wll == "unknown" || wll == "pending" || \
                        wll == "to be determined" || wll == "?")
              if (!weasel && wll ~ /(^|[^[:alnum:]])later([^[:alnum:]]|$)/) weasel = 1
              if (weasel) print "BAD: " l[s]
            }
          }
' < /dev/null)
if [ -n "$bad_rows" ]; then
  printf 'FAIL: missing or weasel retry predicates\n%s\n' "$bad_rows"
  exit 1
fi
echo 'PASS: ledger retry predicates (structural only)'
