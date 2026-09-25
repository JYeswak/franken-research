#!/usr/bin/env node
// ops/take-build-output.mjs: apply the build job's artifact in the publish job (watch/freshness/SPEC.md FR-O.6).
//
//   node ops/take-build-output.mjs <artifact dir>
//
// The build job runs dependency code with a read-only token and uploads the files the run generated
// (PATHS below). The publish job, which holds the write token, downloads that artifact to a directory
// outside the checkout and runs this script, which copies each file into the checkout only when its path
// matches one of PATHS. Anything else in the artifact (a script, a workflow, a path outside the
// repository, a symlink) fails the run and nothing is copied: the artifact must never be able to replace
// code the publish job then runs with the write token, such as ops/briefs-guard.mjs or
// watch/freshness/dashboard.mjs. The destination side is checked too: every existing component of each
// destination path under the checkout must be a real directory, and an existing destination a regular
// file, so a symlink in the checkout cannot redirect a generated file onto a script. Every destination is
// checked before any file is written. Only file contents are copied, so the modes in the checkout stand.
// The briefs guard then checks that each brief changed only inside its live:card region.
// Exit 0 with `TAKEN files=N`; 1 with `TAKE_BAD` and one indented line per problem; 2 on a usage error.
// Node 22 built-ins only; imports nothing from the repository.
// writes: the generated paths listed in PATHS, inside the checkout

import { readdirSync, lstatSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// The generated files, as the build job's upload step lists them (ops/write-job.mjs checks the two agree).
export const PATHS = [
  'watch/state.json',
  'watch/latest.json',
  'watch/live.json',
  'watch/crossings.jsonl',
  'watch/census/*.tsv',
  'watch/changes/*.json',
  'watch/freshness/REPORT.md',
  'site/feed.xml',
  'site/briefs/*.html',
];

// A PATHS entry as an anchored regular expression; `*` matches one path segment without a slash.
const toRegex = (glob) => new RegExp(`^${glob.split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('[^/]+')}$`);
const ALLOWED = PATHS.map(toRegex);
export const isGenerated = (rel) => ALLOWED.some((re) => re.test(rel));

// Every entry under dir, as repository-relative paths with `/`, plus the problems found while walking.
export function listArtifact(dir) {
  const files = [], problems = [];
  const walk = (abs) => {
    for (const name of readdirSync(abs).sort()) {
      const p = join(abs, name);
      const rel = relative(dir, p).split(sep).join('/');
      const st = lstatSync(p);
      if (st.isSymbolicLink()) problems.push(`${rel}: a symlink`);
      else if (st.isDirectory()) walk(p);
      else if (!st.isFile()) problems.push(`${rel}: not a regular file`);
      else if (!isGenerated(rel)) problems.push(`${rel}: not a generated path (ops/take-build-output.mjs PATHS)`);
      else files.push(rel);
    }
  };
  walk(dir);
  if (files.length === 0 && problems.length === 0) problems.push('the artifact holds no files');
  return { files, problems };
}

// Problems with where rel would land under root: a symlink anywhere on the path, an existing component that
// is not a directory, or an existing destination that is not a regular file. Components that do not exist
// yet are fine; mkdir creates them as directories.
export function destinationProblems(root, rel) {
  const parts = rel.split('/');
  const out = [];
  for (let i = 1; i <= parts.length; i++) {
    const sub = parts.slice(0, i).join('/');
    let st;
    try { st = lstatSync(join(root, sub)); } catch (e) { if (e.code === 'ENOENT') break; throw e; }
    if (st.isSymbolicLink()) { out.push(`${rel}: destination component ${sub} is a symlink`); break; }
    if (i < parts.length && !st.isDirectory()) { out.push(`${rel}: destination component ${sub} is not a directory`); break; }
    if (i === parts.length && !st.isFile()) out.push(`${rel}: destination exists and is not a regular file`);
  }
  return out;
}

// Copies the artifact into root when it is clean; returns { files, problems }. Nothing is written on a
// problem: the artifact and every destination are checked before the first write.
export function takeBuildOutput(dir, root = ROOT) {
  const { files, problems } = listArtifact(dir);
  for (const rel of files) problems.push(...destinationProblems(root, rel));
  if (problems.length) return { files: [], problems };
  for (const rel of files) {
    mkdirSync(dirname(join(root, rel)), { recursive: true });
    writeFileSync(join(root, rel), readFileSync(join(dir, rel)));
  }
  return { files, problems };
}

function main(argv) {
  const dir = argv[0];
  if (argv.length !== 1 || !existsSync(dir) || !lstatSync(dir).isDirectory()) {
    console.error('usage: node ops/take-build-output.mjs <artifact dir>');
    return 2;
  }
  if (!relative(ROOT, resolve(dir)).startsWith('..')) { console.error('the artifact directory must be outside the checkout'); return 2; }
  const r = takeBuildOutput(resolve(dir));
  if (r.problems.length === 0) { console.log(`TAKEN files=${r.files.length}`); return 0; }
  console.log(`TAKE_BAD problems=${r.problems.length}`);
  for (const p of r.problems) console.log(`  ${p}`);
  return 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exit(main(process.argv.slice(2)));
