// Shared tokenizer: the MATCH axis for every candidate (A, B, C).
// Lowercase, NFKD with combining marks removed, split on anything that is not [a-z0-9].
// No stemming, no stop words: those are relevance levers, out of scope for a speed probe.
const MARKS = /[\u0300-\u036f]/g;
const SPLIT = /[^a-z0-9]+/;

export function tokenize(text) {
  if (!text) return [];
  const parts = String(text).normalize('NFKD').replace(MARKS, '').toLowerCase().split(SPLIT);
  const out = [];
  for (const p of parts) if (p) out.push(p);
  return out;
}

// A query's last token is treated as a prefix while the user is still typing it,
// i.e. unless the query ends with a separator (the user just typed a space).
export function lastTokenIsPrefix(q) {
  return /[a-z0-9]$/i.test(q.normalize('NFKD').replace(MARKS, ''));
}

// Field weights shared by A and C (C passes them as `boost`).
export const FIELDS = ['title', 'tags', 'summary'];
export const BOOST = { title: 3, tags: 2, summary: 1 };
// BM25+ parameters and prefix weight: MiniSearch 7.2.0 defaults, mirrored in engine A so that
// the scoring model is a MATCH axis and only the data structure differs.
export const BM25 = { k: 1.2, b: 0.7, d: 0.5 };
export const PREFIX_WEIGHT = 0.375;
export const TOP_K = 10;
