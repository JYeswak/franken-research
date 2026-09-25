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
//   - any `uses:` (step or job) is not `owner/repo[/path]@<full 40-hex commit SHA>`: a tag or branch can be
//     moved to code the job then runs with its token;
//   - the workflow-level permissions, or any job other than `publish`, hold a permission value other than
//     `read` or `none` (or the shorthand `read-all`), whatever the scope name; `build` does not name its
//     own permissions; or `build` references a secret other than GITHUB_TOKEN (a personal token would
//     carry its own write scope past the job's permissions);
//   - the workflow sets `env` or `defaults`, which reach the publish job;
//   - `build` does not run the gate chain before it uploads, or its upload lists other paths than
//     ops/take-build-output.mjs PATHS;
//   - `publish` does not need `build`; sets job `env`, `defaults`, `container` or `services`, or a step
//     `shell`; uses an action other than checkout, setup-node and download-artifact; downloads the
//     artifact inside the checkout; runs an install, build or gate command or any interpreter other than
//     node; calls node other than as `node <allowlisted script> [args]` (no flags before the script, no
//     node by path); names a loader variable (NODE_OPTIONS, NODE_PATH, LD_*, DYLD_*, BUN_*), `export`,
//     `env`, $GITHUB_ENV or $GITHUB_PATH in run text; or puts a `${{ }}` expression in run text;
//   - in `publish`, a step has any env variable other than GITHUB_TOKEN, or has GITHUB_TOKEN without being
//     the push or the sync step; a step other than those two receives the token by any route; or a run
//     line writes a credential into the Git config;
//   - in `publish`, the steps are not in the order apply, briefs guard, push, sync, or a `git push`
//     follows the sync (FR-D.5);
//   - a script in PUBLISH_SCRIPTS, or any file it imports, imports anything but a Node built-in or a
//     repository file, or imports through a non-literal import() or require().
//   - a `run` body in `publish` differs, byte for byte after trailing newlines, from the reviewed text for
//     its step name in PUBLISH_RUNS, a publish step runs text under a name PUBLISH_RUNS does not hold, or
//     a PUBLISH_RUNS step is missing or repeated. A step allowed the token by its role is thereby also
//     held to its reviewed content (review 3e).
// These are a closed list of structural rules. The job boundary is the control; a new kind of workflow
// change needs a new rule here (site/BUILD-GATES.md, gate W3, "Limits").
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

// The reviewed run text of every publish step, by step name, one array element per line (SPEC.md FR-O.6
// after review 3e). The publish job holds the write token, so each body is pinned exactly: an extra
// `echo` fails like an extra `curl`. Changing any publish run body, or adding a publish step with a run,
// needs a matching change here in the same commit, and that commit is the review. Comment lines count:
// GitHub expands `${{ }}` inside them too.
export const PUBLISH_RUNS = {
  'Apply the generated files and commit them': [
    '# Copies only the generated paths; anything else in the artifact fails the run.',
    'node ops/take-build-output.mjs "$RUNNER_TEMP/watch-output"',
    'git add watch/ site/feed.xml site/briefs/',
    'if git diff --cached --quiet -- watch/ site/feed.xml site/briefs/; then',
    '  echo "watch/, feed and cards unchanged; nothing to commit"',
    '  echo "committed=false" >> "$GITHUB_OUTPUT"',
    '  exit 0',
    'fi',
    '# Briefs may change only inside their live:card regions (SPEC.md FR-L.5).',
    'node ops/briefs-guard.mjs',
    'day="$(jq -r \'.checked_at[0:10]\' watch/state.json)"',
    'n="$(jq \'.material | length\' "watch/changes/${day}.json")"',
    'git -c user.name=\'github-actions[bot]\' \\',
    '    -c user.email=\'41898282+github-actions[bot]@users.noreply.github.com\' \\',
    '    commit -m "watch: ${day} census (${n} material) [live]" -- watch/ site/feed.xml site/briefs/',
    'echo "committed=true" >> "$GITHUB_OUTPUT"',
  ],
  Push: [
    '# The token authenticates this one command and is never written to',
    '# .git/config. A plain push: if main moved during the run, this fails.',
    'auth="$(printf \'x-access-token:%s\' "$GITHUB_TOKEN" | base64 -w0)"',
    'git -c "http.https://github.com/.extraheader=AUTHORIZATION: basic ${auth}" \\',
    '    push origin "HEAD:${GITHUB_REF_NAME}"',
  ],
  'Sync the dashboard issue from the committed watch/live.json': [
    'node watch/freshness/dashboard.mjs --sync watch/live.json',
  ],
};

// A run body with its trailing newlines removed, the only normalisation the comparison makes.
const bodyOf = (run) => String(run).replace(/\n+$/, '');

// Problems with the publish run bodies against PUBLISH_RUNS: an unreviewed name, a body that differs
// (named with its first differing line), and a reviewed step that is missing or repeated.
export function runBodyProblems(steps, where, reviewed = PUBLISH_RUNS) {
  const out = [];
  const seen = new Map();
  steps.forEach((step, i) => {
    if (step?.run === undefined) return;
    const name = String(step.name ?? '');
    const at = `${where} step ${i + 1}${name ? ` (${name})` : ''}`;
    if (!Object.hasOwn(reviewed, name)) { out.push(`${at}: runs text under a name PUBLISH_RUNS does not hold; add the reviewed body to ops/write-job.mjs`); return; }
    seen.set(name, (seen.get(name) ?? 0) + 1);
    const want = reviewed[name].join('\n'), got = bodyOf(step.run);
    if (got === want) return;
    const w = want.split('\n'), g = got.split('\n');
    let n = 0;
    while (n < Math.max(w.length, g.length) && w[n] === g[n]) n++;
    out.push(`${at}: run body differs from the reviewed text at line ${n + 1}: reviewed ${JSON.stringify(w[n] ?? '<end>')}, found ${JSON.stringify(g[n] ?? '<end>')}`);
  });
  for (const name of Object.keys(reviewed)) {
    const count = seen.get(name) ?? 0;
    if (count === 0) out.push(`${where}: has no step named ${JSON.stringify(name)} running the reviewed body`);
    if (count > 1) out.push(`${where}: runs the reviewed step ${JSON.stringify(name)} ${count} times`);
  }
  return out;
}

export const TOKEN = /\bgithub\s*\.\s*token\b|\bgithub\s*\[\s*(['"])token\1\s*\]|\bsecrets\s*\.\s*github_token\b|\bsecrets\s*\[\s*(['"])github_token\2\s*\]/i;
// Any secret, and the one secret the build job may name.
const SECRET = /\bsecrets\s*(?:\.\s*([A-Za-z_][A-Za-z0-9_]*)|\[\s*['"]([^'"]+)['"]\s*\])/gi;
// Commands that install, build or gate.
const UNTRUSTED = /\b(bun|npm|pnpm|yarn)\s+(install|ci|i|run|x|add|exec)\b|\bnpx\b|\bbunx\b|verify-site\.sh|make-live\.mjs|make-feed\.mjs|shell\.mjs|brief-strip\.mjs|make-stack\.mjs|harness\/run\.mjs|harness\/mutate\.mjs/;
// Interpreters and script launches other than node.
const OTHER_RUNNER = /(^|[\s;&|(])(bash|sh|zsh|dash|python3?|perl|ruby|deno|bun|php|source|nodejs)\s|(^|[\s;&|(])\.\.?\/[\w./-]+|(^|[\s;&|(])\S*\/node(js)?(\s|$)/;
// Ways a publish run line could change what node or git load, or pass state to a later step's environment.
const LOADER = /\b(NODE_OPTIONS|NODE_PATH|NODE_REPL_EXTERNAL_MODULE|LD_[A-Z_]+|DYLD_[A-Z_]+|BUN_[A-Z_]+|GITHUB_ENV|GITHUB_PATH)\b|(^|[\s;&|(])(export|env)\s/;
// A full commit pin: owner/repo[/path]@<40 hex>.
const PINNED = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(\/[A-Za-z0-9_./-]+)?@[0-9a-f]{40}$/;
const CONFIG_WRITE = /\bgit\s+config\b[^\n]*(extraheader|x-access-token|GITHUB_TOKEN)|\bgit\s+remote\s+(set-url|add)\b[^\n]*(x-access-token|GITHUB_TOKEN|@github\.com)/;
const PUSH = /\bgit\b[^\n]*\bpush\b/;
const GATES = /\bbun run verify\b|verify-site\.sh/;
const READ_VALUES = ['read', 'none'];

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

// The permission entries that are not read-only, as `scope: value`. `read-all` and `{}` are read-only;
// `write-all`, any other shorthand, and any scope whose value is not `read` or `none` are not, whatever
// the scope is called.
export function notReadOnly(perms) {
  if (perms == null) return [];
  if (typeof perms === 'string') return perms === 'read-all' ? [] : [perms];
  if (typeof perms !== 'object' || Array.isArray(perms)) return [JSON.stringify(perms)];
  return Object.entries(perms).filter(([, v]) => !READ_VALUES.includes(String(v))).map(([k, v]) => `${k}: ${v}`);
}

// The node scripts a run text starts, as written (quotes removed).
export function nodeScripts(run) {
  return [...run.matchAll(/(?:^|[\s;&|(])node\s+(\S+)/g)].map((m) => m[1].replace(/^['"]|['"]$/g, ''));
}

// Problems that hold for every job: the main-only guard, checkouts without stored credentials, and every
// action pinned to a full commit SHA.
function everyJobProblems(id, job, where) {
  const out = [];
  if (guardOf(job.if) !== MAIN_GUARD) out.push(`${where}: lacks \`if: ${MAIN_GUARD}\``);
  if (job.uses !== undefined && !PINNED.test(String(job.uses))) out.push(`${where}: uses ${job.uses}, not pinned to a full 40-hex commit SHA`);
  (job.steps ?? []).forEach((step, i) => {
    if (String(step.uses ?? '').startsWith('actions/checkout@') && String(step.with?.['persist-credentials']) !== 'false') {
      out.push(`${where} ${stepName(step, i)}: checkout without \`persist-credentials: false\` leaves the token in .git/config`);
    }
    if (step.uses !== undefined && !PINNED.test(String(step.uses))) out.push(`${where} ${stepName(step, i)}: uses ${step.uses}, not pinned to a full 40-hex commit SHA`);
  });
  return out;
}

// The build job: read-only, no other secrets, gates before the upload, and the upload lists PATHS.
export function buildProblems(job, where) {
  const out = [];
  const steps = job.steps ?? [];
  if (job.permissions == null) out.push(`${where}: names no permissions of its own, so it inherits the workflow's`);
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

// The publish job: no install, build or gate; only listed actions and scripts, called plainly; no env but
// the token, and the token on push and sync only.
export function publishProblems(job, where) {
  const out = [];
  const steps = job.steps ?? [];
  const needs = [].concat(job.needs ?? []);
  if (!needs.includes('build')) out.push(`${where}: does not need the build job, so it could run before the gates`);
  for (const k of ['env', 'defaults', 'container', 'services']) if (job[k] !== undefined) out.push(`${where}: sets job-level \`${k}\`, which reaches every step that holds the write token`);
  steps.forEach((step, i) => {
    const at = `${where} ${stepName(step, i)}`;
    const run = runOf(step);
    const uses = String(step.uses ?? '');
    if (uses && !PUBLISH_ACTIONS.some((p) => uses.startsWith(p))) out.push(`${at}: uses ${uses.split('@')[0]}; publish may use only ${PUBLISH_ACTIONS.map((p) => p.slice(0, -1)).join(', ')}`);
    if (uses.startsWith('actions/download-artifact@') && !/^\$\{\{\s*runner\.temp\s*\}\}\//.test(String(step.with?.path ?? ''))) out.push(`${at}: downloads the artifact inside the checkout, where it could replace a script publish runs; use \${{ runner.temp }}/…`);
    if (step.shell !== undefined) out.push(`${at}: sets \`shell\`, which decides what runs the step`);
    if (UNTRUSTED.test(run)) out.push(`${at}: installs, builds or runs gates in the job that holds the write token`);
    if (OTHER_RUNNER.test(run)) out.push(`${at}: runs an interpreter or script other than the listed node scripts`);
    for (const s of nodeScripts(run)) if (!PUBLISH_SCRIPTS.includes(s)) out.push(`${at}: runs \`node ${s}\`, which is not in PUBLISH_SCRIPTS`);
    if (LOADER.test(run)) out.push(`${at}: names a loader or environment channel (${run.match(LOADER)[0].trim()}) in its run text`);
    if (/\$\{\{/.test(String(step.run ?? ''))) out.push(`${at}: puts a \`\${{ }}\` expression into its run text`);
    const role = run.includes(SYNC) ? 'sync' : PUSH.test(run) ? 'push' : null;
    for (const k of Object.keys(step.env ?? {})) {
      if (k !== 'GITHUB_TOKEN') out.push(`${at}: sets env ${k}; publish steps may set only GITHUB_TOKEN`);
      else if (!role) out.push(`${at}: sets env GITHUB_TOKEN but is not the push or sync step`);
    }
    const src = tokenSource(step);
    if (src && !role) out.push(`${at}: receives the token (${src}) but is not the push or sync step`);
    if (CONFIG_WRITE.test(run)) out.push(`${at}: writes a credential into the Git config`);
  });
  return [...out, ...runBodyProblems(steps, where), ...orderProblems(steps, where)];
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
  for (const p of notReadOnly(wf.permissions)) out.push(`${name}: the workflow-level permission \`${p}\` reaches every job that names none`);
  if (wf.env !== undefined) out.push(`${name}: sets a workflow-level \`env\`, which reaches the publish job`);
  if (wf.defaults !== undefined) out.push(`${name}: sets workflow-level \`defaults\`, which reach the publish job`);
  const ids = Object.keys(wf.jobs);
  for (const need of ['build', 'publish']) if (!ids.includes(need)) out.push(`${name}: has no \`${need}\` job`);
  for (const [id, job] of Object.entries(wf.jobs)) {
    const where = `${name} job ${id}`;
    out.push(...everyJobProblems(id, job, where));
    if (id !== 'publish') for (const p of notReadOnly(job.permissions ?? wf.permissions)) out.push(`${where}: holds the permission \`${p}\`; only the publish job may hold anything but read or none`);
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
