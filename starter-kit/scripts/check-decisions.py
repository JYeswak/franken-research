#!/usr/bin/env python3
"""Small FR decision queue: validate evidence identities, flag stale claims, export.

Record version 1: evidence[{id,artifact,sha256,inputs:{path:hash},scope,visibility}],
claims[{id,text,status,evidence:[id],depends_on:[claim id]}],
decisions[{id,question,owner,priority,next_check,alternatives,disposition,claims}].
This validates structure/identity, never semantic truth. Public records must already
be sanitized: export controls artifact bytes, not the meaning of authored metadata.
"""
import argparse, copy, hashlib, json, pathlib, shutil, sys

def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def safe(root,name):
 p=pathlib.PurePosixPath(name)
 if p.is_absolute() or '..' in p.parts or not p.parts or p.as_posix()!=name:raise ValueError('unsafe/noncanonical path: '+name)
 target=root.joinpath(*p.parts)
 if not target.resolve().is_relative_to(root.resolve()):raise ValueError('path escapes root: '+name)
 if any(x.is_symlink() for x in [target,*target.parents] if x!=root.parent):raise ValueError('symlink path: '+name)
 return target

def inspect(data,root):
 if data.get('version')!=1:raise ValueError('unsupported version')
 def index(kind):
  rows=data[kind];out={r['id']:r for r in rows}
  if len(out)!=len(rows) or not out:raise ValueError('empty or duplicate '+kind)
  return out
 evidence=index('evidence');claims=index('claims');decisions=index('decisions');stale={};reasons={}
 for eid,e in evidence.items():
  if e['visibility'] not in ('public','private','reference-only') or not e['scope'].strip():raise ValueError('evidence scope/visibility: '+eid)
  safe(root,e['artifact'])
  for name in e['inputs']:safe(root,name)
  if e.get('availability')=='reference_only':
   stale[eid]=True;reasons[eid]=['artifact unavailable in transfer'];continue
  artifact=safe(root,e['artifact'])
  if not artifact.is_file() or digest(artifact)!=e['sha256']:raise ValueError('artifact absent/changed: '+eid)
  if e.get('kind')=='execution':
   receipt=json.loads(artifact.read_text())
   if type(receipt.get('exit_code')) is not int or receipt['exit_code']!=0:
    raise ValueError('execution did not succeed: '+eid)
  changed=[name for name,h in e['inputs'].items() if not safe(root,name).is_file() or digest(safe(root,name))!=h]
  stale[eid]=bool(changed);reasons[eid]=changed
 visiting=set();done={}
 def visit(cid):
  if cid not in claims:raise ValueError('unknown claim '+cid)
  if cid in visiting:raise ValueError('claim dependency cycle '+cid)
  if cid in done:return done[cid]
  visiting.add(cid);c=claims[cid]
  if c['status'] not in ('supported','provisional','review_required','retired'):raise ValueError('claim status '+cid)
  if not c['evidence'] or any(x not in evidence for x in c['evidence']):raise ValueError('claim evidence '+cid)
  dependencies=[visit(x) for x in c.get('depends_on',[])]
  bad=any(stale[x] for x in c['evidence']) or any(dependencies) or c['status']!='supported'
  visiting.remove(cid);done[cid]=bad;return bad
 for cid in claims:visit(cid)
 for d in decisions.values():
  if not d['claims'] or any(x not in claims for x in d['claims']):raise ValueError('decision claims '+d['id'])
  if d['disposition'] not in ('adopt','combine','build','defer','kill'):raise ValueError('decision disposition')
  if not all(isinstance(d[x],str) and d[x].strip() for x in ('question','owner','next_check')):raise ValueError('decision missing actionable fields')
  if not isinstance(d['priority'],int) or not 0<=d['priority']<=3 or len(d['alternatives'])<2:raise ValueError('priority/alternatives')
 return done,reasons

def refresh(data,root):
 out=copy.deepcopy(data);bad,_=inspect(out,root)
 for c in out['claims']:
  if bad[c['id']] and c['status']=='supported':c['status']='review_required'
 return out

def export(data,root,dest):
 if dest.exists():raise ValueError('export destination must be new')
 out=copy.deepcopy(data);inspect(out,root);files=set();restricted=set()
 for e in out['evidence']:
  if e['visibility']=='public' and e.get('availability')!='reference_only':files.update([e['artifact'],*e['inputs']])
  else:
   restricted.update([e['artifact'],*e['inputs']]);e['availability']='reference_only'
 # Record has authored public metadata. Never include private bytes just to
 # make validation green; the recipient sees unresolved evidence explicitly.
 if files & {'decisions.json','TRANSFER.md'}:raise ValueError('reserved export path')
 if files & restricted:raise ValueError('conflicting export rights for shared paths')
 for f in files:
  if not safe(root,f).is_file():raise ValueError('export input missing: '+f)
 dest.mkdir(parents=True)
 for f in files:
  target=safe(dest,f);target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(safe(root,f),target)
 out=refresh(out,dest)
 (dest/'decisions.json').write_text(json.dumps(out,indent=2)+'\n')
 (dest/'TRANSFER.md').write_text('''# Decision handoff

Start with decisions.json. This is an evidence subset, not a complete project.
Paths in its evidence records are relative to this directory. Use the FR checker:

    python3 /path/to/fr/scripts/check-decisions.py /path/to/bundle/decisions.json --root /path/to/bundle

If scripts/check-decisions.py is included, from this directory run:

    python3 scripts/check-decisions.py decisions.json --root .

Exit zero means structural/identity checks passed, even when a decision remains
deferred or needs review. It is not execution authorization or proof of meaning.
Private/reference-only artifacts are omitted and their claims require review.
Plans and receipts may mention project-relative commands or review files that
are not bundled: obtain the original repository to run those commands. This
bundle preserves existing receipts; it does not imply their tests were rerun here.
''')
 return out

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('record',type=pathlib.Path);p.add_argument('--root',type=pathlib.Path,default=pathlib.Path(__file__).resolve().parents[1]);p.add_argument('--refresh',action='store_true');p.add_argument('--export',type=pathlib.Path)
 a=p.parse_args()
 try:
  data=json.loads(a.record.read_text());bad,reasons=inspect(data,a.root)
  if a.refresh:data=refresh(data,a.root);a.record.write_text(json.dumps(data,indent=2)+'\n')
  if a.export:export(data,a.root,a.export)
  unsupported=[c['id'] for c in data['claims'] if bad[c['id']] and c['status']=='supported']
  for d in sorted(data['decisions'],key=lambda x:(x['priority'],x['id'])):
   print(f"{d['id']} | {d['disposition']} | {'REVIEW' if any(bad[x] for x in d['claims']) else 'CURRENT IDENTITIES'} | {d['owner']} | next: {d['next_check']}")
  print(json.dumps({'stale_or_unavailable_evidence':{k:v for k,v in reasons.items() if v},'unsupported_current_labels':unsupported,'scope':'identity/structure only, not semantic verification'}))
  return 1 if unsupported else 0
 except (ValueError,KeyError,TypeError,OSError) as e:print('INVALID: '+str(e),file=sys.stderr);return 2
if __name__=='__main__':sys.exit(main())
