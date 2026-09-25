// Candidate C: vendored MiniSearch 7.2.0 (MIT, see vendor/minisearch-7.2.0/LICENSE.txt),
// index serialized at build time and restored with loadJSON. Comparison only; not for site/.
import MiniSearch from '../vendor/minisearch-7.2.0/index.js';
import { tokenize, lastTokenIsPrefix, FIELDS, BOOST, TOP_K } from './tokenize.mjs';

export const MS_OPTIONS = {
  fields: FIELDS,
  storeFields: ['kind', 'title', 'badge'],
  tokenize: (s) => tokenize(s),
  processTerm: (t) => t, // tokenize() already lowercases/normalises: identical term set to A
};

export function build(docs) {
  const ms = new MiniSearch(MS_OPTIONS);
  ms.addAll(docs);
  return ms;
}

export function hydrate(text) {
  return MiniSearch.loadJSON(text, MS_OPTIONS);
}

const PREFIX_LAST = { boost: BOOST, combineWith: 'OR', fuzzy: false, prefix: (term, i, terms) => i === terms.length - 1 };
const NO_PREFIX = { boost: BOOST, combineWith: 'OR', fuzzy: false, prefix: false };
// STATE variant (engine-only): price of typo tolerance, MiniSearch's own fuzzy on the last term.
const FUZZY = { boost: BOOST, combineWith: 'OR', prefix: (term, i, terms) => i === terms.length - 1, fuzzy: (term) => (term.length > 3 ? 0.2 : false) };

export function search(ms, q, k = TOP_K, fuzzy = false) {
  if (!tokenize(q).length) return [];
  const opts = fuzzy ? FUZZY : (lastTokenIsPrefix(q) ? PREFIX_LAST : NO_PREFIX);
  const res = ms.search(q, opts);
  const out = [];
  for (let i = 0; i < res.length && i < k; i++) {
    const r = res[i];
    out.push({ id: r.id, kind: r.kind, title: r.title, badge: r.badge, score: r.score });
  }
  return out;
}
