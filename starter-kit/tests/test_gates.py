#!/usr/bin/env python3
"""Regression checks for actual installed kit paths; fixtures are synthetic."""
import pathlib, subprocess, tempfile, unittest, os, json, hashlib, sys
KIT=pathlib.Path(__file__).resolve().parents[1]
class Gates(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory(prefix='fr-kit-test-');self.root=pathlib.Path(self.tmp.name)
  self.call(['sh',str(KIT/'scripts/init.sh'),str(self.root)],0)
  self.put('README.md','Synthetic claim\n')
  self.put('proof.txt','PASS: synthetic control\n')
  self.put('registries/claims.tsv','label\treadme_pattern\tcapability_key\texpected_substr\tproof_path\tenforce\tnotes\nfixture\tSynthetic claim\tfixture\tPASS\tproof.txt\tyes\tsynthetic\n')
  self.stage()
 def tearDown(self):self.tmp.cleanup()
 def put(self,p,t):
  f=self.root/p;f.parent.mkdir(parents=True,exist_ok=True);f.write_text(t)
 def call(self,cmd,expected):
  p=subprocess.run(cmd,cwd=self.root,text=True,capture_output=True)
  self.assertEqual(p.returncode,expected,p.stdout+p.stderr);return p
 def stage(self):self.call(['git','add','-A'],0)
 def claims(self,n):return self.call(['sh','scripts/check-claim-discipline.sh'],n)
 def hook(self,n):return self.call(['sh','.git/hooks/pre-commit'],n)
 def test_positive_control(self):self.claims(0);self.hook(0)
 def test_missing_proof(self):
  (self.root/'proof.txt').unlink();self.claims(1);self.stage();self.hook(1)
 def test_missing_registry_default(self):
  (self.root/'registries/claims.tsv').unlink();self.claims(1)
 def test_smudge_cannot_rewrite_evidence(self):
  self.put('.gitattributes','proof.txt filter=fixture\n')
  self.call(['git','config','filter.fixture.smudge','sed s/FAIL/PASS/g'],0)
  self.put('proof.txt','FAIL: index evidence\n');self.stage();self.hook(1)
 def test_external_ledger_symlink_rejected(self):
  ledger=self.root/'docs/evidence/NEGATIVE_EVIDENCE.md';ledger.unlink()
  self.put('external-ledger','# valid empty synthetic ledger\n');ledger.symlink_to(self.root/'external-ledger')
  self.call(['sh','scripts/check-ledger.sh'],1);self.stage();self.hook(1)
 def test_registry_parent_symlink_rejected(self):
  (self.root/'registries').rename(self.root/'other');(self.root/'registries').symlink_to('other',target_is_directory=True);self.claims(1)
 def test_missing_registry_staged(self):
  (self.root/'registries/claims.tsv').unlink();self.stage();self.hook(1)
 def test_staged_negative_not_repaired_by_worktree(self):
  self.put('proof.txt','FAIL: synthetic negative\n');self.stage();self.put('proof.txt','PASS: unstaged\n');self.hook(1)
 def test_unstaged_negative_does_not_break_valid_index(self):
  self.put('proof.txt','FAIL: unstaged\n');self.hook(0)
 def test_untracked_proof_is_not_evidence_for_commit(self):
  self.call(['git','rm','--cached','proof.txt'],0);self.hook(1)
 def test_symlink_proof_rejected(self):
  (self.root/'proof.txt').unlink();self.put('elsewhere.txt','PASS\n');(self.root/'proof.txt').symlink_to('elsewhere.txt');self.claims(1);self.stage();self.hook(1)
 def test_absolute_proof_rejected(self):
  p=self.root/'registries/claims.tsv';p.write_text(p.read_text().replace('\tproof.txt\t','\t'+str(self.root/'proof.txt')+'\t'));self.claims(1)
 def test_retired_id_retained(self):
  self.put('README.md','');p=self.root/'registries/claims.tsv';p.write_text(p.read_text().replace('\tyes\tsynthetic','\tno\tretired: synthetic'));self.claims(0)
 def test_missing_checker_blocks(self):
  (self.root/'scripts/check-ledger.sh').unlink();self.stage();self.hook(1)
 def test_ledger_parity(self):
  self.put('docs/evidence/NEGATIVE_EVIDENCE.md','# Synthetic\n## Negative result\n- Retry predicate: later\n');self.stage()
  self.call(['sh','scripts/check-ledger.sh'],1);self.hook(1)
  self.put('docs/evidence/NEGATIVE_EVIDENCE.md','# Synthetic\n## Negative result\n- Retry predicate: rerun when fixture bytes change\n');self.stage()
  self.call(['sh','scripts/check-ledger.sh'],0);self.hook(0)
 def test_ledger_missing_blocks(self):
  (self.root/'docs/evidence/NEGATIVE_EVIDENCE.md').unlink();self.stage();self.call(['sh','scripts/check-ledger.sh'],1);self.hook(1)
 def test_ci_invokes_shared_gates(self):
  s=(self.root/'.github/workflows/kit-gates.yml').read_text()
  self.assertIn('sh scripts/check-ledger.sh docs/evidence/NEGATIVE_EVIDENCE.md',s)
  self.assertIn('sh scripts/check-claim-discipline.sh registries/claims.tsv README.md',s)
 def test_empty_packet_fails(self):self.call(['sh','scripts/check-readiness.sh'],1)
 def test_decision_commands_match_canonical(self):
  for name in ('check-decisions.py','review-decisions.py'):
   self.assertEqual((self.root/'scripts'/name).read_bytes(),(KIT.parent/'scripts'/name).read_bytes())
 def test_installed_review_from_unrelated_directory(self):
  self.put('input.txt','synthetic input')
  self.put('receipt.json','{"exit_code":0}')
  h=lambda p:hashlib.sha256((self.root/p).read_bytes()).hexdigest()
  record={'version':1,'evidence':[{'id':'e','kind':'execution','artifact':'receipt.json','sha256':h('receipt.json'),'inputs':{'input.txt':h('input.txt')},'scope':'synthetic installed CLI exercise','visibility':'public'}],'claims':[{'id':'c','text':'fixture','status':'supported','evidence':['e']}],'decisions':[{'id':'d','question':'fixture?','owner':'test','priority':0,'next_check':'inspect input','alternatives':['keep','change'],'disposition':'combine','claims':['c']}]}
  self.put('decisions.json',json.dumps(record))
  cmd=[sys.executable,str(self.root/'scripts/review-decisions.py'),str(self.root/'decisions.json'),'--json']
  # Default root must follow installed script, not cwd or originating checkout.
  with tempfile.TemporaryDirectory() as elsewhere:
   p=subprocess.run(cmd,cwd=elsewhere,capture_output=True,text=True)
   self.assertEqual(p.returncode,0,p.stdout+p.stderr);self.assertEqual(json.loads(p.stdout)['decisions'],[])
   self.put('input.txt','synthetic change')
   p=subprocess.run(cmd,cwd=elsewhere,capture_output=True,text=True)
   self.assertEqual(p.returncode,1,p.stdout+p.stderr);self.assertEqual(json.loads(p.stdout)['decisions'][0]['causes'][0]['changes'],['input.txt'])
 def test_reinstall_preserves_decision_work(self):
  self.put('scripts/review-decisions.py','# user customization\n');self.put('docs/DECISIONS.md','user notes\n');self.put('decisions.json','user record\n')
  self.call(['sh',str(KIT/'scripts/init.sh'),str(self.root)],0)
  for name,expected in [('scripts/review-decisions.py','# user customization\n'),('docs/DECISIONS.md','user notes\n'),('decisions.json','user record\n')]:self.assertEqual((self.root/name).read_text(),expected)
if __name__=='__main__':unittest.main()
