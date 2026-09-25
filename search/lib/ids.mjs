// The one source-to-id function of .atlas-arc/contracts/IF-ID.md (§2 grammar, §3 slug, §4 suffixes and
// "One derivation function"). Node standard library only.
//
// Imported today by .atlas-arc/eval/validate.mjs (golden-set resolvers and the crate reference check).
// The S04 generator and gate Q1 do not exist yet; when they do, they import mint()/check() from here and
// keep no copy of their own.
//
// Usage as a module: import { mint, mintCrates, check, loadGrammar, slug } from '../search/lib/ids.mjs'
// Selftest:          node search/lib/ids.mjs --selftest   (runs .atlas-arc/contracts/fixtures/id-derivation.json)

import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const hex = (s, n) => createHash('sha256').update(s, 'utf8').digest('hex').slice(0, n);

/** IF-ID.md §3: lowercase, every run outside [a-z0-9] becomes "-", trimmed; never truncated. */
export const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const need = (row, ...keys) => {
  for (const k of keys) if (row[k] == null || row[k] === '') throw new Error(`mint: ${row.family} row has no ${k}`);
};

/** IF-ID.md §2: one source row -> its id. `row.family` is the §5 family name. Throws on a row that has no id. */
export function mint(row) {
  switch (row.family) {
    case 'fr-practice': need(row, 'id'); return `fr:${row.id}`;
    case 'fr-gate': need(row, 'n'); return `fr:gate-${row.n}`;
    case 'fr-kit': need(row, 'id'); return `fr:kit-${row.id}`;
    case 'fr-tech': need(row, 'title'); return `fr:tech-${slug(row.title)}`;
    case 'fr-fm': need(row, 'n'); return `fr:fm-p${row.n}`;
    case 'fr-lesson': need(row, 'topic', 'repo'); return `fr:lesson-${row.topic}-${row.repo}`;
    case 'fr-verdict': need(row, 'repo'); return `fr:verdict-${row.repo}`;
    case 'fr-cohort': need(row, 'repo'); return `fr:cohort-${row.repo}`;
    case 'fr-stack': need(row, 'slug'); return `fr:stack-${row.slug}`;
    case 'fh-rigor': need(row, 'layer_id'); return `fh:rigor:${row.layer_id}`;
    case 'fh-techniques': need(row, 'technique_id'); return `fh:techniques:${row.technique_id}`;
    case 'fh-oracles':
      need(row, 'domain_id');
      if (!/^D(?:[1-9]|1[0-3])$/.test(row.domain_id)) throw new Error(`mint: fh oracle ${row.domain_id} is private or not in v1`);
      return `fh:oracles:${row.domain_id}`;
    case 'fh-runbooks': need(row, 'step_id'); return `fh:runbooks:${row.step_id}`;
    case 'fh-capabilities': need(row, 'capability_id'); return `fh:capabilities:${row.capability_id}`;
    case 'ra-prescription': need(row, 'id'); return `ra:prescription:${row.id}`;
    case 'ra-kind': need(row, 'kind'); return `ra:kind:${row.kind}`;
    case 'ra-profile': need(row, 'repo'); return `ra:profile:${row.repo}`;
    case 'ra-technique':
      need(row, 'repo', 'entity', 'technique');
      return `ra:technique:${row.repo}/${row.entity.replace(/:/g, '.')}/${hex(row.technique.trim(), 8)}`;
    case 'crate':
      need(row, 'repo', 'name', 'manifest');
      if (typeof row.repeated_pair !== 'boolean') throw new Error('mint: crate row needs repeated_pair (use mintCrates over the whole snapshot)');
      return `crate:${row.repo}/${row.name}${row.repeated_pair ? `~${hex(row.manifest, 6)}` : ''}`;
    default: throw new Error(`mint: unknown family ${row.family}`);
  }
}

/** Crate ids over a whole snapshot: a (repo, name) pair seen twice gets the ~<h6> suffix on every member. */
export function mintCrates(rows) {
  const count = new Map();
  for (const r of rows) count.set(`${r.repo}\0${r.name}`, (count.get(`${r.repo}\0${r.name}`) || 0) + 1);
  return rows.map((r) => mint({ family: 'crate', ...r, repeated_pair: count.get(`${r.repo}\0${r.name}`) > 1 }));
}

/** The §5 regex block of IF-ID.md, the only copy: [{family, rx}]. */
export function loadGrammar(path = join(REPO, '.atlas-arc', 'contracts', 'IF-ID.md')) {
  const m = existsSync(path) ? readFileSync(path, 'utf8').match(/## 5\. Validator regexes[\s\S]*?```text\n([\s\S]*?)```/) : null;
  if (!m) throw new Error(`cannot read the id grammar: ${path} is missing or has no "## 5. Validator regexes" text block`);
  return m[1].trim().split('\n').filter(Boolean).map((l) => {
    const [family, rx] = l.split('\t');
    return { family, rx: new RegExp(rx) };
  });
}

/** Q1's per-entry derivation check: does `claimed` equal mint(source)? -> {result, code?, minted}. */
export function check(claimed, source, grammar = loadGrammar()) {
  const minted = mint(source);
  if (claimed === minted) return { result: 'pass', minted };
  if (grammar.filter((f) => f.rx.test(claimed)).length !== 1) return { result: 'fail', code: 'Q1.ID.GRAMMAR', minted };
  if (source.family === 'crate') {
    const base = claimed.replace(/~[0-9a-f]{6}$/, '');
    const mintedBase = minted.replace(/~[0-9a-f]{6}$/, '');
    if (base === mintedBase && claimed.includes('~') && !minted.includes('~')) return { result: 'fail', code: 'Q1.ID.NONCANONICAL_SUFFIX', minted };
    if (base === mintedBase && !claimed.includes('~') && minted.includes('~')) return { result: 'fail', code: 'Q1.ID.MISSING_REQUIRED_SUFFIX', minted };
  }
  return { result: 'fail', code: 'Q1.ID.SOURCE_MISMATCH', minted };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url) && process.argv.includes('--selftest')) {
  const spec = JSON.parse(readFileSync(join(REPO, '.atlas-arc', 'contracts', 'fixtures', 'id-derivation.json'), 'utf8'));
  const grammar = loadGrammar();
  let ok = true;
  for (const f of spec.fixtures) {
    const got = check(f.claimed_id, f.source, grammar);
    const want = f.expect;
    const good = got.result === want.result && (want.result === 'pass' || got.code === want.code) && got.minted === want.minted;
    ok &&= good;
    console.log(`${good ? 'ok  ' : 'FAIL'} ${f.id} ${got.result}${got.code ? ` ${got.code}` : ''} minted=${got.minted} (want ${want.result}${want.code ? ` ${want.code}` : ''} ${want.minted}) ${f.what}`);
  }
  console.log(ok ? `IDS_SELFTEST_OK fixtures=${spec.fixtures.length}` : 'IDS_SELFTEST_FAILED');
  process.exit(ok ? 0 : 1);
}
