#!/usr/bin/env node
// Validates .atlas-arc/eval/golden.jsonl: shape, unique qids, id grammar (contracts/IF-ID.md), that every
// expected and must_not id resolves to a real source item, that each `where` exists and points at the
// same source item as its id, provenance of real queries, the privacy rule (no local paths, session-file
// names, machine or host names, emails or other people's handles in query, origin or provenance),
// negative-control coverage, the leakage audit in leakage.tsv, and the coverage counts the golden set
// promises. Node standard library only. Ids are derived with search/lib/ids.mjs, the one mint function.
//
// What it cannot check: whether an id is a good answer to its query. A valid id whose `where` agrees
// with it passes even when it is irrelevant (fixture GF-06). Relevance is the independent review's job.
//
// Usage: node .atlas-arc/eval/validate.mjs [--golden F] [--crates F] [--fh-ids F] [--ra-ids F]
//          [--contract F] [--leakage F] [--no-coverage] [--json]
//        node .atlas-arc/eval/validate.mjs --selftest            (runs fixtures/selftest.json)
//        node .atlas-arc/eval/validate.mjs --write-leakage --mirror D --fh-repo D --ra-db F
// Exit: 0 = valid and every id resolved; 1 = shape, grammar, agreement, provenance, privacy, leakage or
// coverage error; 2 = only unresolved ids.

import { readFileSync, existsSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mint, mintCrates, loadGrammar } from '../../search/lib/ids.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..');

const args = process.argv.slice(2);
const opt = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? resolve(args[i + 1]) : dflt;
};
const GOLDEN = opt('golden', join(HERE, 'golden.jsonl'));
const CRATES = opt('crates', join(HERE, 'ref', 'crates.tsv'));
const FH_IDS = opt('fh-ids', join(HERE, 'ref', 'fh-ids.tsv'));
const RA_IDS = opt('ra-ids', join(HERE, 'ref', 'ra-ids.tsv'));
const CONTRACT = opt('contract', join(REPO, '.atlas-arc', 'contracts', 'IF-ID.md'));
const LEAKAGE = opt('leakage', join(HERE, 'leakage.tsv'));
const AS_JSON = args.includes('--json');
const NO_COVERAGE = args.includes('--no-coverage');
const sha = (s) => createHash('sha256').update(s, 'utf8').digest('hex');

// ---- selftest: every fixture must fail (or pass) exactly as its row says; the gate W pattern.
if (args.includes('--selftest')) {
  const spec = JSON.parse(readFileSync(join(HERE, 'fixtures', 'selftest.json'), 'utf8'));
  let ok = true;
  for (const f of spec.fixtures) {
    const fargs = f.args.map((a) => a.replace('{fixtures}', join(HERE, 'fixtures')));
    const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), ...fargs, '--json'], { encoding: 'utf8' });
    const out = `${r.stdout}${r.stderr}`;
    const good = r.status === f.expect_exit && (!f.expect_text || out.includes(f.expect_text));
    ok &&= good;
    console.log(`${good ? 'ok  ' : 'FAIL'} ${f.id} exit=${r.status} (want ${f.expect_exit}${f.expect_text ? `, text "${f.expect_text}"` : ''}) ${f.what}`);
  }
  console.log(ok ? `SELFTEST_OK fixtures=${spec.fixtures.length}` : 'SELFTEST_FAILED');
  process.exit(ok ? 0 : 1);
}

const errors = [];
const warnings = [];
const read = (p) => readFileSync(p, 'utf8');
const lines = (p) => read(p).split('\n');

// ---- id grammar: the regex block in IF-ID.md section 5 is the only source; no copy is kept here.
const grammarSource = CONTRACT;
let FAMILIES;
try { FAMILIES = loadGrammar(CONTRACT); } catch (e) { console.error(e.message); process.exit(1); }
const familyOf = (id) => {
  const hits = FAMILIES.filter((f) => f.rx.test(id)).map((f) => f.family);
  return hits.length === 1 ? hits[0] : null;
};

// ---- resolvers: id -> title and id -> source location, built from the real sources.
const titles = new Map(); // id -> title (for the synonym and leakage checks)
const locs = new Map(); // id -> {file, line} for line-addressed repo sources; {repo, manifest, sha} for crates
const add = (id, title, loc) => {
  if (!titles.has(id)) titles.set(id, title);
  if (loc && !locs.has(id)) locs.set(id, loc);
};
const eachLine = (file, fn) => lines(join(REPO, file)).forEach((l, i) => fn(l, i + 1));

eachLine('stack/rigor-practices.tsv', (l, n) => {
  const m = l.match(/^(RP-\d{3})\t([^\t]*)/);
  if (m) add(mint({ family: 'fr-practice', id: m[1] }), m[2], { file: 'stack/rigor-practices.tsv', line: n });
});
eachLine('synthesis/planning/execution-readiness.md', (l, n) => {
  const m = l.match(/^## Gate (\d+) — (.*)/);
  if (m) add(mint({ family: 'fr-gate', n: m[1] }), m[2], { file: 'synthesis/planning/execution-readiness.md', line: n });
});
eachLine('starter-kit/CHECKLIST.md', (l, n) => {
  const m = l.match(/^### ([AB]\d+) — (.*)/);
  if (m) add(mint({ family: 'fr-kit', id: m[1] }), m[2], { file: 'starter-kit/CHECKLIST.md', line: n });
});
eachLine('synthesis/cross-pollination.md', (l, n) => {
  const m = l.match(/^## \d+\. (.*)/);
  if (m) add(mint({ family: 'fr-tech', title: m[1] }), m[1], { file: 'synthesis/cross-pollination.md', line: n });
});
eachLine('synthesis/negative-patterns.md', (l, n) => {
  const m = l.match(/^## P(\d+) — (.*)/);
  if (m) add(mint({ family: 'fr-fm', n: m[1] }), m[2], { file: 'synthesis/negative-patterns.md', line: n });
});
{
  let topic = null;
  eachLine('site/lessons/index.html', (l, n) => {
    const t = l.match(/class="topic" id="([^"]+)"/);
    if (t) topic = t[1];
    const e = l.match(/<span class="r"><a [^>]*>([^<]+)<\/a><\/span>(.*)<\/li>/);
    if (e && topic) add(mint({ family: 'fr-lesson', topic, repo: e[1] }), e[2].replace(/<[^>]+>/g, ''), { file: 'site/lessons/index.html', line: n });
  });
}
for (const f of readdirSync(join(REPO, 'packets'))) {
  const m = f.match(/^(.*)-assessment\.md$/);
  if (m) add(mint({ family: 'fr-verdict', repo: m[1] }), m[1]);
}
for (const f of readdirSync(join(REPO, 'stack'))) {
  if (!f.endsWith('.md') || f === 'METHOD.md') continue;
  const t = read(join(REPO, 'stack', f)).match(/^title: (.*)$/m);
  add(mint({ family: 'fr-stack', slug: f.slice(0, -3) }), t ? t[1] : f.slice(0, -3));
}
if (existsSync(join(REPO, 'cohorts'))) {
  for (const d of readdirSync(join(REPO, 'cohorts'))) {
    const dir = join(REPO, 'cohorts', d);
    if (!existsSync(dir) || !d.match(/^\d{4}-\d{2}$/)) continue;
    for (const f of readdirSync(dir)) {
      const m = f.match(/^(.*)-(assessment|screening)\.md$/);
      if (m) add(mint({ family: 'fr-cohort', repo: m[1] }), m[1]);
    }
  }
}
const refLists = {};
const loadRef = (label, path, titleCol) => {
  if (!existsSync(path)) {
    warnings.push(`${label} id list ${path} not found; its ids will be reported unresolved`);
    refLists[label] = { path, n: 0 };
    return;
  }
  let n = 0;
  let header = null;
  const crateRows = [];
  for (const l of lines(path)) {
    if (!l || l.startsWith('#')) continue;
    const cols = l.split('\t');
    if (!header) { header = cols; continue; }
    const id = cols[0];
    const title = titleCol != null ? cols[titleCol] : id.split(/[:/]/).slice(-1)[0];
    const loc = label === 'crate' ? { repo: cols[1], manifest: cols[3], sha: cols[7] } : null;
    if (label === 'crate') crateRows.push({ id, repo: cols[1], name: cols[2], manifest: cols[3] });
    add(id, title, loc);
    n++;
  }
  // The crate list must be exactly what the shared mint function derives from its own rows (IF-ID §4).
  if (crateRows.length) {
    const minted = mintCrates(crateRows);
    crateRows.forEach((r, i) => { if (minted[i] !== r.id) errors.push(`ref ${path}: ${r.id} is not mint(row) = ${minted[i]}`); });
  }
  refLists[label] = { path, n };
};
loadRef('crate', CRATES, 2);
loadRef('fh', FH_IDS, null);
loadRef('ra', RA_IDS, null);

// ---- agreement: the `where` of an id must point at that id's own source item. A valid id with the
// `where` of another item (the review-5 mutation fr:RP-001) fails here; an irrelevant but self-consistent
// id cannot be caught by any shape check.
const FH_FILE = { rigor: 'rigor-stack.tsv', techniques: 'techniques.tsv', oracles: 'oracles.tsv', runbooks: 'runbooks.tsv', capabilities: 'capability-adoptions.tsv' };
const agreement = (id, where) => {
  if (typeof where !== 'string') return null;
  const loc = locs.get(id);
  let m;
  if (loc && loc.file) {
    const want = `${loc.file}:${loc.line}`;
    return where === want || where.startsWith(`${want} `) ? null : `its source is ${want}`;
  }
  if ((m = id.match(/^fr:verdict-(.+)$/))) {
    return where.startsWith(`site/briefs/${m[1]}.html:`) || where.startsWith(`packets/${m[1]}-assessment.md:`) ? null : `its source is site/briefs/${m[1]}.html or packets/${m[1]}-assessment.md`;
  }
  if ((m = id.match(/^fr:stack-(.+)$/))) return where.startsWith(`stack/${m[1]}.md:`) ? null : `its source is stack/${m[1]}.md`;
  if ((m = id.match(/^fr:cohort-(.+)$/))) {
    return new RegExp(`^cohorts/\\d{4}-\\d{2}/${m[1].replace(/[.]/g, '\\.')}-(assessment|screening)\\.md:`).test(where) ? null : `its source is cohorts/<yyyy-mm>/${m[1]}-(assessment|screening).md`;
  }
  if (id.startsWith('crate:') && loc) {
    const want = `https://github.com/Dicklesworthstone/${loc.repo}/blob/${loc.sha}/${loc.manifest}`;
    return where === want ? null : `its source is ${want} (repo, head commit and manifest path from the crate snapshot)`;
  }
  if ((m = id.match(/^fh:([a-z]+):/))) {
    return new RegExp(`^franken-harvest@[0-9a-f]{8}:${FH_FILE[m[1]].replace('.', '\\.')}:\\d+`).test(where) ? null : `its source is franken-harvest's ${FH_FILE[m[1]]}`;
  }
  if ((m = id.match(/^ra:(profile|kind|prescription):(.+)$/))) {
    const key = { profile: `crate_profiles repo=${m[2]}`, kind: `kinds kind=${m[2]}`, prescription: `prescriptions id=${m[2]}` }[m[1]];
    return where.startsWith(`rigor-atlas data/rigor.sqlite@`) && (where.endsWith(key) || where.includes(`${key} `)) ? null : `its source is rigor-atlas ${key}`;
  }
  if ((m = id.match(/^ra:technique:([^/]+)\/([^/]+)\/[0-9a-f]{8}$/))) {
    const wm = where.match(/techniques repo=(\S+) entity=(\S+)/);
    return wm && wm[1] === m[1] && wm[2].replace(/:/g, '.') === m[2] ? null : `its source is rigor-atlas techniques repo=${m[1]} entity=${m[2]}`;
  }
  return null;
};

// ---- golden set
const ALLOWED = new Set(['qid', 'query', 'user', 'origin', 'origin_note', 'provenance', 'expected', 'must_not', 'controls', 'difficulty', 'honest_answer']);
const DIFFS = ['exact', 'synonym', 'intent', 'typo', 'negation'];
const USERS = ['U1', 'U2', 'U3'];
// Real queries: origin is an opaque public reference; the map from reference to session file is kept
// outside the repository (README "Provenance of real queries").
const SESSION_REF = /^maintainer-session:(\d{4}-\d{2}-\d{2})#[1-9]\d*$/;
// ---- privacy (reviews 5b and 5c): this repository is public. Every scalar field of every golden record is
// scanned (the record schema below names each one; a field it does not name is an error, so nothing is left
// unscanned), free-text fields must use only words found in the repository's own published text or in the
// reviewed allowlist public-words.txt, and every committed file under .atlas-arc/eval and search/ gets the
// same pattern scan. Manual reading stays the second gate: ordinary words can still describe private things.
// privacy-patterns:begin (the scanner's own patterns; the file scan skips these lines of this file only)
const PRIVACY = [
  ['local path', /(?:^|[^A-Za-z0-9_.-])(?:\/Users\/|\/home\/|\/private\/|\/Volumes\/|\/tmp\/|\/var\/folders\/|\/mnt\/|\/opt\/|[A-Za-z]:\\|~\/)/],
  ['session file name', /\bhistory\.(?:jsonl|db)\b|\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b|\brollout-\d{4}-\d{2}-\d{2}T|\b\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z_|\bclaude-history-\d+|\.(?:claude|omp|codex)\//i],
  ['machine or host', /mac ?book|mac ?studio|mac ?mini|\bimac\b|\bm[1-9][ _-]?(?:pro|max|ultra)\b|apple silicon|\bworkstation\b|\blocalhost\b|\b[a-z0-9-]+\.(?:local|internal|lan|corp|intranet|home\.arpa)\b|\b\d{1,3}(?:\.\d{1,3}){3}\b|\b(?:my|our) (?:machine|laptop|server|box|build box|mac|studio)s?\b/i],
  ['email', /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[A-Za-z][A-Za-z0-9.-]*/],
  ['person handle', /(?:^|[^A-Za-z0-9_.-])@(?!doodlestein\b)[A-Za-z0-9_]{2,}/],
  ['private workflow', /\bpanes?\s*#?\d|\bntm (?:send|session|pane)s?\b|\btmux\b|\b(?:send|sending|sent|forward(?:ing)?) (?:this|it) to\b|\bwe(?:'ve| have)? cloned\b|\b(?:our|my) (?:sessions?|fleet|panes?|swarm|crew|workers?|orchestrators?|scratch|repos? list)\b|\bscratch (?:dir|directory|folder)\b/i],
];
// Names of the maintainer's own hosts, volumes, providers, private repositories and people, kept as sha256 of
// the lowercase word (or hyphenated compound) so the list itself discloses nothing.
const PRIVATE_WORD_SHA256 = new Set([
  'cec033e511dab4b2842011e6e960ca35d0bca38f23311342feeac182dd18c10a', '9c89117cfd1ab2d527e07c786b05c262ba7acac87f85c31615127642c42745d2',
  '3a0a942b3419776faae687b07f8b3b704d313450fa5c3e34cf6582d7d34f90c1', '645e3597571c5c8bc2bd6ced66a307541af8f63eaad00ff658326400259435b5',
  '551781074cb519ec1cd660f2856ee2626f91adcbabdb840f3c5a744dbbf1131a',
  '9be4abe1affcc81407f0841e98b51032cf12e70289b5819438fde816340c180f', '9682666514c07508d9ee41ca0a32cf2fc8e0fbda9466c5bfd0f88b82ca5389e9',
  '673063f29d9fd0f136874786cc68b29a509b0c884110ec738f9b760f20c40a6c', '00ce26d7406f611f4c88120f1d1eee8103cca41c8ac509ca7e19658f6a605221',
  'a9db97ea13380c18f21c0b4dd7d0c0e700f02bc05d3c1a6c80d5bec0f1ae8ae3', 'fc52fabe94c0e037d2df4498e87481a6438960c9f73d517584a7a5c564535ac4',
  '386a85d8c88778b00b1355608363c7e3078857f3e9633cfd0802d3bf1c0b5b83', 'fca3d9847bedaa9ac6ff3f168c30c46e4aec20022e9fa590259f984da2496fe3',
  '89c0c88fa2bf8d09b5fb41f34857ba1eaa134ee1f74b97ee1c32a3afdf3fb1dc', '60082084d6bccfc8957b437969a7f5a00dced0e223117d70202a0ca6e3632c68',
  '8e0dd3d1f1dd22fdaed48565f8ea7fd5d009211cf4d2f2879c8b8b35bccb9c5c',
]);
// privacy-patterns:end
const privateWords = (value) => {
  const lower = value.toLowerCase();
  const toks = new Set([...lower.split(/[^a-z0-9]+/), ...lower.split(/[^a-z0-9-]+/).map((t) => t.replace(/^-+|-+$/g, ''))]);
  return [...toks].filter((w) => w && PRIVATE_WORD_SHA256.has(sha(w)));
};
const scanText = (value) => {
  const hits = [];
  for (const [cls, rx] of PRIVACY) { const m = value.match(rx); if (m) hits.push(`${cls} (${JSON.stringify(m[0].trim())})`); }
  if (privateWords(value).length) hits.push('private name (a listed private word)');
  return hits;
};
// The record schema: every scalar leaf of a golden record, by path. `free` fields are prose and also need the
// public vocabulary; the rest are structured and checked by their own grammar or enum elsewhere in this file.
const LEAVES = {
  'qid': 'id', 'query': 'free', 'user': 'enum', 'origin': 'grammar', 'origin_note': 'free', 'difficulty': 'enum', 'honest_answer': 'enum',
  'controls[]': 'enum', 'provenance.source': 'enum', 'provenance.date': 'grammar', 'provenance.verbatim': 'free', 'provenance.redacted[]': 'enum',
  'expected[].id': 'id', 'expected[].why': 'free', 'expected[].where': 'grammar', 'must_not[].id': 'id', 'must_not[].why': 'free', 'must_not[].where': 'grammar',
};
const HONEST_ANSWERS = ['do not use', 'watch, do not commit'];
const REDACTION_LABELS = ['leading local path removed', 'machine name replaced', 'hosting provider name replaced', 'private mirror name replaced',
  'private script name replaced', 'private workflow clause removed', 'person name removed'];
const WHERE_FORMS = [
  /^https:\/\/github\.com\/Dicklesworthstone\/[A-Za-z0-9._-]+\/blob\/[0-9a-f]{40}\/[A-Za-z0-9._\/-]+$/,
  /^[A-Za-z0-9._\/-]+:\d+(?: \(packet: packets\/[A-Za-z0-9._-]+-assessment\.md\))?$/,
  /^franken-harvest@[0-9a-f]{8}:(?:rigor-stack|techniques|oracles|runbooks|capability-adoptions)\.tsv:\d+ \(private repo; vendored snapshot per DEC-003\)$/,
  /^rigor-atlas data\/rigor\.sqlite@[0-9a-f]{8} (?:crate_profiles repo=[A-Za-z0-9._-]+|kinds kind=[a-z0-9-]+|prescriptions id=[a-z0-9-]+|techniques repo=[A-Za-z0-9._-]+ entity=[A-Za-z0-9._:-]+(?: \(row \d+ at this build\))?)$/,
];
// Public vocabulary: every word of the repository's published text (assessments, syntheses, stack verdicts,
// starter kit, cohort packets, briefs, lessons, the Rulebook, the charter) plus the id lists, plus the words a
// reviewer accepted in public-words.txt. A word outside it (a server name, a private tool) fails.
let VOCAB = null;
const vocab = () => {
  if (VOCAB) return VOCAB;
  VOCAB = new Set();
  const files = execFileSync('git', ['-C', REPO, 'ls-files', 'packets', 'synthesis', 'stack', 'starter-kit', 'cohorts', 'site/briefs', 'site/lessons', 'site/stack',
    'RULEBOOK.md', 'README.md', '.atlas-arc/PROJECT_CHARTER.md', '.atlas-arc/eval/ref'], { encoding: 'utf8' }).split('\n').filter((f) => /\.(md|html|tsv|txt)$/.test(f));
  for (const f of files) for (const w of read(join(REPO, f)).toLowerCase().split(/[^a-z0-9]+/)) if (w) VOCAB.add(w);
  const allow = join(HERE, 'public-words.txt');
  if (existsSync(allow)) for (const l of lines(allow)) { const w = l.split('\t')[0]; if (w && !w.startsWith('#')) VOCAB.add(w); }
  return VOCAB;
};
const leafPath = (p) => p.replace(/\[\d+\]/g, '[]');
const privacyScan = (qid, r) => {
  const walk = (path, v) => {
    if (Array.isArray(v)) return v.forEach((x, i) => walk(`${path}[${i}]`, x));
    if (v && typeof v === 'object') return Object.entries(v).forEach(([k, x]) => walk(path ? `${path}.${k}` : k, x));
    const kind = LEAVES[leafPath(path)];
    if (typeof v === 'string') for (const h of scanText(v)) errors.push(`privacy: ${qid} ${path}: ${h}`);
    if (!kind) return errors.push(`privacy: ${qid} ${path}: field outside the public record schema`);
    if (typeof v !== 'string') return;
    if (kind === 'free') {
      const novel = [...new Set(v.toLowerCase().split(/[^a-z0-9]+/))].filter((w) => w && !/^\d+$/.test(w) && !vocab().has(w));
      if (novel.length) errors.push(`privacy: ${qid} ${path}: word not in the public vocabulary (${novel.join(', ')}); if it is public, add it to public-words.txt after review`);
    }
  };
  walk('', r);
};
// Negative-control families (README "Negative controls"): the five postures an adoption imperative
// must never contradict, and the verdict families a wrong verdict can come from.
const CONTROL_FAMILIES = ['posture:patterns-only', 'posture:do-not-depend', 'posture:watch', 'posture:reference-only', 'posture:unassessed',
  'family:pilot', 'family:explore', 'family:monitor', 'family:stack', 'family:cohort'];
const rows = [];
lines(GOLDEN).forEach((l, i) => {
  if (!l.trim()) return;
  try { rows.push({ line: i + 1, r: JSON.parse(l) }); } catch (e) { errors.push(`line ${i + 1}: not JSON (${e.message})`); }
});

const qids = new Map();
const queries = new Map();
const unresolved = new Map(); // id -> [qid]
const byFamily = {};
const familyQueries = {};
const byDiff = Object.fromEntries(DIFFS.map((d) => [d, 0]));
const byUser = Object.fromEntries(USERS.map((u) => [u, 0]));
const byOrigin = { charter: 0, site: 0, session: 0 };
const realVerbatim = [];
const realRedacted = [];
const realParaphrase = [];
const controlQueries = Object.fromEntries(CONTROL_FAMILIES.map((f) => [f, []]));
let honest = 0;
let mustNot = 0;
const synonymClean = [];
const synonymLeaky = [];
const STOP = new Set('a an the to of for in on and or but is it i my me we our us that this with as by be can how what do does should could would not no don t s from at into their its your you are was which when why who whom any all only than then so if there here about like one two own just more most'.split(' '));
const words = (s) => new Set(String(s).toLowerCase().split(/[^a-z0-9]+/).filter((w) => w && !STOP.has(w)).map((w) => (w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w)));

const checkWhere = (qid, id, where) => {
  if (typeof where !== 'string' || !where) return errors.push(`${qid} ${id}: missing "where"`);
  if (!WHERE_FORMS.some((rx) => rx.test(where))) return errors.push(`${qid} ${id}: "where" is not one of the public where forms (repo file:line [with its packet], a pinned GitHub URL, or an fh or rigor-atlas snapshot pointer): ${JSON.stringify(where)}`);
  const m = where.match(/^([A-Za-z0-9._\/-]+):(\d+)/);
  if (!m || /^(https|franken-harvest@|rigor-atlas )/.test(where)) return;
  const p = join(REPO, m[1]);
  if (!existsSync(p)) return errors.push(`${qid} ${id}: "where" file does not exist: ${m[1]}`);
  if (lines(p).length < Number(m[2])) errors.push(`${qid} ${id}: "where" line ${m[2]} is past the end of ${m[1]}`);
};

const checkIds = (qid, list, label, required) => {
  if (!Array.isArray(list)) return errors.push(`${qid}: ${label} must be an array`);
  if (required && (list.length < 1 || list.length > 5)) errors.push(`${qid}: ${label} must hold 1-5 ids, has ${list.length}`);
  const seen = new Set();
  for (const e of list) {
    if (!e || typeof e !== 'object') { errors.push(`${qid}: ${label} entry is not an object`); continue; }
    for (const k of Object.keys(e)) if (!['id', 'why', 'where'].includes(k)) errors.push(`${qid}: ${label} entry has unknown field "${k}"`);
    if (typeof e.id !== 'string') { errors.push(`${qid}: ${label} entry has no id`); continue; }
    if (seen.has(e.id)) errors.push(`${qid}: ${label} repeats ${e.id}`);
    seen.add(e.id);
    if (typeof e.why !== 'string' || e.why.trim().length < 5) errors.push(`${qid} ${e.id}: "why" is missing or too short`);
    checkWhere(qid, e.id, e.where);
    const fam = familyOf(e.id);
    if (!fam) { errors.push(`${qid}: ${e.id} matches no id family (or more than one) in ${grammarSource}`); continue; }
    if (!titles.has(e.id)) unresolved.set(e.id, [...(unresolved.get(e.id) || []), qid]);
    else {
      const bad = agreement(e.id, e.where);
      if (bad) errors.push(`${qid} ${e.id}: "where" does not point at this id's source item (${bad}); where=${e.where}`);
    }
    if (label === 'expected') {
      byFamily[fam] = (byFamily[fam] || 0) + 1;
      (familyQueries[fam] ||= new Set()).add(qid);
    }
  }
  return seen;
};

for (const { line, r } of rows) {
  const qid = r.qid;
  if (typeof qid !== 'string' || !/^G-\d{3}$/.test(qid)) { errors.push(`line ${line}: bad qid ${JSON.stringify(qid)}`); continue; }
  if (qids.has(qid)) errors.push(`${qid}: duplicate qid (lines ${qids.get(qid)} and ${line})`);
  qids.set(qid, line);
  for (const k of Object.keys(r)) if (!ALLOWED.has(k)) errors.push(`${qid}: unknown field "${k}"`);
  if (typeof r.query !== 'string' || !r.query.trim()) errors.push(`${qid}: empty query`);
  else {
    const norm = r.query.toLowerCase().replace(/\s+/g, ' ').trim();
    if (queries.has(norm)) errors.push(`${qid}: same query as ${queries.get(norm)}`);
    queries.set(norm, qid);
  }
  if (!USERS.includes(r.user)) errors.push(`${qid}: user must be one of ${USERS.join('/')}`); else byUser[r.user]++;
  privacyScan(qid, r);
  if (r.honest_answer != null && !HONEST_ANSWERS.includes(r.honest_answer)) errors.push(`${qid}: honest_answer must be one of ${HONEST_ANSWERS.map((h) => JSON.stringify(h)).join(', ')}`);
  let session = false;
  let sessionDate = null;
  if (typeof r.origin !== 'string' || !r.origin) errors.push(`${qid}: missing origin`);
  else if (r.origin === 'charter' || r.origin === 'site') byOrigin[r.origin]++;
  else if (SESSION_REF.test(r.origin)) { byOrigin.session++; session = true; sessionDate = r.origin.match(SESSION_REF)[1]; }
  else errors.push(`${qid}: origin must be "charter", "site" or an opaque maintainer-session:<YYYY-MM-DD>#<n> reference, got ${JSON.stringify(r.origin)}`);
  // A real query carries the question as typed (private detail redacted and labelled), or says it is a paraphrase.
  if (r.provenance != null) {
    const p = r.provenance;
    if (!session) errors.push(`${qid}: provenance is only for session-origin (real) queries`);
    if (!p || typeof p !== 'object') errors.push(`${qid}: provenance must be an object`);
    else {
      for (const k of Object.keys(p)) if (!['source', 'date', 'verbatim', 'redacted'].includes(k)) errors.push(`${qid}: provenance has unknown field "${k}"`);
      if (p.source !== 'maintainer-session') errors.push(`${qid}: provenance.source must be "maintainer-session"`);
      if (typeof p.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(p.date)) errors.push(`${qid}: provenance.date must be YYYY-MM-DD`);
      else if (sessionDate && p.date !== sessionDate) errors.push(`${qid}: provenance.date ${p.date} differs from the origin reference date ${sessionDate}`);
      if (p.redacted != null && (!Array.isArray(p.redacted) || !p.redacted.length || p.redacted.some((x) => !REDACTION_LABELS.includes(x)))) errors.push(`${qid}: provenance.redacted must be a non-empty list of the fixed labels (${REDACTION_LABELS.join('; ')})`);
      if (typeof p.verbatim !== 'string' || !p.verbatim.trim()) errors.push(`${qid}: provenance.verbatim is empty`);
      else if (p.verbatim.length > 400) errors.push(`${qid}: provenance.verbatim is longer than 400 characters; trim it to the question`);
      else if (p.verbatim !== r.query) errors.push(`${qid}: provenance.verbatim differs from query`);
      else (p.redacted ? realRedacted : realVerbatim).push(qid);
    }
  } else if (session) {
    if (/^paraphrase/.test(r.origin_note || '')) realParaphrase.push(qid);
    else errors.push(`${qid}: a session-origin query needs provenance {source, date, verbatim} or an origin_note starting "paraphrase"`);
  }
  if (!DIFFS.includes(r.difficulty)) errors.push(`${qid}: difficulty must be one of ${DIFFS.join('/')}`); else byDiff[r.difficulty]++;
  if (r.honest_answer != null) { if (typeof r.honest_answer !== 'string' || !r.honest_answer) errors.push(`${qid}: honest_answer must be a non-empty string`); else honest++; }
  const exp = checkIds(qid, r.expected, 'expected', true);
  if (r.must_not != null) {
    const mn = checkIds(qid, r.must_not, 'must_not', false);
    mustNot += Array.isArray(r.must_not) ? r.must_not.length : 0;
    if (exp && mn) for (const id of mn) if (exp.has(id)) errors.push(`${qid}: ${id} is both expected and must_not`);
  }
  if (r.controls != null) {
    if (!Array.isArray(r.controls) || !r.controls.length) errors.push(`${qid}: controls must be a non-empty array`);
    else {
      if (!Array.isArray(r.must_not) || !r.must_not.length) errors.push(`${qid}: controls names a negative-control family but the query has no must_not id`);
      for (const c of r.controls) {
        if (!CONTROL_FAMILIES.includes(c)) errors.push(`${qid}: unknown control family "${c}" (known: ${CONTROL_FAMILIES.join(', ')})`);
        else controlQueries[c].push(qid);
      }
    }
  }
  if (r.difficulty === 'synonym' && Array.isArray(r.expected)) {
    const q = words(r.query);
    const leaks = [];
    for (const e of r.expected) {
      const t = titles.get(e.id) ?? e.id;
      for (const w of words(t)) if (q.has(w)) leaks.push(`${e.id}:"${w}"`);
    }
    (leaks.length ? synonymLeaky : synonymClean).push(leaks.length ? `${qid} (${leaks.join(', ')})` : qid);
  }
}
const sortedQids = [...qids.keys()].sort();
const gap = sortedQids.findIndex((q, i) => q !== `G-${String(i + 1).padStart(3, '0')}`);
if (gap >= 0) warnings.push(`qids are not contiguous from ${sortedQids[gap]} (expected G-${String(gap + 1).padStart(3, '0')})`);

// ---- leakage audit: how much of each query's wording already sits in the text it cites (title, why,
// the cited source lines, fh quotes, rigor-atlas rows, crate manifests). leakage.tsv is written by
// --write-leakage on a machine that holds the sources; this run checks it covers every query as worded now.
const LEAK_RUN = 3; // a shared run of 3+ consecutive words holding 2+ content words is leaky
const LEAK_RATIO = 0.5; // or half or more of the query's content words appear in the cited text
const tokens = (s) => String(s).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
const leakOf = (query, texts) => {
  const q = tokens(query);
  const qc = words(query);
  const all = texts.join('\n');
  const cited = words(all);
  const shared = [...qc].filter((w) => cited.has(w));
  const t = tokens(all);
  const tset = new Set();
  for (let n = 3; n <= Math.min(8, q.length); n++) for (let i = 0; i + n <= t.length; i++) tset.add(`${n}|${t.slice(i, i + n).join(' ')}`);
  let run = 0;
  let runText = '';
  for (let n = Math.min(8, q.length); n >= 3 && !run; n--) {
    for (let i = 0; i + n <= q.length; i++) {
      const g = q.slice(i, i + n);
      if (g.filter((w) => !STOP.has(w)).length >= 2 && tset.has(`${n}|${g.join(' ')}`)) { run = n; runText = g.join(' '); break; }
    }
  }
  const ratio = qc.size ? shared.length / qc.size : 0;
  return { cls: run >= LEAK_RUN || (qc.size >= 2 && ratio >= LEAK_RATIO) ? 'leaky' : 'independent', run, runText, ratio, shared };
};

// leakage.tsv header: fixed text, so the file cannot carry where or from what it was generated (review 5c).
const LEAKAGE_HEADER = [
  '# Leakage audit of golden.jsonl: each query against every text it cites, for expected and must_not ids alike:',
  '# the id title, the "why" line, and the cited source (repo file lines where..where+6, the pinned crate manifest,',
  `# the fh catalog row with its quote at the pinned revision, the rigor-atlas row). leaky = a shared run of >= ${LEAK_RUN} consecutive words`,
  `# holding >= 2 content words, or >= ${LEAK_RATIO * 100}% of the query's content words in the cited text; else independent.`,
];
const LEAKAGE_WRITTEN = /^# written \d{4}-\d{2}-\d{2} by \.atlas-arc\/eval\/validate\.mjs --write-leakage \(leakage format 2\)$/;
const LEAKAGE_COLUMNS = 'qid\tquery_sha12\tclass\tlongest_shared_run\tcontent_overlap\tsources_read\tsources_missing\tshared_words\tshared_run';

if (args.includes('--write-leakage')) {
  // No defaults: the sources live on the maintainer's machine and their paths do not belong in this repository.
  const MIRROR = opt('mirror', process.env.FR_MIRROR);
  const FH_REPO = opt('fh-repo', process.env.FR_FH_REPO);
  const RA_DB = opt('ra-db', process.env.FR_RA_DB);
  if (!MIRROR || !FH_REPO || !RA_DB) {
    console.error('--write-leakage needs --mirror <Dicklesworthstone mirror>, --fh-repo <franken-harvest checkout> and --ra-db <rigor.sqlite copy> (or FR_MIRROR, FR_FH_REPO, FR_RA_DB)');
    process.exit(1);
  }
  const sh = (cmd, a) => { try { return execFileSync(cmd, a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 << 20 }); } catch { return null; } };
  const strip = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  const sq = (s) => s.replace(/'/g, "''");
  const raText = (where, id) => {
    let m;
    let sql = null;
    if ((m = where.match(/crate_profiles repo=(\S+)/))) sql = `select * from crate_profiles where repo='${sq(m[1])}'`;
    else if ((m = where.match(/kinds kind=(\S+)/))) sql = `select * from kinds where kind='${sq(m[1])}'`;
    else if ((m = where.match(/prescriptions id=(\S+)/))) sql = `select * from prescriptions where id='${sq(m[1])}'`;
    else if ((m = where.match(/techniques repo=(\S+) entity=(\S+)/))) sql = `select * from techniques where repo='${sq(m[1])}' and entity='${sq(m[2])}'`;
    if (!sql || !existsSync(RA_DB)) return null;
    const out = sh('sqlite3', ['-json', `file:${RA_DB}?immutable=1`, sql]);
    if (out == null) return null;
    let rs = out.trim() ? JSON.parse(out) : [];
    const h8 = id.match(/\/([0-9a-f]{8})$/);
    if (h8) rs = rs.filter((r) => sha(String(r.technique).trim()).startsWith(h8[1]));
    return rs.length ? rs.map((r) => Object.values(r).filter((v) => typeof v === 'string').join('\n')).join('\n') : null;
  };
  const sourceText = (id, where) => {
    let m;
    if ((m = where.match(/^https:\/\/github\.com\/Dicklesworthstone\/([^/]+)\/blob\/([0-9a-f]{40})\/(.+)$/))) return sh('git', ['-C', join(MIRROR, m[1]), 'show', `${m[2]}:${m[3]}`]);
    if ((m = where.match(/^franken-harvest@([0-9a-f]{8}):([^:]+):(\d+)/))) {
      const t = sh('git', ['-C', FH_REPO, 'show', `${m[1]}:${m[2]}`]);
      return t == null ? null : t.split('\n')[Number(m[3]) - 1] ?? null;
    }
    if (where.startsWith('rigor-atlas ')) return raText(where, id);
    if ((m = where.match(/^([A-Za-z0-9._\/-]+):(\d+)/)) && existsSync(join(REPO, m[1]))) {
      const n = Number(m[2]);
      return strip(lines(join(REPO, m[1])).slice(Math.max(0, n - 2), n + 6).join('\n'));
    }
    return null;
  };
  const out = [...LEAKAGE_HEADER, `# written ${new Date().toISOString().slice(0, 10)} by .atlas-arc/eval/validate.mjs --write-leakage (leakage format 2)`, LEAKAGE_COLUMNS];
  for (const { r } of rows) {
    const texts = [];
    let readN = 0;
    const missing = [];
    for (const e of [...(r.expected || []), ...(r.must_not || [])]) {
      texts.push(titles.get(e.id) ?? '', e.why ?? '');
      const t = sourceText(e.id, e.where ?? '');
      if (t == null) missing.push(e.id); else { texts.push(t); readN++; }
    }
    const L = leakOf(r.query, texts);
    out.push([r.qid, sha(r.query).slice(0, 12), L.cls, L.run, L.ratio.toFixed(2), readN, missing.join(',') || '-', L.shared.join(',') || '-', L.runText || '-'].join('\t'));
  }
  writeFileSync(LEAKAGE, `${out.join('\n')}\n`);
  console.log(`wrote ${LEAKAGE} (${rows.length} rows)`);
  process.exit(0);
}

const leakage = { file: LEAKAGE, leaky: [], independent: [], real_leaky: [], real_independent: [] };
if (!NO_COVERAGE || args.includes('--leakage')) {
  if (!existsSync(LEAKAGE)) errors.push(`leakage: ${LEAKAGE} is missing; run node .atlas-arc/eval/validate.mjs --write-leakage`);
  else {
    const L = new Map();
    // The header is a fixed public form (review 5c): the method lines, one opaque tool/format/date line, the columns.
    const all = lines(LEAKAGE);
    const head = all.filter((l) => l.startsWith('#'));
    const want = [...LEAKAGE_HEADER, null];
    const headOk = head.length === want.length && head.every((l, i) => (want[i] === null ? LEAKAGE_WRITTEN.test(l) : l === want[i])) && all.includes(LEAKAGE_COLUMNS);
    if (!headOk) errors.push(`leakage header: ${LEAKAGE} does not carry the fixed public header (method lines, "# written <date> by .atlas-arc/eval/validate.mjs --write-leakage (leakage format 2)", columns); rerun --write-leakage`);
    for (const l of all) {
      if (!l || l.startsWith('#') || l.startsWith('qid\t')) continue;
      const c = l.split('\t');
      L.set(c[0], { sha12: c[1], cls: c[2] });
    }
    const real = new Set([...realVerbatim, ...realRedacted, ...realParaphrase]);
    for (const { r } of rows) {
      const row = L.get(r.qid);
      if (!row) { errors.push(`leakage: ${r.qid} has no row in ${LEAKAGE}; rerun --write-leakage`); continue; }
      if (row.sha12 !== sha(r.query).slice(0, 12)) { errors.push(`leakage: ${r.qid} row is stale (the query changed since the audit); rerun --write-leakage`); continue; }
      if (!['leaky', 'independent'].includes(row.cls)) { errors.push(`leakage: ${r.qid} has class "${row.cls}"`); continue; }
      leakage[row.cls].push(r.qid);
      if (real.has(r.qid)) leakage[`real_${row.cls}`].push(r.qid);
    }
  }
}

// ---- committed-artifact scan (review 5c): every file under .atlas-arc/eval and search/ that git tracks or would
// add gets the pattern scan above, line by line. Exempt: the pattern block of this file (between its markers),
// and the fixtures selftest.json marks planted_private (expected to fail); their planted values are synthetic,
// and the selftest proves each of them is rejected.
const ARTIFACT_ROOTS = ['.atlas-arc/eval', 'search'];
const artifactList = args.includes('--artifact-files')
  ? args[args.indexOf('--artifact-files') + 1].split(',').map((f) => resolve(f))
  : NO_COVERAGE ? [] : execFileSync('git', ['-C', REPO, 'ls-files', '--cached', '--others', '--exclude-standard', '--', ...ARTIFACT_ROOTS], { encoding: 'utf8' })
    .split('\n').filter(Boolean).map((f) => join(REPO, f)).filter((f) => existsSync(f));
const plantedFixtures = new Set();
{
  const spec = JSON.parse(read(join(HERE, 'fixtures', 'selftest.json')));
  for (const f of spec.fixtures) {
    if (f.expect_exit === 0 || f.planted_private !== true) continue;
    for (const a of f.args) if (a.startsWith('{fixtures}/')) plantedFixtures.add(join(HERE, 'fixtures', a.slice('{fixtures}/'.length)));
  }
}
let artifactsScanned = 0;
for (const f of artifactList) {
  if (!args.includes('--artifact-files') && plantedFixtures.has(f)) continue;
  artifactsScanned++;
  const rel = f.startsWith(`${REPO}/`) ? f.slice(REPO.length + 1) : f;
  let skipping = false;
  lines(f).forEach((l, i) => {
    if (f === fileURLToPath(import.meta.url)) {
      if (l.startsWith('// privacy-patterns:begin')) skipping = true;
      if (l.startsWith('// privacy-patterns:end')) { skipping = false; return; }
      if (skipping) return;
    }
    for (const h of scanText(l)) errors.push(`privacy: artifact ${rel}:${i + 1}: ${h}`);
  });
}

// ---- coverage promised by the golden set (charter REQ-O1 needs 40 real queries surviving review)
const REQUIRED_FAMILIES = ['fr-practice', 'fr-gate', 'fr-kit', 'fr-tech', 'fr-fm', 'fr-lesson', 'fr-verdict', 'fr-stack', 'fr-cohort',
  'crate', 'ra-prescription', 'ra-kind', 'ra-profile', 'ra-technique',
  'fh-rigor', 'fh-techniques', 'fh-oracles', 'fh-runbooks', 'fh-capabilities'];
const coverage = NO_COVERAGE ? [] : [
  ['queries >= 60', rows.length, rows.length >= 60],
  ['real (session-origin) queries >= 40 (REQ-O1)', byOrigin.session, byOrigin.session >= 40],
  ['synonym queries sharing no word with any expected title >= 8', synonymClean.length, synonymClean.length >= 8],
  ['typo queries >= 5', byDiff.typo, byDiff.typo >= 5],
  ['queries whose honest answer is do-not-use >= 4', honest, honest >= 4],
  ...REQUIRED_FAMILIES.map((f) => [`family ${f} expected in >= 1 query`, familyQueries[f]?.size ?? 0, (familyQueries[f]?.size ?? 0) >= 1]),
  ...CONTROL_FAMILIES.map((f) => [`negative control ${f} in >= 1 query`, controlQueries[f].length, controlQueries[f].length >= 1]),
];
for (const [name, n, ok] of coverage) if (!ok) errors.push(`coverage: ${name} (have ${n})`);
for (const s of synonymLeaky) warnings.push(`synonym query shares a word with an expected title: ${s}`);

const report = {
  golden: GOLDEN, grammar: grammarSource, ref_lists: refLists,
  queries: rows.length, users: byUser, origins: byOrigin,
  real_queries: { verbatim: realVerbatim.length, redacted: realRedacted.length, paraphrase: realParaphrase.length, redacted_qids: realRedacted },
  difficulty: byDiff,
  honest_do_not_use: honest, must_not_ids: mustNot,
  negative_controls: Object.fromEntries(Object.entries(controlQueries).map(([k, v]) => [k, v])),
  leakage: {
    file: leakage.file, leaky: leakage.leaky.length, independent: leakage.independent.length,
    real_leaky: leakage.real_leaky.length, real_independent: leakage.real_independent.length,
    real_independent_qids: leakage.real_independent,
  },
  synonym_no_shared_word: synonymClean.length,
  expected_ids_by_family: Object.fromEntries(Object.entries(byFamily).sort()),
  queries_by_family: Object.fromEntries(Object.entries(familyQueries).map(([k, v]) => [k, v.size]).sort()),
  artifacts_scanned: artifactsScanned,
  unresolved: Object.fromEntries(unresolved),
  errors, warnings,
};

if (AS_JSON) {
  console.log(JSON.stringify(report, null, 2));
} else {
  const out = [];
  out.push(`golden set: ${GOLDEN}`);
  out.push(`id grammar: ${grammarSource}`);
  for (const [k, v] of Object.entries(refLists)) out.push(`ref ${k}: ${v.n} ids from ${v.path}`);
  out.push(`queries: ${rows.length}  users: ${USERS.map((u) => `${u}=${byUser[u]}`).join(' ')}  origins: ${Object.entries(byOrigin).map(([k, v]) => `${k}=${v}`).join(' ')}`);
  out.push(`real queries: ${realVerbatim.length} verbatim, ${realRedacted.length} verbatim with private detail redacted, ${realParaphrase.length} paraphrased`);
  out.push(`difficulty: ${DIFFS.map((d) => `${d}=${byDiff[d]}`).join(' ')}  (synonym with no shared word: ${synonymClean.length})`);
  out.push(`honest answer is do-not-use: ${honest}  must_not ids: ${mustNot}`);
  out.push(`negative controls: ${CONTROL_FAMILIES.map((f) => `${f}=${controlQueries[f].length}`).join(' ')}`);
  out.push(`leakage: leaky=${leakage.leaky.length} independent=${leakage.independent.length}; real queries: leaky=${leakage.real_leaky.length} independent=${leakage.real_independent.length}`);
  out.push('expected ids by family (ids / queries):');
  for (const f of REQUIRED_FAMILIES.concat(Object.keys(byFamily).filter((f) => !REQUIRED_FAMILIES.includes(f)))) {
    out.push(`  ${f.padEnd(16)} ${String(byFamily[f] ?? 0).padStart(3)} / ${String(familyQueries[f]?.size ?? 0).padStart(3)}`);
  }
  out.push(`unresolved ids: ${unresolved.size}`);
  for (const [id, qs] of unresolved) out.push(`  ${id}  (${qs.join(', ')})`);
  out.push(`warnings: ${warnings.length}`);
  for (const w of warnings) out.push(`  ${w}`);
  out.push(`errors: ${errors.length}`);
  for (const e of errors) out.push(`  ${e}`);
  console.log(out.join('\n'));
}
process.exit(errors.length ? 1 : unresolved.size ? 2 : 0);
