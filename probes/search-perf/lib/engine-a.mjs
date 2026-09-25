// Candidate A: build-time precomputed inverted index over a sorted term array.
// Straightforward, idiomatic implementation on purpose: no optimisation beyond the obvious.
// The same module runs in Node (engine-only bench), on the page main thread (A) and in a
// module Web Worker (B).
//
// Index JSON (produced by build-index.mjs):
//   { v, n, avg:[title,tags,summary], id[], kind[], title[], badge[],
//     len:[n*3 field lengths], terms:[sorted], df:[terms*3 per-field doc freq],
//     post:[[doc, tfTitle, tfTags, tfSummary, doc, ...] per term] }
//
// `prof` (optional) is a profiling-only instrumentation hook: when non-null, per-stage
// wall time is accumulated into it. Baseline runs pass null.
import { tokenize, lastTokenIsPrefix, FIELDS, BOOST, BM25, PREFIX_WEIGHT, TOP_K } from './tokenize.mjs';

const FIELD_BOOST = FIELDS.map((f) => BOOST[f]);
const NF = FIELDS.length;
const now = typeof performance !== 'undefined' ? () => performance.now() : () => Date.now();

export function hydrate(text) {
  const idx = JSON.parse(text);
  if (idx.v !== 1) throw new Error('engine-a: unsupported index version ' + idx.v);
  return idx;
}

function lowerBound(terms, t) {
  let lo = 0, hi = terms.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (terms[mid] < t) lo = mid + 1; else hi = mid;
  }
  return lo;
}

// Stage 1: tokenize the query.
export function tokenizeQuery(q) {
  const toks = [];
  for (const t of tokenize(q)) if (!toks.includes(t)) toks.push(t);
  return toks;
}

// Stage 2: map query tokens to term ids (exact for every token, prefix range for the last one
// while it is still being typed).
export function lookupTerms(idx, toks, prefixLast) {
  const terms = idx.terms;
  const matches = [];
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    const lo = lowerBound(terms, t);
    if (terms[lo] === t) matches.push({ ti: lo, weight: 1, src: i });
    if (prefixLast && i === toks.length - 1) {
      for (let j = terms[lo] === t ? lo + 1 : lo; j < terms.length && terms[j].startsWith(t); j++) {
        const len = terms[j].length, dist = len - t.length;
        matches.push({ ti: j, weight: PREFIX_WEIGHT * len / (len + 0.3 * dist), src: i });
      }
    }
  }
  return matches;
}

// Stage 3: walk postings and accumulate BM25+ scores per document.
export function accumulateScores(idx, matches) {
  const { n, avg, len, df, post } = idx;
  const { k, b, d } = BM25;
  const acc = new Map();
  for (const m of matches) {
    const p = post[m.ti];
    for (let i = 0; i < p.length; i += NF + 1) {
      const doc = p[i];
      let s = 0;
      for (let f = 0; f < NF; f++) {
        const tf = p[i + 1 + f];
        if (!tf) continue;
        const dfv = df[m.ti * NF + f];
        const idf = Math.log(1 + (n - dfv + 0.5) / (dfv + 0.5));
        s += FIELD_BOOST[f] * idf * (d + tf * (k + 1) / (tf + k * (1 - b + b * len[doc * NF + f] / avg[f])));
      }
      s *= m.weight;
      const e = acc.get(doc);
      if (e) { e.score += s; e.mask |= 1 << m.src; } else acc.set(doc, { score: s, mask: 1 << m.src });
    }
  }
  return acc;
}

function popcount(x) { let c = 0; while (x) { c += x & 1; x >>>= 1; } return c; }

// Stage 4: rank every candidate and keep the top k (full sort, as MiniSearch does).
export function selectTopK(acc, k) {
  const all = Array.from(acc, ([doc, e]) => ({ doc, score: e.score * popcount(e.mask) }));
  all.sort((a, b) => (b.score - a.score) || (a.doc - b.doc));
  return all.slice(0, k);
}

// Stage 5: materialise display rows.
export function materialize(idx, top) {
  return top.map(({ doc, score }) => ({ id: idx.id[doc], kind: idx.kind[doc], title: idx.title[doc], badge: idx.badge[doc], score }));
}

export function search(idx, q, k = TOP_K, prof = null) {
  if (!prof) {
    const toks = tokenizeQuery(q);
    if (!toks.length) return [];
    return materialize(idx, selectTopK(accumulateScores(idx, lookupTerms(idx, toks, lastTokenIsPrefix(q))), k));
  }
  let t0 = now();
  const toks = tokenizeQuery(q);
  let t1 = now(); prof.tokenize += t1 - t0;
  if (!toks.length) return [];
  const matches = lookupTerms(idx, toks, lastTokenIsPrefix(q));
  t0 = now(); prof.lookup += t0 - t1; prof.expandedTerms += matches.length;
  const acc = accumulateScores(idx, matches);
  t1 = now(); prof.score += t1 - t0; prof.candidates += acc.size;
  const top = selectTopK(acc, k);
  t0 = now(); prof.sort += t0 - t1;
  const rows = materialize(idx, top);
  prof.materialize += now() - t0;
  return rows;
}
