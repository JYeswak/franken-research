// Nearest-rank percentiles (ceil(p*N)-1, clamped), matching the skill's variance_envelope.py.
export function pct(sorted, p) {
  if (!sorted.length) return null;
  const i = Math.max(0, Math.min(Math.ceil(p * sorted.length) - 1, sorted.length - 1));
  return sorted[i];
}
export function summarize(samples) {
  const s = Float64Array.from(samples).sort();
  const n = s.length;
  let sum = 0; for (const v of s) sum += v;
  const mean = sum / n;
  let sq = 0; for (const v of s) sq += (v - mean) ** 2;
  const sd = Math.sqrt(sq / Math.max(1, n - 1));
  const med = pct(s, 0.5);
  const dev = Float64Array.from(s, (v) => Math.abs(v - med)).sort();
  const r = (v) => (v == null ? null : Math.round(v * 1e4) / 1e4);
  return { n, mean: r(mean), sd: r(sd), cv: r(sd / mean), mad: r(pct(dev, 0.5)), p50: r(med), p95: r(pct(s, 0.95)), p99: r(pct(s, 0.99)), p999: r(pct(s, 0.999)), max: r(s[n - 1]), p999_conservative: n < 1000 };
}
// Spread of per-run p95s: the variance envelope (<=10% noise, >10% investigate, >20% escalate).
export function envelope(perRunP95) {
  const s = [...perRunP95].sort((a, b) => a - b);
  const med = pct(s, 0.5);
  const drift = Math.max(...s.map((v) => Math.abs(v - med) / med));
  const verdict = drift <= 0.05 ? 'STABLE' : drift <= 0.10 ? 'NOISE' : drift <= 0.20 ? 'INVESTIGATE' : 'ESCALATE';
  return { runs: s.length, median_p95: Math.round(med * 1e4) / 1e4, min: s[0], max: s[s.length - 1], max_drift_pct: Math.round(drift * 1000) / 10, verdict };
}
export function mulberry32(a) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export function shuffle(arr, rnd) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
