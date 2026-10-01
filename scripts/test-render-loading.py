#!/usr/bin/env python3
"""Exercise the actual render gate with a delayed and permanently failed stylesheet.

Chrome Fetch interception supplies the fault; no site files or gates are weakened.
Requires the same Node and CHROME_PATH as full verification.
"""
import os
from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
gate = (ROOT / 'site/scripts/verify-site.sh').read_text()
source = gate.split('cat > "$I_TMP/render.mjs" <<\'MEOF\'\n', 1)[1].split('\nMEOF', 1)[0]
start = source.index('const PAGES = ')
end = source.index(';', start) + 1
source = source[:start] + "const PAGES = ['/apply/index.html'];" + source[end:]
source = source.replace('const VIEWPORTS = [[1440, 900], [390, 844]];',
                        'const VIEWPORTS = [[1440, 900]];')
source = source.replace("await send('Page.enable');", """await send('Page.enable');
await send('Fetch.enable', {patterns:[{urlPattern:'*shell.css*',requestStage:'Request'}]});""")

with tempfile.TemporaryDirectory(prefix='fr-render-controls-') as temp:
    for label, handler, expected in [
        ('delayed', "setTimeout(()=>send('Fetch.continueRequest',{requestId:m.params.requestId}),5000)", 0),
        ('missing', "send('Fetch.failRequest',{requestId:m.params.requestId,errorReason:'Failed'})", 1),
    ]:
        script = source.replace('  const m = JSON.parse(e.data);',
                                '  const m = JSON.parse(e.data);\n  if(m.method===\'Fetch.requestPaused\') ' + handler + ';')
        path = Path(temp) / (label + '.mjs')
        path.write_text(script)
        result = subprocess.run(['node', str(path)], cwd=ROOT,
                                env={**os.environ, 'SITE_DIR': str(ROOT / 'site')},
                                text=True, capture_output=True, timeout=150)
        print(label + ':\n' + result.stdout + result.stderr, end='')
        if result.returncode != expected:
            raise SystemExit(f'{label}: expected {expected}, got {result.returncode}')
        if label == 'missing' and 'stylesheet did not load' not in result.stdout:
            raise SystemExit('missing control did not fail for its planted stylesheet fault')
print('RENDER_LOADING_CONTROLS_OK delayed_passed=1 missing_rejected=1')
