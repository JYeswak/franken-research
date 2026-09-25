// Candidate A, optimised for the phone keystroke budget (REQ-O2). Same index file, tokenizer,
// term lookup and scoring arithmetic as engine-a.mjs (the frozen incumbent); only the data
// structures of the two hot stages change. Levers, from the hand-off table of probe
// 20260925T005518Z-ebac079 (README.md), applied cumulatively so each is measured against the
// variant before it:
//   L1  bounded top-k selection: one pass keeping the best k in (score desc, doc asc) order,
//       instead of Array.from over every candidate (one object each) plus a full sort.
//   L2  dense typed-array accumulators indexed by doc (score, query-token mask, touched list),
//       reused across queries; the per-(term, field) weight boost x idf computed once per matched
//       term instead of once per posting, and k x (1 - b + b x len / avg) once per (doc, field).
// Isomorphism: every floating-point expression is evaluated with the same operands in the same
// order as engine-a.mjs, so scores are bit-identical; candidates are distinct docs and the
// (score desc, doc asc) order is total, so the top k is the same set in the same order.
// `bench-node.mjs golden-diff` checks both against the incumbent on every query.
import { lastTokenIsPrefix, FIELDS, BOOST, BM25, TOP_K } from './tokenize.mjs';
import { hydrate, tokenizeQuery, lookupTerms, accumulateScores, materialize } from './engine-a.mjs';

export { hydrate };

const FIELD_BOOST = FIELDS.map((f) => BOOST[f]);
const NF = FIELDS.length;

function popcount(x) { let c = 0; while (x) { c += x & 1; x >>>= 1; } return c; }

// Bounded selection buffer: the best `count` candidates so far, best first.
function makeTop(k) { return { k, count: 0, doc: new Int32Array(k), score: new Float64Array(k) }; }

// Insert (doc, score) if it ranks within the best k. Order: score desc, then doc asc, which is
// engine-a.mjs's comparator `(b.score - a.score) || (a.doc - b.doc)` (for finite doubles
// b - a === 0 exactly when a === b).
function offer(top, doc, score) {
  const { k, doc: D, score: S } = top;
  let i = top.count;
  if (i === k) {
    const ls = S[k - 1];
    if (score < ls || (score === ls && doc > D[k - 1])) return;
    i = k - 1;
  } else top.count++;
  while (i > 0 && (S[i - 1] < score || (S[i - 1] === score && D[i - 1] > doc))) { S[i] = S[i - 1]; D[i] = D[i - 1]; i--; }
  S[i] = score; D[i] = doc;
}

function topRows(top) {
  const out = new Array(top.count);
  for (let i = 0; i < top.count; i++) out[i] = { doc: top.doc[i], score: top.score[i] };
  return out;
}

// L1 alone: the incumbent's Map accumulator, bounded selection.
function selectTopKMap(acc, k) {
  const top = makeTop(k);
  for (const [doc, e] of acc) offer(top, doc, e.score * popcount(e.mask));
  return topRows(top);
}

export function searchL1(idx, q, k = TOP_K) {
  const toks = tokenizeQuery(q);
  if (!toks.length) return [];
  return materialize(idx, selectTopKMap(accumulateScores(idx, lookupTerms(idx, toks, lastTokenIsPrefix(q))), k));
}

// L2 scratch state, one per hydrated index (core and full differ in n).
const STATE = new WeakMap();
function state(idx) {
  let st = STATE.get(idx);
  if (st) return st;
  const { n, avg, len } = idx;
  const { k, b } = BM25;
  // k x (1 - b + b x len / avg), the same expression as engine-a.mjs's denominator term.
  const kNorm = new Float64Array(n * NF);
  for (let doc = 0; doc < n; doc++) for (let f = 0; f < NF; f++) kNorm[doc * NF + f] = k * (1 - b + b * len[doc * NF + f] / avg[f]);
  st = { kNorm, score: new Float64Array(n), mask: new Int32Array(n), touched: new Int32Array(n), w: new Float64Array(NF) };
  STATE.set(idx, st);
  return st;
}

// L1 + L2.
export function search(idx, q, k = TOP_K) {
  const toks = tokenizeQuery(q);
  if (!toks.length) return [];
  const matches = lookupTerms(idx, toks, lastTokenIsPrefix(q));
  const st = state(idx);
  const { n, df, post } = idx;
  const { k: bk, d } = BM25;
  const k1 = bk + 1;
  const { kNorm, score, mask, touched, w } = st;
  let nt = 0;
  for (let mi = 0; mi < matches.length; mi++) {
    const m = matches[mi];
    for (let f = 0; f < NF; f++) {
      const dfv = df[m.ti * NF + f];
      w[f] = FIELD_BOOST[f] * Math.log(1 + (n - dfv + 0.5) / (dfv + 0.5));
    }
    const p = post[m.ti], bit = 1 << m.src, weight = m.weight;
    for (let i = 0; i < p.length; i += NF + 1) {
      const doc = p[i], base = doc * NF;
      let s = 0;
      for (let f = 0; f < NF; f++) {
        const tf = p[i + 1 + f];
        if (!tf) continue;
        s += w[f] * (d + tf * k1 / (tf + kNorm[base + f]));
      }
      s *= weight;
      if (mask[doc] === 0) { touched[nt++] = doc; score[doc] = s; mask[doc] = bit; } else { score[doc] += s; mask[doc] |= bit; }
    }
  }
  const top = makeTop(k);
  for (let i = 0; i < nt; i++) {
    const doc = touched[i];
    offer(top, doc, score[doc] * popcount(mask[doc]));
    mask[doc] = 0;
  }
  return materialize(idx, topRows(top));
}

// L8: the result lists of every one-character query ([a-z0-9], 36 of them) for one index, filled by
// `fillOneChar` from `search` itself (the page runs it one query per idle callback after the full index
// is hydrated) and served by `searchCached`. Every search starts with one character, so this is a cache
// over an input class, not over the probe's query list. A cached answer is the array `search` returned
// for the same index and string, so the rows are identical by construction; `bench-node.mjs
// golden-diff` checks the cached path as well.
export const ONE_CHAR = 'abcdefghijklmnopqrstuvwxyz0123456789';
const CACHE = new WeakMap();
export function fillOneChar(idx, ch, k = TOP_K) {
  let c = CACHE.get(idx);
  if (!c) CACHE.set(idx, (c = new Map()));
  if (!c.has(ch)) c.set(ch, search(idx, ch, k));
}
export function searchCached(idx, q, k = TOP_K) {
  if (q.length === 1 && k === TOP_K) {
    const hit = CACHE.get(idx)?.get(q);
    if (hit) return hit;
  }
  return search(idx, q, k);
}
