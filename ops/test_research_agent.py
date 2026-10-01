#!/usr/bin/env python3
"""Security contract regressions; synthetic controls, not research VALUE results."""
import copy, hashlib, importlib.util, json, os, pathlib, subprocess, tempfile, unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
def load(name,file):
    spec=importlib.util.spec_from_file_location(name,ROOT/'ops'/file);module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);return module
r=load('resolver','research-agent-resolve.py');e=load('evaluator','research-agent-evaluate.py');h=load('hardener','research-agent-harden.py')
FILES=['recipe.md','baseline.py','candidate.py','test.py','execution.json','fixtures/input.json','fixtures/transfer.json']
def listed(): return [{'filename':r.PREFIX+'case/'+x,'status':'added'} for x in FILES]
def git(root,*args):
    return subprocess.check_output(['git','-C',str(root),*args],stderr=subprocess.DEVNULL,
          env={**os.environ,'GIT_CONFIG_NOSYSTEM':'1','GIT_CONFIG_GLOBAL':'/dev/null',
               'GIT_AUTHOR_NAME':'Test','GIT_COMMITTER_NAME':'Test',
               'GIT_AUTHOR_EMAIL':'41898282+github-actions[bot]@users.noreply.github.com',
               'GIT_COMMITTER_EMAIL':'41898282+github-actions[bot]@users.noreply.github.com'}).decode().strip()
def fixture(root,broken=False):
    root.mkdir();git(root,'init','-q');(root/'base.txt').write_text('base');git(root,'add','.');git(root,'commit','-qm','base');base=git(root,'rev-parse','HEAD')
    p=root/r.PREFIX/'case';(p/'fixtures').mkdir(parents=True)
    for name in FILES:(p/name).write_text('{}\n')
    for name in ['baseline.py','candidate.py']:(p/name).write_text('import json,sys\nprint(sum(json.load(open(sys.argv[1]))["values"]))\n')
    (p/'fixtures/input.json').write_text('{"values":[2,3]}\n');(p/'fixtures/transfer.json').write_text('{"values":[7,11]}\n')
    (p/'test.py').write_text('import subprocess,sys\nassert subprocess.check_output([sys.executable,"candidate.py","fixtures/input.json"]).strip()==b"'+('999' if broken else '5')+'"\n')
    git(root,'add','.');git(root,'commit','-qm','candidate');return base,git(root,'rev-parse','HEAD'),p
class Tests(unittest.TestCase):
    def test_required_contract(self):
        self.assertEqual(r.validate_files(listed()),r.PREFIX+'case')
        with self.assertRaises(ValueError):r.validate_files(listed()[:-1])
    def test_reject_paths_and_edits(self):
        for path in ['../x','probes/daily-candidates/case/../x','probes/daily-candidates/.case/x','probes/daily-candidates/case/.secret','site/a.html','probes/daily-candidates/case/x\ny']:
            with self.subTest(path=path),self.assertRaises(ValueError):r.validate_files(listed()+[{'filename':path,'status':'added'}])
        bad=listed();bad[0]['status']='modified'
        with self.assertRaises(ValueError):r.validate_files(bad)
    def test_run_provenance(self):
        run={'id':3,'path':r.WORKFLOW,'repository':{'full_name':r.REPO},'head_repository':{'full_name':r.REPO},'head_branch':'main','event':'schedule','status':'completed','conclusion':'success','head_sha':'a'*40}
        r.validate_run(run,3)
        for key,value in [('head_branch','attack'),('event','pull_request'),('conclusion','failure'),('head_sha','a\n')]:
            with self.subTest(key=key),self.assertRaises(ValueError):r.validate_run({**run,key:value},3)
    def test_exact_pr_selection(self):
        run={'id':3,'run_started_at':'2026-09-29T12:00:00Z','updated_at':'2026-09-29T12:10:00Z'}
        pr={'state':'open','draft':True,'user':{'login':'github-actions[bot]'},'title':'[research-candidate] x','head':{'ref':'research-candidate/x','sha':'a'*40,'repo':{'full_name':r.REPO}},'base':{'ref':'main','repo':{'full_name':r.REPO}},'body':f'https://github.com/{r.REPO}/actions/runs/3','created_at':'2026-09-29T12:01:00Z'}
        self.assertEqual(r.select_candidates(run,[pr]),[pr]);self.assertEqual(r.select_candidates(run,[{**pr,'draft':False}]),[])
        with self.assertRaises(ValueError):r.select_candidates(run,[pr,pr])
        self.assertEqual(r.select_candidates(run,[{**pr,'body':pr['body']+'0'}]),[])
        self.assertEqual(r.select_candidates(run,[{**pr,'created_at':'2026-09-29T13:00:00Z'}]),[])
    def test_real_git_extraction(self):
        with tempfile.TemporaryDirectory() as temp:
            root=pathlib.Path(temp)/'repo';base,sha,p=fixture(root);out=pathlib.Path(temp)/'out'
            name,hashes=e.extract(root,base,sha,out);self.assertEqual(len(hashes),7);self.assertEqual((out/'candidate.py').read_bytes(),(p/'candidate.py').read_bytes())
    def test_symlink_executable_and_oversize_rejected(self):
        for kind in ['symlink','executable','oversize']:
            with self.subTest(kind=kind),tempfile.TemporaryDirectory() as temp:
                root=pathlib.Path(temp)/'repo';base,sha,p=fixture(root);f=p/'candidate.py'
                if kind=='symlink':f.unlink();f.symlink_to('/etc/passwd')
                elif kind=='executable':f.chmod(0o755)
                else:f.write_bytes(b'x'*(256*1024+1))
                git(root,'add','.');git(root,'commit','-qm','attack');sha=git(root,'rev-parse','HEAD')
                with self.assertRaises(ValueError):e.extract(root,base,sha,pathlib.Path(temp)/'out')
    def test_container_boundary(self):
        argv=e.command('/tmp/candidate','test.py',container_name='fr-test')
        for value in ['--network=none','--read-only','--cap-drop=ALL','--security-opt=no-new-privileges','--user=65534:65534','--pids-limit=64','--memory=256m','--memory-swap=256m']:
            self.assertIn(value,argv)
        self.assertNotIn('/var/run/docker.sock',' '.join(argv));self.assertNotIn('GITHUB_TOKEN',' '.join(argv));self.assertIn('@sha256:',e.IMAGE)
    def test_reviewed_lock_mutation_rejected(self):
        script="""import{readFileSync}from'node:fs';import{parseYaml}from'./watch/freshness/yaml.mjs';import{researchAgentProblems,RESEARCH_WORKFLOW}from'./ops/research-agent-policy.mjs';let t=readFileSync(RESEARCH_WORKFLOW,'utf8');let a=researchAgentProblems(process.cwd(),t,parseYaml(t));let changed=t.replace('draft\\\":true','draft\\\":false');if(changed===t)changed=t+'\\n# mutation';let b=researchAgentProblems(process.cwd(),changed,parseYaml(changed));if(a.length||!b.length)process.exit(1);"""
        subprocess.run(['node','--input-type=module','-e',script],cwd=ROOT,check=True)
    def test_hardened_topology_and_secrets(self):
        text=(ROOT/'.github/workflows/research-candidate.lock.yml').read_text()
        import re
        self.assertEqual(set(re.findall(r'^  ([a-z_]+):$',text[text.index('\njobs:\n'):],re.M)),{'activation','agent','conclusion','detection','pre_activation','safe_outputs'})
        self.assertNotIn('persist-credentials: true',text)
        self.assertNotIn('run: bash "${RUNNER_TEMP}/gh-aw/actions/configure_git_credentials.sh"',text)
        for secret in h.REMOVED:self.assertNotIn('secrets.'+secret,text)
        with self.assertRaises(ValueError):h.harden(text)
if __name__=='__main__':unittest.main()
