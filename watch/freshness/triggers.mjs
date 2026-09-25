// watch/freshness/triggers.mjs: class triggers (watch/freshness/SPEC.md FR-T) and the crossing
// ledger (FR-G.3).
//
// For each watched repository and each dimension (ci, rel, license) the machine class at the
// baseline is compared with the reference the analysts recorded there: the master matrix at the
// packet pin, or the cells table of the latest dated re-check under updates/ (FR-T.8). A dimension
// whose machine class disagrees with its reference is untracked (FR-T.2): it raises no class
// crossing, and its events are flagged by the event rules of watch/README.md instead. A tracked
// dimension raises a crossing when its class now differs from its class at the baseline and both
// are known (FR-T.1, FR-T.5). Existence changes always raise one (FR-T.3); machine-observable
// revisit triggers from revisit.tsv raise one with source `revisit` (FR-T.7). Crossings other than
// existence open only on the second consecutive daily observation (FR-T.6), and only a dated
// re-check resolves one (FR-T.8). Everything here is a pure function of its arguments.
//
// Node 22 built-ins only.

import { createHash } from 'node:crypto';
import { DIMS } from './classify.mjs';

const OWNER = 'Dicklesworthstone';
const gh = (repo, rest = '') => `https://github.com/${OWNER}/${repo}${rest}`;
const api = (path) => `https://api.github.com${path}`;
const day = (isoTime) => String(isoTime).slice(0, 10);
const digest = (v) => createHash('sha256').update(JSON.stringify(v)).digest('hex').slice(0, 12);
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
export const DUE_DAYS = 90;

// ---------------------------------------------------------------- references: matrix, re-checks
// The class a matrix cell names: its leading legend token ("C4 (deploy-only; ...)" is C4). The
// license column is Rider, plain MIT, or none.
export function matrixClasses(row) {
  if (!row) return null;
  const tok = (s, re) => (String(s ?? '').match(re) ?? [null])[0];
  return { ci: tok(row.CI, /^C[1-6]\b/), rel: tok(row.Rel, /^R[1-3]\b/), license: row.License?.trim() || null };
}

// A dated re-check updates/<repo>-<YYYY-MM-DD>.md (updates/METHOD.md rules 3 and 4): its re-check
// pin from the header and, from the cells table, the class each dimension has at the re-check
// pin. A cell reading "unchanged" or "Same" keeps the class of its "At the pin" column.
const RECHECK_FILE = /^(.+)-(\d{4}-\d{2}-\d{2})\.md$/;
const CELL_ROWS = { ci: /^CI class$/i, rel: /^Release class$/i, license: /^License$/i };
function licenseWord(s) {
  if (/rider/i.test(s)) return 'Rider';
  if (/plain MIT/i.test(s)) return 'plain MIT';
  if (/\bnone\b|no operative grant/i.test(s)) return 'none';
  return null;
}
function cellClass(dim, atPin, atRecheck) {
  const text = atRecheck.replace(/\*\*/g, '');
  const pick = (s) => (dim === 'ci' ? (s.match(/\bC[1-6]\b/) ?? [null])[0] : dim === 'rel' ? (s.match(/\bR[1-3]\b/) ?? [null])[0] : licenseWord(s));
  const own = /^\s*(same|unchanged)\b/i.test(text) || (/\bunchanged\b/i.test(text) && pick(text) == null) ? null : pick(text);
  return own ?? pick(atPin.replace(/\*\*/g, ''));
}
export function parseRecheck(file, text) {
  const m = file.match(RECHECK_FILE);
  if (!m) return null;
  const pin = text.match(/\*\*Re-check pin:\*\*\s*`([0-9a-f]{40})`\s*\(([^)]*)\)/);
  if (!pin) return null;
  const classes = {};
  for (const line of text.split('\n')) {
    const cells = line.split('|').slice(1, -1).map((c) => c.trim());
    if (cells.length < 3) continue;
    for (const [dim, re] of Object.entries(CELL_ROWS)) if (re.test(cells[0]) && !(dim in classes)) classes[dim] = cellClass(dim, cells[1], cells[2]);
  }
  if (DIMS.some((d) => !classes[d])) return null;
  return { repo: m[1], date: m[2], sha: pin[1], source: `updates/${file}`, classes };
}

// The latest re-check per repository wins (FR-T.8: from then on it is the baseline).
export function latestRechecks(files) {
  const out = {};
  for (const { file, text } of [...files].sort((a, b) => cmp(a.file, b.file))) {
    const r = parseRecheck(file, text);
    if (r && (!out[r.repo] || out[r.repo].date <= r.date)) out[r.repo] = r;
  }
  return out;
}

// private-ci.tsv rows -> repo -> the fact FR-C.2's C6 reads, with its source.
export function parsePrivateCi(text) {
  const out = {};
  const lines = text.split('\n').filter((l) => l && !l.startsWith('#'));
  const head = lines.shift()?.split('\t');
  if (head?.join() !== 'repo,source,tier,quote') throw new Error('private-ci.tsv header is not repo, source, tier, quote');
  for (const l of lines) {
    const [repo, source, tier, quote] = l.split('\t');
    const [path, line] = source.split(':');
    out[repo] = { source, tier, quote, source_url: `https://github.com/JYeswak/franken-research/blob/main/${path}#L${line}` };
  }
  return out;
}

// ---------------------------------------------------------------- per-dimension comparison
// base: the machine classes at the baseline point; now: at HEAD; reference: what the analysts
// recorded at the baseline. tracked (FR-T.2) = the machine agrees with the reference there.
export function compareDim(reference, base, now) {
  const tracked = base.value !== 'unknown' && base.value === reference;
  const known = base.value !== 'unknown' && now.value !== 'unknown';
  return { tracked, crossing: tracked && known && now.value !== base.value };
}

// ---------------------------------------------------------------- candidate crossings
const crossing = (repo, dim, from, to, source, evidence, id) => ({ id: id ?? `${repo}:${dim}:${from}>${to}`, repo, dim, from, to, source, evidence: [...new Set(evidence)] });

// FR-T.1: a tracked dimension whose class moved.
function classCrossings(repo, dims) {
  const out = [];
  for (const d of DIMS) {
    const x = dims[d];
    if (x.cmp.crossing) out.push(crossing(repo, d, x.base.value, x.now.value, 'class', [...x.now.evidence, ...x.base.evidence]));
  }
  return out;
}

// FR-T.2: an untracked dimension falls back to the event rules of watch/README.md, measured from
// the baseline: a release or tag dated after it, a license file set that differs, a workflow file
// removed or workflows appearing where there were none.
export function eventFallback(repo, dim, facts, dims) {
  const b = facts.points.baseline;
  const n = facts.points.now;
  if (!b || !n) return [];
  const x = dims[dim];
  const from = x.base.value;
  const to = x.now.value;
  const ev = (ident, evidence) => crossing(repo, dim, from, to, 'event-fallback', evidence, `${repo}:${dim}:event:${ident}`);
  if (dim === 'rel') {
    const rels = (facts.releases ?? []).filter((r) => r.date > b.date).map((r) => ev(`release:${r.tag}`, [gh(repo, `/releases/tag/${encodeURIComponent(r.tag)}`)]));
    const named = new Set((facts.releases ?? []).map((r) => r.tag));
    const tags = (facts.tags ?? []).filter((t) => t.date > b.date && !named.has(t.name)).map((t) => ev(`tag:${t.name}`, [gh(repo, `/tree/${encodeURIComponent(t.name)}`)]));
    return [...rels, ...tags];
  }
  if (dim === 'license') {
    const key = (p) => p.licenses.map((l) => `${l.name}:${l.blob}`).join(',');
    return key(b) === key(n) ? [] : [ev(digest(key(n)), [gh(repo, `/compare/${b.sha}...${n.sha}`), ...n.licenses.map((l) => gh(repo, `/blob/${n.sha}/${encodeURIComponent(l.name)}`))])];
  }
  const before = b.workflows.map((w) => w.path);
  const after = n.workflows.map((w) => w.path);
  const removed = before.filter((p) => !after.includes(p));
  const added = after.filter((p) => !before.includes(p));
  const material = removed.length > 0 || (before.length === 0 && added.length > 0);
  return material ? [ev(digest(after), [gh(repo, `/compare/${b.sha}...${n.sha}`), gh(repo, `/tree/${n.sha}/.github/workflows`)])] : [];
}

// FR-T.3: archived or unarchived, deleted or made private, pin no longer an ancestor of HEAD.
export function existenceCrossings(record, prevExistence) {
  const repo = record.repo;
  const name = record.name ?? repo;
  const out = [];
  const x = (what, from, to, evidence) => crossing(repo, 'existence', from, to, 'existence', evidence, `${repo}:existence:${what}`);
  if (!record.found) return [x('deleted', 'public', 'not found', [api(`/repos/${OWNER}/${repo}`), gh(repo)])];
  if (record.archived) out.push(x('archived', 'active', 'archived', [api(`/repos/${OWNER}/${name}`), gh(name)]));
  if (!record.archived && prevExistence?.archived === true) out.push(x('unarchived', 'archived', 'active', [api(`/repos/${OWNER}/${name}`), gh(name)]));
  if (record.pin_reachable === false) out.push(x('pin-rewritten', 'ancestor', record.compare_status ?? 'unreachable', [api(`/repos/${OWNER}/${name}/compare/${record.pin}...${record.head}`), gh(name, `/commit/${record.pin}`)]));
  return out;
}

// ---------------------------------------------------------------- FR-T.7 machine revisit triggers
// Rows whose detector the watch can evaluate from its facts. `contributors.second_human` is in the
// vocabulary, but the watch never reads commit authors (watch/README.md), so it is not observed.
export const OBSERVED_DETECTORS = new Set(['release.first', 'ci.class', 'license.text', 'archived', 'dependency.edge']);
const DETECTOR_DIM = { 'release.first': 'rel', 'ci.class': 'ci', 'license.text': 'license', archived: 'existence', 'dependency.edge': 'dependency' };
const param = (params, key) => (String(params ?? '').split(';').map((kv) => kv.split('=')).find(([k]) => k === key)?.[1] ?? null);

export function revisitFires(row, facts, dims, record) {
  const d = row.detector;
  if (d === 'release.first') return dims.rel.base.value === 'R1' && ['R2', 'R3'].includes(dims.rel.now.value) ? { from: 'R1', to: dims.rel.now.value } : null;
  if (d === 'ci.class') {
    const want = param(row.params, 'to')?.split('|') ?? null;
    const { base, now } = dims.ci;
    if (base.value === 'unknown' || now.value === 'unknown' || base.value === now.value) return null;
    return !want || want.includes(now.value) ? { from: base.value, to: now.value } : null;
  }
  if (d === 'license.text') {
    const b = facts.points.baseline;
    const n = facts.points.now;
    const key = (p) => p?.licenses?.map((l) => l.blob).join(',') ?? null;
    return b && n && key(b) !== key(n) ? { from: dims.license.base.value, to: dims.license.now.value } : null;
  }
  if (d === 'archived') return record.archived ? { from: 'active', to: 'archived' } : null;
  if (d === 'dependency.edge') {
    const crates = param(row.params, 'crates')?.split('|') ?? [];
    const has = new Set(facts.points.now?.lockfile?.summary?.packages ?? []);
    const hit = crates.filter((c) => has.has(c));
    return facts.points.now?.lockfile?.summary && hit.length ? { from: 'absent', to: hit.join('+') } : null;
  }
  return null;
}

function revisitCrossings(repo, rows, facts, dims, record) {
  const fired = [];
  const out = [];
  for (const row of rows) {
    if (!OBSERVED_DETECTORS.has(row.detector)) continue;
    const f = revisitFires(row, facts, dims, record);
    if (!f) continue;
    fired.push(row.detector);
    out.push(crossing(repo, DETECTOR_DIM[row.detector], f.from, f.to, 'revisit', [gh(repo), `https://github.com/JYeswak/franken-research/blob/main/${row.packet}`], `${repo}:revisit:${row.n}`));
  }
  return { fired: [...new Set(fired)].sort(), out };
}

// ---------------------------------------------------------------- the crossing ledger (FR-G.3)
export const LEDGER_KEYS = ['date', 'event', 'id', 'repo', 'dim', 'from', 'to', 'source', 'evidence', 'resolved_by'];
export function ledgerLine(e) {
  return JSON.stringify(Object.fromEntries(LEDGER_KEYS.map((k) => [k, e[k] ?? null]))) + '\n';
}
export function parseLedger(text) {
  if (text === '') return [];
  if (!text.endsWith('\n')) throw new Error('crossings.jsonl does not end with a newline');
  return text.slice(0, -1).split('\n').map((l, i) => {
    let o;
    try { o = JSON.parse(l); } catch { throw new Error(`crossings.jsonl line ${i + 1} is not JSON`); }
    if (JSON.stringify(Object.keys(o)) !== JSON.stringify(LEDGER_KEYS)) throw new Error(`crossings.jsonl line ${i + 1} keys are not ${LEDGER_KEYS.join(', ')}`);
    if (!['opened', 'resolved'].includes(o.event)) throw new Error(`crossings.jsonl line ${i + 1} event ${o.event}`);
    if (ledgerLine(o) !== l + '\n') throw new Error(`crossings.jsonl line ${i + 1} is not in canonical form`);
    return o;
  });
}
// Crossings opened and not yet resolved, in ledger order.
export function openFromLedger(entries) {
  const open = new Map();
  for (const e of entries) {
    if (e.event === 'opened') open.set(e.id, e);
    else if (!open.delete(e.id)) throw new Error(`crossings.jsonl resolves ${e.id}, which is not open`);
  }
  return open;
}
// The next ledger: the previous text byte for byte, then one line per event. Anything else fails.
export function appendLedger(prevText, events) {
  parseLedger(prevText);
  const next = prevText + events.map(ledgerLine).join('');
  assertLedgerPrefix(prevText, next);
  return next;
}
export function assertLedgerPrefix(prevText, nextText) {
  if (!nextText.startsWith(prevText)) throw new Error('crossings.jsonl: the new ledger does not start with the previous committed ledger');
  parseLedger(nextText);
}

// ---------------------------------------------------------------- FR-T.6 debounce, FR-T.8 resolve
// candidates: this run's crossings; open: ledger's open map; prevPending: id -> { since } from the
// previous live.json; prevDay: the previous run's UTC day. A candidate opens when it is an
// existence crossing, or when the previous run, on an earlier day, already saw it pending.
export function debounce(candidates, open, prevPending, prevDay, today) {
  const opened = [];
  const pending = [];
  for (const c of candidates) {
    if (open.has(c.id)) continue;
    const seen = prevPending.get(c.id);
    if (c.source === 'existence' || (seen && prevDay && prevDay < today)) opened.push({ ...c, since: seen?.since ?? today });
    else pending.push({ ...c, since: seen?.since ?? today });
  }
  return { opened, pending };
}

// An open crossing is resolved by a re-check of its repository dated on or after the day it opened.
export function resolutions(open, rechecks) {
  const out = [];
  for (const e of open.values()) {
    const r = rechecks[e.repo];
    if (r && r.date >= e.date) out.push({ ...e, event: 'resolved', resolved_by: r.source });
  }
  return out;
}

// ---------------------------------------------------------------- one repository
// facts: from facts.factsFor with points pin, now and baseline; reference: the classes recorded at
// the baseline; classify: the FR-C classifier (injected, so this file stays pure and testable).
export function evaluateRepo({ record, facts, reference, classify, revisitRows = [], prevExistence = null }) {
  const at = { pin: classify(facts, 'pin'), baseline: classify(facts, 'baseline'), now: classify(facts, 'now') };
  const dims = {};
  for (const d of DIMS) {
    const base = at.baseline[d];
    const now = at.now[d];
    dims[d] = { reference: reference?.[d] ?? null, pin: at.pin[d], base, now, cmp: compareDim(reference?.[d] ?? null, base, now) };
  }
  const candidates = [];
  if (!record.found) return { dims, candidates: existenceCrossings(record, prevExistence), revisit: { fired: [] } };
  candidates.push(...existenceCrossings(record, prevExistence));
  candidates.push(...classCrossings(record.repo, dims));
  for (const d of DIMS) if (!dims[d].cmp.tracked) candidates.push(...eventFallback(record.repo, d, facts, dims));
  const rv = revisitCrossings(record.repo, revisitRows, facts, dims, record);
  const taken = new Set(candidates.map((c) => c.dim));
  candidates.push(...rv.out.filter((c) => !taken.has(c.dim)));
  return { dims, candidates: candidates.sort((a, b) => cmp(a.id, b.id)), revisit: { fired: rv.fired } };
}

// FR-T.9 and the repository's state (FR-L.1): changed (an open crossing), unknown (a class could not
// be computed at the baseline or now), due (90 days since the baseline), else current.
export function repoState({ open, dims, baselineDate, checkedAt }) {
  const age = Math.floor((Date.parse(checkedAt) - Date.parse(baselineDate)) / 86400000);
  const old = Number.isFinite(age) && age >= DUE_DAYS;
  const due = open.length ? { due: true, reason: 'open crossing' } : old ? { due: true, reason: `${DUE_DAYS} days since baseline` } : { due: false, reason: null };
  if (open.length) return { state: 'changed', state_reason: `open crossing ${open.map((c) => c.id).join(', ')}`, due };
  const unk = DIMS.flatMap((d) => [['baseline', dims[d].base], ['now', dims[d].now]].filter(([, x]) => x.value === 'unknown').map(([w, x]) => `${d} ${w} (${x.rule})`));
  if (unk.length) return { state: 'unknown', state_reason: `unknown: ${unk.join(', ')}`, due };
  if (old) return { state: 'due', state_reason: `${age} days since the baseline`, due };
  return { state: 'current', state_reason: 'every computed class equals its class at the baseline', due };
}
