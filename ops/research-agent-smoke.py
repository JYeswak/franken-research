#!/usr/bin/env python3
"""Hosted Docker positive/negative control; does not invoke an LLM or claim value."""
import importlib.util,json,pathlib,subprocess,tempfile,sys
HERE=pathlib.Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('controls',HERE/'test_research_agent.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
output=pathlib.Path(sys.argv[1]);output.mkdir(parents=True,exist_ok=False)
rows=[]
with tempfile.TemporaryDirectory(prefix='fr-hosted-smoke-') as temp:
    for broken in (False,True):
        label='negative' if broken else 'positive';root=pathlib.Path(temp)/label
        base,sha,_=m.fixture(root,broken)
        done=subprocess.run([sys.executable,'-B',str(HERE/'research-agent-evaluate.py'),'--root',str(root),'--base',base,'--sha',sha,'--output',str(output/label)],check=False)
        record=json.loads((output/label/'result.json').read_text())
        passed=(done.returncode==1 and record['checks'] and any(x['label']=='author-tests' and x['exit_code']!=0 for x in record['checks'])) if broken else (done.returncode==0 and record['status']=='execution_reproduced')
        rows.append({'control':label,'passed':passed,'exit_code':done.returncode,'candidate_sha':sha})
(output/'controls.json').write_text(json.dumps({'scope':'Hosted synthetic sandbox controls; not an agent research run or user-value result.','controls':rows},indent=2)+'\n')
if not all(x['passed'] for x in rows):raise SystemExit(1)
print('Hosted candidate sandbox: positive and planted failure controls passed')
