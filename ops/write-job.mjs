#!/usr/bin/env node
// ops/write-job.mjs: the static check of the scheduled watch's two-job split (watch/freshness/SPEC.md
// FR-O.6, FR-D.5). Gate W3 runs it.
//
//   node ops/write-job.mjs            check .github/workflows/watch.yml
//
// The watch runs as two jobs. `build` installs dependencies, runs the watch, builds and runs the gate
// chain with a read-only token, and uploads only the generated files. `publish` holds the write
// permissions, installs nothing, runs no build or gate, and runs only dependency-free scripts from the
// repository. The job boundary is the control: whatever a dependency does with the build token, the token
// cannot write. The check parses the workflow with the watch's own YAML reader and fails when
//   - a job lacks `if: github.ref == 'refs/heads/main'`, or a checkout lacks `persist-credentials: false`;
//   - the workflow-level permissions, or any job other than `publish`, grant a write scope; `build` does
//     not name its own read-only permissions; or `build` references a secret other than GITHUB_TOKEN (a
//     personal token would carry its own write scope past the job's permissions);
//   - a token is in the workflow env, where every job would see it;
//   - `build` does not run the gate chain before it uploads, or its upload lists other paths than
//     ops/take-build-output.mjs PATHS;
//   - `publish` does not need `build`, uses an action other than checkout, setup-node and
//     download-artifact, downloads the artifact inside the checkout, runs an install, build or gate
//     command or any interpreter other than node, or runs a node script outside PUBLISH_SCRIPTS;
//   - in `publish`, a step other than the push and the sync receives the token, or a run line writes a
//     credential into the Git config;
//   - in `publish`, the steps are not in the order apply, briefs guard, push, sync, or a `git push`
//     follows the sync (FR-D.5);
//   - a script in PUBLISH_SCRIPTS, or any file it imports, imports anything but a Node built-in or a
//     repository file, or imports through a non-literal import() or require().
// A token is any expression naming `github.token`, `github['token']`, `secrets.GITHUB_TOKEN` or
// `secrets['GITHUB_TOKEN']` / `secrets["GITHUB_TOKEN"]`, in any letter case, inside or outside `${{ }}`.
// Exit 0 with `WRITE_JOB_OK`; 1 with `WRITE_JOB_BAD` and one indented line per problem; 2 on a
// workflow the YAML reader rejects. Node 22 built-ins only. Writes nothing.

import { readFileSync, existsSync } from 'node:fs';
import { builtinModules } from 'node:module';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseYaml } from '../watch/freshness/yaml.mjs';
import { PATHS } from './take-build-output.mjs';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const WORKFLOW = '.github/workflows/watch.yml';
export const MAIN_GUARD = "github.ref == 'refs/heads/main'";
export const SYNC = 'node watch/freshness/dashboard.mjs --sync watch/live.json';
// The only node scripts the publish job may run, in the order it runs them.
export const PUBLISH_SCRIPTS = ['ops/take-build-output.mjs', 'ops/briefs-guard.mjs', 'watch/freshness/dashboard.mjs'];
// The only actions the publish job may use.
export const PUBLISH_ACTIONS = ['actions/checkout@', 'actions/setup-node@', 'actions/download-artifact@'];

export const TOKEN = /\bgithub\s*\.\s*token\b|\bgithub\s*\[\s*(['"])token\1\s*\]|\bsecrets\s*\.\s*github_token\b|\bsecrets\s*\[\s*(['"])github_token\2\s*\]/i;
// Any secret, and the one secret the build job may name.
const SECRET = /\bsecrets\s*(?:\.\s*([A-Za-z_][A-Za-z0-9_]*)|\[\s*['"]([^'"]+)['"]\s*\])/gi;
// Commands that install, build or gate.
const UNTRUSTED = /\b(bun|npm|pnpm|yarn)\s+(install|ci|i|run|x|add|exec)\b|\bnpx\b|\bbunx\b|verify-site\.sh|make-live\.mjs|make-feed\.mjs|shell\.mjs|brief-strip\.mjs|make-stack\.mjs|harness\/run\.mjs|harness\/mutate\.mjs/;
// Interpreters and script launches other than node.
const OTHER_RUNNER = /(^|[\s;&|(])(bash|sh|zsh|dash|python3?|perl|ruby|deno|bun|php|source)\s|(^|[\s;&|(])\.\.?\/[\w./-]+/;
const CONFIG_WRITE = /\bgit\s+config\b[^\n]*(extraheader|x-access-token|GITHUB_TOKEN)|\bgit\s+remote\s+(set-url|add)\b[^\n]*(x-access-token|GITHUB_TOKEN|@github\.com)/;
const PUSH = /\bgit\b[^\n]*\bpush\b/;
const GATES = /\bbun run verify\b|verify-site\.sh/;
const WRITE_SCOPES = ['contents', 'issues', 'pull-requests', 'actions', 'packages', 'deployments', 'statuses', 'checks', 'id-token', 'pages', 'security-events', 'attestations'];

// The run text of a step without comment lines, with `\`-continued lines joined, so a commented-out
// command counts for nothing and a command split over lines is read as one.
const runOf = (step) => String(step?.run ?? '').replace(/\\\n\s*/g, ' ').split('\n').filter((l) => !l.trim().startsWith('#')).join('\n');
const guardOf = (s) => String(s ?? '').trim().replace(/^\$\{\{\s*/, '').replace(/\s*\}\}$/, '').replace(/\s+/g, ' ').replace(/"/g, "'");
const stepName = (step, i) => `step ${i + 1}${step?.name ? ` (${step.name})` : step?.uses ? ` (${String(step.uses).split('@')[0]})` : ''}`;
const strings = (v) => (v == null ? [] : typeof v === 'object' ? Object.values(v).flatMap(strings) : [String(v)]);

// Does any string inside a value (env map, `with:` map, run text; nested too) name the token?
export function tokenIn(v) {
  return strings(v).some((s) => TOKEN.test(s));
}
// Where a step receives the token: 'env', 'with:', 'run text', or null. Run text is read raw: GitHub
// substitutes `${{ }}` into comment lines too.
export function tokenSource(step) {
  if (tokenIn(step?.env)) return 'env';
  if (tokenIn(step?.with)) return 'with:';
  if (tokenIn(step?.run)) return 'run text';
  return null;
}
// The names of the secrets a value refers to.
export function secretNames(v) {
  return strings(v).flatMap((s) => [...s.matchAll(SECRET)].map((m) => (m[1] ?? m[2]).toUpperCase()));
}

export function grantsWrite(perms) {
  if (perms === 'write-all') return true;
  if (!perms || typeof perms !== 'object') return false;
  return WRITE_SCOPES.some((k) => perms[k] === 'write');
}

// The node scripts a run text starts, as written (quotes removed).
export function nodeScripts(run) {
  return [...run.matchAll(/(?:^|[\s;&|(])node\s+(\S+)/g)].map((m) => m[1].replace(/^['"]|['"]$/g, ''));
}

// Problems that hold for every job: the main-only guard and checkouts without stored credentials.
function everyJobProblems(id, job, where) {
  const out = [];
  if (guardOf(job.if) !== MAIN_GUARD) out.push(`${where}: lacks \`if: ${MAIN_GUARD}\``);
  (job.steps ?? []).forEach((step, i) => {
    if (String(step.uses ?? '').startsWith('actions/checkout@') && String(step.with?.['persist-credentials']) !== 'false') {
      out.push(`${where} ${stepName(step, i)}: checkout without \`persist-credentials: false\` leaves the token in .git/config`);
    }
  });
  return out;
}

// The build job: read-only, no other secrets, gates before the upload, and the upload lists PATHS.
export function buildProblems(job, where) {
  const out = [];
  const steps = job.steps ?? [];
  if (!job.permissions || typeof job.permissions !== 'object') out.push(`${where}: names no permissions of its own, so it inherits the workflow's`);
  const others = [...new Set(secretNames([job.env, steps]).filter((n) => n !== 'GITHUB_TOKEN'))];
  if (others.length) out.push(`${where}: references ${others.map((n) => `secrets.${n}`).join(', ')}; only the read-only GITHUB_TOKEN may reach dependency code`);
  const gates = steps.findIndex((s) => GATES.test(runOf(s)));
  const upload = steps.findIndex((s) => String(s.uses ?? '').startsWith('actions/upload-artifact@'));
  if (gates < 0) out.push(`${where}: runs no gate chain`);
  if (upload < 0) out.push(`${where}: uploads no artifact`);
  else {
    if (gates >= 0 && upload < gates) out.push(`${where}: uploads before the gate chain runs`);
    const listed = String(steps[upload].with?.path ?? '').split('\n').map((l) => l.trim()).filter(Boolean);
    if (listed.join('\n') !== PATHS.join('\n')) out.push(`${where}: the upload lists ${JSON.stringify(listed)}, not ops/take-build-output.mjs PATHS`);
  }
  return out;
}

// The publish job: no install, build or gate; only listed actions and scripts; token on push and sync only.
export function publishProblems(job, where) {
  const out = [];
  const steps = job.steps ?? [];
  const needs = [].concat(job.needs ?? []);
  if (!needs.includes('build')) out.push(`${where}: does not need the build job, so it could run before the gates`);
  steps.forEach((step, i) => {
    const at = `${where} ${stepName(step, i)}`;
    const run = runOf(step);
    const uses = String(step.uses ?? '');
    if (uses && !PUBLISH_ACTIONS.some((p) => uses.startsWith(p))) out.push(`${at}: uses ${uses.split('@')[0]}; publish may use only ${PUBLISH_ACTIONS.map((p) => p.slice(0, -1)).join(', ')}`);
    if (uses.startsWith('actions/download-artifact@') && !/^\$\{\{\s*runner\.temp\s*\}\}\//.test(String(step.with?.path ?? ''))) out.push(`${at}: downloads the artifact inside the checkout, where it could replace a script publish runs; use \${{ runner.temp }}/…`);
    if (UNTRUSTED.test(run)) out.push(`${at}: installs, builds or runs gates in the job that holds the write token`);
    if (OTHER_RUNNER.test(run)) out.push(`${at}: runs an interpreter or script other than the listed node scripts`);
    for (const s of nodeScripts(run)) if (!PUBLISH_SCRIPTS.includes(s)) out.push(`${at}: runs \`node ${s}\`, which is not in PUBLISH_SCRIPTS`);
    const src = tokenSource(step);
    const role = run.includes(SYNC) ? 'sync' : PUSH.test(run) ? 'push' : null;
    if (src && !role) out.push(`${at}: receives the token (${src}) but is not the push or sync step`);
    if (CONFIG_WRITE.test(run)) out.push(`${at}: writes a credential into the Git config`);
  });
  return [...out, ...orderProblems(steps, where)];
}

// FR-D.5 within publish: apply, briefs guard, push, sync, in that order, the sync with the token, and no
// push after the sync. The gates come before all of it through `needs: build`.
export function orderProblems(steps, where) {
  const out = [];
  const first = (test) => steps.findIndex((s) => test(runOf(s)));
  const take = first((r) => nodeScripts(r).includes('ops/take-build-output.mjs'));
  const guard = first((r) => nodeScripts(r).includes('ops/briefs-guard.mjs'));
  const sync = first((r) => r.includes(SYNC));
  const pushes = steps.map((s, i) => (PUSH.test(runOf(s)) ? i : -1)).filter((i) => i >= 0);
  if (take < 0) out.push(`${where}: never applies the artifact with ops/take-build-output.mjs`);
  if (guard < 0) out.push(`${where}: never runs ops/briefs-guard.mjs`);
  if (take >= 0 && guard >= 0 && guard < take) out.push(`${where}: runs the briefs guard before applying the artifact`);
  if (pushes.length === 0) out.push(`${where}: never pushes`);
  else if (guard >= 0 && pushes[0] < guard) out.push(`${where}: pushes before the briefs guard`);
  if (sync < 0) out.push(`${where}: no step runs \`${SYNC}\``);
  else {
    if (pushes.length === 0 || sync < pushes[0]) out.push(`${where}: the dashboard sync does not come after the push`);
    for (const p of pushes) if (p > sync) out.push(`${where}: a git push (step ${p + 1}) follows the dashboard sync`);
    if (!tokenIn(steps[sync].env)) out.push(`${where}: the dashboard sync step has no token in its env`);
  }
  return out;
}

// Problems with one parsed workflow. `name` prefixes each problem.
export function writeJobProblems(wf, name = WORKFLOW) {
  const out = [];
  if (!wf || typeof wf !== 'object' || !wf.jobs) return [`${name}: no jobs`];
  if (grantsWrite(wf.permissions)) out.push(`${name}: the workflow-level permissions grant a write scope to every job that names none`);
  if (tokenIn(wf.env)) out.push(`${name}: a token is in the workflow env, so every job sees it`);
  const ids = Object.keys(wf.jobs);
  for (const need of ['build', 'publish']) if (!ids.includes(need)) out.push(`${name}: has no \`${need}\` job`);
  for (const [id, job] of Object.entries(wf.jobs)) {
    const where = `${name} job ${id}`;
    out.push(...everyJobProblems(id, job, where));
    if (id !== 'publish' && grantsWrite(job.permissions ?? wf.permissions)) out.push(`${where}: grants a write scope; only the publish job may`);
    if (id !== 'publish' && tokenIn(job.env)) out.push(`${where}: a token is in the job env`);
    if (id === 'build') out.push(...buildProblems(job, where));
    if (id === 'publish') {
      if (tokenIn(job.env)) out.push(`${where}: a token is in the job env, so every publish step sees it`);
      out.push(...publishProblems(job, where));
    }
  }
  return out;
}

// The module specifiers a source text imports, statically or dynamically; `null` for a non-literal
// import() or require().
export function importSpecifiers(text) {
  // Full-line `//` comments only: a block-comment pass would read `packets/*-assessment.md` in a header
  // comment as the start of a comment and swallow the imports after it. An import inside a block comment
  // is therefore counted, which errs on the side of a false alarm.
  const src = text.replace(/^\s*\/\/.*$/gm, '');
  const out = [];
  for (const m of src.matchAll(/^\s*(?:import|export)\b[^'"`;]*?\bfrom\s*['"]([^'"]+)['"]|^\s*import\s*['"]([^'"]+)['"]/gm)) out.push(m[1] ?? m[2]);
  for (const m of src.matchAll(/\b(?:import|require)\s*\(\s*([^)]*?)\s*\)/g)) {
    const lit = m[1].match(/^['"]([^'"`$]+)['"]$/);
    out.push(lit ? lit[1] : null);
  }
  return out;
}

const BUILTINS = new Set(builtinModules);
// Problems in the import graph of the publish scripts: package imports, missing files, non-literal imports.
export function dependencyProblems(root = ROOT, scripts = PUBLISH_SCRIPTS) {
  const out = [];
  const seen = new Set();
  const visit = (rel) => {
    if (seen.has(rel)) return;
    seen.add(rel);
    const abs = join(root, rel);
    if (!existsSync(abs)) { out.push(`${rel}: imported by a publish script but missing`); return; }
    for (const spec of importSpecifiers(readFileSync(abs, 'utf8'))) {
      if (spec === null) out.push(`${rel}: a non-literal import() or require(), which could load anything`);
      else if (spec.startsWith('node:') || BUILTINS.has(spec)) continue;
      else if (spec.startsWith('./') || spec.startsWith('../')) {
        const next = relative(root, resolve(dirname(abs), spec)).split('\\').join('/');
        if (next.startsWith('..')) out.push(`${rel}: imports ${spec}, outside the repository`);
        else visit(next);
      } else out.push(`${rel}: imports the package \`${spec}\`; the publish job installs nothing`);
    }
  };
  for (const s of scripts) visit(s);
  return { files: seen.size, problems: out };
}

export function checkWriteJob(root = ROOT, file = WORKFLOW) {
  const deps = dependencyProblems(root);
  return { problems: [...writeJobProblems(parseYaml(readFileSync(join(root, file), 'utf8')), file), ...deps.problems], files: deps.files };
}

function main() {
  let r;
  try { r = checkWriteJob(); } catch (e) { console.log(`WRITE_JOB_ERROR ${e.message}`); return 2; }
  if (r.problems.length === 0) { console.log(`WRITE_JOB_OK workflow=${WORKFLOW} publish_files=${r.files}`); return 0; }
  console.log(`WRITE_JOB_BAD problems=${r.problems.length}`);
  for (const p of r.problems) console.log(`  ${p}`);
  return 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exit(main());
