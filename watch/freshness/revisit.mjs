#!/usr/bin/env node
// watch/freshness/revisit.mjs: every packet's revisit triggers (RULEBOOK.md §4.11), parsed and mapped
// to the closed detector vocabulary of watch/freshness/SPEC.md FR-T.7.
//
//   node watch/freshness/revisit.mjs --tsv    print revisit.tsv to stdout (the committed file is this
//                                             output with its reviewed_by column filled in by review)
//
// A packet states its triggers in one of three shapes: an inline list "(1) ...; (2) ...", an inline
// list split by semicolons, or a numbered list under a "**Revisit triggers ...:**" line. The mapping
// is by keywords and is conservative: a trigger gets a machine detector only when every alternative
// in it ("A or B") names the same observable thing; anything else is `human`, listed and never
// alerted. Node 22 built-ins only.

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const DETECTORS = ['release.first', 'ci.class', 'license.text', 'archived', 'contributors.second_human', 'dependency.edge', 'human'];
export const TSV_HEAD = ['repo', 'n', 'text', 'detector', 'params', 'packet', 'reviewed_by'];
export const UNREVIEWED = 'FreshCore (unreviewed)';

// ---------------------------------------------------------------- parsing
// "**Revisit triggers ...:**", "**Concrete revisit triggers**", or a plain "Revisit triggers:" in prose.
const MARKER = /\*\*(?:Concrete )?revisit triggers[^*]*\*\*|\bRevisit triggers:/i;
const clean = (s) => s.replace(/\*\*/g, '').replace(/\s+/g, ' ').replace(/[\s.;]+$/, '').trim();

// Split on `;` outside parentheses.
function splitTop(s) {
  const out = [];
  let depth = 0;
  let cur = '';
  for (const c of s) {
    if (c === '(') depth++;
    else if (c === ')') depth = Math.max(0, depth - 1);
    if (c === ';' && depth === 0) { out.push(cur); cur = ''; } else cur += c;
  }
  return [...out, cur];
}

// Returns [{ n, text, line }] for the packet's revisit triggers, in order. `line` is 1-based. The
// marker is looked for in the trajectory section (RULEBOOK §4.11, "## 4.11 ..." or "## §10 —
// Trajectory ...") first, then anywhere. A numbered list under the marker line wins over any text
// after the marker on that line.
const SECTION = /^#{2,3} .*(4\.11|Trajectory)/;
export function parseTriggers(text) {
  const lines = text.split('\n');
  const from = Math.max(0, lines.findIndex((l) => SECTION.test(l)));
  const inSection = lines.findIndex((l, i) => i >= from && MARKER.test(l));
  const at = inSection >= 0 ? inSection : lines.findIndex((l) => MARKER.test(l));
  if (at < 0) return [];
  const list = [];
  for (let i = at + 1; i < lines.length; i++) {
    const l = lines[i];
    if (l.trim() === '' && list.length === 0) continue;
    const m = l.match(/^\s*(\d+)\.\s+(.*)$/);
    if (!m) break;
    list.push({ n: Number(m[1]), text: clean(m[2]), line: i + 1 });
  }
  if (list.length) return list;
  const rest = lines[at].slice(lines[at].search(MARKER)).replace(MARKER, '').trim();
  const numbered = [...rest.matchAll(/\((\d+)\)\s*([^]*?)(?=\s*\(\d+\)\s|$)/g)];
  const items = numbered.length ? numbered.map((m) => m[2]) : splitTop(rest);
  return items.map(clean).filter(Boolean).map((t, i) => ({ n: i + 1, text: t, line: at + 1 }));
}

// ---------------------------------------------------------------- mapping
const CRATES = [['asupersync', 'asupersync'], ['frankensqlite', 'fsqlite']];
const CI_WORD = String.raw`\b(?:CI|GitHub Actions|workflows?|\.github\/workflows)\b`;
const CI_STATE = String.raw`\b(?:green|appears?|appearing|restored|re-enabl\w*|enabl\w*|executing|observable|verdicts?|in-tree)\b`;
const RULES = [
  ['archived', /\barchiv/i],
  ['license.text', /\brider\b|\blicen[cs]e\b/i],
  ['dependency.edge', /\b(asupersync|frankensqlite)\b[^]*\b(Cargo\.lock|Cargo edge|dependency|admitted|appearing|build graph)\b|\b(Cargo\.lock|Cargo edge)\b[^]*\b(asupersync|frankensqlite)\b/i],
  ['release.first', /\b(first|any)\b[^]*\b(release|tag)\b|\ba tagged release\b|\bfirst git tag\b/i],
  ['ci.class', new RegExp(`${CI_WORD}[^]*${CI_STATE}|${CI_STATE}[^]*${CI_WORD}`, 'i')],
  ['contributors.second_human', /\bsecond (human )?(maintainer|committer|contributor)\b/i],
];
// Words that name something the watch cannot see (registries, receipts, benchmarks, reviews,
// durations, a release at one particular commit): a trigger that mentions one is human even when
// a machine keyword also matches.
const UNOBSERVABLE = /\b(PyPI|npm|crates\.io|reverse-dependency|benchmark|review|receipt|deployment|governance|funder|stable|non-pre-release|after v\d|DSR|self-hosted|logs|embedding|pointing at the assessed commit|at the assessed commit|HEAD-current|sustained|days|month)\b/i;

function categoryOf(alt) {
  const hits = RULES.filter(([, re]) => re.test(alt)).map(([d]) => d);
  if (hits.length <= 1) return hits[0] ?? null;
  return hits.includes('dependency.edge') ? 'dependency.edge' : 'ambiguous';
}

// Only the trigger phrase is mapped: what follows " — ", " → " or ". Flips" states consequences.
export const triggerPhrase = (text) => text.split(/\s[—→]\s|\.\s+Flips\b/)[0];

export function mapDetector(full) {
  const text = triggerPhrase(full);
  if (UNOBSERVABLE.test(text)) return { detector: 'human', params: '' };
  const alts = text.split(/\s\(?(?:or|and\/or)\s|,\s(?=a |an |the |any )/i);
  const cats = new Set(alts.map(categoryOf));
  if (cats.size !== 1) return { detector: 'human', params: '' };
  const [d] = cats;
  if (!d || d === 'ambiguous') return { detector: 'human', params: '' };
  if (d === 'ci.class') return { detector: d, params: /\bgreen/i.test(text) ? 'to=C1' : 'to=C1|C2|C3' };
  if (d === 'dependency.edge') {
    const crates = CRATES.filter(([word]) => new RegExp(`\\b${word}\\b`, 'i').test(text)).map(([, crate]) => crate);
    return { detector: d, params: `crates=${crates.join('|')}` };
  }
  return { detector: d, params: '' };
}

// ---------------------------------------------------------------- the table
export function revisitRows(root = ROOT) {
  const dir = join(root, 'packets');
  const rows = [];
  for (const f of readdirSync(dir).filter((x) => x.endsWith('-assessment.md')).sort()) {
    const repo = f.replace(/-assessment\.md$/, '');
    for (const t of parseTriggers(readFileSync(join(dir, f), 'utf8'))) {
      const m = mapDetector(t.text);
      rows.push({ repo, n: t.n, text: t.text, detector: m.detector, params: m.params, packet: `packets/${f}#L${t.line}`, reviewed_by: UNREVIEWED });
    }
  }
  return rows;
}

const tsvCell = (v) => String(v).replace(/[\t\n]/g, ' ');
export function renderTsv(rows) {
  return [
    '# Revisit triggers from every packet (RULEBOOK.md §4.11), mapped to the FR-T.7 detector vocabulary. Generated by `node watch/freshness/revisit.mjs --tsv`; the reviewed_by column records who checked each mapping.',
    TSV_HEAD.join('\t'),
    ...rows.map((r) => TSV_HEAD.map((k) => tsvCell(r[k])).join('\t')),
  ].join('\n') + '\n';
}

export function parseTsv(text) {
  const lines = text.split('\n').filter((l) => l && !l.startsWith('#'));
  const head = lines.shift()?.split('\t');
  if (head?.join() !== TSV_HEAD.join()) throw new Error(`revisit.tsv header is not ${TSV_HEAD.join(', ')}`);
  return lines.map((l) => {
    const c = l.split('\t');
    const row = Object.fromEntries(TSV_HEAD.map((k, i) => [k, c[i] ?? '']));
    row.n = Number(row.n);
    if (!DETECTORS.includes(row.detector)) throw new Error(`revisit.tsv: ${row.repo} #${row.n} detector ${row.detector} is not in the FR-T.7 vocabulary`);
    return row;
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv[2] !== '--tsv') { console.error('usage: node watch/freshness/revisit.mjs --tsv'); process.exit(2); }
  process.stdout.write(renderTsv(revisitRows()));
}
