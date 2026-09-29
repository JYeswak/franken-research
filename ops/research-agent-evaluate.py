#!/usr/bin/env python3
"""Run untrusted candidate code only inside a capped, no-network Docker container.

This reruns author-authored tests. It neither judges their semantic correctness nor
promotes recipes. No candidate output is emitted as GitHub workflow commands.
"""
import argparse, hashlib, json, os, pathlib, re, shutil, subprocess, tempfile, time, resource, uuid
from importlib.machinery import SourceFileLoader
HERE = pathlib.Path(__file__).resolve().parent
resolver = SourceFileLoader('research_resolver', str(HERE / 'research-agent-resolve.py')).load_module()
IMAGE = 'ghcr.io/github/gh-aw-firewall/agent:0.28.23@sha256:2c78aaba1c108e130e2d6d01e4f2cca334ea04c53e6f258913ac34173fe7e3b2'
LIMIT_BYTES = 256 * 1024

def git(root, *args):
    return subprocess.check_output(['git', '--no-replace-objects', '-C', str(root), *args],
                                   env={**os.environ, 'GIT_CONFIG_NOSYSTEM': '1'}, timeout=30)

def extract(root, base, sha, destination):
    if not resolver.SHA.fullmatch(base) or not resolver.SHA.fullmatch(sha): raise ValueError('invalid SHA')
    changed = git(root, 'diff', '--name-status', '--no-renames', base, sha).decode().splitlines()
    files = []
    for row in changed:
        parts = row.split('\t')
        if len(parts) != 2 or parts[0] != 'A': raise ValueError('only new candidate files allowed')
        files.append({'filename': parts[1], 'status': 'added'})
    candidate = resolver.validate_files(files)
    entries = git(root, 'ls-tree', '-rz', '--full-tree', sha, candidate).split(b'\0')
    total = 0; hashes = {}; contents = []
    for entry in entries:
        if not entry: continue
        metadata, path = entry.split(b'\t', 1); mode, kind, oid = metadata.decode().split()
        path = path.decode()
        if mode != '100644' or kind != 'blob': raise ValueError('nonregular candidate member')
        if path not in {f['filename'] for f in files}: raise ValueError('candidate directory already existed')
        size = int(git(root, 'cat-file', '-s', oid))
        total += size
        if total > LIMIT_BYTES: raise ValueError('candidate exceeds 256 KiB')
        data = git(root, 'cat-file', 'blob', oid)
        rel = path[len(candidate)+1:]
        hashes[rel] = hashlib.sha256(data).hexdigest(); contents.append((rel, data))
    if len(contents) != len(files): raise ValueError('candidate tree mismatch')
    destination.mkdir()
    for rel, data in contents:
        target = destination / rel; target.parent.mkdir(parents=True, exist_ok=True); target.write_bytes(data)
    return candidate, hashes

def command(candidate, script, argument=None, container_name=None):
    args = ['docker', 'run', '--rm', '--pull=never', '--network=none', '--read-only',
            '--cap-drop=ALL', '--security-opt=no-new-privileges', '--pids-limit=64',
            '--memory=256m', '--memory-swap=256m', '--cpus=1', '--user=65534:65534',
            '--tmpfs=/tmp:rw,noexec,nosuid,size=32m',
            '--mount', f'type=bind,src={candidate},dst=/candidate,readonly',
            '--workdir=/candidate', '--env=HOME=/tmp', '--entrypoint=python3', IMAGE, '-B', script]
    if container_name: args[3:3]=['--name',container_name]
    if argument: args.append(argument)
    return args

def file_digest(path):
    with path.open('rb') as stream: return hashlib.file_digest(stream,'sha256').hexdigest()

def run_one(candidate, label, script, argument, output):
    started = time.monotonic()
    container_name='fr-candidate-'+uuid.uuid4().hex
    def limit_output(): resource.setrlimit(resource.RLIMIT_FSIZE,(2*1024*1024,2*1024*1024))
    stdout = output / (label + '.stdout'); stderr = output / (label + '.stderr')
    # Output files are host-created outside the container, never candidate paths.
    with stdout.open('wb') as out, stderr.open('wb') as err:
        try:
            completed = subprocess.run(command(candidate, script, argument, container_name), stdout=out, stderr=err,
                                       preexec_fn=limit_output,
                                       timeout=90, check=False, env={'PATH': os.environ['PATH'], 'HOME': os.environ['HOME']})
            code = completed.returncode
        except subprocess.TimeoutExpired: code = 124
        finally:
            subprocess.run(['docker','rm','-f',container_name],stdout=subprocess.DEVNULL,
                           stderr=subprocess.DEVNULL,timeout=15,check=False)
    limited=any(f.stat().st_size>=2*1024*1024 for f in (stdout,stderr))
    if limited: code=125
    return {'output_limit_reached':limited,'label': label, 'command': ['python3', '-B', script] + ([argument] if argument else []),
            'exit_code': code, 'wall_seconds': time.monotonic()-started,
            'stdout_sha256': file_digest(stdout),
            'stderr_sha256': file_digest(stderr)}

def main():
    p=argparse.ArgumentParser(); p.add_argument('--root', type=pathlib.Path, default=HERE.parent)
    p.add_argument('--base', required=True); p.add_argument('--sha', required=True)
    p.add_argument('--output', type=pathlib.Path, required=True); a=p.parse_args()
    if a.output.exists(): raise ValueError('output must be new')
    a.output.mkdir(parents=True)
    result={'candidate_sha':a.sha, 'base_sha':a.base, 'image':IMAGE,
            'evaluator_sha256':file_digest(pathlib.Path(__file__)),
            'resolver_sha256':file_digest(HERE/'research-agent-resolve.py'),
            'scope':'Independent execution of author-authored candidate tests; no semantic acceptance or VALUE multiplier.',
            'promoted':False, 'checks':[], 'status':'failed'}
    try:
        with tempfile.TemporaryDirectory(prefix='fr-candidate-') as temp:
            candidate=pathlib.Path(temp)/'candidate'
            name, hashes=extract(a.root,a.base,a.sha,candidate)
            result.update(candidate=name, inputs=hashes)
            # tempfile parents default 0700: container user needs only this subtree.
            pathlib.Path(temp).chmod(0o755)
            for file in candidate.rglob('*'): file.chmod(0o755 if file.is_dir() else 0o644)
            candidate.chmod(0o755)
            subprocess.run(['docker','pull',IMAGE],check=True,timeout=180,stdout=subprocess.DEVNULL)
            for fixture in ['fixtures/input.json','fixtures/transfer.json']:
                for script in ['baseline.py','candidate.py']:
                    label=pathlib.Path(fixture).stem+'-'+pathlib.Path(script).stem
                    result['checks'].append(run_one(candidate,label,script,fixture,a.output))
            result['checks'].append(run_one(candidate,'author-tests','test.py',None,a.output))
            # A fresh container has no prior execution state or original FR checkout.
            result['checks'].append(run_one(candidate,'fresh-container-tests','test.py',None,a.output))
            result['status']='execution_reproduced' if all(x['exit_code']==0 for x in result['checks']) else 'failed'
    except (OSError, ValueError, subprocess.SubprocessError) as error:
        result['error']=str(error)
    (a.output/'result.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({'status':result['status'],'candidate_sha':a.sha,'promoted':False}))
    return 0 if result['status']=='execution_reproduced' else 1

if __name__=='__main__': raise SystemExit(main())
