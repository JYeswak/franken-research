#!/usr/bin/env python3
"""Public download, update propagation and fail-closed publication regressions."""
import importlib.util
import io
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
import zipfile

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('learning', ROOT / 'scripts/build-learning.py')
learning = importlib.util.module_from_spec(spec)
spec.loader.exec_module(learning)


class LearningTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / 'source'
        self.root.mkdir()
        for directory in ('starter-kit', 'research'):
            shutil.copytree(ROOT / directory, self.root / directory)
        (self.root / 'watch').mkdir()
        for name in ('latest.json', 'live.json'):
            shutil.copyfile(ROOT / 'watch' / name, self.root / 'watch' / name)
        shutil.copyfile(ROOT / 'LICENSE', self.root / 'LICENSE')

    def test_download_install_and_move_transfer_without_repository(self):
        _, data, outside = learning.inputs(self.root)
        self.assertEqual(learning.sha(data), outside['archive']['sha256'])
        destination = Path(self.temp.name) / 'download'
        with zipfile.ZipFile(io.BytesIO(data)) as archive:
            names = archive.namelist()
            self.assertEqual(len(names), len(set(names)))
            self.assertFalse(any('..' in Path(n).parts for n in names))
            archive.extractall(destination)
        kit = destination / 'fr-starter-kit'
        manifest = json.loads((kit / 'MANIFEST.json').read_text())
        self.assertEqual(set(manifest['files']) | {'MANIFEST.json'},
                         {str(p.relative_to(kit)) for p in kit.rglob('*') if p.is_file()})
        for name, fact in manifest['files'].items():
            self.assertEqual(learning.sha((kit / name).read_bytes()), fact['sha256'])
        shutil.rmtree(self.root)
        project = Path(self.temp.name) / 'new consumer'
        run = subprocess.run([sys.executable, str(kit / 'examples/decision-cycle/run.py'), str(project)],
                             cwd=destination, capture_output=True, text=True)
        self.assertEqual(run.returncode, 0, run.stdout + run.stderr)
        moved = Path(self.temp.name) / 'another consumer'
        shutil.move(str(project / 'public-transfer'), moved)
        shutil.rmtree(project)
        shutil.rmtree(destination)
        result = subprocess.run([sys.executable, 'scripts/check-decisions.py', 'decisions.json', '--root', '.'],
                                cwd=moved, capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn('REVIEW', result.stdout)

    def test_deterministic_and_signal_change_does_not_reapprove_code(self):
        before, bundle, _ = learning.inputs(self.root)
        self.assertEqual(bundle, learning.inputs(self.root)[1])
        for name in ('latest.json', 'live.json'):
            p = self.root / 'watch' / name
            data = json.loads(p.read_text())
            data['checked_at'] = '2026-09-27T00:00:00Z'
            p.write_text(json.dumps(data))
        after, changed, _ = learning.inputs(self.root)
        self.assertNotEqual(bundle, changed)
        self.assertEqual(before['code_revision'], after['code_revision'])
        self.assertEqual(before['recipes'], after['recipes'])
        self.assertNotEqual(before['signals']['checked_at'], after['signals']['checked_at'])

    def test_accepted_code_change_updates_archive_and_recipe_binding(self):
        before, data, _ = learning.inputs(self.root)
        p = self.root / 'starter-kit/scripts/check-decisions.py'
        p.write_text(p.read_text() + '\n# reviewed revision fixture\n')
        after, changed, _ = learning.inputs(self.root)
        self.assertNotEqual(before['code_revision'], after['code_revision'])
        self.assertNotEqual(data, changed)
        self.assertNotEqual(before['recipes'][-1]['file_sha256'], after['recipes'][-1]['file_sha256'])

    def test_unlisted_private_file_never_enters_download(self):
        _, before, _ = learning.inputs(self.root)
        (self.root / 'starter-kit/private.json').write_text('DO NOT SHIP')
        self.assertEqual(before, learning.inputs(self.root)[1])

    def test_traversal_symlink_and_unshipped_recipe_fail(self):
        allow = self.root / 'research/kit-public-files.txt'
        original = allow.read_text()
        for path in ('../LICENSE', '/etc/passwd', 'scripts/../README.md', 'scripts\\private.py'):
            allow.write_text(original + path + '\n')
            with self.assertRaises(ValueError):
                learning.inputs(self.root)
        allow.write_text(original)
        target = self.root / 'starter-kit/scripts/check-decisions.py'
        target.unlink()
        target.symlink_to(ROOT / 'starter-kit/scripts/check-decisions.py')
        with self.assertRaisesRegex(ValueError, 'symlink'):
            learning.inputs(self.root)
        target.unlink()
        shutil.copyfile(ROOT / 'starter-kit/scripts/check-decisions.py', target)
        catalog = self.root / 'research/recipes.json'
        data = json.loads(catalog.read_text())
        data['recipes'][0]['files'].append('not-shipped.py')
        catalog.write_text(json.dumps(data))
        with self.assertRaisesRegex(ValueError, 'unshipped'):
            learning.inputs(self.root)

    def test_corrupted_archive_is_detectable(self):
        _, data, manifest = learning.inputs(self.root)
        corrupted = data[:50] + bytes([data[50] ^ 1]) + data[51:]
        self.assertNotEqual(learning.sha(corrupted), manifest['archive']['sha256'])

    def test_committed_page_and_bundle_are_current(self):
        for name, expected in learning.build(ROOT).items():
            self.assertEqual((ROOT / name).read_bytes(), expected, name + ' is stale')


if __name__ == '__main__':
    unittest.main()
