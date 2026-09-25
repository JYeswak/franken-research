#!/usr/bin/env bash
# Search performance probe for the planned Franken Research search (REQ-O2). Measurement only.
#
#   probes/search-perf/run.sh [RUN_ID]
#
# Builds a ~3.9k-entry corpus from local sources into $SCRATCH (never the repo), builds each
# candidate's index, then measures engine-only (Node), end-to-end keystroke latency, load path and
# heap (headless Chrome, desktop and phone profiles), and CPU profiles. Artifacts land in
# .atlas-arc/artifacts/perf/<RUN_ID>/. Needs node >= 22.5 (node:sqlite), Google Chrome, python3.
# No dependencies are installed; MiniSearch is vendored under vendor/ (MIT).
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FR="$(cd "$HERE/../.." && pwd)"
STATE="${XDG_STATE_HOME:-$HOME/.local/state}/zeststream/scratch/control-plane/franken-lead"
SCRATCH="${SCRATCH:-$STATE/search-perf}"
CRATES_TSV="${CRATES_TSV:-$STATE/atlas/eco2-crates.tsv}"
RIGOR_SRC="${RIGOR_SRC:-$HOME/Developer/rigor-atlas/data/rigor.sqlite}"
SKILL="${SKILL:-$HOME/.claude/skills/profiling-software-performance}"
RUN_ID="${1:-$(date -u +%Y%m%dT%H%M%SZ)-$(git -C "$FR" rev-parse --short HEAD)}"
OUT="$FR/.atlas-arc/artifacts/perf/$RUN_ID"
export FR SCRATCH
mkdir -p "$OUT" "$SCRATCH"
cd "$HERE"
step() { printf '\n== %s (%s)\n' "$1" "$(date -u +%H:%M:%SZ)" >&2; }

step fingerprint
node fingerprint.mjs "$RUN_ID" > "$OUT/fingerprint.json"
node frame-cadence.mjs > "$OUT/frame-cadence.json"

step corpus
cp "$RIGOR_SRC" "$SCRATCH/rigor.sqlite"   # a copy, opened read-only
rm -f "$SCRATCH/rigor.sqlite-wal" "$SCRATCH/rigor.sqlite-shm"
CRATES_TSV="$CRATES_TSV" RIGOR_DB="$SCRATCH/rigor.sqlite" node --no-warnings build-corpus.mjs > "$OUT/corpus-summary.json"
node gen-queries.mjs > "$OUT/queries.json"

step indexes
node build-index.mjs > "$OUT/sizes.json"

step "engine-only baseline (node)"
node bench-node.mjs baseline "$OUT" "$OUT/queries.json" > "$OUT/log-bench-node.txt"
node bench-node.mjs hydrate "$OUT" "$OUT/queries.json" > "$OUT/log-hydrate-node.txt"

step "instrumented pass (profiling-only stage timers)"
node bench-node.mjs instrument "$OUT" "$OUT/queries.json" > "$OUT/log-instrument-node.txt"

step "scaling law (corpus size and query length)"
node bench-node.mjs scale "$OUT" "$OUT/queries.json" 2> "$OUT/log-scale-node.txt"

step "node cpu profiles"
for c in A-full C-full I1-full; do
  node --cpu-prof --cpu-prof-interval 100 --cpu-prof-dir "$OUT" --cpu-prof-name "cpu-node-$c.cpuprofile" \
    bench-node.mjs cpuprof "$OUT" "$OUT/queries.json" "$c"
done

step "browser timing: desktop"
node bench-browser.mjs timing "$OUT" "$OUT/queries.json" desktop > "$OUT/log-browser-desktop.txt"
step "browser timing: phone"
node bench-browser.mjs timing "$OUT" "$OUT/queries.json" phone > "$OUT/log-browser-phone.txt"

step "browser traces and cpu profiles"
for p in desktop phone; do node bench-browser.mjs trace "$OUT" "$OUT/queries.json" "$p"; done
CANDS=A,B,C,I1 node bench-browser.mjs cpuprof "$OUT" "$OUT/queries.json" phone
node analyze-cpuprofile.mjs "$OUT"/*.cpuprofile > "$OUT/cpu-attribution.json"

step "long-task attribution (diagnostic passes)"
CANDS=A,B,I0 LT_PASSES=3 node bench-browser.mjs longtasks "$OUT" "$OUT/queries.json" desktop
CANDS=A,B,I0 LT_PASSES=2 node bench-browser.mjs longtasks "$OUT" "$OUT/queries.json" phone

step "contention sentinel, hotspot tables, golden check"
node contention.mjs "$OUT" > "$OUT/contention.json"
for c in A B C; do
  node hotspots.mjs "$OUT" "$c" > "$OUT/profile-phone-$c.jsonl"
  python3 "$SKILL/scripts/render_hotspot_table.py" "$OUT/profile-phone-$c.jsonl" --top 12 > "$OUT/hotspots-rendered-phone-$c.md"
done
node bench-node.mjs verify-golden "$OUT" "$OUT/queries.json" > "$OUT/golden-verify.json"

step "variance envelopes (skill script)"
: > "$OUT/variance-envelope.txt"
for f in "$OUT"/baseline-node-*.json "$OUT"/baseline-browser-*.json; do
  b="$(basename "$f" .json)"; key="${b#baseline-}"
  { echo "## $key"; (cd "$OUT" && python3 "$SKILL/scripts/variance_envelope.py" runs/"$key"-r*.json) || true; echo; } >> "$OUT/variance-envelope.txt"
done

step "budget table"
node report.mjs "$OUT" > "$OUT/budgets.md"
node scrub-paths.mjs "$OUT"/*.cpuprofile "$OUT"/*.txt "$OUT"/*.json >&2
echo "artifacts: $OUT" >&2
