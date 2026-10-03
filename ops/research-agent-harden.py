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
    # The stripped global env block leaves the gateway's OTLP endpoint to
    # expand empty at runtime; pinned mcpg v0.4.25 schema-rejects an empty
    # endpoint (minLength/pattern). Pin an inert local collector instead:
    # export toward an unreachable loopback endpoint is non-fatal for mcpg.
    endpoint='"endpoint": "${OTEL_EXPORTER_OTLP_ENDPOINT}"'
    if text.count(endpoint)!=1: raise ValueError('gateway OTLP endpoint placeholder changed')
    text=text.replace(endpoint,'"endpoint": "http://127.0.0.1:4318/v1/traces"')
    # gh-aw strips the provider prefix from engine.model, but the prefixed id
    # is what Groq's Responses API serves (bare id 404s). Restore it in the
    # two codex model env pins: the agent run and threat detection.
    for var in ('GH_AW_MODEL_AGENT_CODEX','GH_AW_MODEL_DETECTION_CODEX'):
        pin='          '+var+': gpt-oss-120b'
        if text.count(pin)!=1: raise ValueError('codex model env pin changed: '+var)
        text=text.replace(pin,'          '+var+': openai/gpt-oss-120b')
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
