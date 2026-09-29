#!/usr/bin/env python3
"""Execute the pinned OpenResearch shell template, without building orx.
This is a bounded reproduction, not a replacement research engine.
"""
import hashlib, json, pathlib, re, shlex, subprocess, tempfile, time
HERE=pathlib.Path(__file__).resolve().parent
UP=HERE/'openresearch-inspect'
PIN='7cc3251d91eca4e98b5e4edd7d4b85f5decb2902'
def call(args,cwd,**kw): return subprocess.run(args,cwd=cwd,check=True,capture_output=True,**kw).stdout
assert call(['git','rev-parse','HEAD'],UP,text=True).strip()==PIN
source=(UP/'src/compute.rs').read_text()
body=source.split('pub fn snapshot_script(',1)[1].split('pub fn staged_script',1)[0]
template=json.loads(re.search(r'("set -eo pipefail;[^\n]+")',body).group(1))
start=time.monotonic(); results=[]
with tempfile.TemporaryDirectory(prefix='orx-snapshot-probe-') as tmp:
 root=pathlib.Path(tmp); repo=root/'source'; repo.mkdir()
 call(['git','init','-q'],repo)
 (repo/'data.txt').write_text('2\n3\n')
 (repo/'evaluate.py').write_text("from pathlib import Path\nprint(sum(int(x) for x in Path('data.txt').read_text().split()))\n")
 call(['git','add','.'],repo)
 call(['git','-c','user.name=Probe','-c','user.email=noreply@example.invalid','commit','-qm','frozen evaluator'],repo)
 revision=call(['git','rev-parse','HEAD'],repo,text=True).strip()
 (repo/'data.txt').write_text('999\n')
 for label in ['positive_committed_snapshot','counterexample_export_ignore']:
  if label.startswith('counterexample'):
   (repo/'.git/info/attributes').write_text('data.txt export-ignore\n')
  archive=root/(label+'.tar')
  archive.write_bytes(call(['git','archive','--format=tar',revision],repo))
  work=root/label; work.mkdir()
  script=template.format(shlex.quote(str(archive)),'python3 evaluate.py')
  run=subprocess.run(['bash','-c',script],cwd=work,capture_output=True,text=True)
  results.append(dict(case=label,revision=revision,sha256=hashlib.sha256(archive.read_bytes()).hexdigest(),archive_members=call(['tar','-tf',str(archive)],root,text=True).splitlines(),exit_code=run.returncode,stdout=run.stdout,stderr=run.stderr))
assert results[0]['exit_code']==0 and results[0]['stdout']=='5\n'
assert results[1]['exit_code']!=0 and 'FileNotFoundError' in results[1]['stderr']
assert results[0]['revision']==results[1]['revision'] and results[0]['sha256']!=results[1]['sha256']
result=dict(upstream_pin=PIN,upstream_template=template,scope='git archive + exact shell template; Rust product not executed',elapsed_seconds=round(time.monotonic()-start,4),cases=results)
(HERE/'snapshot-results.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
