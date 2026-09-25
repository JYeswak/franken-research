#!/usr/bin/env node
// ops/write-job.mjs: the static check of every workflow's token boundary (watch/freshness/SPEC.md FR-O.6,
// FR-D.5; extended to every workflow on 2026-09-25, decision D2). Gate W3 runs it.
//
//   node ops/write-job.mjs            check every .github/workflows/*.yml
//
// A job that holds a write permission runs no dependency code; a job that runs dependency code (installs,
// builds, gates) holds only read or none. The watch and the discovery sweep therefore run as two jobs: a
// read-only `build` that installs, runs, builds and gates and uploads only its generated files, and a
// `publish` that installs nothing and runs only dependency-free repository scripts. The triage job writes
// one issue comment and installs nothing. Each write job is described in POLICIES below. The job boundary
// is the control. The check parses each workflow with the watch's own YAML reader and fails when
//   in any workflow:
//   - a job names no permissions and the workflow names none either (it would get the repository's
//     default token permissions, which may write);
//   - the workflow-level permissions hold a value other than `read` or `none` (or `read-all`);
//   - a job holds a permission value other than `read` or `none`, whatever the scope name, and is not a
//     write job in POLICIES;
//   - any `uses:` (step or job) is not `owner/repo[/path]@<full 40-hex commit SHA>`;
//   - any checkout lacks `persist-credentials: false`;
//   - anything holds `id-token: write` (or write-all);
//   - a secret other than GITHUB_TOKEN is named at workflow or job level, or on a step that SECRET_JOBS
//     does not record with that secret and its exact reviewed run body; a job with recorded secret steps
//     lacks its reviewed `if:` (main only) or its environment;
//   in a workflow with a POLICIES entry:
//   - a job lacks `if: github.ref == 'refs/heads/main'` where the policy is main-only; the workflow sets
//     `env` or `defaults`, which would reach the write job;
//   - the build job names no permissions of its own, runs no gate chain before it uploads, or uploads
//     other paths than ops/take-build-output.mjs PATH_SETS[<set>];
//   in a write job:
//   - it does not need its build job; sets job `env`, `defaults`, `container` or `services`, or a step
//     `shell`; it uses an action outside its list, or
//     downloads an artifact inside the checkout; it runs an install, build or gate command or an
//     interpreter other than node; calls node other than as `node <listed script> [args]`; names a loader
//     variable (NODE_OPTIONS, NODE_PATH, LD_*, DYLD_*, BUN_*), `export`, `env`, $GITHUB_ENV or $GITHUB_PATH
//     in run text, or puts a `${{ }}` expression there;
//   - a step sets an env variable outside the policy's list, or a step outside the policy's token steps
//     receives the token by any route; or a run line writes a credential into the Git config;
//   - its steps are not in the policy's order (apply, briefs guard where there is one, push, sync), or a
//     `git push` follows the sync (FR-D.5);
//   - a run body differs, byte for byte after trailing newlines, from the reviewed text for its step
//     name, a step runs text under a name the policy does not hold, or a reviewed step is missing or
//     repeated (review 3e);
//   - a script it runs, or any file that script imports, imports anything but a Node built-in or a
//     repository file, or imports through a non-literal import() or require().
// These are a closed list of structural rules. The job boundary is the control; a new kind of workflow
// change needs a new rule here (site/BUILD-GATES.md, gate W3, "Limits").
// A token is any expression naming `github.token`, `github['token']`, `secrets.GITHUB_TOKEN` or
// `secrets['GITHUB_TOKEN']` / `secrets["GITHUB_TOKEN"]`, in any letter case, inside or outside `${{ }}`.
// Exit 0 with `WRITE_JOB_OK`; 1 with `WRITE_JOB_BAD` and one indented line per problem; 2 on a
// workflow the YAML reader rejects. Node 22 built-ins only. Writes nothing.

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { builtinModules } from 'node:module';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseYaml } from '../watch/freshness/yaml.mjs';
import { PATH_SETS } from './take-build-output.mjs';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const WORKFLOWS = '.github/workflows';
export const MAIN_GUARD = "github.ref == 'refs/heads/main'";
export const SYNC = 'node watch/freshness/dashboard.mjs --sync watch/live.json';
export const ROLLUP_SYNC = 'node watch/discover.mjs --sync-issue';

// The push step is the same reviewed text in every workflow that pushes.
const PUSH_RUN = [
  '# The token authenticates this one command and is never written to',
  '# .git/config. A plain push: if main moved during the run, this fails.',
  'auth="$(printf \'x-access-token:%s\' "$GITHUB_TOKEN" | base64 -w0)"',
  'git -c "http.https://github.com/.extraheader=AUTHORIZATION: basic ${auth}" \\',
  '    push origin "HEAD:${GITHUB_REF_NAME}"',
];
const PUBLISH_ACTIONS = ['actions/checkout@', 'actions/setup-node@', 'actions/download-artifact@'];

// Every workflow that holds a write permission, and what its write jobs may do. `runs` is the reviewed run
// text of every step with a `run`, by step name, one array element per line (SPEC.md FR-O.6 after review
// 3e). A write job holds the token, so each body is pinned exactly: an extra `echo` fails like an extra
// `curl`. Changing any such run body, or adding a step with a run to a write job, needs a matching change
// here in the same commit, and that commit is the review. Comment lines count: GitHub expands `${{ }}`
// inside them too. A workflow not listed here may hold only read or none in every job.
export const POLICIES = {
  '.github/workflows/watch.yml': {
    mainOnly: true,
    build: { job: 'build', set: 'watch' },
    write: {
      publish: {
        needs: 'build',
        actions: PUBLISH_ACTIONS,
        scripts: ['ops/take-build-output.mjs', 'ops/briefs-guard.mjs', 'watch/freshness/dashboard.mjs'],
        env: ['GITHUB_TOKEN'],
        tokenSteps: ['Push', 'Sync the dashboard issue from the committed watch/live.json'],
        order: { apply: 'ops/take-build-output.mjs', guard: 'ops/briefs-guard.mjs', sync: SYNC, label: 'dashboard sync' },
        runs: {
          'Apply the generated files and commit them': [
            '# Copies only the generated paths; anything else in the artifact fails the run.',
            'node ops/take-build-output.mjs watch "$RUNNER_TEMP/watch-output"',
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
          Push: PUSH_RUN,
          'Sync the dashboard issue from the committed watch/live.json': [
            'node watch/freshness/dashboard.mjs --sync watch/live.json',
          ],
        },
      },
    },
  },
  '.github/workflows/discover.yml': {
    mainOnly: true,
    build: { job: 'build', set: 'discover' },
    write: {
      publish: {
        needs: 'build',
        actions: PUBLISH_ACTIONS,
        scripts: ['ops/take-build-output.mjs', 'watch/discover.mjs'],
        env: ['GITHUB_TOKEN'],
        tokenSteps: ['Push', 'Sync the rollup issue from the committed week file'],
        order: { apply: 'ops/take-build-output.mjs', guard: null, sync: ROLLUP_SYNC, label: 'rollup sync' },
        runs: {
          'Apply the generated file and commit it': [
            '# Copies only watch/discovery/*.json; anything else in the artifact fails the run.',
            'node ops/take-build-output.mjs discover "$RUNNER_TEMP/discover-output"',
            'git add watch/discovery/',
            'if git diff --cached --quiet -- watch/discovery/; then',
            '  echo "watch/discovery/ unchanged; nothing to commit"',
            '  echo "committed=false" >> "$GITHUB_OUTPUT"',
            '  exit 0',
            'fi',
            '# The one file this run wrote (a rerun in the same week rewrites it).',
            'file="$(git diff --cached --name-only -- \'watch/discovery/*.json\' | head -n 1)"',
            'week="$(basename "$file" .json)"',
            'n="$(jq \'.candidates | length\' "$file")"',
            'git -c user.name=\'github-actions[bot]\' \\',
            '    -c user.email=\'41898282+github-actions[bot]@users.noreply.github.com\' \\',
            '    commit -m "discover: ${week} Rust candidates (${n}) [live]" -- watch/discovery/',
            'echo "committed=true" >> "$GITHUB_OUTPUT"',
          ],
          Push: PUSH_RUN,
          'Sync the rollup issue from the committed week file': [
            '# The newest committed week file is the one this run wrote: the sweep always writes the current ISO week.',
            'node watch/discover.mjs --sync-issue "$(git ls-files \'watch/discovery/*.json\' | sort | tail -n 1)"',
          ],
        },
      },
    },
  },
  // An issues event always runs the workflow file as it is on the default branch, so no main guard applies.
  // gh is runner software, like git and jq, not a dependency of this repository.
  '.github/workflows/triage.yml': {
    mainOnly: false,
    build: null,
    write: {
      ack: {
        needs: null,
        actions: ['actions/checkout@', 'actions/setup-node@'],
        scripts: ['.github/scripts/triage-ack.mjs'],
        env: ['GH_TOKEN', 'ISSUE'],
        tokenSteps: ['Acknowledge once'],
        order: null,
        runs: {
          'Acknowledge once': [
            'body="$RUNNER_TEMP/ack.md"',
            'node .github/scripts/triage-ack.mjs --event "$GITHUB_EVENT_PATH" > "$body"',
            'if [ ! -s "$body" ]; then',
            '  echo "Issue #$ISSUE has no reader label (or is a watch issue); nothing to post."',
            '  exit 0',
            'fi',
            'posted="$(gh api --paginate "repos/$GITHUB_REPOSITORY/issues/$ISSUE/comments" \\',
            '  --jq \'[.[] | select(.body | contains("<!-- triage-ack -->"))] | length\' \\',
            '  | awk \'{ n += $1 } END { print n + 0 }\')"',
            'if [ "$posted" -gt 0 ]; then',
            '  echo "Issue #$ISSUE already acknowledged; nothing to post."',
            '  exit 0',
            'fi',
            'gh issue comment "$ISSUE" -R "$GITHUB_REPOSITORY" --body-file "$body"',
          ],
        },
      },
    },
  },
};

// Secrets other than GITHUB_TOKEN, recorded rather than changed, and bound to exact reviewed steps (decision D2
// review, 2026-09-25). deploy.yml's deploy job is read-only (contents: read). Its CLOUDFLARE_API_TOKEN lives
// only in the `production` environment, whose deployment branch policy admits main alone (attested with gh api
// in site/BUILD-GATES.md, gate W3); the job's own `if:` checks main as well, and that condition is pinned
// here because the environment policy is a GitHub setting no offline gate can see. The token reaches only the
// three steps below, each pinned byte for byte like a write job's run body. `npx --yes wrangler@4.85.0` in
// the deploy step receives it by design: wrangler is the deploy tool. The token can deploy the Pages project;
// it cannot write to this repository. Any other step, job or workflow that names any secret but GITHUB_TOKEN
// fails, and so does `id-token: write` anywhere.
export const SECRET_JOBS = {
  '.github/workflows/deploy.yml': {
    deploy: {
      guard: "github.ref == 'refs/heads/main' && (github.event_name != 'workflow_run' || (github.event.workflow_run.conclusion == 'success' && github.event.workflow_run.head_branch == 'main'))",
      environment: 'production',
      steps: {
        'Deploy token present?': {
          secrets: ['CLOUDFLARE_API_TOKEN'],
          run: [
            'if [ -n "$CLOUDFLARE_API_TOKEN" ]; then',
            '  echo "ready=true" >> "$GITHUB_OUTPUT"',
            '  exit 0',
            'fi',
            'echo "ready=false" >> "$GITHUB_OUTPUT"',
            'echo "::warning title=Site not deployed::The gates passed, but the repository secret CLOUDFLARE_API_TOKEN is not set, so site/ was not deployed. To add it: in the Cloudflare dashboard open Manage Account > Account API Tokens > Create Token > Custom token, give it the single permission Account / Cloudflare Pages / Edit on the zeststream account, then run \'gh secret set CLOUDFLARE_API_TOKEN -R ${GITHUB_REPOSITORY}\' and paste the token at the prompt (never on the command line). Steps are in docs/PIPELINE.md."',
          ],
        },
        'Deploy site/ to Cloudflare Pages': {
          secrets: ['CLOUDFLARE_API_TOKEN'],
          run: [
            'set -o pipefail',
            'sha="$(git rev-parse HEAD)"',
            '# First line of the commit subject, trimmed to 100 characters for the Pages dashboard.',
            'subject="$(git log -1 --format=%s HEAD | cut -c1-100)"',
            '# wrangler pinned to the version used for the manual deploys (`wrangler --version`',
            '# on 2026-09-24: 4.85.0).',
            'npx --yes wrangler@4.85.0 pages deploy site \\',
            '  --project-name franken-assessments \\',
            '  --branch main \\',
            '  --commit-hash "$sha" \\',
            '  --commit-message "$subject" | tee "$RUNNER_TEMP/wrangler.log"',
            '# wrangler ends with "Deployment complete! Take a peek over at https://<id>.<project>.pages.dev".',
            '# That URL serves this deployment and nothing else, so the smoke step checks it.',
            'url="$(grep -oE \'https://[0-9a-f]{8}\\.franken-assessments\\.pages\\.dev\' "$RUNNER_TEMP/wrangler.log" | tail -1 || true)"',
            'test -n "$url" || { echo "::error title=No deployment URL::wrangler printed no https://<id>.franken-assessments.pages.dev URL"; exit 1; }',
            'echo "deployment URL: $url"',
            '{ echo "url=$url"; echo "sha=$sha"; } >> "$GITHUB_OUTPUT"',
          ],
        },
        'Smoke test the deployment and the live domain': {
          secrets: ['CLOUDFLARE_API_TOKEN'],
          run: [
            '# Pages serves /briefs/<name>.html at /briefs/<name>.',
            'want="$(grep -o \'<title>[^<]*</title>\' site/index.html | head -1)"',
            'set -- site/briefs/*.html',
            'brief="$(basename "$1" .html)"',
            'test -n "$want" && test -f "$1" || { echo "::error::could not read the expected title or a brief name"; exit 1; }',
            'test -n "$DEPLOY_URL" && test -n "$DEPLOY_SHA" || { echo "::error::the deploy step left no deployment URL or commit"; exit 1; }',
            '# A missed daily watch run is a warning, never a failure (watch/freshness/SPEC.md FR-O.4):',
            '# prints ::warning when watch/live.json checked_at is more than 36 hours old or unreadable.',
            'node ops/stale-run.mjs watch/live.json',
            'page="$RUNNER_TEMP/page.html"',
            'headers="$RUNNER_TEMP/headers.txt"',
            '# Prints "<home status> <brief status> <title found 0|1>" for a base URL. 000 means no',
            '# HTTP answer. The files are removed first so a failed request cannot reuse an old page.',
            'probe() {',
            '  local home brief_code found=0',
            '  rm -f "$page" "$headers"',
            '  home="$(curl -sS -o "$page" -D "$headers" -w \'%{http_code}\' "$1/?smoke=$GITHUB_RUN_ID" || true)"',
            '  brief_code="$(curl -sS -o /dev/null -w \'%{http_code}\' "$1/briefs/$brief" || true)"',
            '  [ -f "$page" ] && grep -qF "$want" "$page" && found=1',
            '  echo "${home:-000} ${brief_code:-000} $found"',
            '}',
            '',
            '# 1. The deployment\'s own URL.',
            'ok=0',
            'for attempt in 1 2 3 4 5 6; do',
            '  read -r home code found <<< "$(probe "$DEPLOY_URL")"',
            '  echo "1. $DEPLOY_URL attempt $attempt: / $home, /briefs/$brief $code, title found $found"',
            '  if [ "$home" = 200 ] && [ "$code" = 200 ] && [ "$found" = 1 ]; then ok=1; break; fi',
            '  sleep 10',
            'done',
            '[ "$ok" = 1 ] || { echo "::error title=Smoke test failed::$DEPLOY_URL did not serve / and /briefs/$brief with $want"; exit 1; }',
            '',
            '# 2. The Pages API. The token goes to curl on stdin, never on its command line.',
            'api() {',
            '  printf \'header = "Authorization: Bearer %s"\\n\' "$CLOUDFLARE_API_TOKEN" |',
            '    curl -sS -K - "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects/franken-assessments$1" || true',
            '}',
            '# Prints OK, or every mismatch joined by "; ".',
            'check_api() {',
            '  jq -rn --argjson p "$1" --argjson d "$2" --arg url "$DEPLOY_URL" --arg sha "$DEPLOY_SHA" \'',
            '    [ (if $p.success then empty else "project lookup failed: \\($p.errors)" end),',
            '      ($p.result.canonical_deployment as $c | if $c.url == $url then empty else "canonical deployment is \\($c.url), not \\($url)" end),',
            '      ($p.result.latest_deployment as $l | if $l.url == $url then empty else "latest deployment is \\($l.url), not \\($url)" end),',
            '      ($p.result.canonical_deployment as $c | if $c.environment == "production" and $c.latest_stage.status == "success" then empty else "canonical deployment is \\($c.environment) \\($c.latest_stage.name)/\\($c.latest_stage.status)" end),',
            '      ($p.result.canonical_deployment.deployment_trigger.metadata.commit_hash as $h | if $h == $sha then empty else "canonical deployment is commit \\($h), not \\($sha)" end),',
            '      (if $d.success then empty else "domain lookup failed: \\($d.errors)" end),',
            '      (if $d.result.status == "active" then empty else "fr.zeststream.ai status is \\($d.result.status), not active" end)',
            '    ] | if length == 0 then "OK" else join("; ") end\' 2>/dev/null || echo "the API did not return JSON"',
            '}',
            'for attempt in 1 2 3; do',
            '  verdict="$(check_api "$(api \'\')" "$(api /domains/fr.zeststream.ai)")"',
            '  [ "$verdict" = OK ] && break',
            '  echo "2. Pages API attempt $attempt: $verdict"',
            '  sleep 5',
            'done',
            'if [ "$verdict" != OK ]; then',
            '  echo "::error title=Smoke test failed::Pages API: $verdict"',
            '  exit 1',
            'fi',
            'echo "2. Pages API: $DEPLOY_URL is the canonical and latest production deployment, commit $DEPLOY_SHA; fr.zeststream.ai is active"',
            '',
            '# 3. The custom domain, best effort.',
            'for attempt in 1 2 3 4 5 6; do',
            '  read -r home code found <<< "$(probe "$SITE_URL")"',
            '  echo "3. $SITE_URL attempt $attempt: / $home, /briefs/$brief $code, title found $found"',
            '  if [ "$home" = 200 ] && [ "$code" = 200 ] && [ "$found" = 1 ]; then',
            '    echo "OK: $DEPLOY_URL and $SITE_URL serve commit $DEPLOY_SHA"',
            '    exit 0',
            '  fi',
            '  if [ "$home" = 403 ] || [ "$code" = 403 ]; then',
            '    mitigated="$(grep -i "^cf-mitigated:" "$headers" | tr -d \'\\r\' || true)"',
            '    echo "::notice title=Custom domain not reachable from the runner::$SITE_URL answered 403 to the GitHub runner, which is Cloudflare bot protection on the zeststream.ai zone blocking datacenter IPs (${mitigated:-no cf-mitigated header}). Checks 1 and 2 passed, so this deployment is live."',
            '    echo "OK: $DEPLOY_URL serves commit $DEPLOY_SHA and the API confirms it is live on $SITE_URL"',
            '    exit 0',
            '  fi',
            '  sleep 10',
            'done',
            'echo "::error title=Smoke test failed::$SITE_URL did not serve / and /briefs/$brief with $want (see the attempts above)"',
            'exit 1',
          ],
        },
      },
    },
  },
};

// Every script any write job runs, for the dependency walk.
export const WRITE_SCRIPTS = [...new Set(Object.values(POLICIES).flatMap((p) => Object.values(p.write).flatMap((j) => j.scripts)))];

// A run body with its trailing newlines removed, the only normalisation the comparison makes.
const bodyOf = (run) => String(run).replace(/\n+$/, '');

// null when a run body equals its reviewed lines, else where it first differs.
function bodyDiff(lines, run) {
  const want = lines.join('\n'), got = bodyOf(run ?? '');
  if (got === want) return null;
  const w = want.split('\n'), g = got.split('\n');
  let n = 0;
  while (n < Math.max(w.length, g.length) && w[n] === g[n]) n++;
  return `run body differs from the reviewed text at line ${n + 1}: reviewed ${JSON.stringify(w[n] ?? '<end>')}, found ${JSON.stringify(g[n] ?? '<end>')}`;
}

// Problems with a write job's run bodies against its reviewed `runs`: an unreviewed name, a body that
// differs (named with its first differing line), and a reviewed step that is missing or repeated.
export function runBodyProblems(steps, where, reviewed) {
  const out = [];
  const seen = new Map();
  steps.forEach((step, i) => {
    if (step?.run === undefined) return;
    const name = String(step.name ?? '');
    const at = `${where} step ${i + 1}${name ? ` (${name})` : ''}`;
    if (!Object.hasOwn(reviewed, name)) { out.push(`${at}: runs text under a name its reviewed runs in ops/write-job.mjs POLICIES do not hold; add the reviewed body there`); return; }
    seen.set(name, (seen.get(name) ?? 0) + 1);
    const diff = bodyDiff(reviewed[name], step.run);
    if (diff) out.push(`${at}: ${diff}`);
  });
  for (const name of Object.keys(reviewed)) {
    const count = seen.get(name) ?? 0;
    if (count === 0) out.push(`${where}: has no step named ${JSON.stringify(name)} running the reviewed body`);
    if (count > 1) out.push(`${where}: runs the reviewed step ${JSON.stringify(name)} ${count} times`);
  }
  return out;
}

export const TOKEN = /\bgithub\s*\.\s*token\b|\bgithub\s*\[\s*(['"])token\1\s*\]|\bsecrets\s*\.\s*github_token\b|\bsecrets\s*\[\s*(['"])github_token\2\s*\]/i;
// Any secret, by name.
const SECRET = /\bsecrets\s*(?:\.\s*([A-Za-z_][A-Za-z0-9_]*)|\[\s*['"]([^'"]+)['"]\s*\])/gi;
// Commands that install, build or gate.
const UNTRUSTED = /\b(bun|npm|pnpm|yarn)\s+(install|ci|i|run|x|add|exec)\b|\bnpx\b|\bbunx\b|verify-site\.sh|make-live\.mjs|make-feed\.mjs|shell\.mjs|brief-strip\.mjs|make-stack\.mjs|harness\/run\.mjs|harness\/mutate\.mjs/;
// Interpreters and script launches other than node.
const OTHER_RUNNER = /(^|[\s;&|(])(bash|sh|zsh|dash|python3?|perl|ruby|deno|bun|php|source|nodejs)\s|(^|[\s;&|(])\.\.?\/[\w./-]+|(^|[\s;&|(])\S*\/node(js)?(\s|$)/;
// Ways a write job's run line could change what node or git load, or pass state to a later step's environment.
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

// Checkouts that leave the job's token in .git/config, where any later step can read it.
function checkoutProblems(job, where) {
  return (job.steps ?? []).flatMap((step, i) => (String(step.uses ?? '').startsWith('actions/checkout@') && String(step.with?.['persist-credentials']) !== 'false'
    ? [`${where} ${stepName(step, i)}: checkout without \`persist-credentials: false\` leaves the token in .git/config`] : []));
}

// `id-token: write` as a scope or through a write-all shorthand.
function hasIdToken(perms) {
  return perms === 'write-all' || (perms != null && typeof perms === 'object' && String(perms['id-token']) === 'write');
}

// Secrets other than GITHUB_TOKEN: none at job level, and on a step only when SECRET_JOBS records that
// exact step, those secrets, and its reviewed run body. A job with recorded steps must also carry the
// reviewed `if:` and environment.
export function secretProblems(job, where, reviewed) {
  const out = [];
  const others = (v) => [...new Set(secretNames(v).filter((n) => n !== 'GITHUB_TOKEN'))];
  const atJob = others([job.env, job.with, job.if, job.environment, job.secrets, job.container, job.services]);
  if (atJob.length) out.push(`${where}: names ${atJob.map((n) => `secrets.${n}`).join(', ')} at job level, where every step sees it`);
  const seen = new Map();
  (job.steps ?? []).forEach((step, i) => {
    const names = others([step.env, step.with, step.run, step.if]);
    if (names.length === 0) return;
    const at = `${where} ${stepName(step, i)}`;
    const rec = reviewed?.steps && Object.hasOwn(reviewed.steps, String(step.name ?? '')) ? reviewed.steps[step.name] : null;
    if (!rec) { out.push(`${at}: references ${names.map((n) => `secrets.${n}`).join(', ')}; only a reviewed step in ops/write-job.mjs SECRET_JOBS may name a secret other than GITHUB_TOKEN`); return; }
    seen.set(step.name, (seen.get(step.name) ?? 0) + 1);
    const extra = names.filter((n) => !rec.secrets.includes(n));
    if (extra.length) out.push(`${at}: references ${extra.map((n) => `secrets.${n}`).join(', ')}, which its SECRET_JOBS entry does not record`);
    const diff = bodyDiff(rec.run, step.run);
    if (diff) out.push(`${at}: holds a recorded secret, and its ${diff}`);
  });
  if (reviewed) {
    for (const [name, n] of seen) if (n > 1) out.push(`${where}: runs the reviewed secret step ${JSON.stringify(name)} ${n} times`);
    if (guardOf(job.if) !== reviewed.guard) out.push(`${where}: its \`if:\` is not the reviewed main-only condition in SECRET_JOBS`);
    const env = typeof job.environment === 'object' ? job.environment?.name : job.environment;
    if (env !== reviewed.environment) out.push(`${where}: runs outside the \`${reviewed.environment}\` environment that scopes its secret`);
  }
  return out;
}

// Every `uses:` in a job (steps and the job itself) pinned to a full commit SHA.
function pinProblems(job, where) {
  const out = [];
  if (job.uses !== undefined && !PINNED.test(String(job.uses))) out.push(`${where}: uses ${job.uses}, not pinned to a full 40-hex commit SHA`);
  (job.steps ?? []).forEach((step, i) => {
    if (step.uses !== undefined && !PINNED.test(String(step.uses))) out.push(`${where} ${stepName(step, i)}: uses ${step.uses}, not pinned to a full 40-hex commit SHA`);
  });
  return out;
}

// The build job of a two-job workflow: its own permissions, gates before the upload, and the upload lists
// exactly the path set the write job will accept.
export function buildProblems(job, where, paths) {
  const out = [];
  const steps = job.steps ?? [];
  if (job.permissions == null) out.push(`${where}: names no permissions of its own, so it inherits the workflow's`);
  const gates = steps.findIndex((s) => GATES.test(runOf(s)));
  const upload = steps.findIndex((s) => String(s.uses ?? '').startsWith('actions/upload-artifact@'));
  if (gates < 0) out.push(`${where}: runs no gate chain`);
  if (upload < 0) out.push(`${where}: uploads no artifact`);
  else {
    if (gates >= 0 && upload < gates) out.push(`${where}: uploads before the gate chain runs`);
    const listed = String(steps[upload].with?.path ?? '').split('\n').map((l) => l.trim()).filter(Boolean);
    if (listed.join('\n') !== paths.join('\n')) out.push(`${where}: the upload lists ${JSON.stringify(listed)}, not its ops/take-build-output.mjs PATH_SETS entry`);
  }
  return out;
}

// A write job: no install, build or gate; only listed actions and scripts, called plainly; only listed env
// variables, and the token only on the listed steps; reviewed run bodies; the listed order.
export function writeProblems(job, where, policy) {
  const out = [];
  const steps = job.steps ?? [];
  if (policy.needs && ![].concat(job.needs ?? []).includes(policy.needs)) out.push(`${where}: does not need the ${policy.needs} job, so it could run before the gates`);
  for (const k of ['env', 'defaults', 'container', 'services']) if (job[k] !== undefined) out.push(`${where}: sets job-level \`${k}\`, which reaches every step that holds the write token`);
  steps.forEach((step, i) => {
    const at = `${where} ${stepName(step, i)}`;
    const run = runOf(step);
    const uses = String(step.uses ?? '');
    if (uses && !policy.actions.some((p) => uses.startsWith(p))) out.push(`${at}: uses ${uses.split('@')[0]}; this write job may use only ${policy.actions.map((p) => p.slice(0, -1)).join(', ')}`);
    if (uses.startsWith('actions/download-artifact@') && !/^\$\{\{\s*runner\.temp\s*\}\}\//.test(String(step.with?.path ?? ''))) out.push(`${at}: downloads the artifact inside the checkout, where it could replace a script this job runs; use \${{ runner.temp }}/…`);
    if (step.shell !== undefined) out.push(`${at}: sets \`shell\`, which decides what runs the step`);
    if (UNTRUSTED.test(run)) out.push(`${at}: installs, builds or runs gates in a job that holds a write token`);
    if (OTHER_RUNNER.test(run)) out.push(`${at}: runs an interpreter or script other than the listed node scripts`);
    for (const s of nodeScripts(run)) if (!policy.scripts.includes(s)) out.push(`${at}: runs \`node ${s}\`, which is not one of this write job's scripts`);
    if (LOADER.test(run)) out.push(`${at}: names a loader or environment channel (${run.match(LOADER)[0].trim()}) in its run text`);
    if (/\$\{\{/.test(String(step.run ?? ''))) out.push(`${at}: puts a \`\${{ }}\` expression into its run text`);
    for (const k of Object.keys(step.env ?? {})) if (!policy.env.includes(k)) out.push(`${at}: sets env ${k}; this write job's steps may set only ${policy.env.join(', ')}`);
    const src = tokenSource(step);
    if (src && !policy.tokenSteps.includes(String(step.name ?? ''))) out.push(`${at}: receives the token (${src}) but is not one of the steps allowed it (${policy.tokenSteps.join('; ')})`);
    if (CONFIG_WRITE.test(run)) out.push(`${at}: writes a credential into the Git config`);
  });
  if (tokenIn(job.env)) out.push(`${where}: a token is in the job env, so every step sees it`);
  out.push(...runBodyProblems(steps, where, policy.runs));
  if (policy.order) out.push(...orderProblems(steps, where, policy.order));
  return out;
}

// FR-D.5 within a write job: apply, the briefs guard where there is one, push, sync, in that order, the
// sync with the token, and no push after the sync. The gates come before all of it through `needs`.
export function orderProblems(steps, where, { apply = 'ops/take-build-output.mjs', guard = 'ops/briefs-guard.mjs', sync = SYNC, label = 'dashboard sync' } = {}) {
  const out = [];
  const first = (test) => steps.findIndex((s) => test(runOf(s)));
  const take = first((r) => nodeScripts(r).includes(apply));
  const guarded = guard ? first((r) => nodeScripts(r).includes(guard)) : -1;
  const synced = first((r) => r.includes(sync));
  const pushes = steps.map((s, i) => (PUSH.test(runOf(s)) ? i : -1)).filter((i) => i >= 0);
  if (take < 0) out.push(`${where}: never applies the artifact with ${apply}`);
  if (guard && guarded < 0) out.push(`${where}: never runs ${guard}`);
  if (guard && take >= 0 && guarded >= 0 && guarded < take) out.push(`${where}: runs the briefs guard before applying the artifact`);
  if (pushes.length === 0) out.push(`${where}: never pushes`);
  else if (guard && guarded >= 0 && pushes[0] < guarded) out.push(`${where}: pushes before the briefs guard`);
  else if (take >= 0 && pushes[0] < take) out.push(`${where}: pushes before applying the artifact`);
  if (synced < 0) out.push(`${where}: no step runs \`${sync}\``);
  else {
    if (pushes.length === 0 || synced < pushes[0]) out.push(`${where}: the ${label} does not come after the push`);
    for (const p of pushes) if (p > synced) out.push(`${where}: a git push (step ${p + 1}) follows the ${label}`);
    if (!tokenIn(steps[synced].env)) out.push(`${where}: the ${label} step has no token in its env`);
  }
  return out;
}

// Problems with one parsed workflow, by its repository path; `policy` defaults to its POLICIES entry.
export function writeJobProblems(wf, file, policy = POLICIES[file] ?? null, secretJobs = SECRET_JOBS[file] ?? {}) {
  const out = [];
  if (!wf || typeof wf !== 'object' || !wf.jobs || typeof wf.jobs !== 'object') return [`${file}: no jobs`];
  for (const p of notReadOnly(wf.permissions)) out.push(`${file}: the workflow-level permission \`${p}\` reaches every job that names none`);
  const wfSecrets = secretNames([wf.env, wf.defaults]).filter((n) => n !== 'GITHUB_TOKEN');
  if (wfSecrets.length) out.push(`${file}: names ${wfSecrets.map((n) => `secrets.${n}`).join(', ')} at workflow level, where every job sees it`);
  for (const id of Object.keys(secretJobs)) if (!Object.hasOwn(wf.jobs, id)) out.push(`${file}: has no \`${id}\` job for its SECRET_JOBS entry`);
  const write = policy?.write ?? {};
  if (policy) {
    if (wf.env !== undefined) out.push(`${file}: sets a workflow-level \`env\`, which reaches the write job`);
    if (wf.defaults !== undefined) out.push(`${file}: sets workflow-level \`defaults\`, which reach the write job`);
    for (const need of [policy.build?.job, ...Object.keys(write)].filter(Boolean)) if (!Object.hasOwn(wf.jobs, need)) out.push(`${file}: has no \`${need}\` job`);
  }
  for (const [id, job] of Object.entries(wf.jobs)) {
    const where = `${file} job ${id}`;
    out.push(...pinProblems(job, where));
    if (job.permissions == null && wf.permissions == null) out.push(`${where}: neither the job nor the workflow names permissions, so it gets the repository's default token permissions`);
    const isWrite = Object.hasOwn(write, id);
    if (!isWrite) for (const p of notReadOnly(job.permissions ?? wf.permissions)) out.push(`${where}: holds the permission \`${p}\`; only a write job listed in ops/write-job.mjs POLICIES may hold anything but read or none`);
    out.push(...secretProblems(job, where, secretJobs[id] ?? null));
    out.push(...checkoutProblems(job, where));
    if (hasIdToken(job.permissions)) out.push(`${where}: holds \`id-token: write\` (or write-all), which can mint OIDC tokens for other services; nothing here needs it`);
    if (policy?.mainOnly && guardOf(job.if) !== MAIN_GUARD) out.push(`${where}: lacks \`if: ${MAIN_GUARD}\``);
    if (policy && !isWrite && tokenIn(job.env)) out.push(`${where}: a token is in the job env`);
    if (policy?.build?.job === id) out.push(...buildProblems(job, where, PATH_SETS[policy.build.set]));
    if (isWrite) out.push(...writeProblems(job, where, write[id]));
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
// Problems in the import graph of the scripts write jobs run: package imports, missing files, non-literal
// imports.
export function dependencyProblems(root = ROOT, scripts = WRITE_SCRIPTS) {
  const out = [];
  const seen = new Set();
  const visit = (rel) => {
    if (seen.has(rel)) return;
    seen.add(rel);
    const abs = join(root, rel);
    if (!existsSync(abs)) { out.push(`${rel}: imported by a write-job script but missing`); return; }
    for (const spec of importSpecifiers(readFileSync(abs, 'utf8'))) {
      if (spec === null) out.push(`${rel}: a non-literal import() or require(), which could load anything`);
      else if (spec.startsWith('node:') || BUILTINS.has(spec)) continue;
      else if (spec.startsWith('./') || spec.startsWith('../')) {
        const next = relative(root, resolve(dirname(abs), spec)).split('\\').join('/');
        if (next.startsWith('..')) out.push(`${rel}: imports ${spec}, outside the repository`);
        else visit(next);
      } else out.push(`${rel}: imports the package \`${spec}\`; a write job installs nothing`);
    }
  };
  for (const s of scripts) visit(s);
  return { files: seen.size, problems: out };
}

// Every workflow under .github/workflows, checked; plus the dependency walk of every write-job script.
// A POLICIES entry whose workflow file is gone is a problem too, so a rename cannot drop a policy silently.
export function checkWorkflows(root = ROOT) {
  const dir = join(root, WORKFLOWS);
  const files = readdirSync(dir).filter((f) => /\.ya?ml$/.test(f)).sort().map((f) => `${WORKFLOWS}/${f}`);
  const problems = [];
  for (const file of files) problems.push(...writeJobProblems(parseYaml(readFileSync(join(root, file), 'utf8')), file));
  for (const file of Object.keys(POLICIES)) if (!files.includes(file)) problems.push(`${file}: has a POLICIES entry but no workflow file`);
  const deps = dependencyProblems(root);
  const writeJobs = Object.values(POLICIES).reduce((n, p) => n + Object.keys(p.write).length, 0);
  return { problems: [...problems, ...deps.problems], workflows: files.length, writeJobs, files: deps.files };
}

function main() {
  let r;
  try { r = checkWorkflows(); } catch (e) { console.log(`WRITE_JOB_ERROR ${e.message}`); return 2; }
  if (r.problems.length === 0) { console.log(`WRITE_JOB_OK workflows=${r.workflows} write_jobs=${r.writeJobs} script_files=${r.files}`); return 0; }
  console.log(`WRITE_JOB_BAD problems=${r.problems.length}`);
  for (const p of r.problems) console.log(`  ${p}`);
  return 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exit(main());
