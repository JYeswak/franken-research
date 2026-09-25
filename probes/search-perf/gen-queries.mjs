// Deterministic query-set generator: every per-keystroke prefix of each phrase in phrases.txt
// (as typing produces them) plus one seeded typo variant for every other phrase (only the
// prefixes from the typo onward are new queries). Usage: node gen-queries.mjs > queries.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SEED = 20260924;
function mulberry32(a) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const rnd = mulberry32(SEED);
const pick = (n) => Math.floor(rnd() * n);
const LETTERS = 'abcdefghijklmnopqrstuvwxyz';

function typo(phrase) {
  const words = phrase.split(' ');
  const cands = words.map((w, i) => [w, i]).filter(([w]) => w.length >= 5);
  const [w, wi] = cands[pick(cands.length)];
  const p = 1 + pick(w.length - 2);
  let t;
  switch (pick(4)) {
    case 0: t = w.slice(0, p) + w[p + 1] + w[p] + w.slice(p + 2); break; // transpose
    case 1: t = w.slice(0, p) + w.slice(p + 1); break; // drop
    case 2: t = w.slice(0, p) + LETTERS[pick(26)] + w.slice(p + 1); break; // substitute
    default: t = w.slice(0, p) + w[p] + w.slice(p); break; // double
  }
  if (t === w) t = w.slice(0, p) + w.slice(p + 1);
  words[wi] = t;
  return words.join(' ');
}

const here = path.dirname(fileURLToPath(import.meta.url));
const phrases = fs.readFileSync(path.join(here, 'phrases.txt'), 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
const queries = []; // {q, phrase, variant, keystroke}
const typed = []; // sequences as typed: [{text, variant, from}] where keystrokes from..len are measured queries
phrases.forEach((p, pi) => {
  typed.push({ phrase: pi, variant: 'clean', text: p, from: 1 });
  if (pi % 2 === 1) {
    const t = typo(p);
    let d = 0; while (d < t.length && t[d] === p[d]) d++;
    typed.push({ phrase: pi, variant: 'typo', text: t, from: d + 1 });
  }
});
for (const s of typed) for (let i = s.from; i <= s.text.length; i++) {
  const q = s.text.slice(0, i);
  if (/[a-z0-9]/i.test(q)) queries.push({ q, phrase: s.phrase, variant: s.variant, keystroke: i });
}
process.stdout.write(JSON.stringify({ seed: SEED, generator: 'probes/search-perf/gen-queries.mjs', phrases, typed, count: queries.length, queries }, null, 0) + '\n');
