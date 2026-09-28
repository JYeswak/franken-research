#!/usr/bin/env python3
import importlib.util,json,pathlib,tempfile,unittest
spec=importlib.util.spec_from_file_location('decisions',pathlib.Path(__file__).with_name('check-decisions.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class Decisions(unittest.TestCase):
 def setUp(self):
  self.t=tempfile.TemporaryDirectory();self.r=pathlib.Path(self.t.name);(self.r/'source').write_text('public input');(self.r/'receipt').write_text('synthetic receipt')
  self.d={'version':1,'evidence':[{'id':'e','artifact':'receipt','sha256':m.digest(self.r/'receipt'),'inputs':{'source':m.digest(self.r/'source')},'scope':'synthetic only','visibility':'public'}],'claims':[{'id':'c','text':'Synthetic claim','status':'supported','evidence':['e'],'depends_on':[]}],'decisions':[{'id':'d','question':'Synthetic question?','owner':'test','priority':1,'next_check':'read source','alternatives':['retain','change'],'disposition':'defer','claims':['c']}]}
 def tearDown(self):self.t.cleanup()
 def test_valid(self):self.assertFalse(m.inspect(self.d,self.r)[0]['c'])
 def test_failed_execution_not_rescued_by_pass_text(self):
  (self.r/'receipt').write_text(json.dumps({'exit_code':1,'output':'PASS was expected but not obtained'}))
  self.d['evidence'][0].update(kind='execution',sha256=m.digest(self.r/'receipt'))
  with self.assertRaises(ValueError):m.inspect(self.d,self.r)
 def test_input_change_demotes(self):
  (self.r/'source').write_text('changed');self.assertEqual(m.refresh(self.d,self.r)['claims'][0]['status'],'review_required')
 def test_receipt_tamper_rejected(self):
  (self.r/'receipt').write_text('tampered')
  with self.assertRaises(ValueError):m.inspect(self.d,self.r)
 def test_dependency_propagates(self):
  self.d['claims'].append({'id':'c2','text':'dependent','status':'supported','evidence':['e'],'depends_on':['c']});self.d['claims'][0]['status']='review_required';self.assertTrue(m.inspect(self.d,self.r)[0]['c2'])
 def test_cycle_rejected(self):
  self.d['claims'][0]['depends_on']=['c']
  with self.assertRaises(ValueError):m.inspect(self.d,self.r)
 def test_transfer_public(self):
  dest=self.r/'transfer';out=m.export(self.d,self.r,dest);self.assertFalse(m.inspect(out,dest)[0]['c'])
 def test_transfer_private_omitted_and_demoted(self):
  self.d['evidence'][0]['visibility']='private';dest=self.r/'transfer';out=m.export(self.d,self.r,dest)
  self.assertFalse((dest/'receipt').exists());self.assertFalse((dest/'source').exists());self.assertEqual(out['claims'][0]['status'],'review_required')
 def test_no_path_escape(self):
  self.d['evidence'][0]['artifact']='../escape'
  with self.assertRaises(ValueError):m.inspect(self.d,self.r)
 def test_conflicting_rights_block_export(self):
  e=dict(self.d['evidence'][0]);e.update(id='private-copy',visibility='private');self.d['evidence'].append(e)
  with self.assertRaises(ValueError):m.export(self.d,self.r,self.r/'transfer')
 def test_alias_cannot_bypass_rights(self):
  e=dict(self.d['evidence'][0]);e.update(id='private-copy',visibility='private');self.d['evidence'].append(e)
  self.d['evidence'][0]['artifact']='./receipt'
  with self.assertRaises(ValueError):m.export(self.d,self.r,self.r/'transfer')
 def test_no_symlink(self):
  (self.r/'link').symlink_to('receipt');self.d['evidence'][0]['artifact']='link'
  with self.assertRaises(ValueError):m.inspect(self.d,self.r)
 def test_unrelated_change_preserves(self):
  (self.r/'unrelated').write_text('new');self.assertFalse(m.inspect(self.d,self.r)[0]['c'])
if __name__=='__main__':unittest.main()
