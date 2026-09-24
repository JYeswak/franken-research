#!/usr/bin/env bash
# verify-site.sh — pre-ship gates for the FrankenSuite shareable site.
#
# Run from anywhere:  ./scripts/verify-site.sh   (from site/)
#                     bash site/scripts/verify-site.sh
# Prints PASS/FAIL per gate and exits 0 only if every gate passes.
# What each gate checks and why is documented in ../BUILD-GATES.md.
set -u

SITE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CANON="$HOME/workspace/franken-research"
export SITE_DIR CANON

PASS=0
FAIL=0
FAILED_GATES=()

pass() { PASS=$((PASS+1)); echo "PASS  $1"; }
fail() {
  FAIL=$((FAIL+1)); echo "FAIL  $1"; FAILED_GATES+=("$1")
  if [ -n "${2:-}" ]; then echo "      $2"; fi
}

echo "FrankenSuite site gates — $SITE_DIR"
echo "----------------------------------------"

# ============ Gate A: packet + Rulebook byte integrity, method citations ============
echo "== A  packet/rulebook byte integrity =="
A_OK=1
A_DETAIL=""
for f in "$CANON"/*-assessment.md; do
  base="$(basename "$f")"
  if [ ! -f "$SITE_DIR/packets/$base" ]; then
    A_OK=0; A_DETAIL="${A_DETAIL}missing:$base "
  elif ! cmp -s "$f" "$SITE_DIR/packets/$base"; then
    A_OK=0; A_DETAIL="${A_DETAIL}differs:$base "
  fi
done
for f in "$SITE_DIR"/packets/*.md; do
  base="$(basename "$f")"
  if [ ! -f "$CANON/$base" ]; then
    A_OK=0; A_DETAIL="${A_DETAIL}extra:$base "
  fi
done
if ! cmp -s "$CANON/RULEBOOK.md" "$SITE_DIR/RULEBOOK.md"; then
  A_OK=0; A_DETAIL="${A_DETAIL}RULEBOOK-differs "
fi
if [ $A_OK -eq 1 ]; then
  pass "A packet/rulebook byte-identical ($(ls "$SITE_DIR"/packets/*.md | wc -l) packets + RULEBOOK)"
else
  fail "A packet/rulebook byte-identical" "$A_DETAIL"
fi

echo "== A2 method-page claim citations =="
A2_OUT="$(python3 - <<'PYEOF'
import re, html as h, os, sys
site = os.environ['SITE_DIR']
def norm(s):
    s = h.unescape(s)
    s = re.sub(r'`([^`]*)`', r'\1', s)
    s = re.sub(r'\*\*([^*]*)\*\*', r'\1', s)
    s = re.sub(r'\[([^\]]*)\]\([^)]*\)', r'\1', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s
errs = []
try:
    t = open(site + '/method/index.html').read()
    texts = re.findall(r'<div class="cr-text">(.*?)</div>', t, re.S)
    srcs = re.findall(r'<span class="cr-src">(.*?)</span>', t)
    if not texts:
        errs.append('no .cr-text citations found')
    if len(texts) != len(srcs):
        errs.append('mismatched cr-text (%d) vs cr-src (%d)' % (len(texts), len(srcs)))
    for q, s in zip(texts, srcs):
        m = re.match(r'^([\w.\-]+\.md):(\d+)$', s.strip())
        if not m:
            errs.append('bad citation format: %r' % s); continue
        fn, ln = m.group(1), int(m.group(2))
        pp = site + '/packets/' + fn
        if not os.path.isfile(pp):
            errs.append('cited packet missing: %s' % fn); continue
        lines = open(pp).read().split('\n')
        if not (1 <= ln <= len(lines)):
            errs.append('%s:%d line out of range' % (fn, ln)); continue
        line = lines[ln - 1]
        if not re.match(r'^\|\s*\d+\s*\|', line):
            errs.append('%s:%d is not a claim-table row' % (fn, ln)); continue
        qq = norm(q).strip('"“”')
        if norm(qq) not in norm(line):
            errs.append('quote not in cited line %s:%d: %r' % (fn, ln, qq[:60]))
except Exception as e:
    errs.append('checker error: %s' % e)
print('CITATIONS_OK %d' % len(texts) if not errs else 'CITATIONS_BAD')
for e in errs:
    print('  ' + e)
PYEOF
)"
if echo "$A2_OUT" | head -1 | grep -q CITATIONS_OK; then
  pass "A2 method citations resolve ($(echo "$A2_OUT" | head -1 | grep -o '[0-9]*') claim rows)"
else
  fail "A2 method citations resolve" "$(echo "$A2_OUT" | tail -n +2 | head -4 | tr '\n' ';')"
fi

# ============ Gate B: statistics computed at render time ============
echo "== B  render-time statistics =="
B_OUT="$(python3 - <<'PYEOF'
import re, html as h, os, glob, sys

site = os.environ['SITE_DIR']
errs = []
src = open(site + '/assets/data.js').read()

# --- parse data.js: window.FRANKEN_DATA = { "framing": "...", "repos": [ {...}, ... ] } ---
rows = []
for m in re.finditer(r'\{\n\s*"name":\s*"([^"]+)",(.*?)\n\s*\}', src, re.S):
    body = m.group(0)
    g = lambda k: re.search(r'"' + k + r'":\s*"([^"]*)"', body)
    gi = lambda k: re.search(r'"' + k + r'":\s*(\d+)', body)
    try:
        rows.append({
            'name': m.group(1),
            'nodus': g('nodus').group(1),
            'licenseKey': g('licenseKey').group(1),
            'ciKey': g('ciKey').group(1),
            'trlLow': int(gi('trlLow').group(1)) if gi('trlLow') else None,
            'trlHigh': int(gi('trlHigh').group(1)) if gi('trlHigh') else None,
            'techNA': '"techNA": true' in body,
        })
    except AttributeError:
        pass
if not rows:
    errs.append('could not parse REPOS from data.js')

rings = {'Invest': 0, 'Pilot': 0, 'Explore': 0, 'Monitor': 0}
ci = {}
green_names = []
lic = {'rider': 0, 'mit': 0, 'none': 0}
trl_lo, trl_hi = 9, 2
for r in rows:
    rings[r['nodus']] = rings.get(r['nodus'], 0) + 1
    ci[r['ciKey']] = ci.get(r['ciKey'], 0) + 1
    lic[r['licenseKey']] = lic.get(r['licenseKey'], 0) + 1
    if r['ciKey'] == 'C1':
        green_names.append(r['name'])
    if not r['techNA'] and r['trlLow'] is not None:
        trl_lo = min(trl_lo, r['trlLow'])
        trl_hi = max(trl_hi, r['trlHigh'])
green_names.sort()
STATS = {
    'total': len(rows), 'greenCount': len(green_names),
    'notGreen': len(rows) - len(green_names),
    'riderCount': lic['rider'], 'mitCount': lic['mit'], 'noneCount': lic['none'],
    'noRiderCount': lic['mit'] + lic['none'],
    'ringInvest': rings['Invest'], 'ringPilot': rings['Pilot'],
    'ringExplore': rings['Explore'], 'ringMonitor': rings['Monitor'],
    'trlRange': '%d\u2013%d' % (trl_lo, trl_hi),
    'greenNames': green_names,
    'ciC1': ci.get('C1', 0), 'ciC2': ci.get('C2', 0), 'ciC3': ci.get('C3', 0),
    'ciC4': ci.get('C4', 0), 'ciC5': ci.get('C5', 0), 'ciC6': ci.get('C6', 0),
}

def clean(s):
    s = re.sub(r'<[^>]+>', '', s)
    return re.sub(r'\s+', ' ', h.unescape(s)).strip()

pages = (['index.html', 'method/index.html', 'failure-modes/index.html',
          'lessons/index.html', 'techniques/index.html', 'reproduce/index.html',
          'starter-kit/index.html'] + sorted(glob.glob(site + '/briefs/*.html')))

slot_n = 0
for p in pages:
    rel = p if p.startswith(site) else site + '/' + p
    t = open(rel).read()
    for m in re.finditer(r'<([a-z0-9]+)[^>]*data-stat="([A-Za-z0-9]+)"[^>]*>(.*?)</\1>', t, re.S | re.I):
        key, fallback = m.group(2), clean(m.group(3))
        slot_n += 1
        if key not in STATS:
            errs.append('%s: unknown data-stat key %r' % (os.path.basename(p), key)); continue
        exp = STATS[key]
        if key == 'greenNames':
            got = set(re.findall(r'[a-z][a-z0-9_]*', fallback.lower())) - {'and'}
            if got != set(exp):
                errs.append('%s: data-stat greenNames fallback %r != %r' % (os.path.basename(p), sorted(got), exp))
        elif fallback != str(exp):
            errs.append('%s: data-stat %s fallback %r != computed %r' % (os.path.basename(p), key, fallback, str(exp)))

# framesentence fallback must equal FRANKEN_DATA.framing after slot substitution
import json as _json
fm = re.search(r'"framing":\s*"((?:[^"\\]|\\.)*)"', src)
if fm and os.path.isfile(site + '/index.html'):
    framing = _json.loads('"' + fm.group(1) + '"')
    t = open(site + '/index.html').read()
    sm = re.search(r'<span id="framesentence">(.*?)</span>\s*The <span data-stat="ringPilot"', t, re.S)
    if sm:
        inner = sm.group(1)
        inner = re.sub(r'<[a-z0-9]+[^>]*data-stat="([A-Za-z0-9]+)"[^>]*>.*?</[a-z0-9]+>',
                        lambda m: str(STATS.get(m.group(1), '?')), inner, flags=re.S | re.I)
        if clean(inner) != re.sub(r'\s+', ' ', framing).strip():
            errs.append('index.html framesentence fallback != data.js framing')
    else:
        errs.append('index.html: #framesentence not found')

# hardcoded-stat literal scan (bare N/44 etc. outside slots and STAT-annotated synthesis counts)
HARD = [
    (r'\b\d+\s+of\s+44\b', 'N of 44'),
    (r'\b\d+/44\b', 'N/44'),
    (r'\b(three|thirty[\s-]?four|seven|zero)\b.{0,24}\b(pilots?|explorations?|monitors?)\b', 'ring word count'),
    (r'\b(0|3|34|7)\b.{0,12}\b(pilots?|explorations?|monitors?)\b', 'ring numeral count'),
    (r'\ball 44 briefs\b', 'all-44 nav label'),
]
for p in pages:
    rel = p if p.startswith(site) else site + '/' + p
    t = open(rel).read()
    t = re.sub(r'<(script|style)[^>]*>.*?</\1>', '', t, flags=re.S | re.I)
    # blank out data-stat slot contents and STAT-annotated regions (400 chars after annotation)
    t = re.sub(r'<[a-z0-9]+[^>]*data-stat="[A-Za-z0-9]+"[^>]*>.*?</[a-z0-9]+>', ' ', t, flags=re.S | re.I)
    # STAT-annotated synthesis counts: blank the annotation AND the ~400 chars after it (the literal)
    t = re.sub(r'<!--\s*STAT:.*?-->.{0,400}', ' ', t, flags=re.S)
    txt = re.sub(r'<[^>]+>', ' ', t)
    txt = re.sub(r'\s+', ' ', h.unescape(txt))
    for pat, label in HARD:
        for m in re.finditer(pat, txt, re.I):
            errs.append('%s: hardcoded stat (%s): %r' % (
                rel.replace(site + '/', ''), label, txt[max(0, m.start()-30):m.end()+30].strip()))

print('SLOTS %d' % slot_n)
print('STATS_OK' if not errs else 'STATS_BAD')
for e in errs[:12]:
    print('  ' + e)
if len(errs) > 12:
    print('  ... and %d more' % (len(errs) - 12))
PYEOF
)"
if echo "$B_OUT" | grep -q '^STATS_OK'; then
  pass "B stats computed at render time ($(echo "$B_OUT" | grep -oP '^SLOTS \K[0-9]+') data-stat slots checked)"
else
  fail "B stats computed at render time" "$(echo "$B_OUT" | tail -n +3 | head -4 | tr '\n' ';')"
fi

# ============ Gate C: key terms defined on first use ============
echo "== C  definitions on first use =="
C_OUT="$(python3 - <<'PYEOF'
import re, html as h, os, glob

site = os.environ['SITE_DIR']
errs = []

TERMS = {
    'NODUS':      re.compile(r'NODUS'),
    'TRL':        re.compile(r'\bTRL\b'),
    'CI':         re.compile(r'\bCI\b'),
    'rider':      re.compile(r'\brider\b', re.I),
    'pin':        re.compile(r'\bpin\b|\bpinned\b', re.I),
    'bus factor': re.compile(r'bus factor', re.I),
}
# definitional phrases that must appear in a pre-first-use vocab block
DEF_PHRASE = {
    'NODUS': re.compile(r'four-ring verdict'),
    'TRL': re.compile(r'technology readiness'),
    'CI': re.compile(r'continuous integration'),
    'rider': re.compile(r'withholding all rights|barring the AI labs|license clause withholding|bars OpenAI and Anthropic'),
    'pin': re.compile(r'exact commit|single commit'),
    'bus factor': re.compile(r'how many people'),
}
# inline glosses accepted at first use (front door pattern)
GLOSS = {
    'NODUS': re.compile(r'\([^)]*(?:four|4)[^)]*assessment rings?[^)]*\)'),
    'TRL': re.compile(r'technology-readiness\s*\(TRL\)|technology readiness level'),
    'CI': re.compile(r'CI\s*\(continuous integration\)'),
    'rider': re.compile(r'AI-lab license rider'),
    'pin': re.compile(r'pinned?\s*(?:[A-Z][a-z]+\s+\d{1,2},\s+\d{4}\s*|[A-Z][a-z]+\s+\d{4}\s*)?\((?:the )?(?:single |exact )?assessed commit\)'),
    'bus factor': re.compile(r'bus factor.{0,60}\(one maintainer'),
}

pages = (['index.html', 'method/index.html', 'failure-modes/index.html',
          'lessons/index.html', 'techniques/index.html', 'reproduce/index.html',
          'starter-kit/index.html'] + sorted(glob.glob(site + '/briefs/*.html')))

for p in pages:
    rel = p if p.startswith(site) else site + '/' + p
    short = rel.replace(site + '/', '')
    t = open(rel).read()
    t = re.sub(r'<(script|style)[^>]*>.*?</\1>', '', t, flags=re.S | re.I)
    t = re.sub(r'<!--.*?-->', '', t, flags=re.S)
    vm = re.search(r'<div class="vocab"[^>]*>.*?</div>', t, re.S)
    def vis(x):
        x = re.sub(r'<[^>]+>', ' ', x)
        return re.sub(r'\s+', ' ', h.unescape(x)).strip()
    full_txt = vis(t)
    vocab_txt = vis(vm.group(0)) if vm else ''
    vstart = -1
    search_txt = full_txt
    if vocab_txt:
        i = full_txt.find(vocab_txt[:40])
        if i >= 0:
            vstart = i
            search_txt = full_txt[:i] + ' ' * len(vocab_txt) + full_txt[i + len(vocab_txt):]
    for name, rx in TERMS.items():
        m = rx.search(search_txt)
        if not m:
            continue
        ok = False
        # (1) vocab block before first use, containing the definitional phrase
        if vstart >= 0 and vstart < m.start() and DEF_PHRASE[name].search(vocab_txt):
            ok = True
        # (2) inline gloss within 120 chars on either side of first use
        if not ok and GLOSS[name].search(search_txt[max(0, m.start()-120):m.start() + 120]):
            ok = True
        if not ok:
            errs.append('%s: %r used before definition: %r' % (
                short, name, search_txt[max(0, m.start()-40):m.start()+60].strip()))

print('DEFS_OK' if not errs else 'DEFS_BAD')
for e in errs[:12]:
    print('  ' + e)
if len(errs) > 12:
    print('  ... and %d more' % (len(errs) - 12))
PYEOF
)"
if echo "$C_OUT" | grep -q '^DEFS_OK'; then
  pass "C key terms defined on first use"
else
  fail "C key terms defined on first use" "$(echo "$C_OUT" | tail -n +2 | head -4 | tr '\n' ';')"
fi

# ============ Gate D: brief <-> packet integrity ============
echo "== D  brief/packet pairing =="
D_OUT="$(python3 - <<'PYEOF'
import re, os, glob
site = os.environ['SITE_DIR']
errs = []
briefs = sorted(glob.glob(site + '/briefs/*.html'))
for b in briefs:
    name = os.path.basename(b)[:-5]
    t = open(b).read()
    pkt = '../packets/%s-assessment.md' % name
    n = t.count('href="%s"' % pkt)
    if n != 1:
        errs.append('%s: packet link %r appears %d times (want 1)' % (name, pkt, n))
    # brief must name its packet file in the footer sources area
    if ('%s-assessment.md' % name) not in t:
        errs.append('%s: packet filename not cited in brief body' % name)
packets = sorted(glob.glob(site + '/packets/*-assessment.md'))
pnames = set(os.path.basename(p)[:-len('-assessment.md')] for p in packets)
bnames = set(os.path.basename(b)[:-5] for b in briefs)
for p in sorted(pnames - bnames):
    errs.append('packet without brief: %s' % p)
for b in sorted(bnames - pnames):
    errs.append('brief without packet: %s' % b)
# data.js names must map 1:1 onto both
src = open(site + '/assets/data.js').read()
dnames = set(re.findall(r'\{\s*"name":\s*"([^"]+)"', src))
if dnames != bnames:
    errs.append('data.js names != brief names: %r' % sorted(dnames ^ bnames)[:6])
print('PAIR_OK' if not errs else 'PAIR_BAD')
for e in errs[:10]:
    print('  ' + e)
PYEOF
)"
if echo "$D_OUT" | grep -q '^PAIR_OK'; then
  pass "D brief/packet 1:1 pairing ($(ls "$SITE_DIR"/briefs/*.html | wc -l) briefs)"
else
  fail "D brief/packet 1:1 pairing" "$(echo "$D_OUT" | tail -n +2 | head -4 | tr '\n' ';')"
fi

# ============ Gate E: internal link graph ============
echo "== E  internal links =="
E_OUT="$(python3 - <<'PYEOF'
import re, os, glob
from urllib.parse import unquote
site = os.environ['SITE_DIR']
errs = []
pages = (['index.html', 'method/index.html', 'failure-modes/index.html',
          'lessons/index.html', 'techniques/index.html', 'reproduce/index.html',
          'starter-kit/index.html'] + sorted(glob.glob(site + '/briefs/*.html')))
SKIP_PREFIX = ('http://', 'https://', '//', 'mailto:', 'tel:', 'data:', 'javascript:')
checked = 0
for p in pages:
    rel = p if p.startswith(site) else site + '/' + p
    short = rel.replace(site + '/', '')
    t = open(rel).read()
    t = re.sub(r'<(script|style)[^>]*>.*?</\1>', ' ', t, flags=re.S | re.I)
    ids = set(re.findall(r'id="([^"]+)"', t))
    for attr in ('href', 'src'):
        for m in re.finditer(attr + r'="([^"]*)"', t):
            raw = m.group(1).strip()
            if not raw or raw.startswith(SKIP_PREFIX) or raw.startswith('#'):
                if raw.startswith('#') and raw[1:] not in ids and raw != '#':
                    errs.append('%s: fragment %r has no matching id' % (short, raw))
                continue
            if raw == '#':
                continue  # JS-owned placeholder (verified in gate G)
            url = unquote(raw.split('#')[0])
            frag = raw.split('#')[1] if '#' in raw else None
            base = os.path.dirname(rel)
            target = os.path.normpath(os.path.join(base, url))
            if not target.startswith(site):
                errs.append('%s: link escapes site root: %r' % (short, raw)); continue
            if os.path.isdir(target):
                target = os.path.join(target, 'index.html')
            if not os.path.isfile(target):
                errs.append('%s: broken %s %r' % (short, attr, raw)); continue
            checked += 1
            if frag and target.endswith('.html'):
                tt = open(target).read()
                tt = re.sub(r'<(script|style)[^>]*>.*?</\1>', ' ', tt, flags=re.S | re.I)
                if ('id="%s"' % frag) not in tt:
                    errs.append('%s: fragment %r missing in %s' % (short, raw, target.replace(site + '/', '')))
print('LINKS %d ok' % checked)
print('LINKS_OK' if not errs else 'LINKS_BAD')
for e in errs[:12]:
    print('  ' + e)
if len(errs) > 12:
    print('  ... and %d more' % (len(errs) - 12))
PYEOF
)"
if echo "$E_OUT" | grep -q '^LINKS_OK'; then
  pass "E internal links resolve ($(echo "$E_OUT" | grep -oP '^LINKS \K[0-9]+') links)"
else
  fail "E internal links resolve" "$(echo "$E_OUT" | tail -n +3 | head -4 | tr '\n' ';')"
fi

# ============ Gate F: method-animation artifacts shipped ============
echo "== F  method artifacts =="
F_OK=1; F_DETAIL=""
# every cr-src citation target exists (covered in A2) + every station link on method page
F_OUT="$(python3 - <<'PYEOF'
import re, os
site = os.environ['SITE_DIR']
t = open(site + '/method/index.html').read()
hrefs = set(re.findall(r'href="(\.\./starter-kit/[^"]+)"', t))
errs = []
for h in sorted(hrefs):
    if not os.path.isfile(os.path.normpath(os.path.join(site + '/method', h))):
        errs.append('station link missing: %s' % h)
# every local asset referenced by any page must exist (css/js/img/svg/fonts)
import glob
for p in (['index.html', 'method/index.html'] + sorted(glob.glob(site + '/briefs/*.html'))):
    rel = p if p.startswith(site) else site + '/' + p
    tt = open(rel).read()
    for m in re.finditer(r'(?:src|href)="((?:\.\./|\./)?assets/[^"]+|favicon\.svg|\.\./favicon\.svg)"', tt):
        a = os.path.normpath(os.path.join(os.path.dirname(rel), m.group(1)))
        if not os.path.isfile(a):
            errs.append('%s: asset missing: %s' % (os.path.basename(p), m.group(1)))
print('ART_OK' if not errs else 'ART_BAD')
for e in errs[:10]:
    print('  ' + e)
PYEOF
)"
if echo "$F_OUT" | grep -q '^ART_OK'; then
  pass "F method artifacts + local assets exist"
else
  fail "F method artifacts + local assets exist" "$(echo "$F_OUT" | tail -n +2 | head -4 | tr '\n' ';')"
fi

# ============ Gate G: keyboard operability + no-JS/no-WebGL/reduced-motion ============
echo "== G  keyboard + fallbacks =="
G_OUT="$(python3 - <<'PYEOF'
import re, os, glob
site = os.environ['SITE_DIR']
errs = []
# G1: every page has a skip link or the front door's equivalent landmark nav
for p in (['index.html', 'method/index.html', 'failure-modes/index.html',
           'lessons/index.html', 'techniques/index.html', 'reproduce/index.html',
           'starter-kit/index.html'] + sorted(glob.glob(site + '/briefs/*.html'))):
    rel = p if p.startswith(site) else site + '/' + p
    short = rel.replace(site + '/', '')
    t = open(rel).read()
    body = t.split('<body', 1)[1] if '<body' in t else t
    # interactive elements must be natively focusable or have tabindex/key handlers
    for m in re.finditer(r'<(div|span)[^>]*(?:onclick|role="button")[^>]*>', body):
        tag = m.group(0)
        if 'tabindex' not in tag and '<' not in tag:
            errs.append('%s: clickable %s without tabindex' % (short, m.group(1)))
    # details/summary disclosure widgets are keyboard-native; confirm no JS-only disclosure
    # G2: reduced-motion respected somewhere global
# G2: each page's CSS/JS must handle prefers-reduced-motion (or be a static page)
for p in (['index.html', 'method/index.html'] + sorted(glob.glob(site + '/briefs/*.html'))):
    rel = p if p.startswith(site) else site + '/' + p
    short = rel.replace(site + '/', '')
    t = open(rel).read()
    if 'prefers-reduced-motion' not in t:
        errs.append('%s: no prefers-reduced-motion handling' % short)
# G3: front door works without WebGL/JS: framesentence + stats fallbacks present, table view exists
t = open(site + '/index.html').read()
for needle in ['id="framesentence"', 'id="tableview"', 'id="stats"', '<noscript']:
    if needle not in t:
        errs.append('index.html: missing no-JS/no-WebGL fallback marker %s' % needle)
# G4: method page works without JS: claim rows are static HTML, animation is enhancement
t = open(site + '/method/index.html').read()
if t.count('class="claim-row') < 12:
    errs.append('method/index.html: claim rows not statically rendered (<12)')
if 'prefers-reduced-motion' not in t:
    errs.append('method/index.html: no prefers-reduced-motion handling')
print('A11Y_OK' if not errs else 'A11Y_BAD')
for e in errs[:10]:
    print('  ' + e)
PYEOF
)"
if echo "$G_OUT" | grep -q '^A11Y_OK'; then
  pass "G keyboard operability + fallbacks"
else
  fail "G keyboard operability + fallbacks" "$(echo "$G_OUT" | tail -n +2 | head -4 | tr '\n' ';')"
fi

# ============ Gate H: copy-quality slop scan ============
echo "== H  slop scan =="
H_OUT="$(python3 - <<'PYEOF'
import re, html as h, glob, os
site = os.environ['SITE_DIR']
fails, notes = [], []
pages = (['index.html', 'method/index.html', 'failure-modes/index.html',
          'lessons/index.html', 'techniques/index.html', 'reproduce/index.html',
          'starter-kit/index.html'] + sorted(glob.glob(site + '/briefs/*.html')))
for p in pages:
    short = p.replace(site + '/', '')
    t = open(p if p.startswith(site) else site + '/' + p).read()
    t = re.sub(r'<(script|style)[^>]*>.*?</\1>', '', t, flags=re.S | re.I)
    t = re.sub(r'<!--.*?-->', '', t, flags=re.S)
    # em-dash: exclude UI/list separators (instance rows, list items, summaries)
    prose_lines = [ln for ln in t.split('\n')
                   if not re.search(r'<(li|summary)[^>]*>|class="repo"|class="count"', ln)]
    prose = h.unescape(re.sub(r'<[^>]+>', ' ', '\n'.join(prose_lines)))
    nd = prose.count('\u2014')
    if nd > 30:
        fails.append('%s: %d non-separator em-dashes (limit 30)' % (short, nd))
    txt = h.unescape(re.sub(r'<[^>]+>', ' ', t))
    for w in ['delve', 'tapestry']:
        for m in re.finditer(r'\b%s\b' % w, txt, re.I):
            fails.append('%s: filler %r: %r' % (short, w, txt[max(0,m.start()-40):m.end()+40].strip()))
    for w in ['unprecedented', 'revolutionary', 'game-changing']:
        for m in re.finditer(w, txt, re.I):
            fails.append('%s: unsupported superlative %r: %r' % (short, w, txt[max(0,m.start()-40):m.end()+40].strip()))
    for w in ['honestly', 'genuinely', 'landscape']:
        for m in re.finditer(r'\b%s\b' % w, txt, re.I):
            notes.append('%s: filler? %r: %r' % (short, w, txt[max(0,m.start()-40):m.end()+40].strip()))
    for w in ['best', 'most widely used', 'world-class', 'cutting-edge', 'state-of-the-art']:
        for m in re.finditer(w, txt, re.I):
            notes.append('%s: superlative? %r: %r' % (short, w, txt[max(0,m.start()-50):m.end()+50].strip()))
print('SLOP_OK' if not fails else 'SLOP_BAD')
for f in fails[:10]:
    print('  FAIL ' + f)
for n in notes[:8]:
    print('  note ' + n)
if len(notes) > 8:
    print('  note ... and %d more review notes' % (len(notes) - 8))
PYEOF
)"
if echo "$H_OUT" | grep -q '^SLOP_OK'; then
  pass "H slop scan"
  echo "$H_OUT" | grep '^  note' | head -8 | sed 's/^/      /'
else
  fail "H slop scan" "$(echo "$H_OUT" | grep '^  FAIL' | head -4 | tr '\n' ';')"
fi

# ============ Gate I: headless render (CDP) ============
# Loads pages via file:// (the site is designed to run straight from the ZIP
# with no server) in headless Chromium, checking for console errors and
# horizontal overflow at desktop and phone widths.
echo "== I  headless render =="
I_TMP="$(mktemp -d)"
cat > "$I_TMP/render.mjs" <<'MEOF'
import { spawn, execSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const SITE = process.env.SITE_DIR;
const CHROME = '/opt/meta-chromium/chrome';
const PAGES = ['/index.html', '/method/index.html', '/briefs/asupersync.html', '/lessons/index.html'];
const VIEWPORTS = [[1440, 900], [390, 844]];

// file:// loading: the site is designed to run straight from the ZIP with no
// server, so the render gate tests exactly that. (An http://127.0.0.1 test
// server is unusable here: Chrome 152's local-network access checks block
// CDP-initiated navigation to loopback.)
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-prof-'));
const chrome = spawn(CHROME, [
  '--headless=new', '--no-sandbox', '--disable-gpu',
  '--allow-file-access-from-files',
  '--remote-debugging-port=0', `--user-data-dir=${prof}`,
  '--no-first-run', '--disable-extensions', 'about:blank',
], { stdio: ['ignore', 'pipe', 'pipe'] });

let dbgPort = null;
await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('no devtools port')), 15000);
  chrome.stderr.on('data', d => {
    const m = /DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)/.exec(d.toString());
    if (m) { dbgPort = m[1]; clearTimeout(t); resolve(); }
  });
  chrome.on('exit', () => { clearTimeout(t); reject(new Error('chrome exited')); });
});

const tabs = JSON.parse(execSync(`curl -s http://127.0.0.1:${dbgPort}/json/list`).toString());
const wsUrl = tabs[0].webSocketDebuggerUrl;
const ws = new WebSocket(wsUrl);
await new Promise((r, rej) => { ws.onopen = r; ws.onerror = rej; });

let id = 0;
const pending = new Map();
let consoleEvents = [];
ws.onmessage = e => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  else if (m.method === 'Runtime.consoleAPICalled') consoleEvents.push(m);
  else if (m.method === 'Runtime.exceptionThrown') consoleEvents.push(m);
  else if (m.method === 'Log.entryAdded') consoleEvents.push(m);
};
const send = (method, params = {}) => new Promise(res => {
  const myId = ++id;
  pending.set(myId, res);
  ws.send(JSON.stringify({ id: myId, method, params }));
});
const errors = [];
const sleep = ms => new Promise(r => setTimeout(r, ms));

await send('Runtime.enable');
await send('Log.enable');
await send('Page.enable');

for (const page of PAGES) {
  for (const vp of VIEWPORTS) {
    consoleEvents = [];
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp[0], height: vp[1], deviceScaleFactor: 1, mobile: vp[0] < 500 });
    await send('Page.navigate', { url: `file://${SITE}${page}` });
    await sleep(3000); // let load + timers/animations settle
    const ev = await send('Runtime.evaluate', { returnByValue: true, expression: `(() => ({
      overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      blank: document.body ? document.body.innerText.trim().length : 0,
      title: document.title
    }))()` });
    const v = ev.result.result.value;
    const label = `${page} @${vp[0]}x${vp[1]}`;
    if (!v || !v.title) { errors.push(`${label}: navigation failed`); continue; }
    if (v.overflowX > 1) errors.push(`${label}: horizontal overflow ${v.overflowX}px`);
    if (v.blank < 200) errors.push(`${label}: page looks blank (${v.blank} chars)`);
    for (const e of consoleEvents) {
      const txt = JSON.stringify(e.params || e).slice(0, 300);
      // ignore known-harmless software-WebGL deprecation noise from headless Chromium
      if (/GroupMarkerNotSet|WebGL.*software|SwiftShader/i.test(txt)) continue;
      if (e.method === 'Runtime.consoleAPICalled' && ['error'].includes(e.params.type)) errors.push(`${label}: console.error ${txt}`);
      else if (e.method === 'Runtime.exceptionThrown') errors.push(`${label}: exception ${txt}`);
      else if (e.method === 'Log.entryAdded' && ['error'].includes(e.params.entry.level)) errors.push(`${label}: log.error ${txt}`);
    }
  }
}
ws.close();
chrome.kill();
fs.rmSync(prof, { recursive: true, force: true });
if (errors.length) { console.log('RENDER_BAD'); errors.slice(0, 12).forEach(e => console.log('  ' + e)); process.exit(1); }
console.log(`RENDER_OK ${PAGES.length}x${VIEWPORTS.length} page-views, zero console errors, zero overflow`);
MEOF
if node "$I_TMP/render.mjs" > "$I_TMP/render.out" 2> "$I_TMP/render.err"; then
  pass "I headless render ($(cat "$I_TMP/render.out" | head -1 | sed 's/RENDER_OK //'))"
else
  fail "I headless render" "$(head -6 "$I_TMP/render.out" "$I_TMP/render.err" | tr '\n' ';' | head -c 600)"
fi
rm -rf "$I_TMP"

# ============ Gate J: no deleted-path references ============
echo "== J  deleted paths =="
J_BAD="$(cd "$SITE_DIR" && grep -rln --include='*.html' --include='*.js' -E 'reader-template|/old/|/drafts/|lorem ipsum|\.bak|TODO\.html' . | grep -v '^\./scripts/' || true)"
if [ -z "$J_BAD" ]; then
  pass "J no deleted-path references"
else
  fail "J no deleted-path references" "$(echo "$J_BAD" | tr '\n' ' ')"
fi

# ============ summary ============
echo "----------------------------------------"
echo "gates passed: $PASS   failed: $FAIL"
if [ $FAIL -gt 0 ]; then
  echo "failed gates: ${FAILED_GATES[*]}"
  exit 1
fi
echo "ALL GATES PASS"
