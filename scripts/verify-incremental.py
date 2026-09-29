#!/usr/bin/env python3
"""Local reuse of full verification for narrowly scoped metadata changes.

Release/CI remains `bun run verify`. This command reports prior-result reuse,
never a freshly executed full suite. Cache is trusted private local state, not
an attestation for another user/host. Optional explicit BLAKE3 acceleration.
"""
import argparse
import ast
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import resource
import shutil
import stat
import subprocess
import sys
import tempfile
import time

ROOT = Path(__file__).resolve().parents[1]
VERSION = 1
HASH = hashlib.sha256
HASH_NAME = 'sha256'
BACKEND_FILES = []
BACKEND_VERSION = None
TOOLS = ['bun', 'node', 'python3', 'bash', 'git', 'diff', 'cmp', 'find', 'grep', 'sed', 'awk', 'xmllint', 'head', 'tail', 'wc', 'tr', 'cut', 'mktemp', 'cat', 'mkdir', 'rm', 'ls', 'cp']
INJECTED_INPUTS = ('BASH_ENV', 'ENV', 'NODE_OPTIONS', 'PYTHONPATH', 'PYTHONHOME',
                   'PYTHONSTARTUP', 'LD_PRELOAD', 'LD_LIBRARY_PATH')

def sha(data):
    return hashlib.sha256(data).hexdigest()

def file_sha(path):
    with open(path, 'rb') as f:
        return hashlib.file_digest(f, HASH).hexdigest()

def select_hash(name):
    global HASH, HASH_NAME, BACKEND_FILES, BACKEND_VERSION
    HASH, HASH_NAME, BACKEND_FILES, BACKEND_VERSION = hashlib.sha256, 'sha256', [], None
    if name == 'blake3':
        try:
            import blake3
        except ImportError as error:
            raise ValueError('explicit blake3 backend unavailable; install blake3==1.0.8 in an external venv') from error
        if blake3.__version__ != '1.0.8':
            raise ValueError('blake3 backend must be version 1.0.8')
        HASH, HASH_NAME, BACKEND_VERSION = blake3.blake3, name, blake3.__version__
        BACKEND_FILES = sorted(p.resolve() for p in Path(blake3.__file__).parent.iterdir()
                               if p.suffix in ('.py', '.so', '.pyd', '.dll'))

def hash_identity():
    # Independent SHA256 identity of wrapper/native implementation; never self-hashed.
    return {'algorithm': HASH_NAME, 'version': BACKEND_VERSION,
            'implementation_sha256': {str(p): sha(p.read_bytes()) for p in BACKEND_FILES}}

def run(args, root, **kwargs):
    return subprocess.run(args, cwd=root, text=True, capture_output=True, **kwargs)

def git(root, *args):
    p = run(['git', *args], root)
    if p.returncode:
        raise ValueError('git inspection failed: ' + p.stderr.strip())
    return p.stdout

def git_context(root):
    # Replacement refs alter `SHA^{commit}` without adding/removing objects.
    parts = [git(root, 'config', '--show-origin', '--list'),
             git(root, 'for-each-ref', '--format=%(refname) %(objectname)', 'refs/replace')]
    for name in ('info/grafts', 'shallow'):
        path = Path(git(root, 'rev-parse', '--git-path', name).strip())
        if not path.is_absolute(): path = root / path
        parts.append(file_sha(path) if path.is_file() else None)
    return sha(json.dumps(parts).encode())

def inventory(root):
    """Hash all files, including ignored dependencies; exclude only Git's own storage."""
    result = {}
    for directory, dirs, files in os.walk(root, followlinks=False):
        if Path(directory) == root:
            dirs[:] = [d for d in dirs if d != '.git']
            files = [f for f in files if f != '.git']
        for name in sorted(dirs + files):
            p = Path(directory) / name
            rel = p.relative_to(root).as_posix()
            s = p.lstat()
            mode = stat.S_IMODE(s.st_mode)
            if p.is_symlink():
                target = p.resolve()
                if not target.is_relative_to(root):
                    raise ValueError('external repository symlink: ' + rel)
                result[rel] = ['link', mode, os.readlink(p)]
            elif p.is_file():
                result[rel] = ['file', mode, file_sha(p)]
            elif p.is_dir():
                result[rel] = ['dir', mode]
            else:
                raise ValueError('unsupported filesystem entry: ' + rel)
    return result

def environment(root):
    # Keep secrets out of receipts: only the digest of environment values is stored.
    env = {k: v for k, v in os.environ.items() if k not in ('_', 'SHLVL')}
    binaries = {}
    for name in TOOLS:
        path = shutil.which(name)
        binaries[name] = [str(Path(path).resolve()), file_sha(path)] if path else None
    active_python = str(Path(sys.executable).resolve())
    path_python = binaries['python3']
    binaries['active_python'] = [active_python, path_python[1]
                                 if path_python and path_python[0] == active_python
                                 else file_sha(active_python)]
    chrome = os.environ.get('CHROME_PATH')
    if not chrome or not Path(chrome).is_file():
        raise ValueError('explicit CHROME_PATH required for local reuse')
    binaries['chrome'] = [str(Path(chrome).resolve()), file_sha(chrome)]
    objects = git(root, 'cat-file', '--batch-all-objects', '--batch-check=%(objectname) %(objecttype)')
    return {'root': str(root), 'env_sha256': sha(json.dumps(env, sort_keys=True).encode()),
            'tools': binaries, 'git_objects': sorted(objects.splitlines()),
            'tracked': git(root, 'ls-files', '-z').split('\0')[:-1],
            'git_context': git_context(root),
            'platform': list(os.uname()), 'python': sys.version, 'hash_backend': hash_identity()}

def snapshot(root):
    return {'files': inventory(root), 'environment': environment(root)}

def guard(root, env=None):
    """Detect concurrent writes without reading every binary twice.

    ctime/inode/mtime/size/mode are checked around content hashing and execution.
    This assumes the same trusted host (not a hostile privileged writer).
    """
    paths = []
    for directory, dirs, files in os.walk(root, followlinks=False):
        if Path(directory) == root:
            dirs[:] = [d for d in dirs if d != '.git']
            files = [f for f in files if f != '.git']
        paths.extend(Path(directory) / n for n in dirs + files)
    if env is None:
        tools = [shutil.which(n) for n in TOOLS] + [os.environ.get('CHROME_PATH'), sys.executable]
        paths.extend(Path(p).resolve() for p in tools if p)
    else:
        paths.extend(Path(v[0]) for v in env['tools'].values() if v)
    paths.extend(BACKEND_FILES)
    result = {}
    for p in paths:
        s = p.lstat()
        result[str(p)] = (s.st_dev, s.st_ino, s.st_mode, s.st_size, s.st_mtime_ns, s.st_ctime_ns)
    result['git_objects'] = git(root, 'cat-file', '--batch-all-objects', '--batch-check=%(objectname) %(objecttype)')
    result['tracked'] = git(root, 'ls-files', '-z')
    result['git_context'] = git_context(root)
    return result

def eligible(before, after):
    a, b = before['environment'].copy(), after['environment'].copy()
    ta, tb = set(a.pop('tracked')), set(b.pop('tracked'))
    oa, ob = set(a.pop('git_objects')), set(b.pop('git_objects'))
    if not oa <= ob:
        return False, [], 'Git objects removed or changed'
    if a != b:
        return False, [], 'environment/toolchain/Git object set changed'
    old, new = before['files'], after['files']
    changed = sorted({k for k in old.keys() | new.keys() if old.get(k) != new.get(k)} | (tb - ta))
    if not ta <= tb:
        return False, changed, 'tracked path removed'
    for path in set(changed) | (tb - ta):
        prev, now = old.get(path), new.get(path)
        if not now or now[0] != 'file' or now[1] not in (0o644, 0o600):
            return False, changed, 'non-regular/removed/mode-changed path: ' + path
        if prev and prev[:2] != now[:2]:
            return False, changed, 'type or mode changed: ' + path
        if path == '.beads/issues.jsonl' and prev:
            continue
        if (prev is None and path.startswith('docs/evidence/applied-research/')
                and path.endswith('.md') and path.count('/') == 3):
            continue
        return False, changed, 'outside narrow metadata allowance: ' + path
    return True, changed, 'unchanged code/data; eligible metadata changes only'

def privacy(root, changed):
    # Use the SAME predicate as Gate L, extracted from the currently bound gate.
    gate = (root / 'site/scripts/verify-site.sh').read_text()
    code = gate.split("L_OUT=\"$(python3 - <<'PYEOF'\n", 1)[1].split('\nPYEOF', 1)[0]
    tree = ast.parse(code)
    nodes = [n for n in tree.body if
             isinstance(n, ast.FunctionDef) and n.name == 'allowed' or
             isinstance(n, ast.Assign) and any(isinstance(t, ast.Name) and t.id == 'EMAIL' for t in n.targets)]
    if len(nodes) != 2:
        raise ValueError('Gate L predicate changed; full verification required')
    namespace = {'re': re}
    exec(compile(ast.Module(body=nodes, type_ignores=[]), '<Gate L predicate>', 'exec'), namespace)
    findings = []
    for name in changed:
        p = root / name
        if not p.is_file():
            continue
        data = p.read_bytes()
        if b'\0' in data[:8192]:
            continue
        for line, text in enumerate(data.decode('utf8', 'replace').split('\n'), 1):
            for email in namespace['EMAIL'].findall(text):
                if not namespace['allowed'](email):
                    findings.append(f'{name}:{line}: disallowed address')
    return findings

def fresh_checks(root, changed):
    findings = privacy(root, changed)
    check = run([sys.executable, '-B', 'scripts/check-decisions.py',
                 'docs/evidence/fr-evolution/decisions.json'], root)
    return {'privacy_findings': findings, 'decision_exit_code': check.returncode,
            'decision_stdout': check.stdout, 'decision_stderr': check.stderr,
            'ok': not findings and check.returncode == 0}

def read_cache(path, root):
    s = path.lstat()
    if not stat.S_ISREG(s.st_mode) or s.st_uid != os.getuid() or stat.S_IMODE(s.st_mode) != 0o600:
        raise ValueError('cache must be private regular owner file (0600)')
    data = json.loads(path.read_text())
    payload = data['payload']
    if data['sha256'] != sha(json.dumps(payload, sort_keys=True).encode()):
        raise ValueError('cache integrity mismatch')
    if payload['version'] != VERSION or payload['full']['exit_code'] != 0:
        raise ValueError('cache is not successful full verification')
    if 'gates passed: 26   failed: 0\nALL GATES PASS' not in payload['full']['stdout']:
        raise ValueError('cache lacks full gate result')
    if payload['snapshot']['environment']['root'] != str(root):
        raise ValueError('cache belongs to another checkout')
    return payload

def write_cache(path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, name = tempfile.mkstemp(prefix='.fr-verify-', dir=path.parent)
    try:
        with os.fdopen(fd, 'w') as f:
            json.dump({'payload': payload, 'sha256': sha(json.dumps(payload, sort_keys=True).encode())}, f)
        os.replace(name, path)
    finally:
        if os.path.exists(name): os.unlink(name)

def cpu():
    return sum(getattr(resource.getrusage(who), field) for who in
               (resource.RUSAGE_SELF, resource.RUSAGE_CHILDREN) for field in ('ru_utime', 'ru_stime'))

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--cache', required=True, type=Path)
    parser.add_argument('--hash', choices=['sha256', 'blake3'], default='sha256')
    parser.add_argument('--full', action='store_true', help='execute original full command and replace cache only on stable success')
    parser.add_argument('--explain', action='store_true', help='return 3 if full verification is required; do not run it')
    args = parser.parse_args()
    select_hash(args.hash)
    if args.cache.is_symlink(): raise ValueError('cache must not be a symlink')
    root = ROOT.resolve(); cache = args.cache.resolve()
    if cache.is_relative_to(root): raise ValueError('cache must be outside repository')
    start, cpu_start = time.perf_counter(), cpu()
    initial_guard = guard(root)
    before = snapshot(root)
    stable_guard = guard(root, before['environment'])
    if initial_guard != stable_guard:
        raise ValueError('inputs changed during hashing; result refused')
    reason = 'explicit full verification or unsafe reuse environment'
    prior = None
    if not args.full and not any(os.environ.get(k) for k in
            ('CI', 'UPDATE_GOLDENS', 'CANON', *INJECTED_INPUTS)):
        try:
            prior = read_cache(cache, root)
            ok, changed, reason = eligible(prior['snapshot'], before)
        except (OSError, ValueError, KeyError, TypeError) as error:
            ok, changed, reason = False, [], str(error)
        if ok:
            checks = fresh_checks(root, changed)
            if guard(root, before['environment']) != stable_guard:
                raise ValueError('inputs changed during verification; result refused')
            result = {'mode': 'reused_full_result_with_fresh_metadata_checks',
                      'scope': 'local validation only; full release/CI command unchanged',
                      'changed': changed, 'fresh': checks, 'prior_full_result_sha256': sha(json.dumps(prior['full'], sort_keys=True).encode()),
                      'wall_seconds': time.perf_counter()-start, 'cpu_seconds': cpu()-cpu_start}
            print(json.dumps(result)); return 0 if checks['ok'] else 1
    if args.explain:
        print(json.dumps({'mode': 'full_required', 'reason': reason})); return 3
    p = run(['bun', 'run', 'verify'], root)
    stable = guard(root, before['environment']) == stable_guard
    full = {'exit_code': p.returncode, 'stdout': p.stdout, 'stderr': p.stderr}
    if p.returncode == 0 and stable and 'gates passed: 26   failed: 0\nALL GATES PASS' in p.stdout:
        write_cache(cache, {'version': VERSION, 'snapshot': before, 'full': full})
    result = {'mode': 'full', 'reason': reason, 'stable': stable, 'full': full,
              'wall_seconds': time.perf_counter()-start, 'cpu_seconds': cpu()-cpu_start}
    print(json.dumps(result)); return p.returncode or (0 if stable else 2)

if __name__ == '__main__':
    try: sys.exit(main())
    except (ValueError, OSError, KeyError, TypeError) as error:
        print('INVALID: ' + str(error), file=sys.stderr); sys.exit(2)
