#!/usr/bin/env node
// ops/stale-run.mjs: the missed-daily-run warning (watch/freshness/SPEC.md FR-O.4).
//
//   node ops/stale-run.mjs watch/live.json [--now <ISO time>]
//
// Reads `checked_at` from watch/live.json. When it is more than 36 hours before now (or the file is
// missing or unreadable), prints a GitHub Actions `::warning` line naming the age; otherwise prints
// `LIVE_FRESH`. It warns and never fails: a missed watch run must not block a deploy of other work.
// deploy.yml's smoke step runs it. `--now` exists so the harness can test it without a clock.
// Exit 0 always, except 2 on a usage error. Node 22 built-ins only. Writes nothing.

import { readFileSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const LIMIT_HOURS = 36;
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

// Decides whether a run is stale. Returns { stale, hours, reason }; hours is null when unknown.
export function staleness(checkedAt, now, limit = LIMIT_HOURS) {
  if (typeof checkedAt !== 'string' || !ISO.test(checkedAt)) return { stale: true, hours: null, reason: `checked_at ${JSON.stringify(checkedAt)} is not an ISO UTC time` };
  const hours = (Date.parse(now) - Date.parse(checkedAt)) / 3_600_000;
  if (hours < 0) return { stale: true, hours, reason: `checked_at ${checkedAt} is in the future` };
  if (hours > limit) return { stale: true, hours, reason: `checked_at ${checkedAt} is ${hours.toFixed(1)} h old, more than ${limit} h: a daily watch run was missed` };
  return { stale: false, hours, reason: `checked_at ${checkedAt} is ${hours.toFixed(1)} h old` };
}

// The line the smoke step prints for a live.json path at a given time.
export function staleLine(path, now) {
  let checkedAt;
  if (!existsSync(path)) return `::warning title=Missed daily watch::${path} is missing, so the time of the last watch run is unknown`;
  try { checkedAt = JSON.parse(readFileSync(path, 'utf8')).checked_at; } catch (e) { return `::warning title=Missed daily watch::${path} is not JSON (${e.message})`; }
  const s = staleness(checkedAt, now);
  return s.stale ? `::warning title=Missed daily watch::${path}: ${s.reason}` : `LIVE_FRESH ${path}: ${s.reason}`;
}

function main(argv) {
  const path = argv[0];
  const i = argv.indexOf('--now');
  const now = i >= 0 ? argv[i + 1] : new Date().toISOString();
  if (!path || path.startsWith('--') || (i >= 0 && !ISO.test(now ?? '')) || argv.length !== (i >= 0 ? 3 : 1)) {
    console.error('usage: node ops/stale-run.mjs watch/live.json [--now <ISO UTC time>]');
    return 2;
  }
  console.log(staleLine(path, now));
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exit(main(process.argv.slice(2)));
