// watch/freshness/classify.mjs: the freshness classifier (watch/freshness/SPEC.md FR-C).
//
// classify(facts, point) turns recorded facts into the master-matrix classes CI (C1-C6), release
// (R1-R3) and license (Rider, plain MIT, none, other:...). It is pure: no network, no clock, no file
// reads. For `now`, CI is read at the CI point the facts carry (FR-C.3: the newest default-branch
// commit with settled push runs, chosen by settledCommit below when the facts are gathered).
// The facts shape is built by watch/freshness/facts.mjs (factsFor); the workflow and license
// summaries it carries come from summarizeWorkflow and summarizeLicense below, applied to the blob
// text once and cached by blob id.
//
// Node 22 built-ins only.

import { parseYaml } from './yaml.mjs';

const OWNER = 'Dicklesworthstone';
const gh = (repo, rest = '') => `https://github.com/${OWNER}/${repo}${rest}`;
const api = (path) => `https://api.github.com${path}`;
export const TIER = { external: '[External, High]', code: '[Code-verified, High]' };

// ---------------------------------------------------------------- FR-C.7: what a workflow does
// A step "tests" when its shell command runs a test runner, a linter or type checker, or a
// repository check script, or when it uses an action whose job is one of those. A job "deploys"
// when a step publishes the site or a build (Pages, Cloudflare, Vercel, Netlify, gh-pages) or the
// job targets the github-pages environment. Tests win over deploys: a workflow that tests and then
// publishes is a test workflow. Release builds (compile and upload) are neither: kind `other`.
const TEST_COMMAND = new RegExp([
  String.raw`\bcargo\s+(?:\+\S+\s+)?(?:test|nextest|clippy|check|miri|fuzz|llvm-cov|tarpaulin|hack|deny|audit|semver-checks)\b`,
  String.raw`\bcargo\s+(?:\+\S+\s+)?fmt\b[^\n]*--check`,
  String.raw`\bcargo-nextest\b`,
  String.raw`\b(?:py\.test|pytest|tox|nox|mypy|ruff|pyright|shellcheck|ctest|vitest|jest|mocha)\b`,
  String.raw`\bpython3?\s+-m\s+(?:pytest|unittest|mypy)\b`,
  String.raw`\bgo\s+(?:test|vet)\b`,
  String.raw`\b(?:npm|pnpm|yarn|bun)\s+(?:run\s+)?(?:test|lint|check|typecheck|verify)\b`,
  String.raw`\b(?:npx|bunx|pnpx)\s+(?:vitest|jest|playwright|tsc|eslint|biome)\b`,
  String.raw`\bplaywright\s+test\b`,
  String.raw`\b(?:make|just)\s+(?:test|check|verify|ci|lint)\b`,
  String.raw`\blake\s+(?:build|test|exe\s+\S*test)\b`,
  String.raw`(?:^|[\s;&|(])(?:\.\/|bash\s+|sh\s+)?[\w./-]*(?:test|check|verify|qualif|gate|conformance|lint)[\w.-]*\.(?:sh|py|mjs|js|ts)\b`,
].join('|'), 'i');
const TEST_ACTION = /^(?:actions-rs\/clippy-check|EmbarkStudios\/cargo-deny-action|rustsec\/audit-check|taiki-e\/cargo-llvm-cov|codecov\/codecov-action|golangci\/golangci-lint-action|pre-commit\/action|ludeeus\/action-shellcheck)@/i;
const DEPLOY_ACTION = /^(?:actions\/deploy-pages|actions\/upload-pages-artifact|peaceiris\/actions-gh-pages|JamesIves\/github-pages-deploy-action|cloudflare\/(?:wrangler-action|pages-action)|amondnet\/vercel-action|nwtgck\/actions-netlify|netlify\/actions\/[\w-]+)@/i;
const DEPLOY_COMMAND = /\b(?:wrangler\s+(?:pages\s+)?deploy|vercel\s+(?:deploy|--prod)|netlify\s+deploy|firebase\s+deploy|gh-pages\s+-d)\b/i;
// actions-rs/cargo@v1 with `command: test` (and similar) runs cargo through an action.
const CARGO_ACTION_TEST = (step) => /^actions-rs\/cargo@/i.test(String(step?.uses ?? '')) && /^(?:test|clippy|check|nextest|fmt)$/i.test(String(step?.with?.command ?? ''));

const asList = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
const jobsOf = (doc) => (doc?.jobs && typeof doc.jobs === 'object' && !Array.isArray(doc.jobs) ? Object.values(doc.jobs) : []);
const stepsOf = (job) => asList(job?.steps).filter((s) => s && typeof s === 'object');

export function stepTests(step) {
  return TEST_COMMAND.test(String(step.run ?? '')) || TEST_ACTION.test(String(step.uses ?? '')) || CARGO_ACTION_TEST(step);
}
export function stepDeploys(step) {
  return DEPLOY_ACTION.test(String(step.uses ?? '')) || DEPLOY_COMMAND.test(String(step.run ?? ''));
}
const jobDeploys = (job) => {
  const env = typeof job?.environment === 'object' ? job.environment?.name : job?.environment;
  return String(env ?? '') === 'github-pages' || stepsOf(job).some(stepDeploys);
};

// The single decision rule for FR-C.7: 'test' | 'deploy' | 'other', from jobs, steps and uses.
export function workflowKind(doc) {
  const jobs = jobsOf(doc);
  if (jobs.some((j) => stepsOf(j).some(stepTests))) return 'test';
  if (jobs.some(jobDeploys)) return 'deploy';
  return 'other';
}

// ---------------------------------------------------------------- triggers
// GitHub's filter patterns: `*` any run of characters except `/`, `**` any run, `?` and `+` a
// quantifier on the previous character, `[...]` a class, a leading `!` negates (patterns apply in
// order, the last match wins).
function globRegex(pat) {
  let re = '';
  for (let i = 0; i < pat.length; i++) {
    const c = pat[i];
    if (c === '*') { if (pat[i + 1] === '*') { re += '.*'; i++; } else re += '[^/]*'; }
    else if (c === '?' || c === '+') re += c;
    else if (c === '[') { const j = pat.indexOf(']', i); if (j < 0) re += '\\['; else { re += pat.slice(i, j + 1); i = j; } }
    else re += c.replace(/[.^${}()|\\]/g, '\\$&');
  }
  return new RegExp(`^${re}$`);
}
export function filterMatches(patterns, name) {
  let hit = false;
  for (const raw of asList(patterns).map(String)) {
    const neg = raw.startsWith('!');
    if (globRegex(neg ? raw.slice(1) : raw).test(name)) hit = !neg;
  }
  return hit;
}

// The events a workflow listens to: `on:` as a string, a list, or a map of event -> filter.
export function eventsOf(doc) {
  const on = doc?.on;
  if (typeof on === 'string') return { [on]: null };
  if (Array.isArray(on)) return Object.fromEntries(on.map((e) => [String(e), null]));
  if (on && typeof on === 'object') return { ...on };
  return {};
}

// Does a push (or pull_request, whose branch filter is the base branch) to `branch` start it?
export function branchTriggers(filter, branch, { tagsOnlyBlocks }) {
  if (filter == null || typeof filter !== 'object') return true;
  if (filter.branches != null) return filterMatches(filter.branches, branch);
  if (filter['branches-ignore'] != null) return !filterMatches(filter['branches-ignore'], branch);
  if (tagsOnlyBlocks && (filter.tags != null || filter['tags-ignore'] != null)) return false;
  return true;
}

// A parsed workflow file reduced to what FR-C needs. Kept small because it is cached by blob id.
export function summarizeWorkflow(text) {
  let doc;
  try { doc = parseYaml(text); } catch (e) { return { ok: false, error: String(e.message).slice(0, 160) }; }
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) return { ok: false, error: 'not a mapping' };
  const ev = eventsOf(doc);
  const pick = (f) => (f && typeof f === 'object' ? Object.fromEntries(['branches', 'branches-ignore', 'tags', 'tags-ignore'].filter((k) => f[k] != null).map((k) => [k, asList(f[k]).map(String)])) : null);
  const runsOn = jobsOf(doc).map((j) => j?.['runs-on']).filter((r) => r != null);
  const labels = (r) => (typeof r === 'object' && !Array.isArray(r) ? asList(r.labels) : asList(r)).map(String);
  return {
    ok: true,
    kind: workflowKind(doc),
    push: 'push' in ev ? pick(ev.push) ?? {} : null,
    pull_request: 'pull_request' in ev ? pick(ev.pull_request) ?? {} : null,
    events: Object.keys(ev).sort(),
    self_hosted: runsOn.length > 0 && runsOn.every((r) => labels(r).includes('self-hosted')),
  };
}

export function triggersDefault(summary, branch) {
  if (!summary?.ok) return false;
  return (summary.push != null && branchTriggers(summary.push, branch, { tagsOnlyBlocks: true }))
    || (summary.pull_request != null && branchTriggers(summary.pull_request, branch, { tagsOnlyBlocks: false }));
}

// ---------------------------------------------------------------- FR-C.5: license text summary
const RIDER = (t) => /OpenAI/.test(t) && /Anthropic/.test(t) && /\b(?:rider|restricted part(?:y|ies))\b/i.test(t);
const MIT = (t) => /^\s*MIT License/i.test(t) || /Permission is hereby granted, free of charge, to any person obtaining a copy/i.test(t.replace(/\s+/g, ' '));
export function summarizeLicense(text) {
  const first = (String(text).split('\n').find((l) => l.trim() !== '') ?? '').trim().slice(0, 120);
  return { first_line: first, rider: RIDER(text), mit: MIT(text) };
}

// ---------------------------------------------------------------- results
const result = (value, rule, tier, evidence) => ({ value, rule, tier, evidence: [...new Set(evidence)] });
const unknown = (rule, evidence = []) => result('unknown', rule, null, evidence);

// ---------------------------------------------------------------- FR-C.2, FR-C.3: CI class
const RED = new Set(['failure', 'timed_out', 'startup_failure']);
const PENDING = new Set(['queued', 'in_progress', 'waiting', 'pending', 'requested']);
const TEST_EVENTS = new Set(['push', 'pull_request']);
// FR-C.3: for `now`, the run rules read the newest default-branch commit whose push-triggered test
// runs have all completed, found in one page of the default branch's push runs. The API lists runs
// newest first, so commits are taken in the order they first appear (a commit's author timestamp
// is not a push order: an old commit pushed again carries its old date). Runs carry `sha`. The
// oldest commit on a page that does not hold every run may have runs cut off, so it qualifies only
// when the page is complete. `isTest(path)` says which workflow paths run tests (as HEAD's files
// define them). Returns { sha, runs } or null when no commit qualifies.
export function settledCommit(page, isTest) {
  if (!page?.list?.length) return null;
  const bySha = new Map();
  for (const r of page.list) {
    if (!bySha.has(r.sha)) bySha.set(r.sha, { sha: r.sha, runs: [] });
    bySha.get(r.sha).runs.push(r);
  }
  const commits = [...bySha.values()];
  const usable = page.complete ? commits : commits.slice(0, -1);
  const settled = (c) => c.runs.filter((r) => r.event === 'push' && isTest(runPath(r))).every((r) => r.status === 'completed');
  const hit = usable.find(settled);
  return hit ? { sha: hit.sha, runs: hit.runs } : null;
}
// GitHub records a workflow file it cannot parse as a run named after the file path, with no jobs.
export const unparsedRun = (r) => r.name === r.path;
const runPath = (r) => String(r.path ?? '').replace(/@.*$/, '');

function ciEvidence(facts, p) {
  return [gh(facts.repo, `/tree/${p.sha}/.github/workflows`), api(`/repos/${OWNER}/${facts.repo}/actions/runs?head_sha=${p.sha}`)];
}

// C6: the packet states the tests run privately (private-ci.tsv), or every test workflow runs on
// self-hosted runners and every run on the commit `r` (the run point) sits on one or is queued or
// cancelled.
function ruleC6(facts, f, tests, r) {
  if (facts.private_ci) return result('C6', 'FR-C.2/C6-private', facts.private_ci.tier ?? TIER.code, [facts.private_ci.source_url]);
  if (!tests.length || !tests.every((w) => w.summary.self_hosted) || !r.runs?.complete) return null;
  const byPath = new Map((r.workflows ?? []).map((w) => [w.path, w]));
  const hidden = (x) => PENDING.has(x.status) || x.conclusion === 'cancelled' || byPath.get(runPath(x))?.summary?.self_hosted === true;
  return r.runs.list.every(hidden) ? result('C6', 'FR-C.2/C6-self-hosted', TIER.external, ciEvidence(facts, r)) : null;
}

// A registered workflow's state applies to `now` as observed. To an earlier point it applies only
// when GitHub last changed the workflow (`since`) on or before that commit's date; otherwise the
// state at that point is not known (null).
export function stateAt(facts, point, p, path) {
  const s = facts.workflow_states?.[path];
  if (!s) return null;
  if (point === 'now') return s.state;
  return s.since && p.date && s.since <= p.date ? s.state : null;
}
const disabledAt = (facts, point, p, path) => /^disabled/.test(stateAt(facts, point, p, path) ?? '');

// C5: test workflow files exist but none starts on a push or pull request to the default branch (a
// workflow disabled at the point starts on nothing), or the workflow files the pin had are all gone.
function ruleC5(facts, point, p, tests) {
  const ev = ciEvidence(facts, p);
  const starts = (w) => triggersDefault(w.summary, facts.default_branch) && !disabledAt(facts, point, p, w.path);
  if (tests.length && !tests.some(starts)) {
    const byState = tests.some((w) => triggersDefault(w.summary, facts.default_branch));
    return byState
      ? result('C5', 'FR-C.2/C5-disabled', TIER.external, [...ev, api(`/repos/${OWNER}/${facts.repo}/actions/workflows`)])
      : result('C5', 'FR-C.2/C5-no-push-trigger', TIER.code, ev);
  }
  const pinFiles = facts.points.pin?.workflows?.length ?? 0;
  if (point !== 'pin' && pinFiles > 0 && p.workflows.length === 0) return result('C5', 'FR-C.2/C5-deleted', TIER.code, ev);
  return null;
}

// Where CI is read. The file rules (C6 private, C5, C4) always read the point's own files: for
// `now`, HEAD's. The run rules read the run point: for `now` with a CI point recorded (FR-C.3),
// that commit, but only when it is not older than the baseline commit (a commit before the verdict
// cannot describe what changed since); otherwise HEAD's files with no runs, marked unsettled.
function ciPoints(facts, point) {
  const pts = facts.points ?? {};
  if (point !== 'now' || !('ci' in pts)) return { files: pts[point], runsAt: pts[point] };
  const base = pts.baseline ?? pts.pin;
  const fresh = pts.ci && !(base?.date && pts.ci.date && pts.ci.date < base.date) ? pts.ci : null;
  return { files: pts.now, runsAt: fresh ?? (pts.now ? { ...pts.now, runs: null, unsettled: true } : null) };
}
const testsOf = (p) => (p?.workflows ?? []).filter((w) => w.summary?.ok && w.summary.kind === 'test');

// C2, C1 and C3 read the completed push and pull_request runs of test workflows on the commit. Only
// success and the red conclusions are verdicts; cancelled, skipped or neutral give none.
export function classifyCi(facts, point) {
  const { files: f, runsAt: p } = ciPoints(facts, point);
  if (!f?.sha || !Array.isArray(f.workflows)) return unknown('FR-C.3/api-gap');
  const fileTests = testsOf(f);
  const c6 = ruleC6(facts, f, fileTests, p);
  if (c6) return c6;
  const c5 = ruleC5(facts, point, f, fileTests);
  if (c5) return c5;
  if (!fileTests.length) return result('C4', 'FR-C.2/C4', TIER.code, ciEvidence(facts, f));
  if (p.unsettled) return unknown('FR-C.3/no-settled-commit', [api(`/repos/${OWNER}/${facts.repo}/actions/runs?branch=${facts.default_branch}&event=push`)]);
  if (!Array.isArray(p.workflows) || !p.runs?.complete) return unknown('FR-C.3/api-gap', ciEvidence(facts, p));
  const testPaths = new Set(testsOf(p).map((w) => w.path));
  const runs = p.runs.list.filter((r) => testPaths.has(runPath(r)) && TEST_EVENTS.has(r.event) && !unparsedRun(r));
  if (runs.some((r) => r.status !== 'completed')) return unknown('FR-C.3/in-progress', ciEvidence(facts, p));
  if (runs.some((r) => RED.has(r.conclusion))) return result('C2', 'FR-C.2/C2', TIER.external, ciEvidence(facts, p));
  if (runs.some((r) => r.conclusion === 'success')) return result('C1', 'FR-C.2/C1', TIER.external, ciEvidence(facts, p));
  // C5 did not hold, so an enabled test workflow starts on push or pull request.
  return result('C3', 'FR-C.2/C3', TIER.external, ciEvidence(facts, p));
}
// The commit a known CI class at `point` describes (live.json dims.ci.now_commit for `now`): the
// point's own commit when its files decided (C6 by packet, C5, C4), else the run point; null when
// the class is unknown.
export function ciCommit(facts, point, cls) {
  if (cls.value === 'unknown') return null;
  const { files, runsAt } = ciPoints(facts, point);
  return (/^FR-C\.2\/(C6-private|C5|C4)/.test(cls.rule) ? files : runsAt)?.sha ?? null;
}

// ---------------------------------------------------------------- FR-C.4: release class
// Tags count at a point when their date is on or before the point's commit date: the tagger date of
// an annotated tag, else the date of the commit it names (so a lightweight tag created later on an
// old commit counts from that commit's date: a known limit, watch/README.md). A non-draft release
// counts only when its tag counts; its publish date is not used.
const tagDate = (facts, tag) => facts.tags.find((t) => t.name === tag)?.date ?? null;
export function classifyRel(facts, point) {
  const p = facts.points?.[point];
  if (!p?.date || !Array.isArray(facts.releases) || !Array.isArray(facts.tags)) return unknown('FR-C.4/api-gap');
  const ev = [gh(facts.repo, '/releases'), gh(facts.repo, '/tags')];
  const onTime = (d) => d != null && d <= p.date;
  const rels = facts.releases.filter((r) => !r.draft && onTime(tagDate(facts, r.tag)));
  const tags = facts.tags.filter((t) => onTime(t.date));
  if (!rels.length && !tags.length) return result('R1', 'FR-C.4/R1', TIER.external, ev);
  if (rels.some((r) => r.assets == null)) return unknown('FR-C.4/api-gap', ev);
  const hit = rels.find((r) => r.target === p.sha) ?? rels.find((r) => r.assets > 0);
  if (hit) return result('R3', hit.target === p.sha ? 'FR-C.4/R3-targets-point' : 'FR-C.4/R3-asset', TIER.external, [gh(facts.repo, `/releases/tag/${encodeURIComponent(hit.tag)}`), ...ev]);
  return result('R2', 'FR-C.4/R2', TIER.external, ev);
}

// ---------------------------------------------------------------- FR-C.5: license class
export function classifyLicense(facts, point) {
  const p = facts.points?.[point];
  if (!p?.sha || !Array.isArray(p.licenses)) return unknown('FR-C.5/api-gap');
  const ev = p.licenses.map((l) => gh(facts.repo, `/blob/${p.sha}/${encodeURIComponent(l.name)}`));
  if (!p.licenses.length) return result('none', 'FR-C.5/none', TIER.code, [gh(facts.repo, `/tree/${p.sha}`)]);
  if (p.licenses.some((l) => l.summary == null)) return unknown('FR-C.5/api-gap', ev);
  if (p.licenses.some((l) => l.summary.rider)) return result('Rider', 'FR-C.5/Rider', TIER.code, ev);
  if (p.licenses.every((l) => l.summary.mit)) return result('plain MIT', 'FR-C.5/plain-MIT', TIER.code, ev);
  return result(`other:${p.licenses[0].summary.first_line || p.licenses[0].name}`, 'FR-C.5/other', TIER.code, ev);
}

// ---------------------------------------------------------------- FR-C.1
export const DIMS = ['ci', 'rel', 'license'];
export function classify(facts, point) {
  return { ci: classifyCi(facts, point), rel: classifyRel(facts, point), license: classifyLicense(facts, point) };
}
