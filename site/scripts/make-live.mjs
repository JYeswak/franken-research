#!/usr/bin/env node
// site/scripts/make-live.mjs: the live card on every brief, rendered at build time from watch/live.json
// (watch/freshness/SPEC.md FR-L.3 to FR-L.5; the renderer is watch/freshness/card.mjs).
// writes: site/briefs/*.html (live:card regions)
//
//   node site/scripts/make-live.mjs            rewrite the live:card region of every brief, then --check
//   node site/scripts/make-live.mjs --check    exit 1 if a brief lacks the region, a region differs from a fresh
//                                              render of watch/live.json, a brief has no live.json record, or a
//                                              record names a brief that does not exist
//   --site DIR                                 operate on another copy of site/
//   --live FILE                                read another live.json (default: watch/live.json beside site/)
//
// The region is everything between <!-- live:card --> and <!-- /live:card -->. This script owns it and rewrites
// it whole; nothing outside the markers changes. First run: the region is placed just before
// <main id="main-content">. The card works without JavaScript. Gate W3 runs --check.
// Prints LIVE_OK briefs=N regions=N, or LIVE_BAD and one indented line per problem. Exit 0 ok, 1 problems.
// No dependencies beyond node's standard library.

import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { LiveError, applyCard, briefFiles, checkBriefs, readLive, recordFor } from '../../watch/freshness/card.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

/** Rewrites every brief whose region is missing or stale; returns the briefs it changed. Writes nothing on error. */
export function writeBriefs(site, live) {
  const next = briefFiles(site).map((rel) => {
    const rec = recordFor(live, rel);
    if (!rec) throw new LiveError(`${rel}: no watch/live.json record names this brief`);
    const html = readFileSync(join(site, rel), 'utf8');
    return [rel, html, applyCard(rel, html, rec, live)];
  });
  const changed = [];
  for (const [rel, before, after] of next) if (after !== before) { writeFileSync(join(site, rel), after); changed.push(rel); }
  return changed;
}

function option(argv, name, fallback) {
  const i = argv.indexOf(name);
  return i >= 0 ? resolve(argv[i + 1]) : fallback;
}

export function main(argv) {
  const site = option(argv, '--site', resolve(HERE, '..'));
  const file = option(argv, '--live', resolve(site, '..', 'watch', 'live.json'));
  const bad = (lines) => { console.log('LIVE_BAD'); lines.slice(0, 20).forEach((e) => console.log(`  ${e}`)); if (lines.length > 20) console.log(`  ... and ${lines.length - 20} more`); return 1; };
  if (!existsSync(site) || !statSync(site).isDirectory()) return bad([`no site directory at ${site}`]);
  try {
    const live = readLive(file);
    if (!argv.includes('--check')) console.log(`live: ${writeBriefs(site, live).length} brief(s) rewritten`);
    const { errs, briefs } = checkBriefs(site, live);
    if (errs.length) return bad(errs);
    console.log(`LIVE_OK briefs=${briefs} regions=${briefs}`);
    return 0;
  } catch (e) {
    if (!(e instanceof LiveError)) throw e;
    return bad([e.message, 'nothing written']);
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) process.exit(main(process.argv.slice(2)));
