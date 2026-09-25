// Candidate A index builder (build time). Shared by build-index.mjs and the scaling bench.
import { tokenize, FIELDS } from './tokenize.mjs';

const badge = (d) => d.verdict || d.license_class || '';

export function buildA(docs, extraSummary = null) {
  const NF = FIELDS.length;
  const postings = new Map(); // term -> Map(doc -> tf[])
  const len = new Array(docs.length * NF).fill(0);
  const sumLen = new Array(NF).fill(0);
  docs.forEach((d, di) => {
    FIELDS.forEach((f, fi) => {
      let text = d[f];
      if (f === 'summary' && extraSummary && extraSummary[d.id]) text += ' ' + extraSummary[d.id];
      const toks = tokenize(text);
      len[di * NF + fi] = toks.length;
      sumLen[fi] += toks.length;
      for (const t of toks) {
        let m = postings.get(t);
        if (!m) postings.set(t, (m = new Map()));
        let tf = m.get(di);
        if (!tf) m.set(di, (tf = new Array(NF).fill(0)));
        tf[fi]++;
      }
    });
  });
  const terms = [...postings.keys()].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const df = [], post = [];
  for (const t of terms) {
    const m = postings.get(t);
    const counts = new Array(NF).fill(0);
    const flat = [];
    for (const [doc, tf] of [...m].sort((a, b) => a[0] - b[0])) {
      flat.push(doc, ...tf);
      tf.forEach((c, fi) => { if (c) counts[fi]++; });
    }
    df.push(...counts);
    post.push(flat);
  }
  return {
    v: 1, n: docs.length, avg: sumLen.map((s) => s / docs.length),
    id: docs.map((d) => d.id), kind: docs.map((d) => d.kind), title: docs.map((d) => d.title), badge: docs.map(badge),
    len, terms, df, post,
  };
}
