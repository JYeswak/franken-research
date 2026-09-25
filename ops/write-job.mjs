#!/usr/bin/env node
// ops/write-job.mjs: the trust and ordering check for the job that writes (watch/freshness/SPEC.md FR-O.6,
// FR-D.5). Gate W3 runs it.
//
//   node ops/write-job.mjs            check .github/workflows/watch.yml
//
// The watch job pushes commits and edits the dashboard issue, so its token can write. The check parses
// the workflow with the watch's own YAML reader and fails when
//   - the job that writes has no `if: github.ref == 'refs/heads/main'` guard (FR-O.6);
//   - any actions/checkout step lacks `persist-credentials: false`, which leaves the token in .git/config;
//   - a token sits in the workflow's or the job's env, where every step would see it;
//   - a step receives the token (in its env, its `with:` inputs, or its run text, which GitHub expands
//     before the shell runs, comment lines included) but is not the watch, push or sync step;
//   - a step that installs, builds or runs the gates receives the token, whatever its role;
//   - a run line writes a credential into the Git config (`git config … extraheader`, `git remote set-url`
//     with a token); a push authenticates per command with `git -c http…extraheader=… push`;
//   - the watch step still syncs the dashboard itself, the sync step does not come after the gate chain
//     and the push, or any `git push` comes after the sync (FR-D.5: the issue describes what was pushed).
// A token is any expression naming `github.token`, `github['token']`, `secrets.GITHUB_TOKEN` or
// `secrets['GITHUB_TOKEN']` / `secrets["GITHUB_TOKEN"]`, in any letter case (GitHub contexts are
// case-insensitive), inside or outside `${{ }}`.
// Exit 0 with `WRITE_JOB_OK`; 1 with `WRITE_JOB_BAD` and one indented line per problem; 2 on a
// workflow the YAML reader rejects. Node 22 built-ins only. Writes nothing.

import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseYaml } from '../watch/freshness/yaml.mjs';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const WORKFLOW = '.github/workflows/watch.yml';
export const MAIN_GUARD = "github.ref == 'refs/heads/main'";
export const SYNC = 'node watch/freshness/dashboard.mjs --sync watch/live.json';

export const TOKEN = /\bgithub\s*\.\s*token\b|\bgithub\s*\[\s*(['"])token\1\s*\]|\bsecrets\s*\.\s*github_token\b|\bsecrets\s*\[\s*(['"])github_token\2\s*\]/i;
// Commands that install, build or gate: none of them may run with a token in reach.
const UNTRUSTED = /\b(bun|npm|pnpm|yarn)\s+(install|ci|i|run|x)\b|\bnpx\b|verify-site\.sh|make-live\.mjs|make-feed\.mjs|shell\.mjs|brief-strip\.mjs|make-stack\.mjs|harness\/run\.mjs|harness\/mutate\.mjs/;
const CONFIG_WRITE = /\bgit\s+config\b[^\n]*(extraheader|x-access-token|GITHUB_TOKEN)|\bgit\s+remote\s+(set-url|add)\b[^\n]*(x-access-token|GITHUB_TOKEN|@github\.com)/;
const WRITE_SCOPES = ['contents', 'issues', 'pull-requests', 'actions', 'packages', 'deployments'];
// The run text of a step without comment lines, with `\`-continued lines joined, so a commented-out
// command counts for nothing and a command split over lines is read as one.
const runOf = (step) => String(step?.run ?? '').replace(/\\\n\s*/g, ' ').split('\n').filter((l) => !l.trim().startsWith('#')).join('\n');
// Does any string inside a value (env map, `with:` map, run text; nested objects and lists too) name the token?
export function tokenIn(v) {
  if (v == null) return false;
  if (typeof v === 'object') return Object.values(v).some(tokenIn);
  return TOKEN.test(String(v));
}
const envHasToken = (env) => tokenIn(env);
// Where a step receives the token: 'env', 'with:', 'run text', or null. Run text is read raw, not through
// runOf: GitHub substitutes `${{ }}` into comment lines too.
export function tokenSource(step) {
  if (tokenIn(step?.env)) return 'env';
  if (tokenIn(step?.with)) return 'with:';
  if (tokenIn(step?.run)) return 'run text';
  return null;
}
const PUSH = /\bgit\b[^\n]*\bpush\b/;
// The three steps FR-O.6 lets hold the token, or null for every other step.
export function roleOf(step) {
  const run = runOf(step);
  if (run.includes(SYNC)) return 'sync';
  if (PUSH.test(run)) return 'push';
  if (run.includes('node watch/watch.mjs --apply')) return 'watch';
  return null;
}
const guardOf = (s) => String(s ?? '').trim().replace(/^\$\{\{\s*/, '').replace(/\s*\}\}$/, '').replace(/\s+/g, ' ').replace(/"/g, "'");
const stepName = (step, i) => `step ${i + 1}${step?.name ? ` (${step.name})` : step?.uses ? ` (${String(step.uses).split('@')[0]})` : ''}`;

// Does a permissions block (workflow or job level) grant any write scope?
export function grantsWrite(perms) {
  if (perms === 'write-all') return true;
  if (!perms || typeof perms !== 'object') return false;
  return WRITE_SCOPES.some((k) => perms[k] === 'write');
}

// Problems with one parsed workflow. `name` prefixes each problem.
export function writeJobProblems(wf, name = WORKFLOW) {
  const out = [];
  if (!wf || typeof wf !== 'object' || !wf.jobs) return [`${name}: no jobs`];
  if (envHasToken(wf.env)) out.push(`${name}: a token is in the workflow env, so every step sees it`);
  for (const [id, job] of Object.entries(wf.jobs)) {
    const where = `${name} job ${id}`;
    const steps = Array.isArray(job.steps) ? job.steps : [];
    const writes = grantsWrite(job.permissions ?? wf.permissions);
    if (writes && guardOf(job.if) !== MAIN_GUARD) out.push(`${where}: writes but lacks \`if: ${MAIN_GUARD}\``);
    if (envHasToken(job.env)) out.push(`${where}: a token is in the job env, so every step sees it`);
    steps.forEach((step, i) => {
      const at = `${where} ${stepName(step, i)}`;
      const run = runOf(step);
      if (String(step.uses ?? '').startsWith('actions/checkout@') && String(step.with?.['persist-credentials']) !== 'false') {
        out.push(`${at}: checkout without \`persist-credentials: false\` leaves the token in .git/config`);
      }
      const src = tokenSource(step);
      if (src && !roleOf(step)) out.push(`${at}: receives the token (${src}) but is not the watch, push or sync step`);
      if (src && UNTRUSTED.test(run)) out.push(`${at}: installs, builds or runs gates with the token in reach (${src})`);
      if (CONFIG_WRITE.test(run)) out.push(`${at}: writes a credential into the Git config`);
    });
    if (writes) out.push(...orderProblems(steps, where));
  }
  return out;
}

// FR-D.5 in the workflow: the watch step does not sync, the sync comes after the gates and the push, and
// nothing pushes after the sync.
export function orderProblems(steps, where) {
  const out = [];
  const indexes = (re) => steps.map((s, i) => (re.test(runOf(s)) ? i : -1)).filter((i) => i >= 0);
  if (steps.some((s) => /node watch\/watch\.mjs[^\n]*--dashboard/.test(runOf(s)))) out.push(`${where}: watch.mjs still syncs the dashboard (--dashboard); FR-D.5 moves the sync after the push`);
  const sync = steps.findIndex((s) => runOf(s).includes(SYNC));
  const gates = indexes(/\bbun run verify\b|verify-site\.sh/)[0] ?? -1;
  const pushes = indexes(PUSH);
  if (sync < 0) out.push(`${where}: no step runs \`${SYNC}\``);
  else {
    if (gates < 0 || sync < gates) out.push(`${where}: the dashboard sync does not come after the gate chain`);
    if (pushes.length === 0 || sync < pushes[0]) out.push(`${where}: the dashboard sync does not come after the push`);
    for (const p of pushes) if (p > sync) out.push(`${where}: a git push (step ${p + 1}) follows the dashboard sync`);
    if (!tokenIn(steps[sync].env)) out.push(`${where}: the dashboard sync step has no token in its env`);
  }
  return out;
}

export function checkWriteJob(root = ROOT, file = WORKFLOW) {
  return writeJobProblems(parseYaml(readFileSync(join(root, file), 'utf8')), file);
}

function main() {
  let problems;
  try { problems = checkWriteJob(); } catch (e) { console.log(`WRITE_JOB_ERROR ${e.message}`); return 2; }
  if (problems.length === 0) { console.log(`WRITE_JOB_OK workflow=${WORKFLOW}`); return 0; }
  console.log(`WRITE_JOB_BAD problems=${problems.length}`);
  for (const p of problems) console.log(`  ${p}`);
  return 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exit(main());
