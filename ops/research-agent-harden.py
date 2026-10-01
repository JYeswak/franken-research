#!/usr/bin/env python3
"""Deterministic local hardening of pinned gh-aw v0.89.21 compiler output.

Run only after recompiling research-candidate.md. Refuses changed source patterns;
never updates the reviewed admission hashes. See research-agent.md for provenance.
"""
import argparse, json, pathlib, re

REMOVED = {'GH_AW_DEFAULT_OTLP_ENDPOINT','GH_AW_DEFAULT_OTLP_HEADERS','COPILOT_GITHUB_TOKEN',
           'GH_AW_GITHUB_MCP_SERVER_TOKEN','GH_AW_GITHUB_TOKEN'}

def harden(text):
    if '# fr-research-hardening:' in text: raise ValueError('already hardened; recompile first')
    metadata=json.loads(text.splitlines()[0].removeprefix('# gh-aw-metadata: '))
    if metadata.get('compiler_version')!='v0.89.21': raise ValueError('unreviewed compiler version')
    # No implicit telemetry receiver or secret inherited by all jobs.
    jobs_before=re.findall(r'^  ([a-z_]+):$',text[text.index('\njobs:\n'):],re.M)
    start=text.index('\nenv:\n'); end=text.index('\njobs:\n',start)
    block=text[start:end]
    if 'GH_AW_DEFAULT_OTLP_ENDPOINT' not in block or 'GH_AW_DEFAULT_OTLP_HEADERS' not in block:
        raise ValueError('OTLP default block changed')
    text=text[:start]+text[end:]
    # The public-repo publisher uses signed API commits with an explicit token.
    if text.count('persist-credentials: true')!=1: raise ValueError('checkout lifecycle changed')
    text=text.replace('persist-credentials: true','persist-credentials: false')
    pattern=r'^      - name: Configure Git credentials\n.*?(?=^      - |^  [A-Za-z_]+:)' 
    replacement = """      - name: Configure Git identity without credentials
        run: |
          git config --global user.email '41898282+github-actions[bot]@users.noreply.github.com'
          git config --global user.name 'github-actions[bot]'
          git config --global am.keepcr true
          git config --global --add safe.directory "$GITHUB_WORKSPACE"
"""
    text,count=re.subn(pattern,replacement,text,flags=re.M|re.S)
    if count!=3: raise ValueError('credential bootstrap changed')
    for secret in REMOVED:
        text=text.replace('${{ secrets.'+secret+' }}', "''")
    # The compiler preloads this pinned image but historically invokes the MCP tag.
    manifest=json.loads(next(x for x in text.splitlines() if x.startswith('# gh-aw-manifest: ')).split(': ',1)[1])
    gateway=next(x for x in manifest['containers'] if x['image'].startswith('ghcr.io/github/gh-aw-mcpg:'))
    text=re.sub(re.escape(gateway['image'])+r'(?!@sha256:)',gateway['pinned_image'],text)
    lines=text.splitlines()
    manifest['secrets']=[x for x in manifest['secrets'] if x not in REMOVED]
    lines[1]='# gh-aw-manifest: '+json.dumps(manifest,separators=(',',':'))
    lines=[x for x in lines if x not in {'#   - '+s for s in REMOVED}]
    lines.insert(2,'# fr-research-hardening: v1; regenerate with ops/research-agent-harden.py after pinned compiler')
    result='\n'.join(lines)+'\n'
    if re.search(r'secrets\.(?:'+ '|'.join(REMOVED)+r')\b',result): raise ValueError('unexpected remaining magic secret')
    jobs_after=re.findall(r'^  ([a-z_]+):$',result[result.index('\njobs:\n'):],re.M)
    if jobs_before!=jobs_after: raise ValueError('hardening altered job topology')
    return result

def main():
    p=argparse.ArgumentParser();p.add_argument('lock',type=pathlib.Path);a=p.parse_args()
    a.lock.write_text(harden(a.lock.read_text()))

if __name__=='__main__':main()
