#!/usr/bin/env python3
"""Resolve only this workflow's own draft candidate; never execute candidate bytes."""
import datetime, json, os, pathlib, re, sys, urllib.request
REPO = 'JYeswak/franken-research'
WORKFLOW = '.github/workflows/research-candidate.lock.yml'
SHA = re.compile(r'^[0-9a-f]{40}$')
PREFIX = 'probes/daily-candidates/'

def validate_run(run, run_id):
    if (run.get('id') != run_id or run.get('path') != WORKFLOW or
        run.get('repository', {}).get('full_name') != REPO or
        run.get('head_repository', {}).get('full_name') != REPO or
        run.get('head_branch') != 'main' or run.get('event') not in ('schedule', 'workflow_dispatch') or
        run.get('status') != 'completed' or run.get('conclusion') != 'success' or
        not SHA.fullmatch(run.get('head_sha', ''))):
        raise ValueError('untrusted or unsuccessful workflow run')

def select_candidates(run, pulls):
    url = f'https://github.com/{REPO}/actions/runs/{run["id"]}'
    selected = []
    for p in pulls:
        if (p.get('state') == 'open' and p.get('draft') is True and
            p.get('user', {}).get('login') == 'github-actions[bot]' and
            p.get('title', '').startswith('[research-candidate] ') and
            p.get('head', {}).get('ref', '').startswith('research-candidate/') and
            p.get('head', {}).get('repo', {}).get('full_name') == REPO and
            p.get('base', {}).get('repo', {}).get('full_name') == REPO and
            p.get('base', {}).get('ref') == 'main' and
            SHA.fullmatch(p.get('head', {}).get('sha', '')) and
            re.search(re.escape(url)+r'(?![0-9A-Za-z_/-])', p.get('body', '')) and
            run['run_started_at'] <= p.get('created_at', '') <= run['updated_at']):
            selected.append(p)
    if len(selected) > 1: raise ValueError('ambiguous candidate PRs')
    return selected

def validate_files(files):
    if not 1 <= len(files) <= 20: raise ValueError('candidate file count outside 1..20')
    roots = set()
    for f in files:
        path = f.get('filename', '')
        if f.get('status') != 'added' or not path.startswith(PREFIX):
            raise ValueError('candidate may only add files in its dedicated directory')
        rel = path[len(PREFIX):]
        if not re.fullmatch(r'[a-z0-9][a-z0-9-]*/[A-Za-z0-9_.\-/]+', rel):
            raise ValueError('unsafe candidate path')
        if any(x in ('', '.', '..') or x.startswith('.') for x in rel.split('/')):
            raise ValueError('hidden or noncanonical candidate path')
        roots.add(PREFIX + rel.split('/')[0])
    if len(roots) != 1: raise ValueError('exactly one candidate directory required')
    root = next(iter(roots))
    required = {'recipe.md', 'baseline.py', 'candidate.py', 'test.py', 'execution.json', 'fixtures/input.json', 'fixtures/transfer.json'}
    have = {f['filename'][len(root)+1:] for f in files}
    if not required <= have: raise ValueError('missing runnable candidate contract files')
    return root

def main():
    run_id = int(os.environ['RESEARCH_RUN_ID'])
    if run_id <= 0: raise ValueError('invalid run id')
    token = os.environ['GITHUB_TOKEN']
    def api(path):
        request = urllib.request.Request('https://api.github.com/repos/' + REPO + path,
          headers={'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json',
                   'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'fr-research-candidate-evaluator'})
        with urllib.request.urlopen(request, timeout=30) as response: return json.load(response)
    run = api('/actions/runs/' + str(run_id)); validate_run(run, run_id)
    pulls = api('/pulls?state=open&base=main&per_page=100')
    if len(pulls) == 100: raise ValueError('PR listing truncated; refuse incomplete selection')
    selected = select_candidates(run, pulls)
    values = {'found': 'false'}
    if selected:
        pr = api('/pulls/' + str(selected[0]['number']))
        if not select_candidates(run, [pr]): raise ValueError('PR changed during resolution')
        root = validate_files(api('/pulls/' + str(pr['number']) + '/files?per_page=100'))
        values = {'found': 'true', 'sha': pr['head']['sha'], 'base': pr['base']['sha'],
                  'candidate': root, 'number': str(pr['number'])}
        if not SHA.fullmatch(values['base']): raise ValueError('invalid base SHA')
    with open(os.environ['GITHUB_OUTPUT'], 'a') as output:
        for key, value in values.items():
            if '\n' in value or '\r' in value: raise ValueError('unsafe output value')
            output.write(f'{key}={value}\n')
    print(json.dumps({'run_id': run_id, **values}))
    return 0

if __name__ == '__main__':
    try: sys.exit(main())
    except (ValueError, KeyError, OSError) as error:
        print('RESOLUTION_FAILED: ' + str(error), file=sys.stderr); sys.exit(2)
