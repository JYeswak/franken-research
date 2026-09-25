#!/usr/bin/env node
// Citation checks of TIER-MAP.md §4.1 over real sources. Node standard library plus the git and sqlite3
// command-line tools. No default paths: the sources live on the maintainer's machine.
//
//   node search/tools/quote-check.mjs --selftest
//       end to end through a temporary git repository: current, relocated once, relocated twice (N5), stale,
//       empty and whitespace-only quote (N1), unreadable revision (N8), unknown raw state.
//   node search/tools/quote-check.mjs fh --mirror <Dicklesworthstone mirror> --fh-repo <franken-harvest> [--rev <sha>]
//       the fh catalog rows with quotes (IF-SOURCES §4.2 step 4); prints counts per catalog, state and rule.
//   node search/tools/quote-check.mjs ra --mirror <Dicklesworthstone mirror> --db <rigor.sqlite copy> [--out <tsv>]
//       every code evidence path of every KNOW technique (IF-SOURCES §4.3 step 4) at its repository's pinned
//       commit; writes the TM-RA-1 / TM-RA-10 snapshot (default search/snapshots/ra-evidence-check.tsv).

import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { classify, normalize, PRESENT } from '../lib/quote-check.mjs';
import { mint } from '../lib/ids.mjs';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const VERSION = '1';
const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };
const sha256 = (b) => createHash('sha256').update(b).digest('hex');
const FORKS = ['bun', 'exacl', 'ffn', 'gonode', 'hnswlib-rs', 'rust-block', 'textract-py3', 'wezterm'];
const DOC = /(\.md|\.txt|\.rst|\.html)$|^docs?\/|README/i; // TIER-MAP §3 "docs-only"

const cache = new Map();
function gitShow(repoDir, rev, path) {
  const k = `${repoDir}\0${rev}\0${path}`;
  if (!cache.has(k)) {
    const p = spawnSync('git', ['-C', repoDir, 'show', `${rev}:${path}`], { encoding: 'utf8', maxBuffer: 256 << 20 });
    cache.set(k, p.status === 0 ? p.stdout : null);
  }
  return cache.get(k);
}
// The local mirror stores a few repositories under a directory name with "_" where GitHub has "-"
// (frankentui-website); try the exact name first, then that one alias. A miss stays NO_REVISION.
const mirrorDir = (mirror, repo) => {
  const exact = join(mirror, repo);
  if (existsSync(exact)) return exact;
  const alias = join(mirror, repo.replace(/-/g, '_'));
  return existsSync(alias) ? alias : exact;
};
const need = (...names) => {
  const missing = names.filter((n) => !opt(n));
  if (missing.length) { console.error(`missing ${missing.map((n) => `--${n}`).join(', ')}; this tool has no default paths`); process.exit(1); }
};

function selftest() {
  const d = mkdtempSync(join(tmpdir(), 'quote-check-'));
  let ok = true;
  try {
    const git = (...a) => execFileSync('git', ['-C', d, ...a], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    writeFileSync(join(d, 'src.rs'), ['fn a() {}', '// header', 'let x = alpha(beta);', '', 'let y = gamma(delta);', '',
      'let z = omega();', '', 'let z = omega();', 'end'].join('\n') + '\n');
    git('init', '-q');
    git('add', 'src.rs');
    git('-c', 'user.email=t@t', '-c', 'user.name=t', '-c', 'core.hooksPath=/dev/null', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'fixture');
    const rev = git('rev-parse', 'HEAD');
    const cases = [
      ['current', rev, 3, 3, 'let x = alpha(beta);', 'CURRENT', 1, ['3-3'], 'CURRENT', 'TM-FH-1'],
      ['relocated once (N4)', rev, 1, 1, 'let y = gamma(delta);', 'RELOCATED', 1, ['5-5'], 'CURRENT+line_relocated', 'TM-FH-2'],
      ['relocated twice (N5)', rev, 1, 1, 'let z = omega();', 'RELOCATED', 2, ['7-7', '9-9'], 'CANNOT_DETERMINE', 'TM-FH-5'],
      ['stale (N7)', rev, 3, 3, 'let q = nothing();', 'STALE', 0, [], 'STALE', 'TM-FH-4'],
      ['empty quote (N1)', rev, 3, 3, '', 'EMPTY_QUOTE', 0, [], 'PINNED_UNVERIFIED', 'TM-FH-3'],
      ['whitespace quote (N1)', rev, 3, 3, ' \t ', 'EMPTY_QUOTE', 0, [], 'PINNED_UNVERIFIED', 'TM-FH-3'],
      ['no revision (N8)', '0'.repeat(40), 3, 3, 'let x = alpha(beta);', 'NO_REVISION', 0, [], 'CANNOT_DETERMINE', 'TM-FH-5'],
    ];
    for (const [name, r, a, b, q, raw, occ, found, want, rule] of cases) {
      const got = classify(gitShow(d, r, 'src.rs'), a, b, q);
      const n = normalize(got.raw, { occurrences: got.occurrences });
      const good = got.raw === raw && got.occurrences === occ && JSON.stringify(got.foundAt) === JSON.stringify(found) && n.normalized === want && n.rule === rule;
      ok &&= good;
      console.log(`${good ? 'ok  ' : 'FAIL'} ${name}: raw=${got.raw} occurrences=${got.occurrences} found_at=${got.foundAt.join(',') || '-'} -> ${n.normalized} ${n.rule}`);
    }
    // a legacy row where an old checker reported CURRENT on an empty quote still normalizes to N1
    const legacy = normalize('CURRENT', { quoteEmpty: true });
    ok &&= legacy.normalized === 'PINNED_UNVERIFIED';
    console.log(`${legacy.normalized === 'PINNED_UNVERIFIED' ? 'ok  ' : 'FAIL'} legacy CURRENT on an empty quote -> ${legacy.normalized}`);
    try { normalize('MOVED'); ok = false; console.log('FAIL unknown raw state MOVED was accepted'); } catch (e) { console.log(`ok   unknown raw state rejected: ${e.message}`); }
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
  console.log(ok ? 'QUOTE_CHECK_SELFTEST_OK' : 'QUOTE_CHECK_SELFTEST_FAILED');
  return ok ? 0 : 1;
}

function fh() {
  need('mirror', 'fh-repo');
  const rev = opt('rev') || '77d515bf0e7c5f399f3aca82c63423d257799223';
  const counts = new Map();
  const bump = (k) => counts.set(k, (counts.get(k) || 0) + 1);
  for (const [file, key, pathCol] of [['rigor-stack', 'layer_id', 'path'], ['techniques', 'technique_id', 'path'], ['oracles', 'domain_id', 'path'], ['capability-adoptions', 'capability_id', 'source_path']]) {
    const t = execFileSync('git', ['-C', opt('fh-repo'), 'show', `${rev}:${file}.tsv`], { encoding: 'utf8' }).split('\n');
    const head = t[0].replace(/^#\s*/, '').split('\t');
    for (const l of t.slice(1)) {
      if (!l || l.startsWith('#')) continue;
      const r = Object.fromEntries(head.map((h, i) => [h, l.split('\t')[i]]));
      if (file === 'oracles' && !/^D(?:[1-9]|1[0-3])$/.test(r.domain_id)) continue; // private oracles are never read
      const c = classify(gitShow(mirrorDir(opt('mirror'), r.repository), r.revision, r[pathCol]), Number(r.line_start), Number(r.line_end), r.quote ?? '');
      const n = normalize(c.raw, { occurrences: c.occurrences });
      bump(`${file}\t${c.raw}`);
      bump(`rule\t${n.rule}`);
      if (c.raw !== 'CURRENT') console.log([file, r[key], r.repository, r.revision.slice(0, 7), r[pathCol], r.line_start, c.raw, c.occurrences, c.foundAt.join(',') || '-', n.normalized, n.rule].join('\t'));
    }
  }
  for (const [k, v] of [...counts].sort()) console.log(`${k}\t${v}`);
  return 0;
}

function ra() {
  need('mirror', 'db');
  const db = resolve(opt('db'));
  const out = resolve(opt('out') || join(REPO, 'search', 'snapshots', 'ra-evidence-check.tsv'));
  const q = `select t.id, t.repo, t.entity, t.technique, t.epistemic, t.evidence_json, r.sha from techniques t join repos r on r.repo = t.repo where t.repo not in (${FORKS.map((f) => `'${f}'`).join(', ')}) order by t.repo, t.entity, t.id`;
  const rows = JSON.parse(execFileSync('sqlite3', ['-json', `file:${db}?immutable=1`, q], { encoding: 'utf8', maxBuffer: 512 << 20 }) || '[]');
  const lines = [];
  const raw = new Map();
  let techniques = 0;
  let tm1 = 0;
  let tm1RelocOnly = 0;
  let tm10 = 0;
  const bump = (m, k) => m.set(k, (m.get(k) || 0) + 1);
  const outRows = [];
  for (const t of rows) {
    if (t.epistemic !== 'KNOW') continue;
    const ev = JSON.parse(t.evidence_json || '[]');
    const code = ev.filter((e) => e.path && !DOC.test(e.path));
    if (!code.length) continue; // docs-only KNOW is TM-RA-2 and needs no check
    techniques++;
    const id = mint({ family: 'ra-technique', repo: t.repo, entity: t.entity, technique: t.technique });
    const per = code.map((e) => {
      const c = classify(gitShow(mirrorDir(opt('mirror'), t.repo), t.sha, e.path), Number(e.line), Number(e.line), e.quote ?? '');
      const n = normalize(c.raw, { occurrences: c.occurrences });
      bump(raw, c.raw);
      return { e, c, n };
    });
    const present = per.filter((p) => PRESENT.has(p.n.normalized));
    const rule = present.length ? 'TM-RA-1' : 'TM-RA-10';
    if (rule === 'TM-RA-1') { tm1++; if (!present.some((p) => p.n.normalized === 'CURRENT')) tm1RelocOnly++; } else tm10++;
    for (const { e, c, n } of per) {
      outRows.push([id, t.repo, t.sha, e.path, e.line, sha256(String(e.quote ?? '')).slice(0, 16), c.raw, c.occurrences, c.foundAt.join(',') || '-', n.normalized, rule].join('\t'));
    }
  }
  const date = new Date().toISOString().slice(0, 10);
  lines.push(`# rigor-atlas evidence check for TIER-MAP.md TM-RA-1 / TM-RA-10, written ${date} by search/tools/quote-check.mjs ra (format ${VERSION})`);
  lines.push(`# source: rigor-atlas DB snapshot sha256=${sha256(readFileSync(db))}; each file read with git at its repository's pinned commit (repos.sha) from [LOCAL_MIRROR]; quote text is not stored, only the first 16 hex of its sha256`);
  lines.push(`# techniques: KNOW with at least one code evidence path, forks excluded: ${techniques}; TM-RA-1 ${tm1} (of which ${tm1RelocOnly} only through a relocated-once path, N4); TM-RA-10 ${tm10}`);
  lines.push(`# evidence paths checked: ${outRows.length}; raw states ${[...raw].sort().map(([k, v]) => `${k} ${v}`).join(', ')}`);
  lines.push(['technique_id', 'repo', 'commit', 'path', 'line', 'quote_sha16', 'raw_state', 'occurrences', 'found_at', 'normalized', 'technique_rule'].join('\t'));
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, `${lines.concat(outRows).join('\n')}\n`);
  console.log(lines.slice(0, 4).join('\n'));
  console.log(`wrote ${outRows.length} rows`);
  return 0;
}

const mode = args.includes('--selftest') ? 'selftest' : args[0];
process.exit({ selftest, fh, ra }[mode]?.() ?? (console.error('usage: quote-check.mjs --selftest | fh --mirror D --fh-repo D | ra --mirror D --db F [--out F]'), 1));
