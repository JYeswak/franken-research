#!/usr/bin/env python3
"""Paired local experiment. Applies an actual supplied research note to the checkout.
Runs a full setup, then two unchanged full controls and ten reuse trials on the
same note. No paid calls. Output directory and destination note must be new.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import resource
import statistics
import subprocess
import sys
import time

p=argparse.ArgumentParser(description=__doc__)
p.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[2])
p.add_argument('--output',type=Path,required=True)
p.add_argument('--note',type=Path,required=True)
p.add_argument('--hash', choices=['sha256', 'blake3'], default='sha256')
p.add_argument('--stable-env', action='store_true', help='run both arms in the local wrapper environment')
a=p.parse_args(); root=a.root.resolve(); out=a.output.resolve()
if a.stable_env and os.environ.get('CI'):p.error('stable local environment unavailable in CI')
if out.is_relative_to(root):p.error('output must be outside checkout')
if out.exists():p.error('output must be a new directory')
note=root/'docs/evidence/applied-research'/a.note.name
if note.exists() or note.suffix!='.md':p.error('destination must be a new flat Markdown note')
out.mkdir(parents=True)
cache=out/'private-cache.json'
base=['bun','run','verify']
candidate=[sys.executable,'-B','scripts/verify-incremental.py','--hash',a.hash,'--cache',str(cache)]
env=None
if a.stable_env:
 env={k:os.environ[k] for k in ('HOME','PATH','CHROME_PATH')}
 env.update(LANG='C.UTF-8',LC_ALL='C.UTF-8',TZ='UTC')
 candidate=['bash','scripts/verify-local.sh','--hash',a.hash,'--cache',str(cache)]

def trial(label,command):
 before=resource.getrusage(resource.RUSAGE_CHILDREN)
 start=time.perf_counter()
 r=subprocess.run(command,cwd=root,text=True,capture_output=True,env=env)
 wall=time.perf_counter()-start
 after=resource.getrusage(resource.RUSAGE_CHILDREN)
 row=dict(label=label,command=command,exit_code=r.returncode,wall_seconds=wall,
          cpu_seconds=after.ru_utime+after.ru_stime-before.ru_utime-before.ru_stime,
          stdout=r.stdout,stderr=r.stderr)
 (out/(label+'.json')).write_text(json.dumps(row,indent=2)+'\n')
 print(json.dumps({k:row[k] for k in ['label','exit_code','wall_seconds','cpu_seconds']}),flush=True)
 if r.returncode:raise RuntimeError(label+' failed; raw failure retained')
 return row

setup=trial('setup',candidate+['--full'])
source=a.note.read_bytes(); note.write_bytes(source)
subprocess.run(['git','add','--intent-to-add','--',str(note)],cwd=root,check=True)
rows=[]
# Full controls bracket the repeated warm measurements on the identical changed tree.
rows.append(trial('full-1',base))
for i in range(10):
 row=trial(f'reuse-{i+1:02}',candidate)
 result=json.loads(row['stdout'])
 if result['mode']!='reused_full_result_with_fresh_metadata_checks' or not result['fresh']['ok']:
  raise RuntimeError('reuse was not eligible or affected checks failed')
 rows.append(row)
rows.append(trial('full-2',base))
full=[r for r in rows if r['label'].startswith('full-')]
reuse=[r for r in rows if r['label'].startswith('reuse-')]
summary={'scope':'repeated local metadata validation, not human/research productivity',
         'hash_backend':a.hash, 'stable_environment':a.stable_env,
         'candidate_sha256':hashlib.sha256((root/'scripts/verify-incremental.py').read_bytes()).hexdigest(),
         'note_sha256':hashlib.sha256(source).hexdigest(),'setup':{k:setup[k] for k in ['wall_seconds','cpu_seconds']},
         'samples':{r['label']:{k:r[k] for k in ['wall_seconds','cpu_seconds','exit_code']} for r in rows},
         'metrics':{}}
for metric in ['wall_seconds','cpu_seconds']:
 f=[r[metric] for r in full]; c=[r[metric] for r in reuse]
 summary['metrics'][metric]={'full_median':statistics.median(f),'reuse_median':statistics.median(c),
   'median_ratio':statistics.median(f)/statistics.median(c),
   'conservative_ratio':min(f)/max(c),'warm_100x_pass':min(f)/max(c)>=100,
   'hypothetical_ratio_at_10_real_uses_including_setup':10*statistics.median(f)/(setup[metric]+sum(c))}
(out/'summary.json').write_text(json.dumps(summary,indent=2)+'\n')
print(json.dumps(summary['metrics'],indent=2),flush=True)
