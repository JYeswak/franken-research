#!/usr/bin/env node
// Offline, historical CI evidence extraction. No network, dispatch, or re-check resolution.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { loadReference, factsFor } from '../watch/freshness/facts.mjs';
import { classifyCi, summarizeWorkflow, triggersDefault } from '../watch/freshness/classify.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const sha256 = (s) => createHash('sha256').update(s).digest('hex');
const blobHash = (s) => createHash('sha1').update(`blob ${Buffer.byteLength(s)}\0`).update(s).digest('hex');
const fail = (message) => { throw new Error(message); };

export function buildCiPacket(reference, { repo, point = 'recheck' } = {}) {
  const record = reference.records?.[repo];
  if (!record) fail(`Repository is not recorded: ${repo}`);
  // The record's "ci" is selected using HEAD semantics and is not an independent re-check.
  if (['pin', 'now', 'ci'].includes(point)) fail('Choose an explicitly recorded historical point (for example recheck), not pin/now/ci');
  if (!reference.recorded_at || !reference.git_ref || !record.default_branch) fail('Missing recording provenance or default branch');
  const baseline = record.points?.pin;
  const target = record.points?.[point];
  const summaries = {};
  const sources = {};
  for (const [label, p] of [['pin', baseline], [point, target]]) {
    if (!p || !/^[a-f0-9]{40}$/.test(p.sha ?? '') || !p.date || !Array.isArray(p.workflows)) fail(`Missing or invalid point: ${label}`);
    if (!p.runs?.complete || !Array.isArray(p.runs.list) || p.runs.total !== p.runs.list.length) fail(`Incomplete run evidence: ${label}`);
    for (const run of p.runs.list) {
      if (!run || typeof run.path !== 'string' || typeof run.name !== 'string'
          || typeof run.event !== 'string' || typeof run.status !== 'string'
          || !(run.conclusion === null || typeof run.conclusion === 'string'))
        fail(`Malformed run evidence: ${label}`);
    }
    const paths = new Set();
    for (const w of p.workflows) {
      if (!/^\.github\/workflows\/[^/]+\.ya?ml$/.test(w.path ?? '') || paths.has(w.path)) fail(`Invalid or duplicate workflow path: ${label}`);
      paths.add(w.path);
      const text = reference.texts?.[w.blob];
      if (typeof text !== 'string') fail(`Missing source blob: ${w.blob}`);
      if (blobHash(text) !== w.blob) fail(`Source blob hash mismatch: ${w.blob}`);
      sources[w.blob] = { git_blob_sha1: w.blob, text };
      summaries[w.blob] = summarizeWorkflow(text);
    }
  }
  if (baseline.sha !== record.pin) fail('Baseline point does not match recorded pin');
  if (target.date < baseline.date) fail('Target point predates baseline');
  // Deliberately no "ci" point: classify the exact re-check commit, never the recording HEAD.
  const facts = factsFor(record, summaries, { checkedAt: reference.recorded_at, pointMap: { pin: 'pin', now: point } });
  const describe = (p, factPoint) => ({
    sha: p.sha, date: p.date, run_commit: p.sha,
    classification: classifyCi(facts, factPoint),
    workflow_count: p.workflows.length,
    workflows: p.workflows.map((w) => ({ ...w, summary: summaries[w.blob],
      triggers_default_from_source: triggersDefault(summaries[w.blob], record.default_branch),
      source_url: `https://github.com/Dicklesworthstone/${encodeURIComponent(record.name ?? repo)}/blob/${p.sha}/${w.path}` })),
    runs: p.runs,
  });
  const before = describe(baseline, 'pin');
  const after = describe(target, 'now');
  // Classifier now uses workflow registration state as observed; historical checks must not
  // borrow later disabled states. Reject that dependency instead of silently dating it backward.
  for (const [path, state] of Object.entries(record.workflow_states ?? {})) {
    if (/^disabled/.test(state.state ?? '') && (!state.since || state.since > target.date))
      fail(`Workflow state is newer than historical target: ${path}`);
  }
  return {
    schema: 'fr.ci-evidence-packet/v1', repo,
    scope: 'Historical CI-only evidence; not a complete re-check, current upstream assessment, reviewer acceptance, or crossing resolution.',
    source: { recorded_at: reference.recorded_at, recording_git_ref: reference.git_ref,
      recorded_head: record.head, recorded_ci: record.points?.ci?.sha ?? null, target_point: point,
      record_sha256: sha256(JSON.stringify(record)), source_blobs_verified: Object.keys(sources).length,
      integrity_limit: 'Blob hashes verify source bytes. Recorded API facts and tree membership are trusted fixture data, not independently authenticated by these hashes.' },
    baseline: before, target: after, workflow_states: record.workflow_states ?? null, sources,
    next_action: `Independently inspect the pinned workflow sources and recorded run evidence; accept or reject CI ${before.classification.value} → ${after.classification.value} at ${target.sha}. Verify test versus patch/deploy classification, triggers, and run exclusions. Do not infer product correctness or other matrix cells.`,
    limitations: ['No upstream fetch or code execution.', 'No run logs or job lists are present in this fixture.', 'Other matrix cells and human effort are unmeasured.'],
  };
}

const escape = (s) => String(s).replace(/[|\n\r]/g, ' ').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export function renderMarkdown(packet) {
  const a = packet.baseline, b = packet.target;
  const lines = [`# ${escape(packet.repo)}: historical CI evidence`, '', packet.scope, '',
    `Recorded: ${packet.source.recorded_at}. Target point: ${packet.source.target_point}.`, '',
    '| Point | Commit | CI | Rule | Workflow files | Recorded runs |', '|---|---|---|---|---:|---:|',
    ...[['Baseline', a], ['Target', b]].map(([label, p]) => `| ${label} | ${p.sha} | ${p.classification.value} | ${p.classification.rule} | ${p.workflow_count} | ${p.runs.total} |`), '',
    `Recording HEAD: ${packet.source.recorded_head}; selected recording CI: ${packet.source.recorded_ci ?? 'none'}. Neither substitutes for the target.`, '',
    `Verified ${packet.source.source_blobs_verified} unique workflow blob identities. ${packet.source.integrity_limit}`, '',
    '## Target workflow evidence', '', '| Path | Kind | Events | Default-branch trigger from source | Blob |', '|---|---|---|---|---|',
    ...b.workflows.map(w => `| [${escape(w.path)}](${w.source_url}) | ${escape(w.summary.kind ?? 'parse error')} | ${escape((w.summary.events ?? []).join(', '))} | ${w.triggers_default_from_source} | ${w.blob} |`), '',
    '## Review action', '', packet.next_action, '', '## Limits', '', ...packet.limitations.map(x => `- ${x}`), '',
    'The JSON form embeds every baseline and target workflow source and all recorded runs for offline inspection.', ''];
  return lines.join('\n');
}

function main(args) {
  const options = { repo: 'frankengit', point: 'recheck', format: 'json' };
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace(/^--/, '');
    if (!['repo', 'point', 'format'].includes(key) || args[i] !== `--${key}` || !args[i + 1]) fail('Usage: node scripts/ci-evidence-packet.mjs [--repo frankengit] [--point recheck] [--format json|markdown]');
    options[key] = args[i + 1];
  }
  if (!['json', 'markdown'].includes(options.format)) fail('Format must be json or markdown');
  const start = performance.now();
  const reference = loadReference();
  const packet = buildCiPacket(reference, options);
  packet.source.classifier_sha256 = sha256(readFileSync(join(ROOT, 'watch/freshness/classify.mjs')));
  process.stdout.write(options.format === 'markdown' ? renderMarkdown(packet) : JSON.stringify(packet, null, 2) + '\n');
  process.stderr.write(JSON.stringify({ scope: 'single offline component execution, not human productivity or a speedup ratio', elapsed_ms: performance.now() - start, network_requests: 0, paid_api_requests: 0 }) + '\n');
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { main(process.argv.slice(2)); } catch (error) { console.error(`ci-evidence: ${error.message}`); process.exitCode = 2; }
}
