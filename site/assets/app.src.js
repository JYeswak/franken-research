import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';

/* FrankenSuite verdict map — front door of the shareable site.
   Data verified against synthesis/00-overview.md (master matrix) + packets.
   CI-green channel: exactly 2 nodes (frankenscipy, franken_threed). */

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- static index fallback (no WebGL / init threw) ----------
   Generated from data.js at runtime (JS-on path). The <noscript> block in
   index.html covers the JS-off path. Styled as a real index, not an error. */
function esc(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;')
                  .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function showFallback(){
  if (document.getElementById('fallback')) return;  // already shown
  document.body.classList.add('fb');
  const sceneEl = document.getElementById('scene');
  if (sceneEl) sceneEl.innerHTML = '';
  const repos = (window.FRANKEN_DATA && window.FRANKEN_DATA.repos) || [];
  // counts computed from the data contract, never hardcoded (P1-1)
  const greenNames = repos.filter((r) => r.ciKey === 'C1').map((r) => r.name).sort();
  const riderCount = repos.filter((r) => r.licenseKey === 'rider').length;
  const cards = repos.map((r) =>
    '<a class="fb-card" href="./briefs/' + esc(r.name) + '.html">' +
      '<span class="fb-name">' + esc(r.name) + '</span>' +
      '<span class="fb-meta"><span class="chip ' + esc(r.nodus) + '">' + esc(r.nodus) +
      '</span><span>' + (r.techNA ? 'TRL N/A' : 'TRL ' + esc(r.trl)) + '</span></span>' +
      '<span class="fb-blurb">' + esc(r.blurb) + '</span>' +
    '</a>'
  ).join('');
  const root = document.createElement('div');
  root.id = 'fallback';
  root.innerHTML =
    '<div class="fb-inner">' +
      '<p class="fb-kicker">Franken Research &middot; independent assessment</p>' +
      '<h2>44 verdicts, <span class="sys">no 3D required</span></h2>' +
      '<p class="fb-sub">The interactive map needs WebGL, which this browser ' +
      'isn&rsquo;t offering. The verdicts don&rsquo;t &mdash; every brief is ' +
      'below, same packets, same pins.</p>' +
      '<p class="fb-method"><a href="./method/index.html">How the verdicts were made &rarr;</a></p>' +
      '<div class="fb-stats">' +
        '<span class="stat neutral"><b>' + repos.length + '</b> repos assessed, pinned Sep 2026</span>' +
        '<span class="stat"><b>' + (repos.length - greenNames.length) + ' of ' + repos.length + '</b> can&rsquo;t show CI green at the pin</span>' +
        '<span class="stat grn"><b>' + greenNames.length + '</b> can &mdash; ' + greenNames.map(esc).join(', ') + '</span>' +
        '<span class="stat"><b>' + riderCount + ' of ' + repos.length + '</b> carry the AI-lab license rider</span>' +
      '</div>' +
      '<div class="fb-grid">' + cards + '</div>' +
    '</div>';
  document.body.appendChild(root);
}
window.__frontdoorFallback = showFallback;

try {

const RING = {
  Invest:  { color: 0xf5f2e8, css:'#f5f2e8', radius: 4.5 },
  Pilot:   { color: 0xf2a93b, css:'#f2a93b', radius: 8  },
  Explore: { color: 0x2fd4bf, css:'#2fd4bf', radius: 17 },
  Monitor: { color: 0x7f8fb4, css:'#7f8fb4', radius: 27 },
};
const GREEN = { color: 0x39ff7d, css: '#39ff7d' };
const RIDER = { color: 0xf2a93b, css: '#f2a93b' };
const RING_NOTE = {
  Pilot: "The short list: a release artifact plus a bounded, real workload fit. Not a recommendation to ship. Still one maintainer each, still no independent check.",
  Explore: "The bulk of the suite: real code, working lab demos \u2014 but the claims at the assessed commit can\u2019t be independently certified. Substantive but unproven is what this ring means.",
  Monitor: "Websites, dashboards, and one plan. Tracked for movement, not relied on yet.",
};
// ring definitions are owned by the data contract; Invest's note comes straight from it
const ringDefs = (window.FRANKEN_DATA && window.FRANKEN_DATA.ringDefinitions) || {};
RING_NOTE.Invest = ringDefs.Invest || "Independent validation plus governance. Empty in this program.";
const CI_WORD = {
  C1: 'CI green at the pin', C2: 'CI red at the pin',
  C3: 'CI exists, no pin verdict', C4: 'No test CI (deploy-only at most)',
  C5: 'CI disabled or deleted', C6: 'Tests only on maintainer-private machines',
};

const repos = window.FRANKEN_DATA.repos;
const briefUrl = (repo) => './briefs/' + repo.name + '.html';

// framing sentence is owned by the data contract (FIXER B); hard-coded text is the fallback
const frameEl = document.getElementById('framesentence');
if (frameEl && window.FRANKEN_DATA.framing) frameEl.textContent = window.FRANKEN_DATA.framing;

/* ---------- render-time stats (P1-1): every count in the copy is computed
   here from the data contract, never hardcoded. If the data changes, the
   copy follows: header stats, filter buttons, legend rows, dome caption. ---------- */
const STATS = (() => {
  const s = { total: repos.length, green: 0, rider: 0, mit: 0, none: 0,
              rings: { Invest: 0, Pilot: 0, Explore: 0, Monitor: 0 },
              ci: {}, greenNames: [], trlMin: 9, trlMax: 2 };
  for (const r of repos){
    if (r.nodus in s.rings) s.rings[r.nodus]++;
    s.ci[r.ciKey] = (s.ci[r.ciKey] || 0) + 1;
    if (r.ciKey === 'C1'){ s.green++; s.greenNames.push(r.name); }
    if (r.licenseKey === 'rider') s.rider++;
    else if (r.licenseKey === 'mit') s.mit++;
    else if (r.licenseKey === 'none') s.none++;
    if (!r.techNA){
      const lo = (typeof r.trlLow === 'number') ? r.trlLow : 9;
      const hi = (typeof r.trlHigh === 'number') ? r.trlHigh : 2;
      s.trlMin = Math.min(s.trlMin, lo);
      s.trlMax = Math.max(s.trlMax, hi);
    }
  }
  s.greenNames.sort((a, b) => a.localeCompare(b));
  s.noRider = s.mit + s.none;      // the six repos without the rider
  s.notGreen = s.total - s.green;  // "can't show CI green at the pin"
  return s;
})();
const LICENSE_LABEL = { rider: 'MIT + AI-lab rider', mit: 'Plain MIT', none: 'No license file' };
(function fillStats(){
  const set = (key, html) => {
    document.querySelectorAll('[data-stat="' + key + '"]').forEach((el) => { el.innerHTML = html; });
  };
  set('total', STATS.total);
  set('greenCount', STATS.green);
  set('notGreen', STATS.notGreen);
  set('riderCount', STATS.rider);
  set('mitCount', STATS.mit);
  set('noneCount', STATS.none);
  set('noRiderCount', STATS.noRider);
  set('ringInvest', STATS.rings.Invest);
  set('ringPilot', STATS.rings.Pilot);
  set('ringExplore', STATS.rings.Explore);
  set('ringMonitor', STATS.rings.Monitor);
  set('trlRange', STATS.trlMin + '\u2013' + STATS.trlMax);
  set('greenNames', STATS.greenNames.map((n) => '<b>' + esc(n) + '</b>').join(' and '));
  for (const k of ['C1', 'C2', 'C3', 'C4', 'C5', 'C6']) set('ci' + k, STATS.ci[k] || 0);
})();

/* ---------- renderer / scene / camera ---------- */
const container = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ antialias: true });  // throws without WebGL -> fallback
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
// the canvas itself gets an accessible name (Wave-3 P2); the container keeps
// the keyboard-application role with the key-map label (see keyboard access).
renderer.domElement.setAttribute('role', 'img');
renderer.domElement.setAttribute('aria-label',
  '3D map of the 44 assessed repositories arranged by verdict ring, ' +
  'node size and height by technology readiness, green glow where CI was green ' +
  'at the pin. Keyboard users: tab to the map for arrow-key navigation, or use ' +
  'the "Jump to repo" list in the controls.');
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05070d);
scene.fog = new THREE.FogExp2(0x05070d, 0.0045);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth/window.innerHeight, 0.1, 2000);
const CAM_HOME = new THREE.Vector3(0, 27, 54);
const CAM_HOME_MOBILE = new THREE.Vector3(0, 48, 50);  // frames all 44 nodes in the ~390x440 phone band
const TGT_HOME = new THREE.Vector3(0, 2.5, 0);
// one breakpoint for layout and framing; must match the (max-width:900px) block in index.html
const MOBILE_MQ = window.matchMedia('(max-width: 900px)');
const isMobileView = () => MOBILE_MQ.matches;
function applyFraming(){
  // framing per breakpoint; mobile keeps every node inside the viewport at load
  camera.fov = isMobileView() ? 60 : 50;
  camera.updateProjectionMatrix();
  camera.position.copy(isMobileView() ? CAM_HOME_MOBILE : CAM_HOME);
}
applyFraming();

/* Narrow-screen layout: index.html insets #scene to the band between the intro
   sheet and the bottom bar via --maptop; this keeps --maptop equal to the intro's
   real bottom edge as it collapses, expands, or reflows. */
const headerEl = document.getElementById('main');
function layoutMap(){
  const root = document.documentElement.style;
  const b = Math.round(headerEl.getBoundingClientRect().bottom);
  if (isMobileView()){
    root.setProperty('--maptop', b + 'px');
    root.removeProperty('--paneltop');
  } else {
    root.removeProperty('--maptop');
    // desktop: the panel docks in the left column, under the compact intro bar when collapsed
    if (document.body.classList.contains('intro-min')) root.setProperty('--paneltop', (b + 10) + 'px');
    else root.removeProperty('--paneltop');
  }
}
layoutMap();

/* intro card: expanded by default; collapses to a compact bar ("Explore the map"
   or the toggle). The choice holds for the session so returning from a brief
   doesn't re-open it. */
const introToggle = document.getElementById('introtoggle');
function setIntro(expanded, persist){
  document.body.classList.toggle('intro-min', !expanded);
  introToggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  introToggle.textContent = expanded ? 'Hide intro' : 'About this map';
  if (persist){ try { sessionStorage.setItem('fr-intro', expanded ? 'open' : 'min'); } catch (e) {} }
  layoutMap();
  sizeRenderer();
}
introToggle.addEventListener('click', () => {
  const expand = document.body.classList.contains('intro-min');
  // desktop: panel and expanded intro share the left column; the intro wins
  if (expand && selected && !isMobileView()){ kbFocus = null; deselect(); }
  setIntro(expand, true);
});

/* Size the renderer to the scene container, not the window: on narrow screens
   CSS insets #scene to the band above, so the camera frames the node field
   into the visible region at a usable size. */
function sizeRenderer(){
  const w = container.clientWidth || window.innerWidth;
  const h = container.clientHeight || window.innerHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  // desktop: slide the projection centre so the focus sits in free space.
  // Panel open: midway between the docked panel and the right rail (the selected
  // node lands there). Intro card open: right of the card, where the field reads best.
  let shift = 0;
  if (!isMobileView()){
    if (document.body.classList.contains('panel-open')){
      const pEl = document.getElementById('panel');  // layout box: ignores the slide-in transform
      const left = pEl.offsetLeft + pEl.offsetWidth;
      const right = document.getElementById('controls').getBoundingClientRect().left;
      if (right > left) shift = Math.round((left + right) / 2 - w / 2);
    } else if (!document.body.classList.contains('intro-min')){
      shift = Math.round(Math.min(140, w * 0.1));
    }
  }
  if (shift) camera.setViewOffset(w, h, -shift, 0, w, h);
  else camera.clearViewOffset();  // both paths update the projection matrix
}
sizeRenderer();
{
  let stored = null;
  try { stored = sessionStorage.getItem('fr-intro'); } catch (e) {}
  if (stored === 'min') setIntro(false, false);
}
// the intro reflows (fonts, wrapping, collapse): keep the phone map band glued to it
if (typeof ResizeObserver === 'function'){
  new ResizeObserver(() => { layoutMap(); if (isMobileView()) sizeRenderer(); }).observe(headerEl);
}

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(TGT_HOME);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 6;
controls.maxDistance = 160;
controls.autoRotate = !REDUCED;  // reduced motion: no auto-orbit, ever
controls.autoRotateSpeed = 0.45;
let idleTimer = null;
let userDrove = false;
let camGoal = null;  // "Surprise me" / deep-link camera flight; any user drag cancels it
controls.addEventListener('start', () => {
  userDrove = true;
  camGoal = null;
  controls.autoRotate = false;
  clearTimeout(idleTimer);
});
controls.addEventListener('end', () => {
  clearTimeout(idleTimer);
  if (!REDUCED) idleTimer = setTimeout(() => { controls.autoRotate = true; }, 10000);
});

/* ---------- lights ---------- */
scene.add(new THREE.AmbientLight(0xffffff, 0.55));
const key = new THREE.DirectionalLight(0xfff2dd, 1.4);
key.position.set(30, 50, 20);
scene.add(key);
const rim = new THREE.DirectionalLight(0x6f86ff, 0.5);
rim.position.set(-40, 12, -30);
scene.add(rim);

/* ---------- the core: the method is the asset ---------- */
const core = new THREE.Mesh(
  new THREE.SphereGeometry(1.7, 48, 32),
  new THREE.MeshStandardMaterial({ color:0x1a1206, emissive:0xf2a93b, emissiveIntensity:1.1, roughness:0.35 })
);
core.position.set(0, 2.5, 0);
scene.add(core);
const coreGlow = new THREE.PointLight(0xf2a93b, 60, 60, 1.8);
coreGlow.position.copy(core.position);
scene.add(coreGlow);
{
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(2.6, 32, 24),
    new THREE.MeshBasicMaterial({ color:0xf2a93b, transparent:true, opacity:0.10, side:THREE.BackSide })
  );
  halo.position.copy(core.position);
  scene.add(halo);
}

/* ---------- NODUS shells ---------- */
for (const name of Object.keys(RING)){
  const cfg = RING[name];
  const torus = new THREE.Mesh(
    new THREE.TorusGeometry(cfg.radius, 0.035, 8, 220),
    new THREE.MeshBasicMaterial({ color:cfg.color, transparent:true, opacity:0.30 })
  );
  torus.rotation.x = Math.PI/2;
  torus.position.y = 2.5;
  scene.add(torus);
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(cfg.radius, 96),
    new THREE.MeshBasicMaterial({ color:cfg.color, transparent:true, opacity:0.035, side:THREE.DoubleSide })
  );
  disc.rotation.x = -Math.PI/2;
  disc.position.y = 2.45;
  scene.add(disc);
}

/* ---------- repo nodes ---------- */
const sphereGeo = new THREE.SphereGeometry(1, 28, 20);
const cageGeo = new THREE.IcosahedronGeometry(1, 0);
const domeGeo = new THREE.SphereGeometry(1, 24, 12, 0, Math.PI*2, 0, Math.PI/2);
const glowGeo = new THREE.SphereGeometry(1, 32, 24);
const bandGeo = new THREE.CylinderGeometry(1, 1, 1, 8);  // unit cylinder, scaled per TRL range
// data contract: rider domes are uniform world-space hemispheres of fixed radius —
// the dome marks the *presence* of the rider, never a magnitude. Never scale by node size.
const DOME_RADIUS = (window.FRANKEN_DATA && window.FRANKEN_DATA.visualEncoding &&
  window.FRANKEN_DATA.visualEncoding.riderDome &&
  typeof window.FRANKEN_DATA.visualEncoding.riderDome.radius === 'number'
  ? window.FRANKEN_DATA.visualEncoding.riderDome.radius : 2.0);
const nodeMeshes = [];
const greenMeshes = [];
const riderDomes = new THREE.Group();
riderDomes.visible = false;
scene.add(riderDomes);
const ringCount = {};
for (const k of Object.keys(RING)) ringCount[k] = 0;

repos.forEach((repo) => {
  const cfg = RING[repo.nodus];
  const i = ringCount[repo.nodus]++;
  const n = repos.filter(r => r.nodus === repo.nodus).length;
  const angle = (i / n) * Math.PI * 2 + (cfg.radius * 0.37);
  const rad = cfg.radius + (Math.sin(i * 12.9898) * 1.6);
  // data contract (FIXER B): TRL ranges are never plotted at midpoints.
  // The sphere sits at the range's low bound — the only single number any packet
  // states — and a vertical band spans low->high so the range reads as a range.
  // techNA repos (frankentui_website): TRL is N/A as technology, so size and height
  // are neutral — the numeric trl value is never used as a technology claim.
  const sizeOf = (t) => 0.30 + (t / 9) * 0.95;
  const heightOf = (t) => 2.5 + ((t - 2) / 7) * 5.2;
  const techNA = repo.techNA === true;
  const trlLo = (typeof repo.trlLow === 'number') ? repo.trlLow : 2;
  const trlHi = (typeof repo.trlHigh === 'number') ? repo.trlHigh : trlLo;
  const size = techNA ? 0.55 : sizeOf(trlLo);
  const height = techNA ? 2.5 : heightOf(trlLo);
  const isGreen = repo.ciKey === 'C1';
  const hasRider = repo.licenseKey === 'rider';
  const plainMIT = repo.licenseKey === 'mit';

  const mat = new THREE.MeshStandardMaterial({
    color: cfg.color,
    emissive: isGreen ? GREEN.color : cfg.color,
    emissiveIntensity: isGreen ? 0.95 : 0.28,
    roughness: 0.42, metalness: 0.15,
    transparent: true,
  });
  const mesh = new THREE.Mesh(sphereGeo, mat);
  mesh.scale.setScalar(size);
  mesh.position.set(Math.cos(angle)*rad, height, Math.sin(angle)*rad);
  mesh.userData = { repo, size, isGreen, hasRider };
  scene.add(mesh);
  nodeMeshes.push(mesh);

  // CI-green channel: a visible green halo, pulsing in the loop (not when reduced motion)
  if (isGreen){
    const halo = new THREE.Mesh(glowGeo, new THREE.MeshBasicMaterial({
      color: GREEN.color, transparent: true, opacity: 0.22,
      side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    halo.scale.setScalar(size * 1.9);
    halo.userData.isHalo = true;
    mesh.add(halo);
    mesh.userData.halo = halo;
    greenMeshes.push(mesh);
  }

  if (hasRider){
    // rider ceiling dome (hidden until the toggle) — uniform world-space radius
    // for every rider-bound node: presence, not magnitude
    const dome = new THREE.Mesh(domeGeo, new THREE.MeshBasicMaterial({
      color: RIDER.color, transparent: true, opacity: 0.17,
      side: THREE.DoubleSide, depthWrite: false }));
    dome.scale.setScalar(DOME_RADIUS);
    dome.position.copy(mesh.position);
    riderDomes.add(dome);
    mesh.userData.dome = dome;
  } else if (plainMIT){
    // the suite's one genuinely rider-free repo: white cage
    const cage = new THREE.Mesh(cageGeo, new THREE.MeshBasicMaterial({
      color:0xffffff, wireframe:true, transparent:true, opacity:0.55 }));
    cage.scale.setScalar(size * 1.45);
    cage.userData.isCage = true;
    mesh.add(cage);
  } else {
    // no license file: all rights reserved — the most restricted state, not the freest.
    // Red cage so it never reads as freer than plain MIT.
    const cage = new THREE.Mesh(cageGeo, new THREE.MeshBasicMaterial({
      color:0xff6b5e, wireframe:true, transparent:true, opacity:0.55 }));
    cage.scale.setScalar(size * 1.45);
    cage.userData.isCage = true;
    mesh.add(cage);
  }

  if (!techNA && trlHi > trlLo){
    // the range as a range: a thin vertical band from the low bound to the high bound.
    // Scene-level (not a child of the node) so the node's own scale can't warp it.
    // frankensim (4,4) renders as a point — correct.
    const bandTop = heightOf(trlHi);
    const band = new THREE.Mesh(bandGeo, new THREE.MeshBasicMaterial({
      color: cfg.color, transparent: true, opacity: 0.6, depthWrite: false }));
    band.scale.set(0.045, bandTop - height, 0.045);
    band.position.set(mesh.position.x, height + (bandTop - height) / 2, mesh.position.z);
    band.userData.isBand = true;
    scene.add(band);
  }
});

/* selection halo (one, reused) */
const selHalo = new THREE.Mesh(
  new THREE.SphereGeometry(1, 24, 16),
  new THREE.MeshBasicMaterial({ color:0xffffff, wireframe:true, transparent:true, opacity:0.85 })
);
selHalo.visible = false;
scene.add(selHalo);

/* ---------- labels ---------- */
const labelLayer = document.getElementById('labels');
const labelDefs = [];
function makeLabel(html, cls){
  const el = document.createElement('div');
  el.className = cls; el.innerHTML = html; el.style.display = 'none';
  labelLayer.appendChild(el);
  return el;
}
const coreLabel = makeLabel('the core: one grading method, applied to all 44', 'corelabel');
labelDefs.push({ el: coreLabel, kind:'core' });
const nodeLabels = new Map();
for (const mesh of nodeMeshes){
  const { repo, isGreen } = mesh.userData;
  const tag = isGreen ? '<span class="grntag">CI green</span>' : '';
  const el = makeLabel(`<span class="dot" style="background:${isGreen ? GREEN.css : RING[repo.nodus].css}"></span>${repo.name}${tag}`, 'nodelabel');
  labelDefs.push({ el, kind:'node', mesh });
  nodeLabels.set(mesh, el);
}

/* ---------- picking (throttled, flat array, reused results) ---------- */
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let pointerDirty = false;
let hovered = null;
let selected = null;
const hits = [];
const tip = document.getElementById('tip');
const tipT = tip.querySelector('.t'), tipM = tip.querySelector('.m'), tipG = tip.querySelector('.g');
let mouseX = 0, mouseY = 0;
let downX = 0, downY = 0;
const BASE_EMISSIVE = 0.28;

function setEmissive(mesh, v){
  mesh.material.emissiveIntensity = mesh.userData.isGreen ? Math.max(v, 0.95) : v;
}

renderer.domElement.addEventListener('pointermove', (e) => {
  const r = renderer.domElement.getBoundingClientRect();
  pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
  pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  mouseX = e.clientX; mouseY = e.clientY;
  pointerDirty = true;
});
renderer.domElement.addEventListener('pointerdown', (e) => { downX = e.clientX; downY = e.clientY; });
renderer.domElement.addEventListener('pointerup', (e) => {
  if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return;  // it was a drag
  const r = renderer.domElement.getBoundingClientRect();
  pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
  pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  hits.length = 0;
  raycaster.intersectObjects(nodeMeshes, false, hits);
  if (hits.length) select(hits[0].object);
  else { kbFocus = null; deselect(); }
});
renderer.domElement.addEventListener('dblclick', (e) => {
  const r = renderer.domElement.getBoundingClientRect();
  pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
  pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  hits.length = 0;
  raycaster.intersectObjects(nodeMeshes, false, hits);
  if (hits.length) window.location.href = briefUrl(hits[0].object.userData.repo);
});

function doHover(){
  raycaster.setFromCamera(pointer, camera);
  hits.length = 0;
  raycaster.intersectObjects(nodeMeshes, false, hits);
  const m = hits.length ? hits[0].object : null;
  if (m !== hovered){
    if (hovered && hovered !== selected) setEmissive(hovered, BASE_EMISSIVE);
    hovered = m;
    if (hovered){
      renderer.domElement.style.cursor = 'pointer';
      if (hovered !== selected) setEmissive(hovered, 1.0);
      const { repo, isGreen } = hovered.userData;
      tipT.textContent = repo.name;
      tipM.textContent = `${repo.techNA ? (repo.trlTech || 'TRL N/A') : 'TRL ' + repo.trl} \u00b7 ${repo.nodus} \u00b7 ${CI_WORD[repo.ciKey] || ''}`;
      tipG.textContent = isGreen ? 'CI green at the pin — double-click opens the brief' : 'double-click opens the brief';
    } else {
      renderer.domElement.style.cursor = 'grab';
      tip.style.display = 'none';
    }
    tip.style.display = hovered ? 'block' : 'none';
  }
  if (hovered){
    tip.style.left = (mouseX + 16) + 'px';
    tip.style.top = (mouseY + 12) + 'px';
  }
}

/* ---------- detail panel ---------- */
const panel = document.getElementById('panel');
function select(mesh){
  if (selected && selected !== mesh) setEmissive(selected, BASE_EMISSIVE);
  selected = mesh;
  setEmissive(mesh, 1.0);
  const { repo, size, isGreen } = mesh.userData;
  document.getElementById('p-name').textContent = repo.name;
  document.getElementById('chips').innerHTML =
    `<span class="chip ${repo.nodus}">${repo.nodus}</span><span class="chip trl">${repo.techNA ? 'TRL N/A' : 'TRL ' + esc(repo.trl)}</span>` +
    (isGreen ? '<span class="chip green">CI green at the pin</span>' : '');
  document.getElementById('brieflink').href = briefUrl(repo);
  document.getElementById('p-blurb').textContent = repo.blurb;
  document.getElementById('p-ci').innerHTML = '<b class="' + (isGreen ? 'grn' : '') + '">' + esc(repo.ci) + '</b>';
  document.getElementById('p-lic').innerHTML = '<b>' + esc(repo.license) + '</b>';
  document.getElementById('p-rel').innerHTML = '<b>' + esc(repo.release) + '</b>';
  document.getElementById('p-ring').textContent = RING_NOTE[repo.nodus];
  panel.classList.add('open');
  document.body.classList.add('panel-open');
  setHash('#repo=' + encodeURIComponent(repo.name));
  resetCopyButton();
  if (isMobileView()){
    // phone: the panel is a bottom sheet; give it the room the intro and filters were using
    setSheet(false, false);
    if (!document.body.classList.contains('intro-min')) setIntro(false, false);
  }
  sizeRenderer();  // phone: the band shrank above the panel sheet; desktop: recentre beside the panel
  selHalo.visible = true;
  selHalo.scale.setScalar(size * 1.7);
  focusTarget.copy(mesh.position);
  if (REDUCED) controls.target.copy(mesh.position);  // instant: no camera glide under reduced motion
}
let kbFocus = null;  // node under keyboard focus (panel may be closed while this is set)
function deselect(){
  if (selected) setEmissive(selected, BASE_EMISSIVE);
  selected = null;
  if (kbFocus){
    // keyboard focus ring stays on the node so Escape never strands the user
    selHalo.visible = true;
    selHalo.scale.setScalar(kbFocus.userData.size * 1.7);
    selHalo.position.copy(kbFocus.position);
  } else {
    selHalo.visible = false;
  }
  panel.classList.remove('open');
  document.body.classList.remove('panel-open');
  sizeRenderer();  // the map band / projection centre returns to its no-panel layout
  setHash('');
  focusTarget.copy(TGT_HOME);
  if (REDUCED) controls.target.copy(TGT_HOME);  // no camera glide under reduced motion
}

/* ---------- shareable links ----------
   #repo=<name> opens that repo's panel on load and follows the open panel, so a
   map view can be shared. Copy link copies the brief's canonical public URL. */
const SITE_ORIGIN = 'https://fr.zeststream.ai';
const repoFromHash = () => {
  const m = /^#repo=([^&]+)$/.exec(window.location.hash);
  if (!m) return null;
  let name = m[1];
  try { name = decodeURIComponent(name); } catch (e) { return null; }
  return nodeMeshes.find((x) => x.userData.repo.name === name) || null;
};
function setHash(want){
  if (window.location.hash === want) return;
  const url = window.location.pathname + window.location.search + want;
  try { history.replaceState(history.state, '', url); } catch (e) { /* file:// quirks: the link just doesn't follow */ }
}
const copyBtn = document.getElementById('copylink');
const copyFallback = document.getElementById('copyfallback');
const copyUrl = document.getElementById('copyurl');
let copyTimer = null;
function resetCopyButton(){
  clearTimeout(copyTimer);
  copyBtn.textContent = 'Copy link';
  copyBtn.classList.remove('copied');
  copyFallback.hidden = true;
}
/* Every outcome is visible: the async clipboard (raced against a timeout, since a
   pending permission prompt can leave it unresolved), then the legacy execCommand
   path; if both fail, the caller shows the URL in a selectable field. */
async function copyText(text){
  if (navigator.clipboard && navigator.clipboard.writeText){
    try {
      await Promise.race([
        navigator.clipboard.writeText(text),
        new Promise((_, reject) => setTimeout(() => reject(new Error('clipboard timed out')), 1200)),
      ]);
      return true;
    } catch (e) { /* fall through to execCommand */ }
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.cssText = 'position:fixed; top:0; left:0; opacity:0;';
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
  ta.remove();
  copyBtn.focus();
  return ok;
}
copyBtn.addEventListener('click', async () => {
  if (!selected) return;
  const url = SITE_ORIGIN + '/briefs/' + encodeURIComponent(selected.userData.repo.name);
  copyBtn.textContent = 'Copying\u2026';
  const ok = await copyText(url);
  clearTimeout(copyTimer);
  if (ok){
    copyFallback.hidden = true;
    copyBtn.textContent = 'Copied';
    copyBtn.classList.add('copied');
    live.textContent = 'Link copied: ' + url;
    copyTimer = setTimeout(resetCopyButton, 2200);
  } else {
    // blocked clipboard: hand the reader the link, selected and ready for Ctrl/Cmd+C
    copyBtn.textContent = 'Copy link';
    copyBtn.classList.remove('copied');
    copyUrl.value = url;
    copyFallback.hidden = false;
    copyUrl.focus();
    copyUrl.select();
    live.textContent = 'Copying was blocked. The link is selected in a text field: ' + url;
  }
});

document.querySelector('#panel .close').addEventListener('click', () => { deselect(); container.focus(); });
// the filter sheet is a modal on phones: Escape closes it before anything else sees the key
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape' || !document.body.classList.contains('sheet-open')) return;
  if (!searchDrop.hidden) return;  // the search dropdown's own Escape closes it first
  e.preventDefault();
  e.stopPropagation();
  setSheet(false, true);
}, true);
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape'){
    if (tableOpen){ closeTableView(); return; }  // table view closes first
    const wasOpen = panel.classList.contains('open');
    deselect();
    if (wasOpen) container.focus();  // return focus to the map on close
  }
});

/* ---------- filters / search / reset / dome toggle ---------- */
let activeFilter = 'all';
let fLic = 'all', fCi = 'all', fTrl = 'all';  // deep filters (P1-9), combined AND-style
function inFilter(mesh){
  const r = mesh.userData.repo;
  if (activeFilter === 'green'){ if (!mesh.userData.isGreen) return false; }
  else if (activeFilter !== 'all' && r.nodus !== activeFilter) return false;
  if (fLic !== 'all' && r.licenseKey !== fLic) return false;
  if (fCi !== 'all' && r.ciKey !== fCi) return false;
  if (fTrl !== 'all'){
    if (fTrl === 'na'){ if (!r.techNA) return false; }
    else { const t = +fTrl; if (!(r.trlLow <= t && t <= r.trlHigh)) return false; }
  }
  return true;
}
function applyFilter(){
  let n = 0;
  for (const mesh of nodeMeshes){
    const on = inFilter(mesh);
    if (on) n++;
    mesh.material.opacity = on ? 1 : 0.10;
    mesh.visible = true;
    for (const child of mesh.children){
      if (child.userData.isCage) child.material.opacity = on ? 0.55 : 0.05;
      if (child.userData.isHalo) child.material.opacity = on ? 0.22 : 0.05;
    }
  }
  // match-count feedback (Wave-1): visible "N of 44 match", or a zero-match note
  const fc = document.getElementById('filtercount');
  if (fc) fc.textContent = n === 0 ? 'No repos match these filters.' : n + ' of ' + nodeMeshes.length + ' match';
  // phone: the bar button carries the active filter once the sheet is closed
  const sb = document.getElementById('sheetbtn');
  const deep = fLic !== 'all' || fCi !== 'all' || fTrl !== 'all';
  const ringLabel = activeFilter === 'all' ? '' : activeFilter === 'green' ? 'CI green' : activeFilter;
  let label = 'Filters';
  if (ringLabel && !deep) label += ' \u00b7 ' + ringLabel + ' ' + n;
  else if (ringLabel || deep) label += ' \u00b7 ' + n + ' of ' + nodeMeshes.length;
  sb.textContent = label;
  sb.classList.toggle('filtered', label !== 'Filters');
  sb.setAttribute('aria-label', label === 'Filters' ? 'Filters' : label.replace(' \u00b7 ', ': ') + ' shown. Change filters');
}
document.getElementById('filters').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  document.querySelectorAll('#filters button').forEach(x => x.classList.remove('active'));
  b.classList.add('active');
  activeFilter = b.dataset.f;
  applyFilter();
});
/* deep filters are built from the data contract — counts computed, never hardcoded */
function fillSelect(sel, items){
  for (const [val, label] of items){
    const o = document.createElement('option');
    o.value = val; o.textContent = label;
    sel.appendChild(o);
  }
}
{
  const licSel = document.getElementById('flic');
  const licCount = { rider: 0, mit: 0, none: 0 };
  for (const r of repos) if (r.licenseKey in licCount) licCount[r.licenseKey]++;
  fillSelect(licSel, [['all', 'All licenses'],
    ['rider', LICENSE_LABEL.rider + ' \u00b7 ' + licCount.rider],
    ['mit', LICENSE_LABEL.mit + ' \u00b7 ' + licCount.mit],
    ['none', LICENSE_LABEL.none + ' \u00b7 ' + licCount.none]]);
  licSel.addEventListener('change', () => { fLic = licSel.value; applyFilter(); });

  const ciSel = document.getElementById('fci');
  const ciItems = [['all', 'All CI states']];
  for (const k of ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'])
    ciItems.push([k, k + ' \u2014 ' + (CI_WORD[k] || k) + ' \u00b7 ' + (STATS.ci[k] || 0)]);
  fillSelect(ciSel, ciItems);
  ciSel.addEventListener('change', () => { fCi = ciSel.value; applyFilter(); });

  const trlSel = document.getElementById('ftrl');
  const trlItems = [['all', 'All TRLs']];
  for (let t = STATS.trlMin; t <= STATS.trlMax; t++) trlItems.push([String(t), 'TRL ' + t]);
  trlItems.push(['na', 'TRL N/A (support asset)']);
  fillSelect(trlSel, trlItems);
  trlSel.addEventListener('change', () => { fTrl = trlSel.value; applyFilter(); });
}
applyFilter();  // initial paint: populate the "N of 44 match" feedback element

/* ---------- search (P1-8): disambiguating combobox ----------
   Typing lists EVERY match in a dropdown; nothing is selected on keystroke.
   Enter picks the highlighted match (first by default), click picks directly.
   This fixes the old behavior where "markdown" silently grabbed franken_markdown
   and never mentioned franken_markdown_website. */
const searchInput = document.getElementById('search');
const searchMsg = document.getElementById('searchmsg');
const searchDrop = document.getElementById('searchdrop');
let dropItems = [];   // {mesh, el}
let dropActive = -1;
function rankMatches(q){
  // rank: exact name first, then prefix, then substring; ties broken by shorter name
  const scored = [];
  for (const mesh of nodeMeshes){
    const n = mesh.userData.repo.name.toLowerCase();
    let s = -1;
    if (n === q) s = 0;
    else if (n.startsWith(q)) s = 1;
    else if (n.includes(q)) s = 2;
    if (s >= 0) scored.push({ mesh, s, len: n.length });
  }
  scored.sort((a, b) => (a.s - b.s) || (a.len - b.len));
  return scored;
}
function closeDrop(){
  dropItems = []; dropActive = -1;
  searchDrop.hidden = true;
  searchDrop.innerHTML = '';
  searchInput.setAttribute('aria-expanded', 'false');
  searchInput.removeAttribute('aria-activedescendant');
}
function setDropActive(i){
  dropActive = i;
  dropItems.forEach((d, j) => {
    const on = j === i;
    d.el.classList.toggle('active', on);
    d.el.setAttribute('aria-selected', on ? 'true' : 'false');
    if (on){
      d.el.id = 'searchopt-active';
      searchInput.setAttribute('aria-activedescendant', 'searchopt-active');
      d.el.scrollIntoView({ block: 'nearest' });
    } else {
      d.el.removeAttribute('id');
    }
  });
}
function openDrop(scored){
  searchDrop.innerHTML = '';
  dropItems = scored.map(({ mesh }) => {
    const r = mesh.userData.repo;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'comb-opt';
    b.setAttribute('role', 'option');
    b.innerHTML = '<span class="oname">' + esc(r.name) + '</span>' +
      '<span class="ometa">' + esc(r.nodus) + ' \u00b7 ' + esc(r.ciKey) + ' \u2014 ' + (CI_WORD[r.ciKey] || '') + '</span>';
    b.addEventListener('mousedown', (ev) => { ev.preventDefault(); chooseDrop(mesh); });
    searchDrop.appendChild(b);
    return { mesh, el: b };
  });
  searchDrop.hidden = false;
  searchInput.setAttribute('aria-expanded', 'true');
  setDropActive(0);
  searchMsg.textContent = scored.length + (scored.length === 1 ? ' match' : ' matches') +
    ' \u2014 Enter opens the highlighted one, arrows choose';
}
function chooseDrop(mesh){
  closeDrop();
  searchMsg.textContent = '';
  select(mesh);
  searchInput.blur();
}
searchInput.addEventListener('input', () => {
  const q = searchInput.value.trim().toLowerCase();
  searchMsg.textContent = '';
  for (const mesh of nodeMeshes){
    const hit = q && mesh.userData.repo.name.toLowerCase().includes(q);
    if (mesh !== selected) setEmissive(mesh, hit ? 1.0 : BASE_EMISSIVE);
  }
  if (!q){ closeDrop(); return; }
  const scored = rankMatches(q);
  if (scored.length) openDrop(scored);
  else { closeDrop(); searchMsg.textContent = 'no repo matches \u201c' + q + '\u201d'; }
});
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp'){
    if (searchDrop.hidden) return;
    e.preventDefault();
    const d = e.key === 'ArrowDown' ? 1 : -1;
    setDropActive((dropActive + d + dropItems.length) % dropItems.length);
  } else if (e.key === 'Enter'){
    if (!searchDrop.hidden && dropItems.length){
      e.preventDefault();
      chooseDrop(dropItems[Math.max(dropActive, 0)].mesh);
    }
  } else if (e.key === 'Escape'){
    if (!searchDrop.hidden){
      e.stopPropagation();  // keep the window-level Escape from closing the panel
      closeDrop();
      searchMsg.textContent = '';
    }
  }
});
searchInput.addEventListener('blur', () => {
  // option mousedown fires before blur, so this only catches a true focus-out
  setTimeout(() => { if (document.activeElement !== searchInput) closeDrop(); }, 120);
});
const focusTarget = TGT_HOME.clone();
function resetView(){
  kbFocus = null;
  camGoal = null;
  deselect();
  applyFraming();
  focusTarget.copy(TGT_HOME);
  searchInput.value = '';
  closeDrop();
  searchMsg.textContent = '';
  // restore every filter to its default
  activeFilter = 'all';
  document.querySelectorAll('#filters button').forEach(x => x.classList.toggle('active', x.dataset.f === 'all'));
  fLic = fCi = fTrl = 'all';
  document.getElementById('flic').value = 'all';
  document.getElementById('fci').value = 'all';
  document.getElementById('ftrl').value = 'all';
  applyFilter();
  for (const mesh of nodeMeshes) setEmissive(mesh, BASE_EMISSIVE);
}
document.getElementById('resetview').addEventListener('click', resetView);

const domeToggle = document.getElementById('dometoggle');
const domeCap = document.getElementById('domecap');
const legendEl = document.getElementById('legend');
if (isMobileView()) legendEl.removeAttribute('open');  // legend starts collapsed on small screens
domeToggle.addEventListener('click', () => {
  const on = !riderDomes.visible;
  riderDomes.visible = on;
  domeToggle.classList.toggle('on', on);
  domeToggle.setAttribute('aria-pressed', on ? 'true' : 'false');
  domeToggle.textContent = on ? 'Hide the rider ceiling' : 'Show the rider ceiling';
  domeCap.style.display = on ? 'block' : 'none';
  document.body.classList.toggle('dome-on', on);  // mobile: caption takes the legend's slot
  if (on && isMobileView()) legendEl.removeAttribute('open');  // keep the caption unobstructed
});

/* ---------- verdict table view (P1-10) + CSV/JSON export (P1-11) ----------
   All 44 repos as sortable rows, rendered from the same data contract as the
   map. Export buttons build the downloads from the contract at click time. */
const tableView = document.getElementById('tableview');
const tableToggle = document.getElementById('tabletoggle');
const tableBack = document.getElementById('tableback');
const vtabBody = document.querySelector('#vtab tbody');
let tableOpen = false;
let sortCol = 'name', sortDir = 1;
const RING_ORDER = { Invest: 0, Pilot: 1, Explore: 2, Monitor: 3 };
const LIC_ORDER = { rider: 0, mit: 1, none: 2 };
const trlText = (r) => r.techNA ? 'N/A' : r.trl;
const ciText = (r) => r.ciKey + ' \u2014 ' + (CI_WORD[r.ciKey] || r.ciKey);
const licText = (r) => LICENSE_LABEL[r.licenseKey] || r.licenseKey;
function rowVal(r, col){
  switch (col){
    case 'name': return r.name.toLowerCase();
    case 'ring': return (RING_ORDER[r.nodus] !== undefined) ? RING_ORDER[r.nodus] : 9;
    case 'trl': return r.trlLow + r.trlHigh / 100;  // techNA handled in the comparator: always last
    case 'ci': return r.ciKey;
    case 'license': return (LIC_ORDER[r.licenseKey] !== undefined) ? LIC_ORDER[r.licenseKey] : 9;
    case 'verdict': return r.blurb.toLowerCase();
    default: return '';
  }
}
function renderTable(){
  const rows = [...repos].sort((a, b) => {
    if (sortCol === 'trl'){
      // techNA (N/A as technology) is not a number: it always sorts last, either direction
      if (a.techNA && !b.techNA) return 1;
      if (b.techNA && !a.techNA) return -1;
    }
    const va = rowVal(a, sortCol), vb = rowVal(b, sortCol);
    const c = (typeof va === 'number') ? va - vb : String(va).localeCompare(String(vb));
    return (c || a.name.localeCompare(b.name)) * sortDir;
  });
  vtabBody.innerHTML = rows.map((r) =>
    '<tr>' +
    '<td class="vname"><a href="' + esc(briefUrl(r)) + '">' + esc(r.name) + '</a></td>' +
    '<td><span class="chip ' + esc(r.nodus) + '">' + esc(r.nodus) + '</span></td>' +
    '<td>' + esc(trlText(r)) + '</td>' +
    '<td title="' + esc(r.ci) + '">' + esc(ciText(r)) + '</td>' +
    '<td title="' + esc(r.license) + '">' + esc(licText(r)) + '</td>' +
    '<td class="vverdict">' + esc(r.blurb) + '</td>' +
    '</tr>'
  ).join('');
  document.querySelectorAll('#vtab thead th').forEach((th) => {
    th.setAttribute('aria-sort',
      th.dataset.col === sortCol ? (sortDir > 0 ? 'ascending' : 'descending') : 'none');
  });
}
document.querySelectorAll('#vtab thead th button').forEach((btn) => {
  btn.addEventListener('click', () => {
    const col = btn.closest('th').dataset.col;
    if (col === sortCol) sortDir = -sortDir;
    else { sortCol = col; sortDir = 1; }
    renderTable();
  });
});
let tableOpener = null;  // the control that opened the table gets focus back on close
function openTableView(){
  const a = document.activeElement;
  tableOpener = (a && a !== document.body && a.tagName === 'BUTTON') ? a : null;
  setSheet(false, false);
  renderTable();
  tableOpen = true;
  tableView.hidden = false;
  document.body.classList.add('tableon');
  tableToggle.setAttribute('aria-pressed', 'true');
  tableBack.focus();  // focus moves into the table view on open
  setHash('#tableview');  // shareable: index.html#tableview opens straight into the table
}
function closeTableView(){
  tableOpen = false;
  tableView.hidden = true;
  document.body.classList.remove('tableon');
  tableToggle.setAttribute('aria-pressed', 'false');
  setHash(selected ? '#repo=' + encodeURIComponent(selected.userData.repo.name) : '');
  // focus returns to whichever control opened it; on phones the sheet is closed by then
  let back = tableOpener || tableToggle;
  if (isMobileView() && back.closest('#sheet')) back = document.getElementById('sheetbtn');
  back.focus();
}
tableToggle.addEventListener('click', openTableView);
document.querySelectorAll('.js-table').forEach((b) => b.addEventListener('click', openTableView));
tableBack.addEventListener('click', closeTableView);

function download(filename, mime, text){
  const blob = new Blob([text], { type: mime });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
}
function csvCell(s){
  s = String(s);
  return (/[",\n]/.test(s)) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function buildCSV(){
  const lines = ['name,ring,trl,ci_state,license,verdict'];
  for (const r of [...repos].sort((a, b) => a.name.localeCompare(b.name)))
    lines.push([r.name, r.nodus, trlText(r), ciText(r), licText(r), r.blurb].map(csvCell).join(','));
  return '\uFEFF' + lines.join('\r\n') + '\r\n';
}
function buildJSON(){
  return JSON.stringify(
    [...repos].sort((a, b) => a.name.localeCompare(b.name)).map((r) => ({
      name: r.name, nodus: r.nodus, trl: trlText(r),
      trlLow: r.trlLow, trlHigh: r.trlHigh, techNA: !!r.techNA,
      licenseKey: r.licenseKey, license: r.license,
      ciKey: r.ciKey, ci: r.ci, release: r.release,
      blurb: r.blurb, brief: './briefs/' + r.name + '.html',
    })),
    null, 2);
}
document.getElementById('csvdl').addEventListener('click', () => {
  download('frankensuite-verdicts.csv', 'text/csv;charset=utf-8', buildCSV());
});
document.getElementById('jsondl').addEventListener('click', () => {
  download('frankensuite-verdicts.json', 'application/json;charset=utf-8', buildJSON());
});

/* ---------- keyboard access (P0-3) ----------
   The canvas is one tab stop (role=application, labeled with the key map):
   arrows cycle the 44 nodes in data order, each announced as "<name>, <ring> ring"
   through the aria-live region; Enter/Space opens the detail panel and moves
   focus into it; Escape closes the panel and returns focus to the canvas.
   A native <select> "Jump to repo" — disclosed by a <details>, never display:none —
   opens the same panel from a plain list, keyboard alone. */
const live = document.createElement('div');
live.id = 'kb-live';
live.setAttribute('role', 'status');
live.setAttribute('aria-live', 'polite');
document.body.appendChild(live);

container.setAttribute('tabindex', '0');
container.setAttribute('role', 'application');
container.setAttribute('aria-label',
  'Interactive 3D map of 44 assessed repos. Arrow keys move between repos and announce ' +
  'each one. Enter opens the focused repo\u2019s detail panel. Escape closes it. ' +
  'A "Jump to repo" list in the controls offers the same panels as a plain list.');

/* native fallback control: a disclosed <details> holding a plain <select> of all 44 */
const jumpWrap = document.createElement('details');
jumpWrap.id = 'jumpnav';
const jumpSummary = document.createElement('summary');
jumpSummary.textContent = 'Jump to repo';
jumpWrap.appendChild(jumpSummary);
const jumpSelect = document.createElement('select');
jumpSelect.id = 'jumplist';
jumpSelect.setAttribute('aria-label', 'Jump to repo: choose one of the 44 assessed repos to open its detail panel');
{
  const ph = document.createElement('option');
  ph.value = '';
  ph.textContent = 'Choose a repo\u2026';
  jumpSelect.appendChild(ph);
  [...repos].sort((a, b) => a.name.localeCompare(b.name)).forEach((r) => {
    const o = document.createElement('option');
    o.value = r.name;
    o.textContent = r.name + ' \u2014 ' + r.nodus + (r.ciKey === 'C1' ? ', CI green' : '');
    jumpSelect.appendChild(o);
  });
}
jumpWrap.appendChild(jumpSelect);
document.getElementById('controls').appendChild(jumpWrap);
jumpSelect.addEventListener('change', () => {
  if (!jumpSelect.value) return;
  const mesh = nodeMeshes.find((m) => m.userData.repo.name === jumpSelect.value);
  if (mesh) openPanelFor(mesh);
});

let kbIndex = -1;
function previewNode(mesh, announce){
  if (kbFocus && kbFocus !== mesh && kbFocus !== selected) setEmissive(kbFocus, BASE_EMISSIVE);
  kbFocus = mesh;
  kbIndex = nodeMeshes.indexOf(mesh);
  if (mesh !== selected) setEmissive(mesh, 1.0);
  selHalo.visible = true;
  selHalo.scale.setScalar(mesh.userData.size * 1.7);
  selHalo.position.copy(mesh.position);
  focusTarget.copy(mesh.position);
  if (REDUCED) controls.target.copy(mesh.position);  // instant: no camera glide under reduced motion
  if (announce !== false){
    const r = mesh.userData.repo;
    live.textContent = r.name + ', ' + r.nodus + ' ring';
  }
  jumpSelect.value = mesh.userData.repo.name;  // keep the list synced with canvas focus
}
function openPanelFor(mesh){
  kbFocus = mesh;
  kbIndex = nodeMeshes.indexOf(mesh);
  select(mesh);
  jumpSelect.value = mesh.userData.repo.name;
  const closeBtn = panel.querySelector('.close');
  if (closeBtn) closeBtn.focus();  // focus moves into the panel on open
}
container.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown'){
    e.preventDefault();
    previewNode(nodeMeshes[(kbIndex + 1 + nodeMeshes.length) % nodeMeshes.length]);
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp'){
    e.preventDefault();
    previewNode(nodeMeshes[(kbIndex - 1 + nodeMeshes.length) % nodeMeshes.length]);
  } else if (e.key === 'Home'){
    e.preventDefault();
    previewNode(nodeMeshes[0]);
  } else if (e.key === 'End'){
    e.preventDefault();
    previewNode(nodeMeshes[nodeMeshes.length - 1]);
  } else if (e.key === 'Enter' || e.key === ' '){
    e.preventDefault();
    if (kbFocus) openPanelFor(kbFocus);
    else previewNode(nodeMeshes[0]);
  }
});

/* visible focus styles for the new controls; the live region is SR-only (never display:none) */
const kbCss = document.createElement('style');
kbCss.textContent = [
  '#scene:focus{outline:none;}',
  '#scene:focus-visible{outline:3px solid #f2a93b; outline-offset:-3px;}',
  '#kb-live{position:absolute !important; width:1px; height:1px; padding:0; margin:-1px; ' +
    'overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; border:0;}',
  '#jumpnav summary{font:inherit; font-size:12px; color:var(--ink); background:rgba(11,14,22,.85); ' +
    'border:1px solid var(--line); border-radius:99px; padding:7px 14px; cursor:pointer; list-style:none;}',
  '#jumpnav summary::-webkit-details-marker{display:none;}',
  '#jumpnav summary::after{content:" \\25be"; color:var(--faint);}',
  '#jumpnav:not([open]) summary::after{content:" \\25b8"; color:var(--pilot);}',
  '#jumpnav summary:hover{border-color:var(--faint);}',
  '#jumpnav select{font:inherit; font-size:12px; color:var(--ink); background:#0b0e16; ' +
    'border:1px solid var(--line); border-radius:10px; padding:7px 10px; margin-top:6px; max-width:230px;}',
  '#jumpnav summary:focus-visible, #jumpnav select:focus-visible, ' +
    '#panel .close:focus-visible, #brieflink:focus-visible{outline:2px solid #f2a93b; outline-offset:2px;}',
].join('\n');
document.head.appendChild(kbCss);

/* ---------- phone filter sheet ----------
   Under 900px the filters, search, view buttons and key live in a bottom sheet
   (#sheet) opened from the bar's "Filters" button. On desktop #sheet is
   display:contents and these calls only flip an unused class. */
const sheetBtn = document.getElementById('sheetbtn');
const sheetDone = document.getElementById('sheetdone');
const sheetEl = document.getElementById('sheet');
function setSheet(open, moveFocus){
  const was = document.body.classList.contains('sheet-open');
  document.body.classList.toggle('sheet-open', open);
  sheetBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  // phone: an open sheet is a modal dialog; on desktop #sheet is layout-transparent and carries no role
  if (open && isMobileView()){
    sheetEl.setAttribute('role', 'dialog');
    sheetEl.setAttribute('aria-modal', 'true');
    sheetEl.setAttribute('aria-labelledby', 'sheettitle');
  } else {
    sheetEl.removeAttribute('role');
    sheetEl.removeAttribute('aria-modal');
    sheetEl.removeAttribute('aria-labelledby');
  }
  if (!moveFocus || was === open) return;
  (open ? sheetDone : sheetBtn).focus();
}
sheetBtn.addEventListener('click', () => setSheet(!document.body.classList.contains('sheet-open'), true));
sheetDone.addEventListener('click', () => setSheet(false, true));
// modal focus trap: Tab cycles inside the open sheet
sheetEl.addEventListener('keydown', (e) => {
  if (e.key !== 'Tab' || !document.body.classList.contains('sheet-open')) return;
  const f = [...sheetEl.querySelectorAll('button, [href], input, select, summary, [tabindex]:not([tabindex="-1"])')]
    .filter((el) => !el.disabled && el.offsetParent !== null);
  if (!f.length) return;
  const first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
});

/* ---------- camera flight + "Surprise me" ---------- */
function flyTo(mesh){
  const p = mesh.position;
  const dir = camera.position.clone().sub(controls.target);
  dir.y = Math.abs(dir.y) + 0.001;  // always look down onto the node, never from below the plane
  dir.setLength(isMobileView() ? 30 : 20);
  const goal = p.clone().add(dir);
  userDrove = true;  // a resize must not snap the camera back home mid-tour
  controls.autoRotate = false;
  clearTimeout(idleTimer);
  focusTarget.copy(p);
  if (REDUCED){
    camera.position.copy(goal);  // reduced motion: jump, no glide
    controls.target.copy(p);
    camGoal = null;
  } else {
    camGoal = goal;
  }
}
function surprise(){
  const inView = nodeMeshes.filter((m) => inFilter(m) && m !== selected);
  const pool = inView.length ? inView : nodeMeshes.filter((m) => m !== selected);
  const mesh = pool[Math.floor(Math.random() * pool.length)];
  flyTo(mesh);
  openPanelFor(mesh);
}
document.querySelectorAll('.js-surprise').forEach((b) => b.addEventListener('click', surprise));

document.getElementById('explorecta').addEventListener('click', () => {
  setIntro(false, true);
  container.focus({ preventScroll: true });
});

/* deep links (on load and on hash edits): index.html#repo=<name> opens that
   repo's panel; index.html#tableview opens the verdict table */
function openFromHash(){
  if (window.location.hash === '#tableview'){ if (!tableOpen) openTableView(); return; }
  const mesh = repoFromHash();
  if (!mesh || mesh === selected) return;
  flyTo(mesh);
  kbFocus = mesh;
  kbIndex = nodeMeshes.indexOf(mesh);
  select(mesh);
  jumpSelect.value = mesh.userData.repo.name;
}
window.addEventListener('hashchange', openFromHash);

/* ---------- resize ---------- */
window.addEventListener('resize', () => {
  if (!isMobileView()) setSheet(false, false);  // the sheet only exists below the breakpoint
  layoutMap();
  sizeRenderer();
  if (!userDrove) applyFraming();  // keep breakpoint framing until the user takes over
});

/* ---------- animation loop ---------- */
const proj = new THREE.Vector3();
const clock = new THREE.Clock();

/* label de-collision: project every candidate label, then keep highest-priority
   labels whose screen boxes don't overlap an already-kept box. Priority:
   hovered/selected > Pilot > CI-green > the core caption. */
function rectsOverlap(a, b, pad){
  return a.x0 - pad < b.x1 + pad && a.x1 + pad > b.x0 - pad &&
         a.y0 - pad < b.y1 + pad && a.y1 + pad > b.y0 - pad;
}
function updateLabels(){
  // labels live in #labels, which shares #scene's rect (a band on narrow screens)
  const sr = container.getBoundingClientRect();
  const w = sr.width || window.innerWidth, h = sr.height || window.innerHeight;
  const cands = [];
  for (const d of labelDefs){
    let show = false, x = 0, y = 0, pri = 0, below = false;
    if (d.kind === 'core'){
      proj.copy(core.position); proj.y += 3.4; proj.project(camera);
      show = proj.z < 1; x = (proj.x*0.5+0.5)*w; y = (-proj.y*0.5+0.5)*h;
      pri = 10; below = true;  // .corelabel renders below its anchor point
    } else {
      const { repo, isGreen } = d.mesh.userData;
      const labeled = repo.nodus === 'Pilot' || isGreen || d.mesh === hovered || d.mesh === selected;
      // filtered-out repos lose their label (the one you selected keeps it)
      if (labeled && (inFilter(d.mesh) || d.mesh === selected)){
        proj.copy(d.mesh.position);
        proj.y += d.mesh.userData.size * 1.6;
        proj.project(camera);
        show = proj.z < 1; x = (proj.x*0.5+0.5)*w; y = (-proj.y*0.5+0.5)*h;
        pri = (d.mesh === hovered || d.mesh === selected) ? 100
            : repo.nodus === 'Pilot' ? 30 : isGreen ? 20 : 0;
      }
    }
    if (show) cands.push({ d, x, y, pri, below });
    else if (d.el.style.display !== 'none') d.el.style.display = 'none';  // filtered out / off screen: never a stale label
  }
  // position + measure (sizes are cached; label text never changes)
  for (const c of cands){
    c.d.el.style.display = 'block';
    c.d.el.style.left = c.x + 'px';
    c.d.el.style.top = c.y + 'px';
    if (c.d.w === undefined){ c.d.w = c.d.el.offsetWidth; c.d.h = c.d.el.offsetHeight; }
  }
  cands.sort((a, b) => b.pri - a.pri);
  const kept = [];
  for (const c of cands){
    const box = c.below
      ? { x0: c.x - c.d.w/2, y0: c.y,         x1: c.x + c.d.w/2, y1: c.y + c.d.h }
      : { x0: c.x - c.d.w/2, y0: c.y - c.d.h, x1: c.x + c.d.w/2, y1: c.y };
    if (!kept.some((k) => rectsOverlap(box, k, 4))){ kept.push(box); continue; }
    if (!c.below){
      // crowded: try one slot higher, then one below the node, before giving up,
      // so neighbouring labels stack instead of vanishing
      let placed = false;
      for (const dy of [-(c.d.h + 6), 2 * c.d.h + 14]){
        const alt = { x0: box.x0, y0: box.y0 + dy, x1: box.x1, y1: box.y1 + dy };
        if (alt.y0 > 0 && alt.y1 < h && !kept.some((k) => rectsOverlap(alt, k, 4))){
          c.d.el.style.top = (c.y + dy) + 'px';
          kept.push(alt);
          placed = true;
          break;
        }
      }
      if (placed) continue;
    }
    c.d.el.style.display = 'none';  // still crowded: the lower-priority label yields
  }
}
function animate(){
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  if (!REDUCED){
    // core pulse (the one motion the page keeps — it marks the center)
    const p = 1 + Math.sin(t * 1.6) * 0.05;
    core.scale.setScalar(p);
    coreGlow.intensity = 60 + Math.sin(t * 1.6) * 12;

    // CI-green halo pulse
    const gp = 0.20 + Math.sin(t * 2.2) * 0.08;
    for (const m of greenMeshes){
      if (m.userData.halo) m.userData.halo.material.opacity = gp;
    }
  }

  const haloAnchor = selected || kbFocus;
  if (haloAnchor){
    selHalo.position.copy(haloAnchor.position);
    if (!REDUCED) selHalo.rotation.y = t * 0.8;
  }

  if (pointerDirty){ doHover(); pointerDirty = false; }

  if (camGoal){
    camera.position.lerp(camGoal, 0.06);
    if (camera.position.distanceToSquared(camGoal) < 0.01) camGoal = null;
  }
  controls.target.lerp(focusTarget, 0.07);
  controls.update();
  renderer.render(scene, camera);
  updateLabels();
}
animate();

// debug/testing handle
window.__viz = { nodeMeshes, greenMeshes, camera, controls, renderer, select, deselect, riderDomes,
                 domeRadius: DOME_RADIUS, investRadius: RING.Invest.radius,
                 inFilter: () => activeFilter, reduced: REDUCED,
                 stats: STATS,  // render-time counts: every number in the copy comes from here
                 kb: { preview: previewNode, open: openPanelFor, focused: () => kbFocus,
                       index: () => kbIndex, live: () => live.textContent, jump: () => jumpSelect },
                 table: { open: openTableView, close: closeTableView, isOpen: () => tableOpen,
                          rows: () => vtabBody.rows.length,
                          sort: (c, d) => { sortCol = c; sortDir = d; renderTable(); },
                          firstCell: (r, c) => vtabBody.rows[r].cells[c].textContent.trim() },
                 search: { input: () => searchInput, drop: () => searchDrop,
                           items: () => dropItems.length, choose: chooseDrop,
                           active: () => dropActive },
                 csv: buildCSV, json: buildJSON,
                 surprise, flyTo, openFromHash, selected: () => selected,
                 screenXY(i){
                   const m = nodeMeshes[i];
                   const r = container.getBoundingClientRect();
                   proj.copy(m.position); proj.project(camera);
                   return [ r.left + (proj.x*0.5+0.5)*r.width,
                            r.top + (-proj.y*0.5+0.5)*r.height, proj.z ];
                 } };

openFromHash();  // shared link: land on the named repo's panel
window.__FRONTDOOR_READY = true;

} catch (err) {
  console.error('[frontdoor]', err);
  showFallback();
}
