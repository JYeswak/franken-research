// watch/freshness/live.mjs: watch/live.json (watch/freshness/SPEC.md FR-L.1, FR-L.2, FR-O.3) and the
// crossing ledger step (FR-G.3), from recorded facts.
//
// computeFreshness() runs the classifier and the trigger rules over every watched repository and
// returns the live document plus the next ledger text; buildLive() lays the document out;
// renderLiveJson() serializes it with a fixed key order, so equal facts and an equal `checked_at`
// give byte-identical output. Nothing here reads the network or the clock.
//
// Node 22 built-ins only.

import { classify as classifyFacts, ciCommit, DIMS } from './classify.mjs';
import { factsFor } from './facts.mjs';
import {
  matrixClasses, evaluateRepo, repoState, OBSERVED_DETECTORS, parseLedger, openFromLedger, resolutions, debounce, appendLedger,
  withdrawals, currentValue,
} from './triggers.mjs';

export const SCHEMA = 'fr.watch.live/v1';
export const MAX_BYTES = 96 * 1024;
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const day = (t) => String(t).slice(0, 10);
const MAX_EVIDENCE = 2;

// Upstream names (tags, repository names) are the only upstream text live.json carries. Anything
// outside a conservative set is percent-encoded, so a name can break neither HTML, Markdown nor a
// table cell.
export const safeName = (s) => String(s ?? '').replace(/[^A-Za-z0-9._+\-/]/g, (c) => [...Buffer.from(c)].map((b) => `%${b.toString(16).toUpperCase().padStart(2, '0')}`).join(''));

// ---------------------------------------------------------------- fixed key order (FR-L.1)
const K = {
  top: ['schema', 'checked_at', 'totals', 'repos', 'candidates', 'unknowns', 'informational'],
  totals: ['repos', 'pinned', 'cohort', 'current', 'changed', 'due', 'unknown'],
  repo: ['repo', 'packet', 'brief', 'set', 'baseline', 'pin', 'head', 'commits_since_pin', 'latest_release', 'existence', 'dims', 'crossings', 'pending', 'revisit', 'state', 'state_reason', 'due'],
  baseline: ['sha', 'date', 'source'],
  commit: ['sha', 'date'],
  release: ['tag', 'date', 'url'],
  existence: ['found', 'archived', 'pin_reachable'],
  dim: ['matrix', 'reference', 'at_pin', 'at_baseline', 'now', 'tracked', 'rule_at_pin', 'rule_now', 'evidence'],
  // ci also names the commit its `now` class describes (FR-C.3).
  dimCi: ['matrix', 'reference', 'at_pin', 'at_baseline', 'now', 'now_commit', 'tracked', 'rule_at_pin', 'rule_now', 'evidence'],
  crossing: ['id', 'dim', 'from', 'to', 'since', 'source', 'evidence', 'resolved_by'],
  // A pending entry is about to open (phase opening, FR-T.6) or to be withdrawn (withdrawing, FR-T.10).
  pendingEntry: ['id', 'dim', 'from', 'to', 'since', 'source', 'evidence', 'resolved_by', 'phase'],
  revisit: ['machine', 'human', 'fired'],
  due: ['due', 'reason'],
  candidate: ['repo', 'created_at', 'reasons'],
  unknown: ['repo', 'dim', 'why'],
  informational: ['events_today', 'events_since_pin'],
};
const pick = (keys, o) => (o == null ? null : Object.fromEntries(keys.map((k) => [k, o[k] ?? null])));
const canonCrossing = (c) => pick(K.crossing, c);
function canonRepo(r) {
  return {
    ...pick(K.repo, r),
    baseline: pick(K.baseline, r.baseline), pin: pick(K.commit, r.pin), head: pick(K.commit, r.head),
    latest_release: pick(K.release, r.latest_release), existence: pick(K.existence, r.existence),
    dims: Object.fromEntries(DIMS.map((d) => [d, pick(d === 'ci' ? K.dimCi : K.dim, r.dims?.[d])])),
    crossings: (r.crossings ?? []).map(canonCrossing), pending: (r.pending ?? []).map((c) => pick(K.pendingEntry, c)),
    revisit: pick(K.revisit, r.revisit), due: pick(K.due, r.due),
  };
}
export function canonLive(live) {
  return {
    ...pick(K.top, live),
    totals: pick(K.totals, live.totals),
    repos: (live.repos ?? []).map(canonRepo),
    candidates: (live.candidates ?? []).map((c) => pick(K.candidate, c)),
    unknowns: (live.unknowns ?? []).map((u) => pick(K.unknown, u)),
    informational: pick(K.informational, live.informational),
  };
}
// One repository per line keeps the file under the FR-L.2 budget and its diffs readable.
export function renderLiveJson(live) {
  const c = canonLive(live);
  const head = JSON.stringify({ schema: c.schema, checked_at: c.checked_at, totals: c.totals });
  const list = (xs) => (xs.length ? `[\n${xs.map((x) => `  ${JSON.stringify(x)}`).join(',\n')}\n ]` : '[]');
  return `${head.slice(0, -1)},\n "repos": ${list(c.repos)},\n "candidates": ${list(c.candidates)},\n "unknowns": ${list(c.unknowns)},\n "informational": ${JSON.stringify(c.informational)}\n}\n`;
}

// ---------------------------------------------------------------- one repository row
function latestRelease(record) {
  const r = [...(record.releases ?? [])].sort((a, b) => cmp(b.date ?? '', a.date ?? '') || cmp(a.tag, b.tag))[0];
  return r ? { tag: safeName(r.tag), date: r.date, url: `https://github.com/Dicklesworthstone/${record.name ?? record.repo}/releases/tag/${encodeURIComponent(r.tag)}` } : null;
}
const dimRow = (x, matrix, nowCommit) => ({
  matrix, reference: x.reference, at_pin: x.pin.value, at_baseline: x.base.value, now: x.now.value, now_commit: nowCommit, tracked: x.cmp.tracked,
  rule_at_pin: x.pin.rule, rule_now: x.now.rule, evidence: x.now.evidence.slice(0, MAX_EVIDENCE),
});
const liveCrossing = (c, since) => ({ ...c, id: safeName(c.id).replace(/%3A/g, ':').replace(/%3E/g, '>'), since, evidence: c.evidence.slice(0, MAX_EVIDENCE), resolved_by: null });

// ---------------------------------------------------------------- the whole document
// inputs:
//   records        repo -> facts.mjs record (points pin, now, and recheck where one exists)
//   summaries      blob id -> summary
//   watched        [{ repo, packet, set, matrixRow, verdictDate }] (the 44, then cohort rows; FR-O.3)
//   rechecks       repo -> triggers.latestRechecks() entry
//   privateCi      repo -> private-ci.tsv row
//   revisitRows    revisit.tsv rows
//   prevLive       the previous watch/live.json (parsed) or null
//   ledgerText     the previous watch/crossings.jsonl text ('' when absent)
//   candidates     [{ repo, created_at, reasons }] new public repositories flagged (FR-D.4)
//   informational  { events_today, events_since_pin }
export function computeFreshness({ records, summaries, watched, rechecks = {}, privateCi = {}, revisitRows = [], prevLive = null, ledgerText = '', candidates = [], informational, checkedAt, classify = classifyFacts }) {
  const today = day(checkedAt);
  const prevRepos = new Map((prevLive?.repos ?? []).map((r) => [r.repo, r]));
  const evals = watched.map((w) => {
    const record = records[w.repo];
    const re = rechecks[w.repo] ?? null;
    const reference = re ? re.classes : matrixClasses(w.matrixRow);
    const pointMap = { pin: 'pin', now: 'now', baseline: re ? 'recheck' : 'pin', ci: 'ci' };
    const facts = factsFor(record, summaries, { checkedAt, privateCi: privateCi[w.repo] ?? null, pointMap });
    const ev = evaluateRepo({ record, facts, reference, classify, revisitRows: revisitRows.filter((r) => r.repo === w.repo), prevExistence: prevRepos.get(w.repo)?.existence ?? null });
    return { w, record, re, facts, ev };
  });
  // FR-G.3 and FR-T.6/T.8/T.10: resolve with re-checks, withdraw what came back and held, then
  // debounce this run's candidates.
  const open = openFromLedger(parseLedger(ledgerText));
  const resolved = resolutions(open, rechecks);
  for (const e of resolved) open.delete(e.id);
  const prevPending = new Map([...prevRepos.values()].flatMap((r) => r.pending ?? []).map((p) => [p.id, p]));
  const prevDay = prevLive ? day(prevLive.checked_at) : null;
  const byRepo = new Map(evals.map((e) => [e.w.repo, e]));
  const valueNow = (c) => currentValue(c, byRepo.get(c.repo)?.ev.dims);
  const { withdrawn, returning } = withdrawals(open, valueNow, prevPending, prevDay, today);
  for (const e of withdrawn) open.delete(e.id);
  const all = evals.flatMap((e) => e.ev.candidates).map((c) => liveCrossing(c, today));
  const { opened, pending: opening } = debounce(all, open, prevPending, prevDay, today);
  const events = [
    ...resolved.map((e) => ({ ...e, date: today })),
    ...withdrawn.map((e) => ({ ...e, date: today })),
    ...opened.map((c) => ({ ...c, date: today, event: 'opened', resolved_by: null })),
  ];
  const nextLedger = appendLedger(ledgerText, events);
  for (const c of opened) open.set(c.id, { ...c, date: today });
  const pending = [...opening, ...returning];
  const rows = evals.map((e) => repoRow(e, [...open.values()].filter((c) => c.repo === e.w.repo), pending.filter((c) => c.repo === e.w.repo).sort((a, b) => cmp(a.id, b.id)), revisitRows, checkedAt));
  return { live: buildLive({ checkedAt, rows, candidates, informational }), ledgerText: nextLedger, events };
}

function repoRow({ w, record, re, facts, ev }, open, pending, revisitRows, checkedAt) {
  const mine = revisitRows.filter((r) => r.repo === w.repo);
  const machine = mine.filter((r) => OBSERVED_DETECTORS.has(r.detector)).length;
  // The baseline date is the day the verdict was read: the packet's assessment day, or the re-check's.
  const baseline = re ? { sha: re.sha, date: re.date, source: re.source } : { sha: record.pin, date: w.verdictDate, source: 'packet' };
  const crossings = open.map((c) => ({ ...c, since: c.date ?? c.since })).sort((a, b) => cmp(a.id, b.id));
  const st = repoState({ open: crossings, dims: ev.dims, baselineDate: baseline.date, checkedAt });
  return {
    repo: w.repo, packet: w.packet, brief: `site/briefs/${w.repo}.html`, set: w.set, baseline,
    pin: { sha: record.pin, date: record.pin_date }, head: { sha: record.head, date: record.head_date },
    commits_since_pin: record.commits_since_pin, latest_release: latestRelease(record),
    existence: { found: record.found, archived: record.archived, pin_reachable: record.pin_reachable },
    dims: Object.fromEntries(DIMS.map((d) => [d, dimRow(ev.dims[d], matrixClasses(w.matrixRow)?.[d] ?? null, d === 'ci' ? ciCommit(facts, 'now', ev.dims.ci.now) : undefined)])),
    crossings, pending,
    revisit: { machine, human: mine.length - machine, fired: ev.revisit.fired },
    state: st.state, state_reason: st.state_reason, due: st.due,
    // Not part of the row (the canonical form drops it): the unknown dimensions, with the rule that
    // decided each side, for the document's `unknowns` list.
    unknowns: DIMS.flatMap((d) => {
      const x = ev.dims[d];
      const why = [x.base.value === 'unknown' ? `baseline ${x.base.rule}` : null, x.now.value === 'unknown' ? `now ${x.now.rule}` : null].filter(Boolean);
      return why.length ? [{ repo: w.repo, dim: d, why: why.join('; ') }] : [];
    }),
  };
}

export function buildLive({ checkedAt, rows, candidates, informational }) {
  const repos = [...rows].sort((a, b) => cmp(a.repo, b.repo));
  const count = (s) => repos.filter((r) => r.state === s).length;
  return {
    schema: SCHEMA, checked_at: checkedAt,
    totals: { repos: repos.length, pinned: repos.filter((r) => r.set === 'pinned').length, cohort: repos.filter((r) => r.set !== 'pinned').length, current: count('current'), changed: count('changed'), due: count('due'), unknown: count('unknown') },
    repos,
    candidates: [...candidates].map((c) => ({ repo: safeName(c.repo), created_at: c.created_at, reasons: c.reasons.map((x) => x.replace(/"([^"]*)"/g, (m, word) => `"${safeName(word.toLowerCase())}"`)) })).sort((a, b) => cmp(a.repo, b.repo)),
    unknowns: repos.flatMap((r) => r.unknowns ?? []),
    informational: { events_today: informational?.events_today ?? 0, events_since_pin: informational?.events_since_pin ?? 0 },
  };
}
