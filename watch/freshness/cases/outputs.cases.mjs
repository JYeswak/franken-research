// watch/freshness/cases/outputs.cases.mjs: conformance cases for the outputs of the freshness watch: the live card
// (FR-L.3 to FR-L.5), the dashboard issue (FR-D.1 to FR-D.4, FR-O.4's dashboard half, FR-O.5), the weekly feed
// digest (FR-G.1, FR-G.2), and their goldens (FR-H.3).
// writes: temporary files only
//
// Inputs are the hand-written fixtures in watch/freshness/fixtures/outputs/ (PROVENANCE.md there), the committed
// briefs, updates/, SPEC.md and site/feed.xml. Temporary files go to a fresh directory under os.tmpdir() and are
// removed. Case ids start with OUT-; run them with `node watch/freshness/harness/run.mjs --only OUT`.

import { readFileSync, readdirSync, writeFileSync, copyFileSync, mkdirSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { memoryIssues } from '../../watch.mjs';
import { renderCard, applyCard, checkBriefs, regionOf, hrefOf, OPEN, CLOSE } from '../card.mjs';
import { writeBriefs } from '../../../site/scripts/make-live.mjs';
import { renderDashboard, dashboardText, syncDashboard, readSnapshots, DashboardError, duplicateComment, assertCommitted, main as dashMain, TITLE, MARKER, LIMIT } from '../dashboard.mjs';
import { readLedger, digestEntries, isoWeek } from '../digest.mjs';

// ---------- helpers ----------
const fixture = (ctx, name) => JSON.parse(readFileSync(join(ctx.fixtures, 'outputs', name), 'utf8'));
const clone = (x) => JSON.parse(JSON.stringify(x));
const NO_SNAPSHOTS = { status: 'ok', rows: [] };
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', rsquo: '\u2019', rarr: '\u2192', '#39': "'" };
const textOf = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&(#39|[a-z]+);/g, (m, e) => ENT[e] ?? m).replace(/\s+/g, ' ').trim();
/** { pass, detail } from [ok, message] pairs: every failing message is reported. */
function verdict(checks, extra = {}) {
  const bad = checks.filter(([ok]) => !ok).map(([, m]) => m);
  return { pass: bad.length === 0, detail: bad.join('; ').slice(0, 600), ...extra };
}
function withScratch(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'fr-out-'));
  const done = () => rmSync(dir, { recursive: true, force: true });
  try {
    const r = fn(dir);
    if (r && typeof r.then === 'function') return r.finally(done);
    done();
    return r;
  } catch (e) { done(); throw e; }
}
const node = (ctx, args) => spawnSync(process.execPath, args, { cwd: ctx.root, encoding: 'utf8' });
const bySet = (live) => live.repos.filter((r) => r.brief);
/** The FR-L.4 sentence, quoted from SPEC.md itself so the case follows the spec text, not the code. */
function specChangedText(ctx) {
  const m = /\*\*FR-L\.4\*\*[^\n]*`changed` reads as "([^"]+)"/.exec(readFileSync(join(ctx.root, 'watch/freshness/SPEC.md'), 'utf8'));
  if (!m) throw new Error('SPEC.md FR-L.4 no longer quotes the changed wording');
  return m[1];
}
const STATE_WORDS = { current: 'Current', changed: 'Changed', due: 'Due for re-check', unknown: 'Unknown' };

// An in-memory issues API (watch.mjs memoryIssues) that records every call.
function recordingIssues(login = 'github-actions[bot]', { honourFilters = true } = {}) {
  const mem = memoryIssues(login);
  const calls = [];
  // GET /issues honours GitHub's labels, creator and state filters, as the real API does (FR-D.6 listing).
  const filtered = (path, res) => {
    if (!honourFilters || !/\/issues\?/.test(path)) return res;
    const q = new URLSearchParams(path.slice(path.indexOf('?') + 1));
    const names = (i) => i.labels.map((l) => l.name);
    const keep = (i) => (!q.get('labels') || q.get('labels').split(',').every((l) => names(i).includes(l)))
      && (!q.get('creator') || i.user?.login === q.get('creator'))
      && (!q.get('state') || q.get('state') === 'all' || i.state === q.get('state'));
    return { ...res, body: res.body.filter(keep) };
  };
  const api = { stats: {}, rest: async (method, path, payload) => { calls.push({ method, path: path.replace(/\?.*$/, ''), query: path.includes('?') ? path.slice(path.indexOf('?') + 1) : '', payload }); const res = await mem.api.rest(method, path, payload); return method === 'GET' ? filtered(path, res) : res; } };
  const writes = () => calls.filter((c) => c.method !== 'GET');
  return { mem, api, calls, writes };
}
const BOT = 'github-actions[bot]';
const trustedShape = (extra) => ({ title: TITLE, body: `${MARKER}\nold body\n`, labels: [{ name: 'watch' }, { name: 'dashboard' }], user: { login: BOT }, ...extra });

// Relative luminance and contrast ratio (WCAG 2.x) of #rrggbb colours.
const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

function feedFromLedger(ctx, dir, ledger) {
  const r = node(ctx, ['site/scripts/make-feed.mjs', '--out', dir, '--crossings', ledger]);
  return { r, xml: r.status === 0 ? readFileSync(join(dir, 'feed.xml'), 'utf8') : '' };
}
const digestBlocks = (xml) => [...xml.matchAll(/  <entry>\n    <id>tag:fr\.zeststream\.ai,2026:digest\/[^<]+<\/id>[\s\S]*?  <\/entry>\n/g)].map((m) => m[0]);

// ---------- FR-L.3: the card's content ----------
const cardCases = [
  {
    id: 'OUT-L3-facts', clauses: ['FR-L.3'], level: 'MUST',
    title: 'every card shows verdict date, live-as-of time, the three classes at pin and now, commits since pin, latest release, state, and links every evidence URL',
    run(ctx) {
      const live = fixture(ctx, 'live-states.json');
      const checks = [];
      for (const rec of bySet(live)) {
        const html = renderCard(rec, live);
        const text = textOf(html);
        const hrefs = new Set([...html.matchAll(/href="([^"]*)"/g)].map((m) => m[1].replace(/&amp;/g, '&')));
        checks.push([text.includes(`Live, as of ${live.checked_at.slice(0, 10)} ${live.checked_at.slice(11, 16)} UTC`), `${rec.repo}: no live-as-of time`]);
        checks.push([text.includes(rec.baseline.date.slice(0, 10)) && /Verdict (pinned|re-checked)/.test(text), `${rec.repo}: no pinned verdict date`]);
        checks.push([new RegExp(`Commits since the pin ${rec.commits_since_pin}\\b`).test(text), `${rec.repo}: commits since the pin missing`]);
        checks.push([rec.latest_release ? text.includes(rec.latest_release.tag) : /Latest release none/.test(text), `${rec.repo}: latest release missing`]);
        for (const [dim, word] of [['ci', 'CI'], ['rel', 'Release'], ['license', 'License']]) {
          const d = rec.dims[dim];
          const row = [...html.matchAll(/<tr><th scope="row"[^>]*>([^<]*)<\/th>([\s\S]*?)<\/tr>/g)].find((m) => m[1].startsWith(word));
          const cells = row ? [...row[2].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => textOf(m[1])) : [];
          const want = [d.reference, d.at_pin, ...(rec.baseline.source === 'packet' ? [] : [d.at_baseline])];
          checks.push([JSON.stringify(cells.slice(0, want.length)) === JSON.stringify(want) && cells[want.length]?.startsWith(d.now), `${rec.repo} ${dim}: row ${JSON.stringify(cells)}, want ${JSON.stringify([...want, d.now])}`]);
          const rowLinks = new Set([...(row?.[2] ?? '').matchAll(/href="([^"]*)"/g)].map((m) => m[1].replace(/&amp;/g, '&')));
          for (const u of d.evidence) checks.push([rowLinks.has(hrefOf(u)), `${rec.repo} ${dim}: evidence ${u} not linked in its row`]);
        }
        for (const c of [...rec.crossings, ...rec.pending]) for (const u of c.evidence) checks.push([hrefs.has(hrefOf(u)), `${rec.repo}: crossing evidence ${u} not linked`]);
        checks.push([text.includes(`State: ${STATE_WORDS[rec.state]}`), `${rec.repo}: state ${rec.state} not stated in words`]);
      }
      return verdict(checks);
    },
  },
  {
    id: 'OUT-L3-ci-commit', clauses: ['FR-L.3'], level: 'MUST',
    title: 'the CI class now names and links the commit it was read at (dims.ci.now_commit), says whether that is HEAD, and explains an earlier commit; an unknown class names no commit',
    run(ctx) {
      const live = fixture(ctx, 'live-states.json');
      const checks = [];
      let notHead = 0;
      let unknownNull = 0;
      for (const rec of bySet(live)) {
        const html = renderCard(rec, live);
        const row = /<tr><th scope="row"[^>]*>CI[^<]*<\/th>([\s\S]*?)<\/tr>/.exec(html)?.[1] ?? '';
        const now = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].at(-2)?.[1] ?? '';
        const x = rec.dims.ci;
        const note = /CI now was read at/.test(textOf(html));
        if (x.now === 'unknown') {
          if (x.now_commit === null) unknownNull++;
          checks.push([!/ at </.test(now) && !note, `${rec.repo}: an unknown CI class names a commit`]);
          continue;
        }
        const isHead = x.now_commit === rec.head.sha;
        if (!isHead) notHead++;
        checks.push([now.includes(`/commit/${x.now_commit}/"><code>${x.now_commit.slice(0, 7)}</code></a> (${isHead ? 'HEAD' : 'not HEAD'})`), `${rec.repo}: Now cell ${JSON.stringify(textOf(now))} does not name ${x.now_commit.slice(0, 7)} as ${isHead ? 'HEAD' : 'not HEAD'}`]);
        checks.push([note === !isHead, `${rec.repo}: the earlier-commit note is ${note ? 'present' : 'missing'}`]);
        if (!isHead) checks.push([html.includes(`/commit/${rec.head.sha}/"`) && textOf(html).includes(`an earlier commit than HEAD ${rec.head.sha.slice(0, 7)}`), `${rec.repo}: the note does not name HEAD`]);
      }
      checks.push([notHead >= 1, 'fixture has no CI class read at an earlier commit than HEAD']);
      checks.push([unknownNull >= 1, 'fixture has no unknown CI class with now_commit null']);
      return verdict(checks);
    },
  },
  {
    id: 'OUT-L3-state-matches-table', clauses: ['FR-L.3', 'FR-L.4'], level: 'MUST',
    title: 'a current card with a class that moved but no open crossing does not say nothing moved; an unknown card says which class and why in words',
    run(ctx) {
      const live = fixture(ctx, 'live-states.json');
      const term = clone(live.repos.find((r) => r.repo === 'frankenterm'));
      term.dims.ci.now = 'C5';
      term.pending = [{ id: 'frankenterm:ci:C6>C5', dim: 'ci', from: 'C6', to: 'C5', since: '2026-09-24', source: 'class', evidence: [], resolved_by: null }];
      const moved = textOf(renderCard(term, live));
      const still = textOf(renderCard(live.repos.find((r) => r.repo === 'frankenterm'), live));
      const tts = textOf(renderCard(live.repos.find((r) => r.repo === 'franken_tts'), live));
      const dash = renderDashboard(live, { snapshots: NO_SNAPSHOTS });
      return verdict([
        [!/no computed class has moved/.test(moved) && /no crossing is open: the move listed below was seen once/.test(moved), `moved current card says: ${moved.slice(0, 140)}`],
        [/no computed class has moved since the pin/.test(still), 'an unmoved current card lost its sentence'],
        [/could not read the CI class now: test runs are still in progress \(FR-C\.3\)/.test(tts), `unknown card says: ${tts.slice(0, 160)}`],
        [dash.includes('| CI | a test run on HEAD is still in progress |'), 'dashboard unknown row lost its reason'],
      ]);
    },
  },
  {
    id: 'OUT-L3-no-js', clauses: ['FR-L.3'], level: 'MUST',
    title: 'the card is static HTML: no script, no event handler attribute, no noscript fallback needed',
    run(ctx) {
      const live = fixture(ctx, 'live-states.json');
      const checks = bySet(live).map((rec) => {
        const html = renderCard(rec, live);
        return [!/<script|<noscript|\son[a-z]+\s*=/i.test(html), `${rec.repo}: card needs or runs script`];
      });
      return verdict(checks);
    },
  },
  {
    id: 'OUT-L3-state-in-words', clauses: ['FR-L.3'], level: 'MUST',
    title: 'with every style removed, each card still names its state in words',
    run(ctx) {
      const live = fixture(ctx, 'live-states.json');
      const seen = new Set();
      const checks = bySet(live).map((rec) => {
        seen.add(rec.state);
        const bare = renderCard(rec, live).replace(/\sstyle="[^"]*"/g, '');
        return [bare.includes(`State: <strong>${STATE_WORDS[rec.state]}</strong>`), `${rec.repo}: without colour the state ${rec.state} is not in words`];
      });
      checks.push([['current', 'changed', 'due', 'unknown'].every((s) => seen.has(s)), `fixture covers only states ${[...seen].join(', ')}`]);
      return verdict(checks);
    },
  },
  {
    id: 'OUT-L3-contrast', clauses: ['FR-L.3'], level: 'MUST',
    title: 'badge colours and card text read at 4.5:1 or better on the card background, using the brief\'s own CSS variables',
    run(ctx) {
      const live = fixture(ctx, 'live-states.json');
      const brief = readFileSync(join(ctx.root, 'site/briefs/frankengit.html'), 'utf8');
      const vars = Object.fromEntries([...brief.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6});/g)].map((m) => [m[1], m[2]]));
      const bg = vars['bg-2'];
      const checks = [[Boolean(bg), 'brief has no --bg-2']];
      const used = new Set();
      for (const rec of bySet(live)) {
        for (const m of renderCard(rec, live).matchAll(/color:var\(--([a-z0-9-]+)\)/g)) used.add(m[1]);
      }
      for (const v of used) {
        const c = vars[v];
        checks.push([Boolean(c), `--${v} is not a brief colour`]);
        if (c && bg) checks.push([contrast(c, bg) >= 4.5, `--${v} ${c} on --bg-2 ${bg} is ${contrast(c, bg).toFixed(2)}:1`]);
      }
      checks.push([used.size >= 5, `only ${used.size} text colours found`]);
      return verdict(checks);
    },
  },
  {
    id: 'OUT-L3-a11y-table', clauses: ['FR-L.3'], level: 'MUST',
    title: 'the class table has a caption, column and row header cells, and the card is a labelled landmark',
    run(ctx) {
      const live = fixture(ctx, 'live-states.json');
      const html = renderCard(live.repos[0], live);
      const label = /<aside[^>]*aria-labelledby="([^"]+)"/.exec(html)?.[1];
      return verdict([
        [/<caption[^>]*>[^<]+<\/caption>/.test(html), 'no table caption'],
        [(html.match(/<th scope="col"/g) ?? []).length === 5, 'want 5 column headers without a re-check'],
        [(renderCard(live.repos.find((r) => r.repo === 'franken_code_browser'), live).match(/<th scope="col"[^>]*>At re-check</g) ?? []).length === 1, 'a re-checked repository has no At re-check column'],
        [(html.match(/<th scope="row"/g) ?? []).length === 3, 'want 3 row headers (CI, Release, License)'],
        [Boolean(label) && html.includes(`<h2 id="${label}"`), 'aside is not labelled by its heading'],
      ]);
    },
  },
  {
    id: 'OUT-L3-escape', clauses: ['FR-L.3'], level: 'MUST',
    title: 'upstream tag names and URLs are HTML-escaped; only absolute https URLs become links',
    run(ctx) {
      const live = fixture(ctx, 'live-states.json');
      const term = live.repos.find((r) => r.repo === 'frankenterm');
      const html = renderCard(term, live);
      const evil = clone(term);
      evil.dims.ci.evidence = ['javascript:alert(1)', 'https://x.example/" onmouseover="alert(1)', 'http://plain.example/'];
      evil.latest_release = { tag: '"><img src=x onerror=alert(1)>', date: '2026-09-23T00:00:00Z', url: 'javascript:alert(2)' };
      const bad = renderCard(evil, live);
      return verdict([
        [!html.includes('<script>') && html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'), 'tag with <script> not escaped'],
        [html.includes('v0.15.12|&lt;script&gt;alert(1)&lt;/script&gt;`rm`@here'), 'tag text altered beyond HTML escaping'],
        [!/href="(javascript|http):/.test(bad), 'a javascript: or http: URL became a link'],
        [!/<img/.test(bad) && ![...bad.matchAll(/<[^>]*>/g)].some((t) => /\son[a-z]+=/.test(t[0])), 'an element or event attribute was injected'],
      ]);
    },
  },
  {
    id: 'OUT-L3-no-bare-sha', clauses: ['FR-L.3'], level: 'MUST',
    title: 'no card, brief region or dashboard body carries a full SHA followed by a quote, whitespace, `;`, a backtick or a line end (the gitleaks sourcegraph-access-token shape), even on a page naming Sourcegraph; SHA-ending links still resolve to the same place',
    run(ctx) {
      const BARE = /\b[0-9a-fA-F]{40}(?=[`'"\s;]|$)/gm;
      const sha = '0123456789abcdef'.repeat(3).slice(0, 40);
      const other = 'fedcba9876543210'.repeat(3).slice(0, 40);
      const lives = [fixture(ctx, 'live-states.json'), fixture(ctx, 'live-quiet.json'),
        JSON.parse(readFileSync(join(ctx.root, 'watch/freshness/goldens/core/live.json'), 'utf8'))];
      const outputs = [];
      for (const live of lives) {
        for (const rec of bySet(live)) outputs.push([`${rec.repo} card`, renderCard(rec, live)]);
        outputs.push([`dashboard at ${live.checked_at}`, renderDashboard(live, { snapshots: NO_SNAPSHOTS })]);
      }
      // A planted record on a page that names Sourcegraph, whose evidence ends in full SHAs in a path, in a
      // query, and before a `;`.
      const live = fixture(ctx, 'live-states.json');
      const rec = clone(live.repos.find((r) => r.repo === 'frankengit'));
      Object.assign(rec.pin, { sha: other }); Object.assign(rec.head, { sha }); rec.dims.ci.now_commit = sha;
      rec.dims.ci.evidence = [`https://api.github.com/repos/Dicklesworthstone/frankengit/actions/runs?head_sha=${sha}`,
        `https://github.com/Dicklesworthstone/frankengit/tree/${sha}`, `https://api.github.com/repos/Dicklesworthstone/frankengit/commits/${sha};x`];
      const planted = `<p>Sourcegraph indexes this repository.</p>\n${renderCard(rec, live)}\n<p>Compare Sourcegraph.</p>`;
      outputs.push(['planted Sourcegraph card', planted]);
      for (const rel of readdirSync(join(ctx.root, 'site/briefs')).filter((f) => f.endsWith('.html'))) {
        const html = readFileSync(join(ctx.root, 'site/briefs', rel), 'utf8');
        const r = regionOf(rel, html);
        if (r) outputs.push([`site/briefs/${rel} region`, r.text]);
      }
      const hrefs = [...planted.matchAll(/href="([^"]*)"/g)].map((m) => m[1].replace(/&amp;/g, '&'));
      return verdict([
        ...outputs.map(([what, text]) => { const m = text.match(BARE); return [!m, `${what}: bare SHA ${m?.[0].slice(0, 7)}...`]; }),
        [outputs.length > 60, `only ${outputs.length} outputs scanned`],
        [hrefs.includes(`https://github.com/Dicklesworthstone/frankengit/commit/${sha}/`), 'the HEAD commit is not linked with a trailing slash'],
        [hrefs.includes(`https://github.com/Dicklesworthstone/frankengit/compare/${other}...${sha}/`), 'the compare link is not written with a trailing slash'],
        [hrefs.includes(`https://api.github.com/repos/Dicklesworthstone/frankengit/actions/runs?head_sha=${sha}&`), 'the runs query is not closed with &'],
        [hrefs.includes(`https://github.com/Dicklesworthstone/frankengit/tree/${sha}/`), 'the tree link is not written with a trailing slash'],
        [!hrefs.some((h) => h.includes(`${sha};`)), 'a link with a SHA before ; was written'],
      ]);
    },
  },
];

// ---------- FR-L.4: never implies a verdict changed ----------
const FORBIDDEN = /\bverdicts?\s+(?:has\s+|have\s+|was\s+|were\s+|is\s+|are\s+)?(?:been\s+)?(?:now\s+)?(?:changed|moved|updated|revised|downgraded|upgraded|out of date|outdated|stale|wrong|superseded)\b|\bnew verdict\b|\bre-?rated\b|\bverdict (?:changes|changed) to\b/i;
const l4Cases = [
  {
    id: 'OUT-L4-changed-wording', clauses: ['FR-L.4'], level: 'MUST',
    title: 'a changed card carries the exact FR-L.4 sentence, quoted from SPEC.md',
    run(ctx) {
      const live = fixture(ctx, 'live-states.json');
      const want = specChangedText(ctx);
      const changed = bySet(live).filter((r) => r.state === 'changed');
      return verdict([
        [changed.length >= 2, 'fixture has fewer than two changed repositories'],
        ...changed.map((r) => [textOf(renderCard(r, live)).includes(want), `${r.repo}: missing "${want}"`]),
      ]);
    },
  },
  {
    id: 'OUT-L4-never-says-changed', clauses: ['FR-L.4'], level: 'MUST',
    title: 'no card in any state says or implies that a verdict changed',
    run(ctx) {
      const live = fixture(ctx, 'live-states.json');
      const checks = [];
      for (const rec of bySet(live)) {
        const t = textOf(renderCard(rec, live));
        const m = FORBIDDEN.exec(t);
        checks.push([!m, `${rec.repo} (${rec.state}): "${m?.[0]}"`]);
      }
      // the forbidden pattern itself must catch the sentences it exists for
      for (const s of ['The verdict changed.', 'Verdict is now out of date', 'a new verdict applies', 'the verdict has been updated']) checks.push([FORBIDDEN.test(s), `pattern misses "${s}"`]);
      return verdict(checks);
    },
  },
];

// ---------- FR-L.5: the region equals a fresh render; check mode; nothing outside touched ----------
/** A brief as it was before any card: the region and the blank line after it removed. */
function withoutRegion(html) {
  const i = html.indexOf(OPEN);
  if (i < 0) return html;
  const j = html.indexOf(CLOSE) + CLOSE.length;
  return html.slice(0, i) + html.slice(html.startsWith('\n\n', j) ? j + 2 : j);
}
function scratchSite(ctx, dir, live) {
  const site = join(dir, 'site');
  mkdirSync(join(site, 'briefs'), { recursive: true });
  const bare = {};
  for (const r of bySet(live)) {
    bare[r.brief] = withoutRegion(readFileSync(join(ctx.root, r.brief), 'utf8'));
    writeFileSync(join(site, r.brief.replace(/^site\//, '')), bare[r.brief]);
  }
  const file = join(dir, 'live.json');
  writeFileSync(file, JSON.stringify(live));
  return { site, file, bare };
}
const l5Cases = [
  {
    id: 'OUT-L5-write-is-local', clauses: ['FR-L.5', 'FR-L.3'], level: 'MUST',
    title: 'the first write places the card just before <main> and changes nothing else; a rewrite is a no-op; re-rendering a stale region changes only the region',
    run: (ctx) => withScratch((dir) => {
      const live = fixture(ctx, 'live-states.json');
      const { site, bare } = scratchSite(ctx, dir, live);
      const first = writeBriefs(site, live);
      const second = writeBriefs(site, live);
      const checks = [[first.length === bySet(live).length, `first run rewrote ${first.length} briefs`], [second.length === 0, `second run rewrote ${second.length} briefs`]];
      for (const r of bySet(live)) {
        const after = readFileSync(join(site, r.brief.replace(/^site\//, '')), 'utf8');
        const reg = regionOf(r.brief, after);
        checks.push([withoutRegion(after) === bare[r.brief], `${r.brief}: bytes outside the region changed`]);
        checks.push([after.slice(reg.end, reg.end + 2 + '<main id="main-content">'.length) === '\n\n<main id="main-content">', `${r.brief}: region not placed just before <main>`]);
        checks.push([after.indexOf('<div class="vocab"') < reg.start, `${r.brief}: region precedes the vocabulary block`]);
      }
      const next = clone(live); next.checked_at = '2026-09-25T06:12:45Z';
      const outside = (html) => { const g = regionOf('x', html); return [html.slice(0, g.start), html.slice(g.end)]; };
      const rel = bySet(live)[0].brief.replace(/^site\//, '');
      const stale = readFileSync(join(site, rel), 'utf8');
      const third = writeBriefs(site, next);
      const fresh = readFileSync(join(site, rel), 'utf8');
      checks.push([third.length === bySet(live).length, `a newer live.json rewrote ${third.length} briefs`]);
      checks.push([JSON.stringify(outside(fresh)) === JSON.stringify(outside(stale)) && fresh !== stale, `${rel}: re-rendering a stale region changed bytes outside it`]);
      return verdict(checks);
    }),
  },
  {
    id: 'OUT-L5-check-mode', clauses: ['FR-L.5'], level: 'MUST',
    title: 'make-live.mjs --check passes a fresh render and fails a hand edit inside the region, a missing region, a stale live.json and a doubled marker, but not an edit outside the region',
    run: (ctx) => withScratch((dir) => {
      const live = fixture(ctx, 'live-states.json');
      const { site, file } = scratchSite(ctx, dir, live);
      const cli = (...a) => node(ctx, ['site/scripts/make-live.mjs', '--site', site, '--live', file, ...a]);
      const n = bySet(live).length;
      const write = cli();
      const ok = cli('--check');
      const brief = join(site, 'briefs/frankengit.html');
      const good = readFileSync(brief, 'utf8');
      const run = (html, label) => { writeFileSync(brief, html); const r = cli('--check'); writeFileSync(brief, good); return [r, label]; };
      const outside = run(good.replace('<main id="main-content">', '<main id="main-content"><!-- analyst note -->'), 'outside edit');
      const inside = run(good.replace('Live facts since the pin', 'Live facts since the pin (edited)'), 'inside edit');
      const missing = run(good.slice(0, good.indexOf(OPEN)) + good.slice(good.indexOf(CLOSE) + CLOSE.length), 'missing region');
      const doubled = run(good.replace(CLOSE, `${CLOSE}\n${OPEN}${CLOSE}`), 'doubled marker');
      const stale = clone(live); stale.checked_at = '2026-09-25T06:12:45Z'; writeFileSync(file, JSON.stringify(stale));
      const staleRun = cli('--check');
      return verdict([
        [write.status === 0, `write exited ${write.status}: ${write.stdout}${write.stderr}`],
        [ok.status === 0 && ok.stdout.includes(`LIVE_OK briefs=${n} regions=${n}`), `check after write: ${ok.status} ${ok.stdout.trim()}`],
        [outside[0].status === 0, `an edit outside the region failed the check: ${outside[0].stdout.trim()}`],
        ...[inside, missing, doubled].map(([r, label]) => [r.status === 1 && r.stdout.startsWith('LIVE_BAD'), `${label} passed the check`]),
        [staleRun.status === 1 && /differs from a fresh render/.test(staleRun.stdout), 'a newer live.json did not fail the check'],
      ]);
    }),
  },
  {
    id: 'OUT-L5-records', clauses: ['FR-L.5', 'FR-L.3'], level: 'MUST',
    title: 'check mode fails a brief with no live.json record, a record naming a missing brief, and an empty brief set',
    run(ctx) {
      const live = fixture(ctx, 'live-states.json');
      return withScratch((dir) => {
        const { site } = scratchSite(ctx, dir, live);
        writeBriefs(site, live);
        const noRecord = clone(live); noRecord.repos = noRecord.repos.filter((r) => r.repo !== 'frankengit');
        const ghost = clone(live); ghost.repos.push({ ...clone(live.repos[0]), repo: 'ghost', brief: 'site/briefs/ghost.html' });
        const empty = join(dir, 'empty'); mkdirSync(join(empty, 'briefs'), { recursive: true });
        const cohortOnly = checkBriefs(site, live);
        return verdict([
          [cohortOnly.errs.length === 0, `a cohort record with brief null was reported: ${cohortOnly.errs[0]}`],
          [checkBriefs(site, noRecord).errs.some((e) => /frankengit\.html: no watch\/live\.json record/.test(e)), 'a brief without a record passed'],
          [checkBriefs(site, ghost).errs.some((e) => /ghost\.html, which does not exist/.test(e)), 'a record naming a missing brief passed'],
          [checkBriefs(empty, live).errs.some((e) => /empty scan set/.test(e)), 'an empty brief set passed'],
        ]);
      });
    },
  },
  {
    id: 'OUT-L5-committed', clauses: ['FR-L.5', 'FR-L.3'], level: 'MUST',
    title: 'the committed briefs carry cards equal to a fresh render of the committed watch/live.json',
    run(ctx) {
      const r = node(ctx, ['site/scripts/make-live.mjs', '--check']);
      const n = /^LIVE_OK briefs=(\d+) regions=(\d+)/m.exec(r.stdout);
      return verdict([[r.status === 0 && n && Number(n[1]) > 0, `make-live --check exited ${r.status}: ${r.stdout.trim().split('\n').slice(0, 3).join(' | ')}`]]);
    },
  },
];

// ---------- FR-D: the dashboard issue ----------
function sections(body) {
  return [...body.matchAll(/^## (.+)$/gm)].map((m, i, all) => ({ title: m[1], text: body.slice(m.index, all[i + 1]?.index ?? body.length) }));
}
const tableRows = (text) => text.split('\n').filter((l) => l.startsWith('| ') && !l.startsWith('| Repo |') && !l.startsWith('| Snapshot |'));
const D3_ORDER = ['Changed', 'Due for re-check', 'Unknown', 'New repositories flagged as candidates', 'Revisit triggers a machine cannot observe', 'Informational'];

const dashCases = [
  {
    id: 'OUT-D1-lifecycle', clauses: ['FR-D.1'], level: 'MUST',
    title: 'one issue with the title and both labels is created, left alone when the body is unchanged, and edited in place when it changes',
    async run(ctx) {
      const live = fixture(ctx, 'live-states.json');
      const { mem, api, writes } = recordingIssues();
      const a = await syncDashboard(api, live, { bot: BOT, snapshots: NO_SNAPSHOTS });
      const w1 = writes().length;
      const b = await syncDashboard(api, live, { bot: BOT, snapshots: NO_SNAPSHOTS });
      const w2 = writes().length;
      const next = clone(live); next.checked_at = '2026-09-25T06:10:00Z';
      const c = await syncDashboard(api, next, { bot: BOT, snapshots: NO_SNAPSHOTS });
      const patch = writes().slice(w2);
      const issue = mem.issues[0];
      return verdict([
        [a.action === 'created' && mem.issues.length === 1, `first run ${a.action}, ${mem.issues.length} issues`],
        [issue.title === '[watch] Freshness dashboard', `title ${issue.title}`],
        [['watch', 'dashboard'].every((l) => issue.labels.some((x) => x.name === l)), 'labels missing'],
        [b.action === 'unchanged' && w2 === w1, `second run ${b.action} with ${w2 - w1} writes`],
        [c.action === 'edited' && c.number === a.number && mem.issues.length === 1, `third run ${c.action} #${c.number}, ${mem.issues.length} issues`],
        [patch.length === 1 && patch[0].method === 'PATCH' && Object.keys(patch[0].payload).join() === 'body', `edit wrote ${JSON.stringify(patch.map((p) => [p.method, p.payload && Object.keys(p.payload)]))}`],
        [issue.body === renderDashboard(next, { snapshots: NO_SNAPSHOTS }), 'stored body is not the fresh render'],
      ]);
    },
  },
  {
    id: 'OUT-D1-dry-run', clauses: ['FR-D.1'], level: 'MUST',
    title: 'a dry run reports the action it would take and writes nothing',
    async run(ctx) {
      const live = fixture(ctx, 'live-states.json');
      const { mem, api, writes } = recordingIssues();
      const r = await syncDashboard(api, live, { bot: BOT, dryRun: true, snapshots: NO_SNAPSHOTS });
      return verdict([[r.action === 'created' && r.number === null, `dry run said ${r.action} #${r.number}`], [writes().length === 0 && mem.issues.length === 0, `dry run wrote ${writes().length} times`]]);
    },
  },
  {
    id: 'OUT-D2-impostors', clauses: ['FR-D.2'], level: 'MUST',
    title: 'same-title issues by another author, or ours without a label or the marker, are never edited; listed ones are reported as ignored; a trusted one is created, even when the API ignores the creator filter',
    async run(ctx) {
      const live = fixture(ctx, 'live-states.json');
      const results = [];
      for (const honour of [true, false]) {
        const { mem, api, writes } = recordingIssues(BOT, { honourFilters: honour });
        mem.add(trustedShape({ user: { login: 'mallory' } }));
        mem.add(trustedShape({ labels: [{ name: 'dashboard' }] }));
        mem.add(trustedShape({ body: 'no marker here\n' }));
        mem.add(trustedShape({ body: `see ${MARKER} inline, not on its own line\n` }));
        const before = mem.issues.map((i) => i.body);
        const r = await syncDashboard(api, live, { bot: BOT, snapshots: NO_SNAPSHOTS });
        const touched = writes().filter((w) => /\/issues\/\d/.test(w.path));
        const want = honour ? '[2,3,4]' : '[1,2,3,4]';
        results.push(
          [r.action === 'created' && r.number === 5, `${honour ? 'filtered' : 'unfiltered'} listing: action ${r.action} #${r.number}`],
          [JSON.stringify(r.ignored) === want, `${honour ? 'filtered' : 'unfiltered'} listing: ignored ${JSON.stringify(r.ignored)}, want ${want}`],
          [touched.length === 0, `${touched.length} writes to existing issues`],
          [mem.issues.slice(0, 4).every((i, k) => i.body === before[k] && i.state === 'open'), 'an untrusted issue changed'],
        );
      }
      return verdict(results);
    },
  },
  {
    id: 'OUT-D2-reopen', clauses: ['FR-D.2', 'FR-D.1'], level: 'MUST',
    title: 'a closed trusted dashboard is reopened with the fresh body, not replaced',
    async run(ctx) {
      const live = fixture(ctx, 'live-states.json');
      const { mem, api } = recordingIssues();
      await syncDashboard(api, live, { bot: BOT, snapshots: NO_SNAPSHOTS });
      mem.issues[0].state = 'closed';
      const r = await syncDashboard(api, live, { bot: BOT, snapshots: NO_SNAPSHOTS });
      return verdict([[r.action === 'reopened' && r.number === 1, `action ${r.action} #${r.number}`], [mem.issues.length === 1 && mem.issues[0].state === 'open', `issues ${mem.issues.length}, state ${mem.issues[0].state}`]]);
    },
  },
  {
    id: 'OUT-D2-oldest-and-labels', clauses: ['FR-D.2', 'FR-D.1'], level: 'MUST',
    title: 'with several trusted dashboards the oldest is canonical and each newer open one is closed with a comment linking it; an untrusted one is never touched; on a fresh repository both labels are created',
    async run(ctx) {
      const live = fixture(ctx, 'live-states.json');
      const two = recordingIssues();
      two.mem.add(trustedShape());
      two.mem.add(trustedShape());
      two.mem.add(trustedShape({ body: 'ours, labelled, but no marker\n' }));
      two.mem.add(trustedShape({ state: 'closed' }));
      const r = await syncDashboard(two.api, live, { bot: BOT, snapshots: NO_SNAPSHOTS });
      const again = await syncDashboard(two.api, live, { bot: BOT, snapshots: NO_SNAPSHOTS });
      const commentsOn = (n) => two.mem.comments.get(n) ?? [];
      const fresh = recordingIssues();
      await syncDashboard(fresh.api, live, { bot: BOT, snapshots: NO_SNAPSHOTS });
      const made = fresh.writes().filter((w) => w.method === 'POST' && w.path.endsWith('/labels')).map((w) => w.payload.name).sort();
      return verdict([
        [r.action === 'edited' && r.number === 1 && JSON.stringify(r.duplicates) === '[2,4]' && JSON.stringify(r.closed) === '[2]', `kept #${r.number} (${r.action}), duplicates ${JSON.stringify(r.duplicates)}, closed ${JSON.stringify(r.closed)}`],
        [two.mem.issues[1].state === 'closed' && two.mem.issues[1].body === `${MARKER}\nold body\n`, 'the newer duplicate was not closed, or its body was edited'],
        [commentsOn(2).length === 1 && commentsOn(2)[0].body === duplicateComment(1) && commentsOn(2)[0].body.includes('https://github.com/JYeswak/franken-research/issues/1'), 'the duplicate has no comment linking the canonical issue'],
        [commentsOn(4).length === 0, 'an already-closed duplicate got a comment'],
        [two.mem.issues[2].state === 'open' && commentsOn(3).length === 0 && JSON.stringify(r.ignored) === '[3]', 'an untrusted issue was touched or not reported'],
        [again.action === 'unchanged' && again.closed.length === 0 && commentsOn(2).length === 1, 'a second run acted again on the closed duplicate'],
        [made.join() === 'dashboard,watch', `labels created: ${made.join()}`],
      ]);
    },
  },
  {
    id: 'OUT-D3-sections', clauses: ['FR-D.3'], level: 'MUST',
    title: 'the body has the six sections in order, one Changed row per open crossing with evidence and a re-check link, and the other sections list what live.json lists',
    run(ctx) {
      const live = fixture(ctx, 'live-states.json');
      const body = renderDashboard(live, { snapshots: NO_SNAPSHOTS });
      const secs = sections(body);
      const titles = secs.map((s) => s.title);
      const at = (t) => secs.find((s) => s.title === t)?.text ?? '';
      const open = live.repos.flatMap((r) => r.crossings.filter((c) => !c.resolved_by).map((c) => ({ r, c })));
      const changedRows = tableRows(at('Changed'));
      const humanTriggers = live.repos.reduce((s, r) => s + r.revisit.human, 0);
      const humanRepos = live.repos.filter((r) => r.revisit.human > 0).length;
      const checks = [
        [JSON.stringify(titles.slice(0, 6)) === JSON.stringify(D3_ORDER), `sections ${JSON.stringify(titles)}`],
        [changedRows.length === open.length, `${changedRows.length} Changed rows for ${open.length} open crossings`],
        [!at('Changed').includes('franken\\_code\\_browser'), 'a resolved crossing is listed as open'],
        [!at('Changed').includes('Rider | plain MIT'), 'a pending (seen once) crossing is listed as open'],
        [tableRows(at('Due for re-check')).length === live.repos.filter((r) => r.due.due).length, 'Due rows do not match due repositories'],
        [tableRows(at('Unknown')).length === live.unknowns.length, 'Unknown rows do not match live.unknowns'],
        [tableRows(at('New repositories flagged as candidates')).length === live.candidates.length, 'candidate rows do not match'],
        [at('Revisit triggers a machine cannot observe').includes(`${humanTriggers} triggers across ${humanRepos} repositories need a person`), `revisit count is not ${humanTriggers} across ${humanRepos}`],
        [!/\| \[/.test(at('Informational')) && /23 today, 311 since the pins/.test(at('Informational')), 'Informational is not counts only'],
      ];
      for (const { r, c } of open) {
        const row = changedRows.find((l) => l.includes(`](https://github.com/Dicklesworthstone/${r.repo})`) && l.includes(` ${c.from} | ${c.to} `));
        checks.push([Boolean(row), `${c.id}: no row`]);
        if (row) {
          for (const u of c.evidence) checks.push([row.includes(`(${hrefOf(u)})`), `${c.id}: evidence ${u} missing`]);
          checks.push([row.includes('updates/METHOD.md') && row.includes(r.packet), `${c.id}: no re-check link`]);
        }
      }
      return verdict(checks);
    },
  },
  {
    id: 'OUT-D3-escape', clauses: ['FR-D.3', 'FR-D.2'], level: 'MUST',
    title: 'upstream text in the body goes through mdText: no raw HTML, mention, pipe or link syntax survives, and unsafe URLs are not linked',
    run(ctx) {
      const live = fixture(ctx, 'live-states.json');
      live.candidates.push({ repo: 'evil|repo', created_at: '2026-09-24T00:00:00Z', reasons: ['<img src=x onerror=alert(1)> [x](javascript:alert(1)) @everyone #1 `code`'] });
      live.unknowns.push({ repo: 'frankengit', dim: 'ci', why: '<!-- watch-dashboard: v1 -->\n| forged | row |' });
      live.repos[0].crossings[0].evidence.push('javascript:alert(1)', 'https://e.example/a b');
      const body = renderDashboard(live, { snapshots: NO_SNAPSHOTS });
      return verdict([
        [!/(^|[^\\])<(img|b)\b/m.test(body), 'raw HTML survived'],
        [!/\]\(javascript:/.test(body) && !/\(https:\/\/e\.example\/a b\)/.test(body), 'an unsafe URL became a link'],
        [!/(^|[^\\])@everyone/.test(body) && !/(^|[^\\])@someone/.test(body), 'a mention survived'],
        [body.includes('evil\\|repo') && body.includes('\\<b\\>in Rust\\</b\\>'), 'pipes or angle brackets not escaped'],
        [(body.match(/^<!-- watch-dashboard: v1 -->$/gm) ?? []).length === 1, 'upstream text forged a marker line'],
      ]);
    },
  },
  {
    id: 'OUT-D3-quiet', clauses: ['FR-D.3'], level: 'MUST',
    title: 'with nothing to report each section says so in words and keeps its place',
    run(ctx) {
      const body = renderDashboard(fixture(ctx, 'live-quiet.json'), { snapshots: NO_SNAPSHOTS });
      const secs = sections(body);
      return verdict([
        [JSON.stringify(secs.slice(0, 6).map((s) => s.title)) === JSON.stringify(D3_ORDER), 'section order'],
        [/No open crossings\./.test(secs[0].text) && /Nothing is due\./.test(secs[1].text) && /read every repository/.test(secs[2].text) && /None\./.test(secs[3].text), 'an empty section is blank or missing its sentence'],
        [/2 pinned, 0 from cohort matrices/.test(body), 'cohort count 0 is not reported as 0'],
      ]);
    },
  },
  {
    id: 'OUT-D4-limit', clauses: ['FR-D.4'], level: 'MUST',
    title: 'a body over 65,536 characters is cut at a line, keeps its marker, and ends with a link to live.json; a body under the limit is not cut',
    async run(ctx) {
      const live = fixture(ctx, 'live-states.json');
      const big = clone(live);
      const c0 = big.repos[0].crossings[0];
      for (let k = 0; k < 2500; k++) big.repos[0].crossings.push({ ...c0, id: `frankengit:ci:${k}`, since: `2026-09-${String(1 + (k % 28)).padStart(2, '0')}` });
      const body = renderDashboard(big, { snapshots: NO_SNAPSHOTS });
      const small = renderDashboard(live, { snapshots: NO_SNAPSHOTS });
      const { mem, api } = recordingIssues();
      await syncDashboard(api, big, { bot: BOT, snapshots: NO_SNAPSHOTS });
      const rows = tableRows(sections(body)[0]?.text ?? '').length;
      const full = dashboardText(big, { snapshots: NO_SNAPSHOTS });
      const kept = body.slice(0, body.indexOf('\n\nThe rest did not fit'));
      return verdict([
        [body.length <= 65536 && LIMIT === 65536, `body is ${body.length} characters`],
        [rows > 100 && rows < 2503, `cut kept ${rows} rows (want a real cut)`],
        [kept.length > 0 && full.startsWith(kept) && full[kept.length] === '\n', `the cut is not at a line boundary: kept part ends ${JSON.stringify(kept.slice(-40))}, next character ${JSON.stringify(full[kept.length])}`],
        [/\|$/.test(kept), 'the last kept line is not a whole table row'],
        [body.startsWith('<!-- watch-dashboard: v1 -->\n'), 'marker lost'],
        [body.endsWith('[watch/live.json](https://github.com/JYeswak/franken-research/blob/main/watch/live.json)'), `ends with ${JSON.stringify(body.slice(-80))}`],
        [small.endsWith('\n') && !small.includes('did not fit'), 'a small body was cut'],
        [mem.issues[0].body.length <= 65536, 'the stored issue body is over the limit'],
      ]);
    },
  },
  {
    id: 'OUT-D4-one-issue', clauses: ['FR-D.4'], level: 'MUST',
    title: 'open crossings and new-repository candidates reach the dashboard only: one issue in all, whatever the number of events',
    async run(ctx) {
      const live = fixture(ctx, 'live-states.json');
      const { mem, api, writes } = recordingIssues();
      await syncDashboard(api, live, { bot: BOT, snapshots: NO_SNAPSHOTS });
      const body = mem.issues[0]?.body ?? '';
      return verdict([
        [writes().filter((w) => w.method === 'POST' && w.path.endsWith('/issues')).length === 1 && mem.issues.length === 1, `${mem.issues.length} issues opened`],
        [live.candidates.every((c) => body.includes(`[${c.repo.replace(/_/g, '\\_')}]`)), 'a candidate is not on the dashboard'],
      ]);
    },
  },
  {
    id: 'OUT-D6-bounded-listing', clauses: ['FR-D.6'], level: 'MUST',
    title: 'the dashboard is found by listing issues labelled dashboard that the bot opened, any state, 100 a page, at most 3 pages; a listing that fills all 3 pages or returns a non-list fails closed with no write; 2 full pages and a short third proceed',
    async run(ctx) {
      const live = fixture(ctx, 'live-states.json');
      const pagedApi = (pages) => {
        const calls = [];
        const filler = (p) => Array.from({ length: 100 }, (_, k) => ({ number: p * 100 + k, title: `other ${k}`, labels: [{ name: 'dashboard' }], user: { login: BOT }, state: 'closed', body: '' }));
        return { calls, api: { stats: {}, rest: async (method, path, payload) => {
          calls.push({ method, path, payload });
          if (method !== 'GET') return { status: 201, body: { number: 999 } };
          if (/\/labels\?/.test(path)) return { status: 200, body: [{ name: 'watch' }, { name: 'dashboard' }] };
          const page = Number(new URLSearchParams(path.split('?')[1]).get('page'));
          const p = pages[page - 1];
          return { status: 200, body: p === 'full' ? filler(page) : p === 'bad' ? { message: 'Server Error' } : (p ?? []) };
        } } };
      };
      const attempt = async (pages) => {
        const t = pagedApi(pages);
        let err = null, r = null;
        try { r = await syncDashboard(t.api, live, { bot: BOT, snapshots: NO_SNAPSHOTS }); } catch (e) { err = e; }
        const lists = t.calls.filter((c) => c.method === 'GET' && /\/issues\?/.test(c.path));
        return { err, r, lists, writes: t.calls.filter((c) => c.method !== 'GET') };
      };
      const bound = await attempt(['full', 'full', 'full', []]);
      const bad = await attempt(['full', 'bad']);
      const ok = await attempt(['full', 'full', [trustedShape({ number: 250, state: 'open' })]]);
      const q = new URLSearchParams((ok.lists[0]?.path ?? '').split('?')[1] ?? '');
      return verdict([
        [bound.err instanceof DashboardError && /bound of 3 pages/.test(bound.err.message) && bound.writes.length === 0, `three full pages: ${bound.err?.message ?? 'no error'}, ${bound.writes.length} writes`],
        [bound.lists.length === 3, `read ${bound.lists.length} pages, the bound is 3`],
        [bad.err instanceof DashboardError && /not a list/.test(bad.err.message) && bad.writes.length === 0, `a non-list page: ${bad.err?.message ?? 'no error'}, ${bad.writes.length} writes`],
        [!ok.err && ok.r?.action === 'edited' && ok.r.number === 250 && ok.lists.length === 3, `two full pages and a short third: ${ok.err?.message ?? `${ok.r?.action} #${ok.r?.number}`}`],
        [q.get('labels') === 'dashboard' && q.get('creator') === BOT && q.get('state') === 'all' && q.get('per_page') === '100', `listing query ${ok.lists[0]?.path}`],
      ]);
    },
  },
  {
    id: 'OUT-D5-cli', clauses: ['FR-D.5'], level: 'MUST',
    title: 'dashboard.mjs --sync renders only a committed live.json: --dry-run prints the plan and the body and writes nothing; a sync prints DASHBOARD_OK; a bounded-out sync exits 1; an uncommitted file or bad usage exits 2 before any API call',
    run: (ctx) => withScratch(async (dir) => {
      const live = fixture(ctx, 'live-states.json');
      const file = join(dir, 'live.json');
      writeFileSync(file, JSON.stringify(live));
      const run = async (argv, { committed = () => {}, api } = {}) => {
        const t = api ?? recordingIssues();
        const lines = [];
        let asked = 0;
        const code = await dashMain(argv, { committed, client: async () => { asked++; return { api: t.api, bot: BOT }; }, out: (l) => lines.push(l) });
        return { code, lines, asked, writes: t.writes ? t.writes() : [] };
      };
      const dry = await run(['--sync', file, '--dry-run']);
      const real = await run(['--sync', file]);
      const full = { api: { stats: {}, rest: async (m, p) => ({ status: 200, body: /\/issues\?/.test(p) ? Array.from({ length: 100 }, (_, k) => ({ number: k, title: 'x', labels: [], user: { login: BOT } })) : [] }) }, writes: () => [] };
      const bounded = await run(['--sync', file], { api: full });
      const dirty = await run(['--sync', file], { committed: () => { throw new Error('live.json differs from HEAD'); } });
      const usage = await run(['--dry-run']);
      // assertCommitted against a real repository
      const repo = join(dir, 'repo');
      mkdirSync(repo);
      const git = (...a) => spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=noreply@example.com', '-c', 'core.hooksPath=/dev/null', ...a], { cwd: repo, encoding: 'utf8' }).status;
      git('init', '-q'); writeFileSync(join(repo, 'live.json'), '{}\n'); git('add', 'live.json'); git('commit', '-q', '-m', 'x');
      const refuses = (f) => { try { assertCommitted(f, repo); return false; } catch { return true; } };
      const clean = !refuses(join(repo, 'live.json'));
      writeFileSync(join(repo, 'live.json'), '{"changed":1}\n');
      const modified = refuses(join(repo, 'live.json'));
      writeFileSync(join(repo, 'other.json'), '{}\n');
      const untracked = refuses(join(repo, 'other.json'));
      const outside = refuses(file);
      return verdict([
        [dry.code === 0 && /^DASHBOARD_PLAN action=created issue=none /.test(dry.lines[0]) && dry.lines[1] === '' && dry.lines[2] === renderDashboard(live) && dry.writes.length === 0, `dry run: exit ${dry.code}, ${dry.writes.length} writes, ${JSON.stringify(dry.lines[0])}`],
        [real.code === 0 && real.lines.join('\n') === 'DASHBOARD_OK action=created issue=#1 ignored=0 closed_duplicates=0', `sync: exit ${real.code} ${JSON.stringify(real.lines)}`],
        [bounded.code === 1 && /^DASHBOARD_FAIL .*bound/.test(bounded.lines[0] ?? ''), `bounded: exit ${bounded.code} ${JSON.stringify(bounded.lines)}`],
        [dirty.code === 2 && dirty.asked === 0 && /^DASHBOARD_FAIL .*differs from HEAD/.test(dirty.lines[0] ?? ''), `uncommitted: exit ${dirty.code}, client asked ${dirty.asked} times`],
        [usage.code === 2 && usage.asked === 0 && /usage:/.test(usage.lines[0] ?? ''), `usage: exit ${usage.code}`],
        [clean && modified && untracked && outside, `assertCommitted: clean passes ${clean}, refuses modified ${modified}, untracked ${untracked}, outside the repo ${outside}`],
      ]);
    }),
  },
  {
    id: 'OUT-O4-last-run', clauses: ['FR-O.4'], level: 'SHOULD',
    title: 'dashboard half of FR-O.4: the body shows the time of the last run (the deploy warning is the harness\'s case)',
    run(ctx) {
      const live = fixture(ctx, 'live-states.json');
      return verdict([[renderDashboard(live, { snapshots: NO_SNAPSHOTS }).includes('Last run: 2026-09-24 06:12 UTC.'), 'no last-run time']]);
    },
  },
  {
    id: 'OUT-O5-snapshots', clauses: ['FR-O.5'], level: 'SHOULD',
    title: 'the dashboard shows each vendored snapshot\'s age from ops/schedule.tsv; over 30 days is due for rebuild; no snapshots and a missing file read cleanly',
    run: (ctx) => withScratch((dir) => {
      const live = fixture(ctx, 'live-states.json');
      const tsv = join(dir, 'schedule.tsv');
      writeFileSync(tsv, ['# ops/schedule.tsv fixture', 'artifact\tgenerator\tworkflow\tcadence\tgate\tsnapshot_built',
        'watch/live.json\tnode watch/watch.mjs --apply\twatch.yml\tdaily\tW3\t-',
        'search/index-a.json\tnode x\tverify.yml\tweekly\tW3\t2026-08-24',
        'search/index-b.json\tnode x\tverify.yml\tweekly\tW3\t2026-08-25',
        'search/index-c.json\tnode x\tverify.yml\tweekly\tW3\t2026-09-20', ''].join('\n'));
      const snaps = readSnapshots(tsv);
      const body = renderDashboard(live, { snapshots: snaps });
      writeFileSync(tsv, 'artifact\tgenerator\tworkflow\tcadence\tgate\tsnapshot_built\nwatch/live.json\tnode w\twatch.yml\tdaily\tW3\t-\n');
      const none = renderDashboard(live, { snapshots: readSnapshots(tsv) });
      const missing = renderDashboard(live, { snapshots: readSnapshots(join(dir, 'absent.tsv')) });
      return verdict([
        [snaps.rows.length === 3, `${snaps.rows.length} snapshot rows (the '-' row is not a snapshot)`],
        [body.includes('| search/index-a.json | 2026-08-24 | 31 days | due for rebuild (over 30 days) |'), 'a 31-day snapshot is not due'],
        [body.includes('| search/index-b.json | 2026-08-25 | 30 days | fresh |'), 'a 30-day snapshot is due (the limit is more than 30)'],
        [body.includes('| search/index-c.json | 2026-09-20 | 4 days | fresh |'), 'a 4-day snapshot age'],
        [none.includes('No vendored snapshots are listed in ops/schedule.tsv.'), 'no clean "no snapshots" state'],
        [missing.includes('ops/schedule.tsv is missing, so snapshot ages are unknown.'), 'a missing schedule is not stated'],
      ]);
    }),
  },
];

// ---------- FR-G: weekly digest ----------
const LEDGER_FX = 'watch/freshness/fixtures/outputs/crossings.jsonl';
const ledgerLine = (o) => JSON.stringify({ date: o.date, event: o.event, id: o.id ?? 'x:ci:C1>C2', repo: o.repo ?? 'frankengit', dim: 'ci', from: 'C1', to: 'C2', source: 'class', evidence: [], resolved_by: o.resolved_by ?? null });
const digestCases = [
  {
    id: 'OUT-G1-weeks', clauses: ['FR-G.1'], level: 'MUST',
    title: 'one entry per ISO week with a crossing opened, resolved or withdrawn, dated the last day with data, listing every event of the week; a quiet week gets none',
    run(ctx) {
      const events = readLedger(join(ctx.root, LEDGER_FX), ctx.root);
      const entries = digestEntries(events);
      const w39 = entries.find((e) => e.id.endsWith('/2026-W39'));
      const weeks = [
        ['2026-01-01', '2026-W01'], ['2025-12-29', '2026-W01'], ['2026-09-21', '2026-W39'], ['2026-09-27', '2026-W39'],
        ['2026-09-28', '2026-W40'], ['2026-12-31', '2026-W53'], ['2027-01-03', '2026-W53'], ['2027-01-04', '2027-W01'],
      ];
      return verdict([
        [entries.map((e) => e.id.split('/').pop()).join() === '2026-W42,2026-W41,2026-W39', `weeks ${entries.map((e) => e.id).join()}`],
        [w39?.date === '2026-09-24' && entries[1].date === '2026-10-08', 'an entry is not dated its week\'s last day with data'],
        [/2 crossings opened, 1 resolved/.test(w39?.title ?? ''), `W39 title ${w39?.title}`],
        [['franken_code_browser Release R1 \u2192 R3 (2026-09-23', 'frankengit CI C3 \u2192 C5 (2026-09-24', 'by updates/franken_code_browser-2026-09-24.md'].every((s) => w39?.summary.includes(s)), 'W39 does not list every event'],
        [digestEntries([]).length === 0, 'an empty ledger made an entry'],
        ...weeks.map(([d, w]) => [isoWeek(d).label === w, `${d} is ${isoWeek(d).label}, want ${w}`]),
      ]);
    },
  },
  {
    id: 'OUT-L3-withdrawing', clauses: ['FR-L.3', 'FR-D.3'], level: 'MUST',
    title: 'an open crossing whose class is back at its baseline (pending phase withdrawing) is listed once on the card, saying when it came back and that it closes as withdrawn only if the next check agrees; the dashboard counts it apart from moves seen once',
    run(ctx) {
      const live = fixture(ctx, 'live-states.json');
      const fs = live.repos.find((r) => r.repo === 'frankenfs');
      const text = textOf(renderCard(fs, live));
      const body = renderDashboard(live, { snapshots: NO_SNAPSHOTS });
      const opening = live.repos.flatMap((r) => r.pending).filter((p) => p.phase === 'opening').length;
      return verdict([
        [fs?.pending?.[0]?.phase === 'withdrawing' && fs.crossings[0]?.id === fs.pending[0].id, 'fixture has no withdrawing crossing'],
        [(text.match(/CI: C2 → C1, since 2026-09-20/g) ?? []).length === 1, 'the withdrawing crossing is not listed exactly once'],
        [text.includes('back at C2 since 2026-09-24, it closes as withdrawn if the next daily check sees that too'), `card says: ${text.slice(text.indexOf('What the watch flagged'), text.indexOf('What the watch flagged') + 200)}`],
        [!/seen once/.test(text), 'the withdrawing entry is worded as a move seen once'],
        [body.includes(`- Crossings seen once, not yet open: ${opening}.`) && body.includes('- Open crossings whose class is back at its baseline, withdrawn if the next daily check agrees: 1.'), 'dashboard does not count withdrawing apart from opening'],
        [/\| \[frankenfs\]\([^)]*\) \| CI \| C2 \| C1 \|/.test(body), 'a withdrawing crossing left the Changed section before it closed'],
      ]);
    },
  },
  {
    id: 'OUT-G1-withdrawn', clauses: ['FR-G.1'], level: 'MUST',
    title: 'a week whose only event is a withdrawal gets an entry that words it as a return to the baseline class; a withdrawal of an existence crossing, or one naming a re-check, is refused',
    run: (ctx) => withScratch((dir) => {
      const entries = digestEntries(readLedger(join(ctx.root, LEDGER_FX), ctx.root));
      const w42 = entries.find((e) => e.id.endsWith('/2026-W42'));
      const tryLine = (o) => { const f = join(dir, `${o.date}-${o.event}.jsonl`); writeFileSync(f, `${o.line}\n`); try { readLedger(f, ctx.root); return null; } catch (e) { return e.message; } };
      const existence = tryLine({ date: '2026-10-14', event: 'withdrawn', line: ledgerLine({ date: '2026-10-14', event: 'withdrawn' }).replace('"source":"class"', '"source":"existence"') });
      const named = tryLine({ date: '2026-10-15', event: 'withdrawn', line: ledgerLine({ date: '2026-10-15', event: 'withdrawn', resolved_by: 'updates/franken_code_browser-2026-09-24.md' }) });
      const alone = digestEntries([JSON.parse(ledgerLine({ date: '2026-11-04', event: 'withdrawn' }))]);
      return verdict([
        [Boolean(w42), 'the withdrawal-only week 2026-W42 has no entry'],
        [w42?.date === '2026-10-14', `W42 dated ${w42?.date}`],
        [w42?.title === 'Watch digest 2026-W42: 0 crossings opened, 0 resolved, 1 withdrawn', `W42 title ${w42?.title}`],
        [/^Withdrawn: frankensearch License returned to Rider after moving to other:Copyright/.test(w42?.summary ?? '') && !/Opened:|Resolved:/.test(w42?.summary ?? ''), `W42 summary ${w42?.summary?.slice(0, 120)}`],
        [alone.length === 1 && alone[0].summary.startsWith('Withdrawn: frankengit CI returned to C1 after moving to C2 (2026-11-04).'), 'a lone withdrawal is not worded as a return to its baseline class'],
        [/never withdrawn/.test(existence ?? ''), `an existence withdrawal was accepted: ${existence}`],
        [/withdrawn event needs resolved_by null/.test(named ?? ''), `a withdrawal naming a re-check was accepted: ${named}`],
      ]);
    }),
  },
  {
    id: 'OUT-G1-feed', clauses: ['FR-G.1', 'FR-G.2'], level: 'MUST',
    title: 'make-feed.mjs puts the digest entries in a well-formed feed, newest first, XML-escaped; an informational line is refused, never published',
    run: (ctx) => withScratch((dir) => {
      const { r, xml } = feedFromLedger(ctx, dir, join(ctx.root, LEDGER_FX));
      const check = node(ctx, ['site/scripts/make-feed.mjs', '--check', join(dir, 'feed.xml')]);
      const blocks = digestBlocks(xml);
      const bad = join(dir, 'bad.jsonl');
      writeFileSync(bad, `${ledgerLine({ date: '2026-09-24', event: 'informational' })}\n`);
      const refused = node(ctx, ['site/scripts/make-feed.mjs', '--out', join(dir, 'b'), '--crossings', bad]);
      const emptyLedger = join(dir, 'empty.jsonl'); writeFileSync(emptyLedger, '');
      const quiet = feedFromLedger(ctx, join(dir, 'q'), emptyLedger);
      return verdict([
        [r.status === 0, `make-feed exited ${r.status}: ${r.stderr.trim()}`],
        [check.status === 0 && /^FEED_OK/m.test(check.stdout), `feed check: ${check.stdout.trim()}`],
        [blocks.length === 3 && xml.indexOf('digest/2026-W42') < xml.indexOf('digest/2026-W41') && xml.indexOf('digest/2026-W41') < xml.indexOf('digest/2026-W39'), `${blocks.length} digest entries or wrong order`],
        [xml.includes('other:Copyright (c) 2026 &lt;Jeffrey&gt; &amp; &quot;friends&quot;') && !xml.includes('<Jeffrey>'), 'upstream text not XML-escaped'],
        [refused.status !== 0 && /is not opened, resolved, withdrawn/.test(refused.stderr), 'an informational ledger line was accepted'],
        [quiet.r.status === 0 && digestBlocks(quiet.xml).length === 0, 'an empty ledger produced a digest entry (watch/changes/ holds informational events; they must not reach the feed)'],
      ]);
    }),
  },
  {
    id: 'OUT-G2-committed-sources', clauses: ['FR-G.2'], level: 'MUST',
    title: 'the digest reads only committed files: a resolved event must name a committed re-check, the ledger must be well formed, and reruns are byte-identical',
    run: (ctx) => withScratch((dir) => {
      const lines = readFileSync(join(ctx.root, LEDGER_FX), 'utf8');
      const tryLedger = (text) => { const f = join(dir, `l${Math.random().toString(36).slice(2)}.jsonl`); writeFileSync(f, text); try { readLedger(f, ctx.root); return null; } catch (e) { return e.message; } };
      const ghost = tryLedger(`${ledgerLine({ date: '2026-09-24', event: 'resolved', resolved_by: 'updates/frankengit-2026-09-30.md' })}\n`);
      const torn = tryLedger(lines.slice(0, -1));
      const order = tryLedger(`${JSON.stringify({ event: 'opened', date: '2026-09-24', id: 'a', repo: 'b', dim: 'ci', from: 'C1', to: 'C2', source: 'class', evidence: [], resolved_by: null })}\n`);
      const a = feedFromLedger(ctx, join(dir, 'a'), join(ctx.root, LEDGER_FX));
      const b = feedFromLedger(ctx, join(dir, 'b'), join(ctx.root, LEDGER_FX));
      return verdict([
        [/is not a committed file/.test(ghost ?? ''), `a resolved_by naming a missing re-check: ${ghost}`],
        [/no newline/.test(torn ?? ''), `a torn last line: ${torn}`],
        [/keys .* in that order/.test(order ?? ''), `keys out of FR-G.3 order: ${order}`],
        [a.xml.length > 0 && a.xml === b.xml, 'two builds differ'],
      ]);
    }),
  },
  {
    id: 'OUT-G2-committed-feed', clauses: ['FR-G.2', 'FR-G.1'], level: 'MUST',
    title: 'site/feed.xml equals a fresh build from the committed ledger (gate M\'s rule)',
    run: (ctx) => withScratch((dir) => {
      const r = node(ctx, ['site/scripts/make-feed.mjs', '--out', dir]);
      const same = r.status === 0 && readFileSync(join(dir, 'feed.xml'), 'utf8') === readFileSync(join(ctx.root, 'site/feed.xml'), 'utf8');
      return verdict([[same, `fresh feed differs from site/feed.xml (exit ${r.status} ${r.stderr.trim()})`]]);
    }),
  },
];

// ---------- FR-H.3: goldens ----------
function goldens(ctx, pairs) {
  const results = pairs.map(([name, text]) => ctx.golden(name, text));
  const bad = results.filter((r) => !r.pass);
  return { pass: bad.length === 0, detail: (bad.length ? bad : results).map((r) => r.detail).filter(Boolean).join('; ') };
}
const goldenCases = [
  {
    id: 'OUT-H3-cards', clauses: ['FR-H.3', 'FR-L.3'], level: 'MUST',
    title: 'golden cards for four repositories in four states (changed, current with a resolved crossing, due, unknown), one with hostile upstream strings, and one whose CI class describes a commit before HEAD',
    run(ctx) {
      const live = fixture(ctx, 'live-states.json');
      const card = (repo) => renderCard(live.repos.find((r) => r.repo === repo), live) + '\n';
      return goldens(ctx, [
        ['outputs/card-frankengit-changed.html', card('frankengit')],
        ['outputs/card-franken_code_browser-current-resolved.html', card('franken_code_browser')],
        ['outputs/card-frankensearch-due.html', card('frankensearch')],
        ['outputs/card-franken_tts-unknown.html', card('franken_tts')],
        ['outputs/card-frankenterm-escaping.html', card('frankenterm')],
        ['outputs/card-franken_engine-untracked-ci-not-head.html', card('franken_engine')],
        ['outputs/card-frankenfs-withdrawing.html', card('frankenfs')],
      ]);
    },
  },
  {
    id: 'OUT-H3-dashboard', clauses: ['FR-H.3', 'FR-D.3'], level: 'MUST',
    title: 'golden dashboard bodies: every section populated, and the quiet state',
    run(ctx) {
      return goldens(ctx, [
        ['outputs/dashboard-states.md', renderDashboard(fixture(ctx, 'live-states.json'), { snapshots: { status: 'ok', rows: [{ artifact: 'search/index.json', built: '2026-08-01' }] } })],
        ['outputs/dashboard-quiet.md', renderDashboard(fixture(ctx, 'live-quiet.json'), { snapshots: NO_SNAPSHOTS })],
      ]);
    },
  },
  {
    id: 'OUT-H3-core', clauses: ['FR-H.3', 'FR-L.3', 'FR-D.3'], level: 'MUST',
    title: 'golden dashboard and cards rendered from FreshCore\'s live.json golden (its reference fixture, checked_at 2026-09-25T01:42:40Z)',
    run(ctx) {
      const live = JSON.parse(readFileSync(join(ctx.root, 'watch/freshness/goldens/core/live.json'), 'utf8'));
      const card = (repo) => renderCard(live.repos.find((r) => r.repo === repo), live) + '\n';
      return goldens(ctx, [
        ['outputs/core-dashboard.md', renderDashboard(live, { snapshots: NO_SNAPSHOTS })],
        ['outputs/core-card-frankengit-rechecked.html', card('frankengit')],
        ['outputs/core-card-franken_node-pending.html', card('franken_node')],
        ['outputs/core-card-asupersync-unknown.html', card('asupersync')],
        ['outputs/core-card-franken_lean-ci-earlier-commit.html', card('franken_lean')],
      ]);
    },
  },
  {
    id: 'OUT-H3-digest', clauses: ['FR-H.3', 'FR-G.1'], level: 'MUST',
    title: 'golden digest entries as they appear in the built feed',
    run: (ctx) => withScratch((dir) => {
      const { r, xml } = feedFromLedger(ctx, dir, join(ctx.root, LEDGER_FX));
      if (r.status !== 0) return { pass: false, detail: `make-feed exited ${r.status}: ${r.stderr.trim()}` };
      return goldens(ctx, [['outputs/digest-entries.xml', digestBlocks(xml).join('')]]);
    }),
  },
];

export default [...cardCases, ...l4Cases, ...l5Cases, ...dashCases, ...digestCases, ...goldenCases];
