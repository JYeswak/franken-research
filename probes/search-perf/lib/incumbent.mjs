// Incumbent baseline: the map search ranking from site/assets/app.src.js:839-852
// (rankMatches), copied here so site/ is not touched. Exact name > prefix > substring,
// ties broken by the shorter name.
//   I0 = as shipped: 44 repo names from site/assets/data.js, every match rendered.
//   I1 = the same algorithm scaled to the probe corpus titles, top 10 (a naive-scan control).
export function hydrate(text) {
  const { names, rows } = JSON.parse(text);
  return { lower: names.map((n) => n.toLowerCase()), rows };
}

export function rankMatches(inc, q) {
  const scored = [];
  const lower = inc.lower;
  for (let i = 0; i < lower.length; i++) {
    const n = lower[i];
    let s = -1;
    if (n === q) s = 0;
    else if (n.startsWith(q)) s = 1;
    else if (n.includes(q)) s = 2;
    if (s >= 0) scored.push({ i, s, len: n.length });
  }
  scored.sort((a, b) => (a.s - b.s) || (a.len - b.len));
  return scored;
}

export function search(inc, rawQ, k = Infinity) {
  const q = rawQ.trim().toLowerCase();
  if (!q) return [];
  const scored = rankMatches(inc, q);
  const out = [];
  for (let j = 0; j < scored.length && j < k; j++) out.push(inc.rows[scored[j].i]);
  return out;
}
