import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { classifyCi, summarizeWorkflow, triggersDefault } from '../../../../watch/freshness/classify.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const read = file => JSON.parse(readFileSync(join(here, file), 'utf8')).response;
const pin = read('snowPin-tree.json'), head = read('snowHead-tree.json');
const pinRuns = read('pin-runs.json'), headRuns = read('head-runs.json');
const metadata = read('metadata.json');
const paths = tree => tree.tree.filter(x => /^\.github\/workflows\/[^/]+\.ya?ml$/.test(x.path));
if (pin.truncated || head.truncated) throw new Error('incomplete tree cannot prove absence');
if (pinRuns.total_count !== pinRuns.workflow_runs.length || headRuns.total_count !== headRuns.workflow_runs.length) throw new Error('incomplete run collection');
if (!process.argv[2]) {
  if (paths(pin).length !== 1 || paths(head).length !== 0) throw new Error('workflow removal proof mismatch');
  console.log(JSON.stringify({scope: 'complete tree membership only; baseline classification needs independently obtained workflow source', baseline_workflows: paths(pin).map(x => x.path), target_workflows: [], verdict: 'workflow files removed'}));
  process.exit(0);
}
const text = readFileSync(process.argv[2]);
const blobSha = createHash('sha1').update(Buffer.from(`blob ${text.length}\0`)).update(text).digest('hex');
if (paths(pin).length !== 1 || paths(pin)[0].sha !== blobSha || paths(head).length !== 0) throw new Error('source proof mismatch');
const summary = summarizeWorkflow(text.toString());
const facts = {
  repo: 'franken_snowflake', default_branch: metadata.default_branch,
  points: {
    pin: { sha: pin.sha, workflows: [{ path: paths(pin)[0].path, summary }], runs: { complete: true, list: pinRuns.workflow_runs } },
    now: { sha: head.sha, workflows: [], runs: { complete: true, list: headRuns.workflow_runs } },
  },
};
const result = {
  baseline: classifyCi(facts, 'pin'), head: classifyCi(facts, 'now'),
  baseline_workflow_summary: summary, triggers_default: triggersDefault(summary, metadata.default_branch),
  pin_workflow_git_blob_sha: blobSha, pin_tree_entries: pin.tree.length, head_tree_entries: head.tree.length,
  pin_workflows: paths(pin).map(x => x.path), head_workflows: paths(head).map(x => x.path),
  scope: 'CI only at the two named commits; no upstream code executed; no complete assessment, resolution, private CI or product quality claim',
};
if (result.baseline.value !== 'C3' || result.head.value !== 'C5' || result.head.rule !== 'FR-C.2/C5-deleted') throw new Error(JSON.stringify(result));
// Read-only verification; recorded finding remains unchanged.
console.log(JSON.stringify(result, null, 2));
