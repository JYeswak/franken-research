#!/usr/bin/env python3
"""Exercise real decision records in an isolated transfer; mutations are synthetic."""
import pathlib,subprocess,tempfile,json,hashlib,datetime
ROOT=pathlib.Path(__file__).resolve().parents[3]
CHECK=ROOT/'scripts/check-decisions.py';RECORD=ROOT/'docs/evidence/fr-evolution/decisions.json'
steps=[]
def run(cmd,expected):
 p=subprocess.run(cmd,capture_output=True,text=True,cwd=ROOT,timeout=30)
 steps.append({'command':[str(x) for x in cmd],'exit_code':p.returncode,'stdout':p.stdout,'stderr':p.stderr})
 if p.returncode!=expected:raise RuntimeError(steps[-1])
with tempfile.TemporaryDirectory(prefix='fr-dogfood-') as tmp:
 dest=pathlib.Path(tmp)/'handoff'
 run(['python3',str(CHECK),str(RECORD),'--export',str(dest)],0)
 cmd=['python3',str(dest/'scripts/check-decisions.py'),str(dest/'decisions.json'),'--root',str(dest)]
 run(cmd,0)
 source=dest/'starter-kit/scripts/check-ledger.sh';source.write_text(source.read_text()+'\n# SYNTHETIC change for invalidation test only\n')
 run(cmd,1)
 run(cmd+['--refresh'],0)
 rows={r['id']:r['status'] for r in json.loads((dest/'decisions.json').read_text())['claims']}
 assert rows=={'kit-repairs':'review_required','portable-records':'supported','net-benefit':'provisional'},rows
 result={'exit_code':0,'observed_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'input_sha256':{str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in [CHECK,RECORD,pathlib.Path(__file__)]},'scope':'Actual transfer and synthetic source-change exercise; no comparative time or research-quality result.','steps':steps,'after_change':rows,'effect':'Only the affected supported claim required review; no automatic re-promotion.'}
 text=json.dumps(result,indent=2).replace(str(dest),'<handoff>').replace(str(ROOT),'<checkout>')
 (ROOT/'docs/evidence/fr-evolution/dogfood.json').write_text(text+'\n')
print('PASS: transfer, invalidation, explicit review state and unrelated claim preservation')
