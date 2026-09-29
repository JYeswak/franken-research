#!/usr/bin/env node
// Exact reviewed admission for ONE locally hardened gh-aw workflow. No suffix bypass.
// Existing workflows keep ops/write-job.mjs rules. A compiler upgrade requires review.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
export const RESEARCH_WORKFLOW = '.github/workflows/research-candidate.lock.yml';
const EXPECTED_JOBS = ['activation','agent','conclusion','detection','pre_activation','safe_outputs'];
const WRITERS = new Set(['conclusion','safe_outputs']);
const PIN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_./-]+@[0-9a-f]{40}$/;
const hash = (data) => createHash('sha256').update(data).digest('hex');
export function researchAgentProblems(root, text, workflow) {
  const problems=[];
  try {
    const policy=JSON.parse(readFileSync(join(root,'ops/research-agent-policy.json'),'utf8'));
    if(policy.review_status!=='reviewed') problems.push('cloud policy has no completed independent review');
    if(policy.review_status==='reviewed') {
      const reviewBytes=readFileSync(join(root,'ops/research-agent-review.json'));
      if(hash(reviewBytes)!==policy.review_sha256) problems.push('independent review receipt absent or changed');
      const review=JSON.parse(reviewBytes);
      if(review.verdict!=='approved_static_scope') problems.push('independent review did not approve static scope');
      for(const [path,expected] of Object.entries(policy.files)) {
        if(review.file_hashes?.[path]!==expected) problems.push(`${path}: no matching independent review input`);
      }
    }
    if(policy.version!==1 || policy.compiler!=='v0.89.21') problems.push('unreviewed research compiler policy');
    for(const [path,expected] of Object.entries(policy.files)) {
      if(hash(readFileSync(join(root,path)))!==expected) problems.push(`${path}: differs from independently reviewed cloud policy`);
    }
    if(hash(text)!==policy.files[RESEARCH_WORKFLOW]) problems.push('research workflow argument differs from reviewed bytes');
    if(!policy.files['.github/workflows/research-candidate.md'] || !policy.files['ops/research-agent-harden.py']) problems.push('source/hardener missing from admission');
    if(JSON.stringify(Object.keys(workflow.jobs).sort())!==JSON.stringify([...EXPECTED_JOBS].sort())) problems.push('research job topology changed');
    if(Object.keys(workflow.permissions??{}).length || workflow.env!==undefined) problems.push('global credentials or permissions in research workflow');
    if(!String(workflow.jobs.activation.if).includes("github.ref == 'refs/heads/main'")) problems.push('research activation not main-only');
    const secrets=[...text.matchAll(/secrets\.([A-Z_][A-Z0-9_]*)/g)].map(x=>x[1]);
    if(secrets.some(x=>!['GITHUB_TOKEN','CODEX_API_KEY','OPENAI_API_KEY'].includes(x))) problems.push('unreviewed research secret reference');
    for(const [id,job] of Object.entries(workflow.jobs)) {
      for(const [scope,permission] of Object.entries(job.permissions??{})) {
        if(scope==='id-token' || (permission==='write' && (!WRITERS.has(id)||!['contents','pull-requests'].includes(scope)))) problems.push(`${id}: unreviewed write permission ${scope}`);
      }
      for(const step of job.steps??[]) {
        if(step.uses && !PIN.test(step.uses)) problems.push(`${id}: unpinned action`);
        if(String(step.uses??'').startsWith('actions/checkout@') && String(step.with?.['persist-credentials'])!=='false') problems.push(`${id}: persisted checkout credential`);
        if(String(step.run??'').includes('configure_git_credentials.sh')) problems.push(`${id}: credential persistence bootstrap`);
      }
    }
    const output=workflow.jobs.safe_outputs.steps.find(x=>x.name==='Process Safe Outputs');
    const handlers=JSON.parse(output.env.GH_AW_SAFE_OUTPUTS_HANDLER_CONFIG);
    if(JSON.stringify(Object.keys(handlers).sort())!==JSON.stringify(['create_pull_request','noop'])) problems.push('unreviewed safe output');
    const p=handlers.create_pull_request;
    if(p.draft!==true||p.max!==1||p.base_branch!=='main'||p.stacked!==false||p.fallback_as_issue!==false||p.protected_files_policy!=='blocked'||p.max_patch_files!==20||p.max_patch_size!==256||JSON.stringify(p.allowed_files)!==JSON.stringify(['probes/daily-candidates/**'])||JSON.stringify(p.allowed_branches)!==JSON.stringify(['research-candidate/*'])) problems.push('candidate patch policy weakened');
    if(!text.includes('# fr-research-hardening: v1;')) problems.push('missing local hardening provenance');
  } catch(error) { problems.push(`research workflow policy: ${error.message}`); }
  return problems;
}
