#!/usr/bin/env python3
"""Disposable, explicitly synthetic boundary probes of the pinned FR starter kit.

No network, product implementation, paid inference, or production mutation.
Exit 0 means probes executed, NOT that the tested kit rejected every bad input.
"""
import collections
import csv
import hashlib
import json
import pathlib
import subprocess
import tempfile

ROOT = pathlib.Path(__file__).resolve().parents[3]
PIN = '112215ddda638d7610097f3f70c8c35a050b40a4'
HERE = pathlib.Path(__file__).resolve().parent
results = []
INPUTS = ['starter-kit/scripts/check-claim-discipline.sh', 'starter-kit/scripts/check-readiness.sh',
 'starter-kit/scripts/hooks/pre-commit', 'starter-kit/scripts/init.sh',
 'starter-kit/scripts/checklist2beads.awk', 'starter-kit/CHECKLIST.md',
 'watch/freshness/revisit.tsv', 'watch/freshness/triggers.mjs']
INPUTS += [str(p.relative_to(ROOT)) for p in sorted((ROOT/'starter-kit/templates').glob('*')) if p.is_file()]

def run(cmd, cwd):
    p = subprocess.run(cmd, cwd=cwd, text=True, capture_output=True, timeout=30)
    return dict(command=cmd, exit_code=p.returncode, stdout=p.stdout, stderr=p.stderr)

def record(name, cmd, cwd, scope):
    r = run(cmd, cwd)
    # Temporary absolute paths are normalized for a portable public receipt.
    r = json.loads(json.dumps(r).replace(str(cwd), '<fixture>'))
    results.append(dict(id=name, scope=scope, **r))

def setup(cmd, cwd):
    r = run(cmd, cwd)
    if r['exit_code']: raise RuntimeError(r)

def write(p, text):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text)

def registry(p, proof='proof.txt', expected='PASS'):
    write(p/'registries/claims.tsv', 'label\treadme_pattern\tcapability_key\texpected_substr\tproof_path\tenforce\tnotes\n'
          + f'fixture\tSynthetic claim\tfixture\t{expected}\t{proof}\tyes\tSYNTHETIC AUDIT ONLY\n')

def packet():
    sections = {
      'PROBLEM':'problem user success', 'NON-GOALS':'not a real plan',
      'SOTA':'pinned commit not supplied', 'PACKETS':'goal anchor target oracle fixture risk acceptance',
      'CLAIM-INVENTORY':'planned claims.tsv', 'EVIDENCE-DESIGN':'commit version host worker',
      'HONESTY-MACHINERY':'ledger demotion predicate', 'PROOF-TAXONOMY':'non-proof',
      'RELEASE-GATE':'waiver', 'EXIT-CRITERIA':'entry exit', 'REVIEW':'change',
      'SIGN-OFF':'NOT signed by any owner; synthetic date 2026-09-28',
    }
    return '# SYNTHETIC NON-PLAN: nobody authorized execution\n' + '\n'.join(
      f'## {i}. {k}\n<!-- CHECK: {k} -->\n{v}\nThis section has no supporting evidence.\nNothing in this fixture authorizes a build.\n'
      for i,(k,v) in enumerate(sections.items(),1))

head = subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
for name in INPUTS:
    expected = subprocess.check_output(['git','show',f'{PIN}:{name}'],cwd=ROOT)
    if (ROOT/name).read_bytes() != expected:
        raise SystemExit('Tested input differs from pin: '+name)

with tempfile.TemporaryDirectory(prefix='fr-boundary-') as td:
    p = pathlib.Path(td)
    init = run(['sh',str(ROOT/'starter-kit/scripts/init.sh'),str(p)],ROOT)
    if init['exit_code']: raise RuntimeError(init)
    claims = ['sh','scripts/check-claim-discipline.sh']
    hook = ['sh','.git/hooks/pre-commit']
    ready = ['sh','scripts/check-readiness.sh']
    write(p/'README.md','Synthetic claim\n')
    registry(p)
    write(p/'proof.txt','PASS: explicitly synthetic positive control\n')
    record('positive-control',claims,p,'A matching nonempty synthetic proof should pass structural checks.')
    (p/'proof.txt').unlink()
    record('missing-proof-control',claims,p,'An enforced row with no proof should fail.')
    write(p/'proof.txt','FAIL: the required PASS result was not obtained. Synthetic negative evidence.\n')
    record('negative-proof-containing-pass',claims,p,'Substring existence does not establish a passing execution result.')
    write(p/'proof.txt','PASS: explicitly synthetic positive control\n')
    write(p/'README.md','Synthetic claim\nUNREGISTERED SYNTHETIC FALSE CLAIM: this project has independently certified every result.\n')
    record('unregistered-readme-claim',claims,p,'One registered row does not provide coverage of every public claim.')
    (p/'registries/claims.tsv').unlink()
    record('absent-registry-default',claims,p,'This is the no-argument invocation used by kit CI.')
    record('absent-registry-explicit',['sh','scripts/check-claim-discipline.sh','registries/claims.tsv'],p,'Explicit-path missing registry control.')
    record('absent-registry-hook',hook,p,'Installed hook skips the real registry check when the registry is absent.')
    registry(p)
    write(p/'README.md','Synthetic claim\n')
    write(p/'proof.txt','FAIL: synthetic staged proof does not support the claim.\n')
    setup(['git','add','README.md','proof.txt','registries/claims.tsv'],p)
    record('staged-negative-control',hook,p,'Both worktree and staged proof are negative: hook should reject.')
    write(p/'proof.txt','PASS: synthetic unstaged replacement\n')
    record('staged-negative-worktree-positive',hook,p,'Hook observes worktree proof while the index still contains negative proof.')
    record('staged-proof-inspection',['git','show',':proof.txt'],p,'Shows exactly the staged bytes; no commit is made.')
    write(p/'docs/planning/packet.md',packet())
    record('explicitly-unsigned-non-plan',ready,p,'Known heuristic limit: structural completion is not authorization or semantic readiness.')
    write(p/'docs/evidence/NEGATIVE_EVIDENCE.md','# SYNTHETIC ledger\n## 2026-09-28 — REJECT: fixture\n- Retry predicate: later\n')
    setup(['git','add','docs/evidence/NEGATIVE_EVIDENCE.md'],p)
    record('bad-ledger-hook',hook,p,'Local hook should reject the weasel retry predicate.')
    record('bad-ledger-ci-readiness',ready,p,'Replay first kit CI shell gate locally, not a GitHub Actions run.')
    record('bad-ledger-ci-claims',claims,p,'Replay second kit CI shell gate locally; neither CI gate examines ledger.')
    seeds=[json.loads(l) for l in (p/'.beads/issues.jsonl').read_text().splitlines()]
    seed_summary={'rows':len(seeds),'with_dependencies':sum(bool(x['dependencies']) for x in seeds)}

rows=list(csv.DictReader((l for l in (ROOT/'watch/freshness/revisit.tsv').read_text().splitlines() if l and not l.startswith('#')),delimiter='\t'))
receipt={'scope':'Synthetic boundary observations only; not research quality or production exploit frequency.',
 'base_commit':PIN,'execution_head':head,'results':results,'bead_seed':seed_summary,
 'revisit_rows':len(rows),'revisit_detectors':dict(collections.Counter(r['detector'] for r in rows)),
 'revisit_observed_detector_rows':sum(r['detector'] in {'release.first','ci.class','license.text','archived','dependency.edge'} for r in rows),
 'probe_sha256':hashlib.sha256(pathlib.Path(__file__).read_bytes()).hexdigest(),
 'tested_files_sha256':{name:hashlib.sha256((ROOT/name).read_bytes()).hexdigest() for name in INPUTS}}
write(HERE/'PROBE_RESULTS.json',json.dumps(receipt,indent=2)+'\n')
for r in results: print(r['id'],r['exit_code'])
print('seed',seed_summary,'revisit',receipt['revisit_detectors'])
