#!/usr/bin/env node
// ops/briefs-guard.mjs: the scheduled watch may commit site/briefs/ only inside the live:card regions.
//
//   node ops/briefs-guard.mjs        check every staged change under site/briefs/ against HEAD
//
// watch.yml stages the briefs after `node site/scripts/make-live.mjs` rewrites their live:card regions
// (watch/freshness/SPEC.md FR-L.5: nothing outside the region is touched). This guard makes that a
// property of the commit, not a promise of the generator: for every staged brief, the HEAD text and the
// staged text must be byte-equal once each `<!-- live:card -->…<!-- /live:card -->` region is emptied,
// and each must hold exactly one region. An added, deleted or renamed brief fails.
// Exit 0 with `BRIEFS_OK changed=N`; 1 with `BRIEFS_BAD` and one indented line per problem; 2 on a git error.
// Node 22 built-ins only. Writes nothing.

import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const REGION = /<!-- live:card -->[\s\S]*?<!-- \/live:card -->/g;
const EMPTY = '<!-- live:card --><!-- /live:card -->';

// Number of live:card regions in a text.
export function regionCount(text) {
  return (text.match(REGION) ?? []).length;
}

// Decides whether `after` differs from `before` only inside the live:card region. Returns null or a reason.
export function outsideRegionChange(before, after) {
  if (regionCount(before) !== 1) return `HEAD has ${regionCount(before)} live:card regions, expected 1`;
  if (regionCount(after) !== 1) return `the staged file has ${regionCount(after)} live:card regions, expected 1`;
  const a = before.replace(REGION, EMPTY), b = after.replace(REGION, EMPTY);
  if (a === b) return null;
  const x = a.split('\n'), y = b.split('\n');
  let i = 0;
  while (i < Math.max(x.length, y.length) && x[i] === y[i]) i++;
  return `changed outside the live:card region at line ${i + 1}`;
}

const git = (args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 << 20 });

function main() {
  const staged = git(['diff', '--cached', '--name-status', '--no-renames', '--', 'site/briefs/']).split('\n').filter(Boolean);
  const problems = [];
  for (const line of staged) {
    const [status, path] = line.split('\t');
    if (status !== 'M') { problems.push(`${path}: status ${status}; the watch may only modify existing briefs`); continue; }
    const reason = outsideRegionChange(git(['show', `HEAD:${path}`]), git(['show', `:${path}`]));
    if (reason) problems.push(`${path}: ${reason}`);
  }
  if (problems.length === 0) { console.log(`BRIEFS_OK changed=${staged.length}`); return 0; }
  console.log(`BRIEFS_BAD problems=${problems.length}`);
  for (const p of problems) console.log(`  ${p}`);
  return 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { process.exit(main()); } catch (e) { console.error(`BRIEFS_GUARD ERROR: ${e?.message ?? e}`); process.exit(2); }
}
