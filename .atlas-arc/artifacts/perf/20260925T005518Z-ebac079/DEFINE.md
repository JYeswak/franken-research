# DEFINE: Franken Research search, engine choice and speed baseline

## Scenario
A visitor types build-intent phrases into a static, client-side search box. The probe corpus has 3,855 entries built from real local sources (`corpus-summary.json`): FR practices, readiness gates, techniques, failure modes, lessons, checklist, stack verdicts and their copy bullets, vendor-port techniques, shared gate specs, packet TL;DRs and next steps, 1,290 crates, and the rigor-atlas prescriptions, kinds, repo profiles and techniques. Each entry has `{id, kind, title, summary (<= 280 chars), tags, repo, verdict?, license_class}`. The rigor-atlas evidence quotes (3,700 items across 1,497 techniques) sit in a separate lazily loaded quotes shard. That shard is stored, not indexed, and never goes into the core shard (DEC-009).

The query set (`queries.json`, generator `probes/search-perf/gen-queries.mjs`, seed 20260924) has 1,165 queries: every per-keystroke prefix of 39 phrases, plus a seeded typo variant for every other phrase.

Candidates (same corpus, same queries, same tokenizer, same field boosts, top 10 results):
- **A**: hand-written inverted index over a sorted term array. Prefix expansion on the last token, BM25+ with MiniSearch's parameters, shipped as compact JSON, queried on the main thread.
- **B**: A inside a module Web Worker, with the message round trip included.
- **C**: vendored MiniSearch 7.2.0 (MIT), serialized at build time and restored with `loadJSON`. The probe uses it for comparison only.
- **I0**: the shipped map search (`site/assets/app.src.js:839-852`): 44 repo names, exact, then prefix, then substring, with every match rendered as a button.
- **I1**: the same incumbent algorithm scaled to the 3,855 titles, top 10. This is the naive-scan control.

Apples-to-apples matrix:

| Axis | Status | Value |
|---|---|---|
| corpus, query set, result count (10) | MATCH | `corpus-summary.json`, `queries.json` |
| tokenizer, field boosts, BM25+ k/b/d, prefix weight | MATCH (A/B/C) | `lib/tokenize.mjs` |
| renderer (title, kind, badge list) | MATCH (A/B/C/I1) | `page/app.mjs renderList`; I0 keeps its shipped renderer |
| host, Chrome build, Node build | MATCH | `fingerprint.json` |
| index data structure and implementation | STATE | the comparison |
| thread (main vs worker) | STATE | A vs B |
| measurement order | RANDOMIZE | order shuffled per run, seeded (`run_order` in the summaries) |

## Metric
- Engine-only query latency in Node 22: p50, p95, p99, p99.9 and max over 1,165 queries x 20 runs, after 3 warm-up runs.
- End to end in headless Chrome 154:
  - `key2layout` (primary): from `keydown.timeStamp` until the results are rendered and style and layout are forced.
  - `key2paint` (secondary): until the first task after the next animation frame.
  - Components: input delay, search (or the worker round trip), render, layout.
  - Scope: 1,165 keystrokes per run, 20 runs, 1 warm-up run, each run on a fresh page.
- Load path: DOMContentLoaded to first answer from the core shard ("usable"), to full index ready, and to quotes ready.
- Payload: brotli (q11) bytes per shard.
- Memory: JS heap after hydrate, measured against a control page with no index.
- Long tasks: Long Tasks API entries over 50 ms while typing.
- CPU attribution: Node `--cpu-prof`, the CDP Profiler domain, and profiling-only stage timers in engine A.

## Budget (REQ-O2, PROJECT_CHARTER.md)
- Keystroke to results painted: p95 <= 8 ms desktop and <= 16 ms phone, with p99 <= 2x p95.
- Search usable within 300 ms (desktop) and 1,000 ms (phone) of DOMContentLoaded.
- Core shard <= 150 KB brotli. Full index <= 1.5 MB brotli, loaded lazily.
- No main-thread task over 50 ms while typing.
- Profiles:
  - Desktop: Apple M3 Ultra, no throttle, 1440x900@2x.
  - Phone: 4x CPU throttle, DevTools "Fast 4G" (165 ms RTT, 9 Mbps down, 1.5 Mbps up, each x0.9), 390x844@3x, mobile.

## Golden output
`golden-A-full-top10.json` holds A's top-10 ids for every query, and its sha256 is in `golden_checksums.txt`. REQ-O2 golden-set identity requires that an optimization keep the top 3 of every query unchanged. `golden-agreement-A-vs-C.json` compares A's results with MiniSearch's.

## Scope boundary
Out of scope:
- relevance quality (REQ-O1)
- real phones (UNK U10)
- binary or typed-array index formats, and any optimization
- fuzzy matching in A
- the site/ integration and its gates

## Variance envelope
- <= 10% drift in per-run p95 against the median run: noise.
- > 10%: investigate.
- > 20%, or 3 consecutive runs > 10%: escalate.

This run shares the host with other agent sessions. `fingerprint.json` records the load average.

## Stakeholder
Joshua (maintainer). The decision this run informs: which engine the v1 search uses, and the ranked levers for extreme-software-optimization.
