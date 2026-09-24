/* live-watch.js: fills #live-watch with the daily watch's latest result, read from GitHub at view time.
 *
 * The scheduled workflow (.github/workflows/watch.yml) commits watch/latest.json to main every day;
 * this reads it plus the count of open issues labelled `watch`, both unauthenticated, so the site
 * needs no deploy step and no credentials. See watch/README.md.
 *
 * The element's server-rendered text is the fallback and stays whenever anything is missing:
 * JavaScript off, a file:// page (the downloaded ZIP and the gate I render make no requests),
 * no latest.json on main yet, offline, blocked, or rate limited (60 unauthenticated API requests
 * an hour per address). If only the issue count fails, the line leaves the count out.
 * Nothing here logs, throws, or animates. Text from the network goes in through text nodes only.
 */
(function () {
  'use strict';
  var REPO = 'JYeswak/franken-research';
  var API = 'https://api.github.com/repos/' + REPO;
  var LATEST_URL = 'https://raw.githubusercontent.com/' + REPO + '/main/watch/latest.json';
  var BLOB = 'https://github.com/' + REPO + '/blob/main/';
  var ISSUES_URL = 'https://github.com/' + REPO + '/issues?q=is%3Aissue+is%3Aopen+label%3Awatch';
  var CACHE_KEY = 'fr-live-watch-v1';
  var CACHE_MS = 10 * 60 * 1000;
  var TIMEOUT_MS = 8000;

  function isCount(n) { return typeof n === 'number' && isFinite(n) && n >= 0 && Math.floor(n) === n; }

  function getJson(url) {
    var ctl = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = ctl ? setTimeout(function () { ctl.abort(); }, TIMEOUT_MS) : null;
    return fetch(url, { signal: ctl ? ctl.signal : undefined, credentials: 'omit' }).then(function (r) {
      if (timer) clearTimeout(timer);
      if (!r.ok) throw new Error('http ' + r.status);
      return r.json().then(function (body) { return { body: body, link: r.headers.get('Link') || '' }; });
    }, function (e) { if (timer) clearTimeout(timer); throw e; });
  }

  // latest.json is only requested once the directory listing shows it on main, so a site served
  // before the first scheduled run gets a 200 listing, not a 404, and keeps the fallback.
  function loadLatest() {
    return getJson(API + '/contents/watch?ref=main').then(function (res) {
      var list = Array.isArray(res.body) ? res.body : [];
      for (var i = 0; i < list.length; i++) if (list[i] && list[i].name === 'latest.json') return getJson(LATEST_URL);
      throw new Error('no latest.json on main');
    }).then(function (res) {
      var l = res.body;
      if (!l || l.schema !== 1 || typeof l.checked_at !== 'string' || !isCount(l.moved_since_pin)) throw new Error('bad latest.json');
      if (isNaN(Date.parse(l.checked_at))) throw new Error('bad checked_at');
      return {
        checked_at: l.checked_at,
        moved: l.moved_since_pin,
        census: /^watch\/census\/\d{4}-\d{2}-\d{2}\.tsv$/.test(l.census_path) ? l.census_path : null,
      };
    });
  }

  function loadOpen() {
    return getJson(API + '/issues?labels=watch&state=open&per_page=100').then(function (res) {
      if (!Array.isArray(res.body)) throw new Error('bad issues');
      var n = 0;
      for (var i = 0; i < res.body.length; i++) if (res.body[i] && !res.body[i].pull_request) n++;
      return { n: n, more: /rel="next"/.test(res.link) };
    }).then(null, function () { return null; });
  }

  function readCache() {
    try {
      var c = JSON.parse(window.localStorage.getItem(CACHE_KEY) || 'null');
      if (c && c.latest && typeof c.t === 'number' && Date.now() - c.t < CACHE_MS && Date.now() >= c.t) return c;
    } catch (e) { /* storage blocked or corrupt: fetch instead */ }
    return null;
  }
  function writeCache(latest, open) {
    try { window.localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), latest: latest, open: open })); } catch (e) { /* ignore */ }
  }

  function relTime(ms, compact) {
    var s = Math.round((Date.now() - ms) / 1000);
    if (s < 90) return 'just now';
    var m = Math.round(s / 60);
    if (m < 90) return m + (compact ? ' min ago' : ' minutes ago');
    var h = Math.round(m / 60);
    if (h < 36) return compact ? h + ' h ago' : h === 1 ? '1 hour ago' : h + ' hours ago';
    var d = Math.round(h / 24);
    return d === 1 ? '1 day ago' : d + ' days ago';
  }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

  function link(href, text) {
    var a = document.createElement('a');
    a.href = href;
    a.appendChild(document.createTextNode(text));
    return a;
  }

  // data-compact (the map's intro card) keeps the line short enough for one line at card width;
  // the full UTC time moves to the title attribute.
  function render(el, latest, open) {
    var compact = el.hasAttribute('data-compact');
    var t = Date.parse(latest.checked_at);
    var day = new Date(t).toISOString().slice(0, 10);
    var frag = document.createDocumentFragment();
    frag.appendChild(document.createTextNode(compact
      ? 'Daily watch, ' + relTime(t, true) + ': '
      : 'Watched daily. Last check ' + relTime(t, false) + ' (' + day + ' UTC): '));
    var moved = (compact ? latest.moved : plural(latest.moved, 'repo', 'repos')) + ' moved since the pin';
    frag.appendChild(latest.census ? link(BLOB + latest.census, moved) : document.createTextNode(moved));
    if (open) {
      var n = open.more ? open.n + '+' : String(open.n);
      var one = open.n === 1 && !open.more;
      frag.appendChild(document.createTextNode(', '));
      frag.appendChild(link(ISSUES_URL, compact ? n + (one ? ' issue open' : ' issues open') : n + (one ? ' change' : ' changes') + ' open for triage'));
    }
    frag.appendChild(document.createTextNode('.'));
    while (el.firstChild) el.removeChild(el.firstChild);
    el.appendChild(frag);
    if (compact) el.title = 'Last watch check ' + latest.checked_at.replace('T', ' ').replace('Z', ' UTC');
    el.setAttribute('data-live', 'ok');
  }

  function start() {
    try {
      var el = document.getElementById('live-watch');
      if (!el || !window.fetch || !window.Promise || !/^https?:$/.test(location.protocol)) return;
      var cached = readCache();
      if (cached) { render(el, cached.latest, cached.open); return; }
      Promise.all([loadLatest(), loadOpen()]).then(function (r) {
        try { render(el, r[0], r[1]); writeCache(r[0], r[1]); } catch (e) { /* keep the fallback */ }
      }, function () { /* keep the fallback */ });
    } catch (e) { /* keep the fallback */ }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
