#!/usr/bin/env python3
"""Synthetic guard regressions. These do not mint a real verification receipt."""
import copy
import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('incremental', Path(__file__).with_name('verify-incremental.py'))
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)

class Guards(unittest.TestCase):
    def setUp(self):
        m.select_hash('sha256')
        self.base = {'environment': {'root': '/example', 'tools': {}, 'tracked': ['.beads/issues.jsonl'],
                                    'git_objects': ['abc commit'], 'env_sha256': 'env'},
                     'files': {'.beads/issues.jsonl': ['file', 0o644, 'a'],
                               'scripts/a.py': ['file', 0o644, 'a'],
                               'docs/evidence/applied-research/old.md': ['file', 0o644, 'a']}}
    def eligible(self, edit):
        x = copy.deepcopy(self.base); edit(x)
        return m.eligible(self.base, x)[0]
    def test_beads_and_new_note_are_eligible(self):
        self.assertTrue(self.eligible(lambda x: x['files']['.beads/issues.jsonl'].__setitem__(2, 'b')))
        self.assertTrue(self.eligible(lambda x: x['files'].__setitem__('docs/evidence/applied-research/new.md', ['file', 0o644, 'b'])))
    def test_existing_note_code_and_ignored_dependency_changes_require_full(self):
        for p in ['scripts/a.py', 'docs/evidence/applied-research/old.md', 'node_modules/a.js']:
            self.assertFalse(self.eligible(lambda x: x['files'].__setitem__(p, ['file', 0o644, 'b'])))
    def test_deletion_mode_and_symlink_require_full(self):
        self.assertFalse(self.eligible(lambda x: x['files'].pop('.beads/issues.jsonl')))
        for value in [['link', 0o777, '/elsewhere'], ['file', 0o755, 'a']]:
            self.assertFalse(self.eligible(lambda x: x['files'].__setitem__('.beads/issues.jsonl', value)))
    def test_environment_and_missing_objects_require_full(self):
        self.assertFalse(self.eligible(lambda x: x['environment'].__setitem__('env_sha256', 'new')))
        self.assertFalse(self.eligible(lambda x: x['environment'].__setitem__('git_objects', [])))
        self.assertTrue(self.eligible(lambda x: x['environment']['git_objects'].append('def blob')))
    def test_staging_existing_unchecked_file_is_not_eligible(self):
        self.assertFalse(self.eligible(lambda x: x['environment']['tracked'].append('scripts/a.py')))
    def test_newly_tracked_beads_is_privacy_checked_even_without_byte_change(self):
        old = copy.deepcopy(self.base); old['environment']['tracked'] = []
        ok, changed, _ = m.eligible(old, self.base)
        self.assertTrue(ok)
        self.assertIn('.beads/issues.jsonl', changed)
    def test_gate_l_actual_predicate(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d); (root/'site/scripts').mkdir(parents=True)
            (root/'site/scripts/verify-site.sh').write_bytes((m.ROOT/'site/scripts/verify-site.sh').read_bytes())
            note = root/'note.md'; note.write_text('noreply@example.invalid\n')
            self.assertEqual(m.privacy(root, ['note.md']), [])
            note.write_text('private' + '@' + 'example.invalid')
            self.assertEqual(len(m.privacy(root, ['note.md'])), 1)
    def test_cache_rejects_wrong_permissions_integrity_and_failed_full(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d); p = root/'cache.json'
            p.write_text('{}'); p.chmod(0o644)
            with self.assertRaises(ValueError): m.read_cache(p, root)
            p.chmod(0o600); p.write_text(json.dumps({'payload': {}, 'sha256': 'wrong'}))
            with self.assertRaises(ValueError): m.read_cache(p, root)
            payload = {'version': 1, 'full': {'exit_code': 1}}
            m.write_cache(p, payload)
            with self.assertRaises(ValueError): m.read_cache(p, root)
    def test_fifo_is_refused_without_reading(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d)/'fifo'; os.mkfifo(p, 0o600)
            with self.assertRaises(ValueError): m.read_cache(p, Path(d))
    def test_replacement_ref_changes_git_context_without_new_objects(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d); m.git(root, 'init', '-q')
            a = m.run(['git', 'hash-object', '-w', '--stdin'], root, input='a').stdout.strip()
            b = m.run(['git', 'hash-object', '-w', '--stdin'], root, input='b').stdout.strip()
            before = m.git_context(root)
            m.git(root, 'update-ref', 'refs/replace/'+a, b)
            self.assertNotEqual(before, m.git_context(root))

    def test_hash_backend_change_invalidates_reuse(self):
        self.base['environment']['hash_backend'] = {'algorithm': 'sha256'}
        self.assertFalse(self.eligible(lambda x: x['environment'].__setitem__('hash_backend', {'algorithm': 'blake3'})))

    def test_local_wrapper_refuses_ci_before_scrubbing(self):
        result = m.run(['bash', 'scripts/verify-local.sh', '--cache', '/unused'],
                       m.ROOT, env={**os.environ, 'CI': '1'})
        self.assertEqual(result.returncode, 2)
        self.assertIn('unavailable in CI', result.stderr)

    def test_optional_blake3_known_vector_and_modified_byte(self):
        if importlib.util.find_spec('blake3') is None:
            with self.assertRaises(ValueError): m.select_hash('blake3')
            return
        try:
            m.select_hash('blake3')
            with tempfile.TemporaryDirectory() as d:
                p = Path(d)/'input'; p.write_bytes(b'')
                self.assertEqual(m.file_sha(p), 'af1349b9f5f9a1a6a0404dea36dcc9499bcb25c9adc112b7cc9a93cae41f3262')
                before = m.file_sha(p); p.write_bytes(b'1')
                self.assertNotEqual(before, m.file_sha(p))
            identity = m.hash_identity()
            self.assertTrue(any(p.endswith('.py') for p in identity['implementation_sha256']))
            self.assertTrue(any(p.endswith(('.so', '.pyd')) for p in identity['implementation_sha256']))
        finally:
            m.select_hash('sha256')


if __name__ == '__main__': unittest.main()
