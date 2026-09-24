/* fill-stats.js — render-time stat filler for pages that don't load app.bundle.js.
 *
 * Every aggregate number in the site's UI copy is computed here from
 * window.FRANKEN_DATA (assets/data.js) at render time, never hardcoded.
 * Same semantics as the STATS block in assets/app.src.js; this file exists
 * so method/, failure-modes/ and any future static page can use the same
 * data-stat slots without pulling in the 3D bundle.
 *
 * Usage: after data.js,
 *   <script src="../assets/data.js"></script>
 *   <script src="../assets/fill-stats.js"></script>
 * and mark slots like <span data-stat="riderCount">38</span>.
 * The inner text is the no-JS fallback; verify-site.sh gate B2 checks the
 * fallback still equals the computed value (no stale numbers when JS is off).
 */
(function () {
  if (!window.FRANKEN_DATA || !window.FRANKEN_DATA.repos) return; // keep fallbacks
  var repos = window.FRANKEN_DATA.repos;
  var s = { total: repos.length, green: 0, rider: 0, mit: 0, none: 0,
            rings: { Invest: 0, Pilot: 0, Explore: 0, Monitor: 0 },
            ci: {}, greenNames: [], trlMin: 9, trlMax: 2 };
  for (var i = 0; i < repos.length; i++) {
    var r = repos[i];
    if (r.nodus in s.rings) s.rings[r.nodus]++;
    s.ci[r.ciKey] = (s.ci[r.ciKey] || 0) + 1;
    if (r.ciKey === 'C1') { s.green++; s.greenNames.push(r.name); }
    if (r.licenseKey === 'rider') s.rider++;
    else if (r.licenseKey === 'mit') s.mit++;
    else if (r.licenseKey === 'none') s.none++;
    if (!r.techNA) {
      var lo = (typeof r.trlLow === 'number') ? r.trlLow : 9;
      var hi = (typeof r.trlHigh === 'number') ? r.trlHigh : 2;
      if (lo < s.trlMin) s.trlMin = lo;
      if (hi > s.trlMax) s.trlMax = hi;
    }
  }
  s.greenNames.sort();
  s.noRider = s.mit + s.none;
  s.notGreen = s.total - s.green;
  function esc(n) {
    return String(n).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' }[c];
    });
  }
  function set(key, html) {
    var els = document.querySelectorAll('[data-stat="' + key + '"]');
    for (var j = 0; j < els.length; j++) els[j].innerHTML = html;
  }
  set('total', s.total);
  set('greenCount', s.green);
  set('notGreen', s.notGreen);
  set('riderCount', s.rider);
  set('mitCount', s.mit);
  set('noneCount', s.none);
  set('noRiderCount', s.noRider);
  set('ringInvest', s.rings.Invest);
  set('ringPilot', s.rings.Pilot);
  set('ringExplore', s.rings.Explore);
  set('ringMonitor', s.rings.Monitor);
  set('trlRange', s.trlMin + '–' + s.trlMax);
  set('greenNames', s.greenNames.map(function (n) { return '<b>' + esc(n) + '</b>'; }).join(' and '));
  set('ciC1', s.ci.C1 || 0);
  set('ciC2', s.ci.C2 || 0);
  set('ciC3', s.ci.C3 || 0);
  set('ciC4', s.ci.C4 || 0);
  set('ciC5', s.ci.C5 || 0);
  set('ciC6', s.ci.C6 || 0);
})();
