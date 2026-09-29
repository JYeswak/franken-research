#!/usr/bin/env python3
"""Render Apply and a reproducible public kit. No network, promotion or clock-based evidence.

Only explicitly listed first-party public files enter the archive. Source observations
are a separate unresolved queue; they never alter recipe approval or evidence dates.
"""
import argparse
import hashlib
import html
import io
import json
import pathlib
import re
import subprocess
import sys
import zipfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUTPUTS = ('site/apply/index.html', 'site/apply/catalog.json',
           'site/downloads/fr-starter-kit.zip', 'site/downloads/manifest.json')


def sha(data):
    return hashlib.sha256(data).hexdigest()


def encoded(data):
    return (json.dumps(data, indent=2, sort_keys=True) + '\n').encode()


def safe_file(root, name):
    path = pathlib.PurePosixPath(name)
    if not name or path.is_absolute() or '..' in path.parts or path.as_posix() != name or '\\' in name:
        raise ValueError('unsafe public path: ' + name)
    target = root / name
    if any((root / pathlib.Path(*path.parts[:i])).is_symlink() for i in range(1, len(path.parts)+1)):
        raise ValueError('symlink public path: ' + name)
    if not target.is_file():
        raise ValueError('missing public file: ' + name)
    return target.read_bytes()


def inputs(root):
    members = {}
    names = [s.strip() for s in (root / 'research/kit-public-files.txt').read_text().splitlines()
             if s.strip() and not s.startswith('#')]
    if not names or len(names) != len(set(names)):
        raise ValueError('empty or duplicate public member list')
    for name in names:
        if name in ('MANIFEST.json', 'LICENSE') or name.startswith('research/'):
            raise ValueError('reserved public path: ' + name)
        members[name] = safe_file(root / 'starter-kit', name)
    members['LICENSE'] = safe_file(root, 'LICENSE')
    recipes = json.loads(safe_file(root, 'research/recipes.json'))
    if recipes.get('version') != 1 or not recipes.get('recipes'):
        raise ValueError('invalid recipe catalog')
    ids = set()
    for recipe in recipes['recipes']:
        if not re.fullmatch(r'[a-z0-9-]+', recipe['id']) or recipe['id'] in ids:
            raise ValueError('invalid/duplicate recipe id')
        ids.add(recipe['id'])
        for key in ('title', 'need', 'requires', 'command', 'expect', 'limit', 'test'):
            if not isinstance(recipe[key], str) or not recipe[key].strip():
                raise ValueError('missing recipe field ' + key)
        if not recipe['files'] or any(f not in members for f in recipe['files']):
            raise ValueError('recipe cites unshipped code: ' + recipe['id'])
        recipe['file_sha256'] = {f: sha(members[f]) for f in recipe['files']}
    latest = json.loads(safe_file(root, 'watch/latest.json'))
    live = json.loads(safe_file(root, 'watch/live.json'))
    if latest['checked_at'] != live['checked_at']:
        raise ValueError('watch snapshots disagree')
    signals = {'checked_at': live['checked_at'], 'scope': 'Unresolved upstream signals, not adopted techniques.',
               'source_sha256': sha(safe_file(root, 'watch/live.json')), 'queue': []}
    for row in live['repos']:
        if row['state'] == 'current':
            continue
        if not re.fullmatch(r'[A-Za-z0-9_-]+', row['repo']):
            raise ValueError('invalid repository slug')
        signals['queue'].append({k: row[k] for k in ('repo', 'state', 'state_reason')})
    signals['queue'].sort(key=lambda r: r['repo'])
    members['research/recipes.json'] = encoded(recipes)
    # Code revision excludes daily signals: a watch refresh is not a new code approval.
    code_revision = sha(encoded({p: sha(b) for p, b in sorted(members.items())}))
    members['research/signals.json'] = encoded(signals)
    manifest = {'schema': 'fr.public-kit/v1', 'code_revision': code_revision,
                'observed_at': live['checked_at'], 'license': 'MIT (first-party kit files only)',
                'scope': 'MANIFEST.json lists every other archive member; no private receipts or upstream source bytes.',
                'files': {p: {'sha256': sha(b), 'bytes': len(b)} for p, b in sorted(members.items())}}
    members['MANIFEST.json'] = encoded(manifest)
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, 'w', compression=zipfile.ZIP_STORED) as archive:
        for name, data in sorted(members.items()):
            info = zipfile.ZipInfo('fr-starter-kit/' + name, date_time=(1980, 1, 1, 0, 0, 0))
            info.create_system = 3
            info.external_attr = 0o100644 << 16
            archive.writestr(info, data)
    bundle = buffer.getvalue()
    catalog = {**recipes, 'code_revision': code_revision, 'signals': signals,
               'archive_sha256': sha(bundle), 'archive_bytes': len(bundle)}
    return catalog, bundle, {**manifest, 'archive': {'path': 'fr-starter-kit.zip', 'sha256': sha(bundle), 'bytes': len(bundle)}}


def render(root, catalog):
    e = html.escape
    cards = []
    for r in catalog['recipes']:
        links = ' · '.join('<a href="../starter-kit/' + e(f) + '">' + e(f) + '</a>' for f in r['files'])
        cards.append(f'''<section class="card" id="{r['id']}"><h2>{e(r['title'])}</h2>
<p>{e(r['need'])}</p><p><b>Requires:</b> {e(r['requires'])}</p>
<pre><code>{e(r['command'])}</code></pre><p><b>Expected:</b> {e(r['expect'])}</p>
<p><b>Limits:</b> {e(r['limit'])}</p><p class="files">{links}</p>
<details><summary>Reproduce the repository check</summary><pre><code>{e(r['test'])}</code></pre>
<p>Commands above start in the extracted kit. This check starts in an FR checkout.
The manifest identifies the exact shipped bytes; test success does not certify the meaning of a research claim.</p></details></section>''')
    queue = ''.join(f'<li><a href="../briefs/{e(r["repo"])}.html">{e(r["repo"])}</a> — {e(r["state"])}: {e(r["state_reason"])}</li>' for r in catalog['signals']['queue'])
    page = f'''<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Apply the research — Franken Research</title><meta name="description" content="Download runnable research tools, try a complete evidence cycle, and inspect changes awaiting investigation.">
<link rel="icon" href="../favicon.svg" type="image/svg+xml">
<style>
:root{{color-scheme:dark}}*{{box-sizing:border-box}}body{{margin:0;background:#0f1319;color:#ece7da;font:16px/1.6 system-ui,sans-serif;padding:20px}}.wrap{{max-width:1040px;margin:auto}}a{{color:#ffbd59}}h1{{font-size:clamp(28px,5vw,46px);line-height:1.15}}h2{{font-size:22px}}.eyebrow{{color:#9aa3b2;text-transform:uppercase;letter-spacing:.12em;font-size:12px}}.lede{{font-size:19px;max-width:750px}}.card{{padding:24px;border:1px solid #303b4e;border-radius:14px;background:#151b25;margin:24px 0}}pre{{background:#0b0e13;padding:16px;border-radius:8px;overflow:auto;font-size:13px}}.files,small{{font-size:13px}}.files,code{{overflow-wrap:anywhere}}.download{{display:inline-block;background:#ffbd59;color:#101820;padding:12px 20px;border-radius:8px;font-weight:700}}.skip{{position:absolute;left:-9999px}}.skip:focus{{left:0}}details{{margin-top:18px}}@media(max-width:500px){{body{{padding:14px}}.card{{padding:16px}}}}
</style></head><body><a class="skip" href="#main">Skip to content</a><div class="wrap"><nav class="back"></nav>
<main id="main"><p class="eyebrow">Learn → run → inspect → adapt</p><h1>Put the research to work.</h1>
<p class="lede">Start with tools you can run in your own project. Inspect what they actually check, then decide what to adopt.</p>
<p><a class="download" href="../downloads/fr-starter-kit.zip" download>Download the runnable kit</a> &nbsp; <a href="../downloads/manifest.json">Hashes and file manifest</a></p>
<p><small>Code revision <code>{catalog['code_revision'][:16]}</code> · {len(catalog['recipes'])} worked entry points · MIT first-party code.
No third-party source snapshots or private experiment logs are bundled.</small></p>
<p>Extract the ZIP and start in <code>fr-starter-kit/</code>. Compare its SHA-256 with the manifest before running it.
For existing projects, review and copy selected files; reinstalling is not an upgrade procedure.</p>
{''.join(cards)}
<section class="card"><h2>What needs investigation next?</h2>
<p>Last upstream observation: <time id="observed" datetime="{e(catalog['signals']['checked_at'])}">{e(catalog['signals']['checked_at'])}</time>.
<strong id="age">Check the observation time before relying on freshness.</strong></p>
<p>This queue changes with the daily watch. Changed or unknown upstream facts do not approve a new technique or rewrite an assessment at its recorded commit.</p><ul>{queue or '<li>No unresolved signals in this snapshot.</li>'}</ul>
<p><a href="https://github.com/JYeswak/franken-research/actions/workflows/watch.yml">Daily collection runs</a> ·
<a href="https://github.com/JYeswak/franken-research/pulls?q=is%3Apr+%22%5Bresearch-candidate%5D%22">Runnable cloud candidates and review</a></p>
<p>Candidate generation needs a configured coding-engine credential. A draft candidate is unaccepted code; independent tests and review precede promotion into this kit.
Raw candidates are never added to this download automatically.</p></section>
<section class="card"><h2>What counts as better?</h2><p>Measure a fresh user task: correct application, missed or false claims, transfer failures, and total setup, review and maintenance effort.
These tools have bounded regression checks. A 100× improvement in research value has not been demonstrated.</p>
<p><a href="catalog.json">Machine-readable recipes and queue</a> · <a href="../starter-kit/index.html">Complete kit instructions</a></p></section>
</main></div><script>
(function(){{var t=Date.parse(document.getElementById('observed').dateTime);var h=(Date.now()-t)/3600000;
document.getElementById('age').textContent=Number.isFinite(h)?(h>36?'STALE — latest collection is over 36 hours old.':h<0?'Observation time is ahead of this device clock.':'Observed within the last 36 hours; this is not a quality verdict.'):'Unknown observation time.';}})();
</script></body></html>'''
    # Use the existing shell implementation, rather than a second navigation template.
    js = "import {applyShell} from './site/scripts/shell.mjs'; let s=''; for await (const c of process.stdin) s+=c; process.stdout.write(applyShell('apply/index.html',s));"
    return subprocess.run(['node', '--input-type=module', '-e', js], input=page.encode(), cwd=root, check=True, stdout=subprocess.PIPE).stdout


def build(root):
    catalog, archive, manifest = inputs(root)
    return dict(zip(OUTPUTS, (render(root, catalog), encoded(catalog), archive, encoded(manifest))))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    try:
        output = build(ROOT)
        if args.check:
            stale = [p for p, data in output.items() if not (ROOT / p).is_file() or (ROOT / p).read_bytes() != data]
            if stale:
                raise ValueError('stale learning outputs: ' + ', '.join(stale))
        else:
            for p, data in output.items():
                (ROOT / p).parent.mkdir(parents=True, exist_ok=True)
                (ROOT / p).write_bytes(data)
        print('LEARNING_OK outputs=4 public-kit=deterministic scope=identity-and-delivery')
        return 0
    except (ValueError, KeyError, OSError, subprocess.CalledProcessError) as error:
        print('LEARNING_BAD ' + str(error), file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
