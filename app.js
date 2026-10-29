'use strict';
const $ = s => document.querySelector(s);
const NS = 'http://www.w3.org/2000/svg';
const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
const ICONS = ['bag', 'bus', 'bowl', 'meal', 'moon', 'star'];

/* ---------- 저장 ---------- */
const LS = {
  get(k, d) { try { const v = localStorage.getItem('kc.' + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('kc.' + k, JSON.stringify(v)); } catch {} }
};
const uid = () => Math.random().toString(36).slice(2, 9);

let alarms = LS.get('alarms', [
  { id: 'a1', name: '어린이집 출발', icon: 'bag', time: '08:55', days: [1, 2, 3, 4, 5], on: true, msg: '출발!' },
  { id: 'a2', name: '밥', icon: 'bowl', time: '18:00', days: [0, 1, 2, 3, 4, 5, 6], on: true, msg: '밥 먹을 시간!' },
  { id: 'a3', name: '잠', icon: 'moon', time: '21:00', days: [0, 1, 2, 3, 4, 5, 6], on: true, msg: '잘 시간!' },
  { id: 'a4', name: '주말 나들이', icon: 'star', time: '10:00', days: [0, 6], on: false, msg: '출발!' }
]);
if (!LS.get('mig2', false)) {
  alarms.forEach(a => { if (a.id === 'a1' && a.icon === 'bus') a.icon = 'bag'; if (a.id === 'a2' && a.icon === 'meal') a.icon = 'bowl'; });
  LS.set('alarms', alarms); LS.set('mig2', true);
}
if (!LS.get('mig3', false)) {
  const a1 = alarms.find(a => a.id === 'a1');
  if (a1 && a1.time === '08:40' && a1.name === '어린이집') Object.assign(a1, { name: '어린이집 출발', time: '08:55' });
  LS.set('alarms', alarms); LS.set('mig3', true);
}
let prefs = Object.assign({ seconds: true, volume: 0.7, rotateMin: 5 }, LS.get('prefs', {}));
let bgs = LS.get('bgs', [
  { id: 'b-bus', kind: 'builtin', key: 'bus', on: true, scale: 1, x: 50, y: 50 },
  { id: 'b-penguin', kind: 'builtin', key: 'penguin', on: true, scale: 1, x: 50, y: 50 },
  { id: 'b-fairy', kind: 'builtin', key: 'fairy', on: true, scale: 1, x: 50, y: 50 }
]);
let fired = LS.get('fired', {});
const saveAlarms = () => LS.set('alarms', alarms);
const savePrefs = () => LS.set('prefs', prefs);
const saveBgs = () => LS.set('bgs', bgs);

/* ---------- IndexedDB (그림은 이 기기 안에만) ---------- */
const dbp = new Promise((res, rej) => {
  const r = indexedDB.open('kids-clock', 1);
  r.onupgradeneeded = () => r.result.createObjectStore('img');
  r.onsuccess = () => res(r.result);
  r.onerror = () => rej(r.error);
});
async function idb(mode, fn) {
  const d = await dbp;
  return new Promise((res, rej) => {
    const t = d.transaction('img', mode);
    const q = fn(t.objectStore('img'));
    t.oncomplete = () => res(q && q.result);
    t.onerror = () => rej(t.error);
  });
}

/* ---------- 기본 배경 그림 (직접 그린 SVG) ---------- */
function star(cx, cy, r, fill) {
  let p = '';
  for (let i = 0; i < 10; i++) {
    const a = Math.PI / 5 * i - Math.PI / 2, rr = i % 2 ? r * .45 : r;
    p += (cx + rr * Math.cos(a)).toFixed(1) + ',' + (cy + rr * Math.sin(a)).toFixed(1) + ' ';
  }
  return `<polygon points="${p}" fill="${fill}"/>`;
}
const cloud = (x, y, s) => `<g fill="#fff" opacity=".95" transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="0" rx="90" ry="50"/><ellipse cx="70" cy="-25" rx="70" ry="55"/><ellipse cx="140" cy="5" rx="80" ry="45"/></g>`;
const SCENES = {
  bus: () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" width="1600" height="1000">
<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cc8ff"/><stop offset="1" stop-color="#dff3ff"/></linearGradient></defs>
<rect width="1600" height="1000" fill="url(#s)"/>
<circle cx="1390" cy="170" r="95" fill="#ffd84d"/><circle cx="1390" cy="170" r="130" fill="#ffd84d" opacity=".25"/>
${cloud(160, 170, 1)}${cloud(720, 120, .8)}${cloud(1020, 260, .6)}
<path d="M0 690 Q380 540 800 670 T1600 620 V1000 H0Z" fill="#9bdc74"/>
<path d="M0 760 Q500 660 1000 740 T1600 720 V1000 H0Z" fill="#74c653"/>
<g fill="#4fa83a"><circle cx="210" cy="640" r="70"/><circle cx="300" cy="670" r="55"/><circle cx="1480" cy="620" r="65"/></g>
<g fill="#8a5a3b"><rect x="200" y="690" width="22" height="80"/><rect x="1470" y="670" width="22" height="80"/></g>
<rect y="820" width="1600" height="130" fill="#6b7383"/>
<g fill="#fff">${Array.from({ length: 12 }, (_, i) => `<rect x="${i * 140 + 20}" y="878" width="80" height="14" rx="7"/>`).join('')}</g>
<g transform="translate(860 600)">
 <rect x="0" y="0" width="560" height="250" rx="46" fill="#ffc93c"/>
 <rect x="0" y="150" width="560" height="34" fill="#ff8a3d"/>
 <rect x="30" y="34" width="110" height="92" rx="20" fill="#bfe8ff"/><rect x="160" y="34" width="110" height="92" rx="20" fill="#bfe8ff"/>
 <rect x="290" y="34" width="110" height="92" rx="20" fill="#bfe8ff"/><rect x="420" y="34" width="110" height="140" rx="20" fill="#9fdcff"/>
 <circle cx="540" cy="205" r="16" fill="#fff6c2"/>
 <circle cx="130" cy="255" r="52" fill="#333"/><circle cx="130" cy="255" r="22" fill="#ccc"/>
 <circle cx="430" cy="255" r="52" fill="#333"/><circle cx="430" cy="255" r="22" fill="#ccc"/>
</g></svg>`,
  penguin: () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" width="1600" height="1000">
<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a9dcff"/><stop offset="1" stop-color="#f0faff"/></linearGradient></defs>
<rect width="1600" height="1000" fill="url(#s)"/>
<g fill="#fff">${Array.from({ length: 40 }, (_, i) => `<circle cx="${(i * 397) % 1600}" cy="${(i * 211) % 620}" r="${6 + (i % 4) * 3}" opacity=".85"/>`).join('')}</g>
<path d="M0 560 L180 380 L330 560Z M260 560 L470 300 L700 560Z" fill="#e3f4ff"/>
<rect y="600" width="1600" height="90" fill="#6ec1f0"/>
<path d="M0 660 Q400 600 800 650 T1600 640 V1000 H0Z" fill="#fff"/>
<path d="M0 820 Q600 760 1200 820 T1600 800 V1000 H0Z" fill="#dff1ff"/>
<g transform="translate(260 560)"><path d="M0 160 A150 150 0 0 1 300 160Z" fill="#fff" stroke="#cfe6f7" stroke-width="6"/><path d="M110 160 A40 40 0 0 1 190 160Z" fill="#9cc8e6"/></g>
<g transform="translate(1150 560)">
 <ellipse cx="0" cy="130" rx="125" ry="160" fill="#24324a"/>
 <ellipse cx="0" cy="160" rx="85" ry="120" fill="#fff"/>
 <ellipse cx="-125" cy="150" rx="30" ry="80" fill="#24324a" transform="rotate(20 -125 150)"/>
 <ellipse cx="125" cy="150" rx="30" ry="80" fill="#24324a" transform="rotate(-20 125 150)"/>
 <circle cx="-38" cy="40" r="15" fill="#fff"/><circle cx="38" cy="40" r="15" fill="#fff"/>
 <circle cx="-35" cy="42" r="8" fill="#111"/><circle cx="35" cy="42" r="8" fill="#111"/>
 <path d="M-26 70 L26 70 L0 100Z" fill="#ff9a2e"/>
 <circle cx="-60" cy="85" r="14" fill="#ffb3c1" opacity=".7"/><circle cx="60" cy="85" r="14" fill="#ffb3c1" opacity=".7"/>
 <ellipse cx="-50" cy="290" rx="45" ry="16" fill="#ff9a2e"/><ellipse cx="50" cy="290" rx="45" ry="16" fill="#ff9a2e"/>
</g></svg>`,
  fairy: () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" width="1600" height="1000">
<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffc9e6"/><stop offset="1" stop-color="#d8c9ff"/></linearGradient></defs>
<rect width="1600" height="1000" fill="url(#s)"/>
<g fill="none" stroke-width="40" opacity=".55"><path d="M120 900 A680 680 0 0 1 1480 900" stroke="#ff8fb1"/><path d="M160 900 A640 640 0 0 1 1440 900" stroke="#ffd36e"/><path d="M200 900 A600 600 0 0 1 1400 900" stroke="#9be7a8"/><path d="M240 900 A560 560 0 0 1 1360 900" stroke="#8fc9ff"/></g>
${Array.from({ length: 22 }, (_, i) => star((i * 331) % 1600, 60 + (i * 157) % 520, 14 + (i % 3) * 8, i % 2 ? '#fff' : '#fff3a6')).join('')}
<path d="M1420 120 A80 80 0 1 0 1500 220 A64 64 0 1 1 1420 120Z" fill="#fff6c8"/>
<g fill="#b79cf0"><rect x="120" y="700" width="380" height="300"/><rect x="100" y="560" width="90" height="440"/><rect x="430" y="560" width="90" height="440"/><rect x="250" y="600" width="120" height="400"/>
 <path d="M90 560 L145 460 L200 560Z M420 560 L475 460 L530 560Z M240 600 L310 480 L380 600Z"/></g>
<path d="M0 900 Q800 820 1600 900 V1000 H0Z" fill="#c6f0c9"/>
<g transform="translate(1080 470)">
 <ellipse cx="-70" cy="20" rx="80" ry="45" fill="#fff" opacity=".8" transform="rotate(-25 -70 20)"/>
 <ellipse cx="70" cy="20" rx="80" ry="45" fill="#fff" opacity=".8" transform="rotate(25 70 20)"/>
 <path d="M-60 180 L0 30 L60 180Z" fill="#ff7eb6"/>
 <circle cx="0" cy="0" r="46" fill="#ffe0c7"/>
 <path d="M-46 -6 Q0 -70 46 -6 Q30 -30 0 -30 Q-30 -30 -46 -6Z" fill="#8a5a3b"/>
 <circle cx="-15" cy="4" r="5" fill="#333"/><circle cx="15" cy="4" r="5" fill="#333"/>
 <path d="M-12 22 Q0 32 12 22" stroke="#d45a7a" stroke-width="4" fill="none" stroke-linecap="round"/>
 <line x1="60" y1="90" x2="150" y2="-10" stroke="#fff6c8" stroke-width="8" stroke-linecap="round"/>
 ${star(155, -15, 30, '#ffe36e')}
</g></svg>`
};
const sceneURL = {};
const builtinURL = key => sceneURL[key] || (sceneURL[key] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(SCENES[key]()));

/* ---------- 시계판 ---------- */
const clock = $('#clock');
function el(tag, attrs, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}
const P = (r, a) => [r * Math.sin(a * Math.PI / 180), -r * Math.cos(a * Math.PI / 180)];
function buildFace(svg, ring) {
  svg.innerHTML = '';
  const H = {}, clock = svg;
  if (ring) {
    el('circle', { r: 105, fill: 'none', stroke: '#e3e9f3', 'stroke-width': 8 }, clock);
    H.ring = el('circle', { r: 105, fill: 'none', stroke: '#46c46a', 'stroke-width': 8, 'stroke-linecap': 'round', 'stroke-dasharray': 659.7, 'stroke-dashoffset': 659.7, transform: 'rotate(-90)' }, clock);
  }
  el('circle', { r: 98, fill: '#ffffff', stroke: '#2f6fde', 'stroke-width': 4 }, clock);
  el('circle', { r: 93.5, fill: 'none', stroke: '#e8eefb', 'stroke-width': 1.5 }, clock);
  H.wedge = el('path', { d: '', opacity: .38 }, clock);
  for (let i = 0; i < 60; i++) {
    const big = i % 5 === 0, a = i * 6, [x1, y1] = P(big ? 84 : 88, a), [x2, y2] = P(92, a);
    el('line', { x1, y1, x2, y2, stroke: big ? '#22314f' : '#9aa8c2', 'stroke-width': big ? 2.6 : 1.1, 'stroke-linecap': 'round' }, clock);
  }
  for (let i = 1; i <= 12; i++) {
    const [x, y] = P(67, i * 30);
    el('text', { x, y, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': 21, 'font-weight': 900, fill: '#22314f', 'font-family': 'ui-rounded, "SF Pro Rounded", "Apple SD Gothic Neo", sans-serif' }, clock).textContent = i;
    const [mx, my] = P(78.5, i * 30);
    el('text', { x: mx, y: my, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': 6.2, 'font-weight': 800, fill: '#5b8be6', 'font-family': 'ui-rounded, sans-serif' }, clock).textContent = (i * 5) % 60 === 0 ? '0' : i * 5;
  }
  H.goal = el('g', { opacity: 0 }, clock);
  el('circle', { cx: 0, cy: -90, r: 6.5, fill: '#ff6a5a', stroke: '#fff', 'stroke-width': 2 }, H.goal);
  const hand = (len, tail, w, color, op) => {
    const g = el('g', { opacity: op }, clock);
    el('line', { x1: 0, y1: tail, x2: 0, y2: -len, stroke: color, 'stroke-width': w, 'stroke-linecap': 'round' }, g);
    return g;
  };
  H.gh = hand(46, 0, 10, '#e5483f', 0);
  H.gm = hand(74, 0, 6.5, '#2f6fde', 0);
  H.h = hand(46, 10, 10, '#e5483f', 1);
  H.m = hand(74, 12, 6.5, '#2f6fde', 1);
  H.s = el('g', {}, clock);
  el('line', { x1: 0, y1: 18, x2: 0, y2: -82, stroke: '#f39c12', 'stroke-width': 2.2, 'stroke-linecap': 'round' }, H.s);
  el('circle', { cx: 0, cy: -66, r: 3.6, fill: '#f39c12' }, H.s);
  el('circle', { r: 6.5, fill: '#22314f' }, clock);
  el('circle', { r: 2.6, fill: '#f39c12' }, clock);
  return H;
}
const H = buildFace(clock), G = buildFace($('#goalClock'), true);
G.s.style.display = 'none';
function updateGoal(ga, r) {
  const show = ga ? 1 : 0;
  G.h.setAttribute('opacity', show); G.m.setAttribute('opacity', show);
  if (ga) { const [th, tm] = ga.time.split(':').map(Number); rot(G.h, ((th % 12) + tm / 60) * 30); rot(G.m, tm * 6); }
  const f = r == null ? 0 : r <= 0 ? 1 : r >= 3600000 ? 0 : 1 - r / 3600000;
  G.ring.setAttribute('stroke-dashoffset', (659.7 * (1 - f)).toFixed(1));
  G.ring.setAttribute('stroke', r != null && r <= 300000 ? '#ff6a5a' : r != null && r <= 600000 ? '#ffb020' : '#46c46a');
}
function matchFx() {
  for (const e of [$('#clockWrap'), $('#mainCard')]) { e.classList.remove('match'); void e.getBoundingClientRect(); e.classList.add('match'); }
  setTimeout(() => { $('#clockWrap').classList.remove('match'); $('#mainCard').classList.remove('match'); }, 2200);
}

/* ---------- 남은 시간 타이머 (60분 판) ---------- */
const T = {};
(function buildTimer() {
  const svg = $('#timer');
  el('circle', { r: 97, fill: '#fff', stroke: '#ffd0cb', 'stroke-width': 4 }, svg);
  T.sector = el('path', { d: '', fill: '#ff6a5a' }, svg);
  for (let i = 0; i < 60; i++) {
    const big = i % 5 === 0, [x1, y1] = P(big ? 84 : 89, i * 6), [x2, y2] = P(93, i * 6);
    el('line', { x1, y1, x2, y2, stroke: '#22314f', 'stroke-width': big ? 2.6 : 1, 'stroke-linecap': 'round', opacity: big ? .8 : .35 }, svg);
  }
  el('circle', { r: 11, fill: '#22314f' }, svg);
})();
const MINS = [5, 10, 15, 30];
let timerEnd = LS.get('timerEnd', 0) || null, tmMode = '';
function renderTimerBtns() {
  const mode = timerEnd ? 'stop' : 'btns';
  if (mode === tmMode) return; tmMode = mode;
  $('#tmBtns').innerHTML = timerEnd
    ? `<button class="tbtn stop" id="tmStop" aria-label="타이머 끄기">${icon('x')}</button>`
    : MINS.map(m => `<button class="tbtn" data-min="${m}" aria-label="${m}분"><svg viewBox="-12 -12 24 24"><circle r="11" fill="#fff" stroke="#ffb3aa" stroke-width="1.5"/><path d="${wedgePath(10, 360 - m * 6, m * 6)}" fill="#ff6a5a"/></svg><span>${m}</span></button>`).join('');
}
$('#tmBtns').addEventListener('click', e => {
  if (e.target.closest('#tmStop')) { timerEnd = null; LS.set('timerEnd', 0); return; }
  const b = e.target.closest('[data-min]'); if (!b) return;
  timerEnd = Date.now() + b.dataset.min * 60000; LS.set('timerEnd', timerEnd);
});
function updateTimer(real, next, tick) {
  let r = null;
  if (timerEnd) {
    r = timerEnd - real;
    if (r <= 0) { timerEnd = null; LS.set('timerEnd', 0); r = null; matchFx(); setTimeout(() => showGo({ icon: 'bell', msg: '끝!' }), 1400); }
  } else if (next) r = next.at - real;
  const sweep = r > 0 ? Math.min(r, 3600000) / 3600000 * 360 : 0;
  T.sector.setAttribute('d', wedgePath(88, 360 - sweep, sweep));
  T.sector.setAttribute('fill', timerEnd ? '#ff6a5a' : '#2f6fde');
  if (tick) {
    renderTimerBtns();
    let txt = '';
    if (r > 0) { const mins = Math.ceil(r / 60000); txt = mins < 60 ? `${mins}분` : `${Math.floor(mins / 60)}시간${mins % 60 ? ' ' + mins % 60 + '분' : ''}`; }
    $('#tmTxt').textContent = txt;
  }
}

const rot = (g, a) => g.setAttribute('transform', `rotate(${a.toFixed(3)})`);
function wedgePath(r, start, sweep) {
  if (sweep <= 0) return '';
  if (sweep >= 359.9) return `M0 ${-r}A${r} ${r} 0 1 1 0 ${r}A${r} ${r} 0 1 1 0 ${-r}Z`;
  const [x1, y1] = P(r, start), [x2, y2] = P(r, start + sweep);
  return `M0 0L${x1.toFixed(2)} ${y1.toFixed(2)}A${r} ${r} 0 ${sweep > 180 ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}Z`;
}

/* ---------- 알람 계산 ---------- */
function findNext(now) {
  let best = null;
  for (const a of alarms) {
    if (!a.on || !a.days.length) continue;
    const [hh, mm] = a.time.split(':').map(Number);
    for (let d = 0; d <= 7; d++) {
      const t = new Date(now); t.setDate(t.getDate() + d); t.setHours(hh, mm, 0, 0);
      if (!a.days.includes(t.getDay())) continue;
      if (t - now > -120000) { if (!best || t < best.at) best = { a, at: t }; break; }
    }
  }
  return best;
}
const hm = d => { const h = d.getHours(), m = d.getMinutes(); return `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}시${m ? ' ' + m + '분' : ''}`; };
function remainText(r) {
  if (r < 60000) return `${Math.max(1, Math.ceil(r / 1000))}초 남았어요`;
  const mins = Math.ceil(r / 60000);
  if (mins < 60) return `${mins}분 남았어요`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return `${h}시간${m ? ' ' + m + '분' : ''} 남았어요`;
}

/* ---------- 소리 ---------- */
let actx = null;
function unlockAudio() {
  try {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
  } catch {}
  setTimeout(() => $('#soundHint').classList.toggle('off', !!actx && actx.state === 'running'), 150);
}
function tone(f, t, dur) {
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = 'sine'; o.frequency.value = f;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.001, prefs.volume * 0.5), t + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(actx.destination); o.start(t); o.stop(t + dur + 0.05);
}
function chime(stage) {
  if (!actx || actx.state !== 'running') return;
  const notes = stage === 10 ? [659, 880] : stage === 5 ? [659, 880, 1047] : [523, 659, 784, 1047, 784, 1047];
  const t = actx.currentTime + 0.05;
  notes.forEach((f, i) => tone(f, t + i * 0.22, 0.5));
}

/* ---------- 알림 ---------- */
function flash() { const f = $('#flash'); f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); }
let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600); }
let goLoop = null;
function showGo(a) {
  $('#goIcon').innerHTML = `<use href="#i-${a.icon}"/>`;
  $('#goText').textContent = a.msg || '출발!';
  $('#go').hidden = false;
  flash(); chime(0);
  clearInterval(goLoop);
  let n = 0;
  goLoop = setInterval(() => { if (++n > 20) return clearInterval(goLoop); chime(0); flash(); }, 3000);
}
$('#go').addEventListener('click', () => { $('#go').hidden = true; clearInterval(goLoop); });
function alertStage(stage) {
  chime(stage); flash();
  const c = $('#mainCard'); c.classList.remove('urgent'); void c.offsetWidth; c.classList.add('urgent');
}
function checkAlerts(next, r) {
  const base = `${next.a.id}@${+next.at}`, has = s => fired[base + ':' + s];
  const mark = (...ss) => { ss.forEach(s => fired[base + ':' + s] = +next.at); LS.set('fired', fired); };
  if (r <= 0 && r > -60000 && !has(0)) { mark(0, 5, 10); matchFx(); chime(10); setTimeout(() => showGo(next.a), 1400); }
  else if (r > 0 && r <= 300000 && !has(5)) { mark(5, 10); alertStage(5); }
  else if (r > 300000 && r <= 600000 && !has(10)) { mark(10); alertStage(10); }
}
(function pruneFired() {
  const lim = Date.now() - 2 * 864e5;
  for (const k in fired) if (fired[k] < lim) delete fired[k];
  LS.set('fired', fired);
})();

/* ---------- 매 순간 ---------- */
let lastSec = -1;
function frame() {
  const real = new Date();
  stepPlay();
  const now = play ? new Date(playMs) : real;
  const s = now.getSeconds() + now.getMilliseconds() / 1000, m = now.getMinutes() + s / 60, h = (now.getHours() % 12) + m / 60;
  const aH = h * 30, aM = m * 6;
  rot(H.h, aH); rot(H.m, aM); rot(H.s, s * 6);
  H.s.style.display = prefs.seconds && !play ? '' : 'none';

  const next = findNext(real);
  const gA = play && setFor ? alarms.find(a => a.id === setFor) : next && next.a;
  updateGoal(gA, next && gA === next.a ? next.at - real : null);
  const tick = real.getSeconds() !== lastSec;
  updateTimer(real, next, tick);
  if (play) {
    H.wedge.setAttribute('d', ''); H.goal.setAttribute('opacity', 0);
    const ga = setFor ? alarms.find(a => a.id === setFor) : next && next.a;
    if (ga && !setFor) {
      const [th, tm] = ga.time.split(':').map(Number);
      rot(H.gh, ((th % 12) + tm / 60) * 30); rot(H.gm, tm * 6);
    }
    H.gh.setAttribute('opacity', ga && !setFor ? .28 : 0); H.gm.setAttribute('opacity', ga && !setFor ? .28 : 0);
    const key = Math.floor(playMs / 60000);
    if (key !== lastPlayKey) { lastPlayKey = key; playInfo(now); }
  } else if (next) {
    const r = next.at - now;
    const color = r <= 300000 ? '#ff6a5a' : r <= 600000 ? '#ffb020' : '#46c46a';
    const th = next.at.getHours(), tm = next.at.getMinutes();
    const gH = ((th % 12) + tm / 60) * 30, gM = tm * 6;
    if (r > 0 && r <= 3600000) {
      H.wedge.setAttribute('d', wedgePath(90, aM, r / 3600000 * 360));
    } else if (r > 0 && r <= 3 * 3600000) {
      H.wedge.setAttribute('d', wedgePath(54, aH, r / 43200000 * 360));
    } else H.wedge.setAttribute('d', '');
    H.wedge.setAttribute('fill', color);
    const near = r > -120000 && r <= 3 * 3600000;
    H.gh.setAttribute('opacity', near ? .28 : 0); H.gm.setAttribute('opacity', near ? .28 : 0);
    rot(H.gh, gH); rot(H.gm, gM);
    H.goal.setAttribute('opacity', r > 0 && r <= 3600000 ? 1 : 0); rot(H.goal, gM);
  } else {
    H.wedge.setAttribute('d', '');
    H.gh.setAttribute('opacity', 0); H.gm.setAttribute('opacity', 0); H.goal.setAttribute('opacity', 0);
  }

  const sec = now.getSeconds();
  if (sec !== lastSec) {
    lastSec = sec;
    if (!play) updateInfo(real, next); else $('#nowTxt').textContent = hm(real);
    if (next) checkAlerts(next, next.at - real);
  }
  requestAnimationFrame(frame);
}
function updateInfo(now, next) {
  $('#nowTxt').textContent = hm(now);
  if (!next) {
    $('#aIcon').innerHTML = '<use href="#i-star"/>';
    $('#aName').textContent = '알람이 없어요';
    $('#aAt').textContent = ''; $('#remain').textContent = ''; $('#tip').textContent = '';
    return;
  }
  const r = next.at - now, a = next.a;
  $('#aIcon').innerHTML = `<use href="#i-${a.icon}"/>`;
  $('#aName').textContent = a.name;
  $('#aAt').textContent = hm(next.at);
  const msg = a.msg || '출발!';
  if (r <= 0) {
    $('#remain').textContent = msg;
    $('#tip').textContent = '지금이에요!';
  } else {
    $('#remain').textContent = remainText(r);
    $('#tip').innerHTML = r <= 3600000
      ? `<b style="color:#2f6fde">긴 파란 바늘</b>이 색칠한 곳 끝 <b style="color:#ff6a5a">빨간 점</b>까지 가면 ${msg}`
      : r <= 3 * 3600000
        ? `<b style="color:#e5483f">짧은 빨간 바늘</b>이 흐린 바늘 자리까지 가면 ${msg}`
        : '아직 시간이 많이 남았어요';
  }
}

/* ---------- 바늘 잡고 돌리기 ---------- */
let play = false, playMs = 0, drag = null, tween = null, steps = [], lastTouch = 0, setFor = null, lastPlayKey = -1;
const pad = n => String(n).padStart(2, '0');
function stepPlay() {
  if (tween) {
    const k = Math.min(1, (Date.now() - tween.start) / tween.dur), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    const to = tween.to === 'now' ? Date.now() : tween.to;
    playMs = tween.from + (to - tween.from) * e;
    if (k === 1) { const now = tween.to === 'now'; tween = null; if (now) exitPlay(); }
  } else if (play && !drag && Date.now() - lastTouch > 30000) goNow();
}
function enterPlay(ms) {
  if (!play) { play = true; playMs = ms; document.body.classList.add('play'); $('#playBar').hidden = false; lastPlayKey = -1; }
  lastTouch = Date.now();
}
function exitPlay() {
  play = false; setFor = null; steps = []; drag = null;
  document.body.classList.remove('play'); $('#playBar').hidden = true; $('#pickAlarm').hidden = true;
  lastSec = -1;
}
function tweenTo(to) { tween = { from: playMs, to, start: Date.now(), dur: 900 }; lastTouch = Date.now(); }
function goNow() { steps = []; $('#pickAlarm').hidden = true; tweenTo('now'); }
function undo() {
  if (!play) return;
  if (!steps.length) return goNow();
  const prev = steps.pop();
  prev === null ? goNow() : tweenTo(prev);
}
function playInfo(t) {
  const h = t.getHours(), m = t.getMinutes();
  const a = setFor && alarms.find(x => x.id === setFor);
  const day = new Date(t).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0);
  const dayTxt = day > 0 ? (day === 864e5 ? '내일 ' : `${Math.round(day / 864e5)}일 뒤 `) : day < 0 ? (day === -864e5 ? '어제 ' : `${Math.round(-day / 864e5)}일 전 `) : '';
  const na = a || (findNext(new Date()) || {}).a;
  $('#aIcon').innerHTML = `<use href="#i-${na ? na.icon : 'hand'}"/>`;
  $('#aName').textContent = a ? `${a.name} 시각 고르기` : '시계 놀이';
  $('#aAt').textContent = dayTxt.trim();
  $('#remain').innerHTML = `<span class="digi"><small>${h < 12 ? '오전' : '오후'}</small>${h % 12 || 12}:${pad(m)}</span>`;
  $('#tip').innerHTML = `<b>${h % 12 || 12}시${m ? ' ' + m + '분' : ''}</b> · 긴 바늘은 분, 짧은 바늘은 시`;
  $('#setBtn').innerHTML = `${icon('flag')}${a ? '이 시각으로 저장' : '알람 시각으로'}`;
}
function ptOf(e) {
  const r = clock.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width * 200 - 100, y = (e.clientY - r.top) / r.height * 200 - 100;
  return { a: (Math.atan2(x, -y) * 180 / Math.PI + 360) % 360, d: Math.hypot(x, y) };
}
const angDiff = (a, b) => Math.abs(((a - b + 540) % 360) - 180);
clock.addEventListener('pointerdown', e => {
  const p = ptOf(e);
  if (p.d > 102 || p.d < 8) return;
  const t = new Date(play ? playMs : Date.now());
  const m = t.getMinutes() + t.getSeconds() / 60, aM = m * 6, aH = ((t.getHours() % 12) + m / 60) * 30;
  const dm = angDiff(p.a, aM), dh = angDiff(p.a, aH);
  let which;
  if (dm <= 40 && dh <= 40) which = p.d < 56 ? 'h' : 'm';
  else if (dm <= 40) which = 'm';
  else if (dh <= 40) which = 'h';
  else which = p.d < 56 ? 'h' : 'm';
  e.preventDefault();
  clock.setPointerCapture(e.pointerId);
  tween = null;
  steps.push(play ? playMs : null); if (steps.length > 50) steps.shift();
  enterPlay(Math.round(Date.now() / 60000) * 60000);
  $('#pickAlarm').hidden = true;
  drag = { which, lastA: p.a, id: e.pointerId };
  H[which].classList.add('grab');
});
clock.addEventListener('pointermove', e => {
  if (!drag || e.pointerId !== drag.id) return;
  const p = ptOf(e), da = ((p.a - drag.lastA + 540) % 360) - 180;
  drag.lastA = p.a;
  playMs += da / 360 * (drag.which === 'm' ? 3600000 : 43200000);
  lastTouch = Date.now();
});
const endDrag = e => {
  if (!drag || e.pointerId !== drag.id) return;
  H[drag.which].classList.remove('grab');
  drag = null; playMs = Math.round(playMs / 60000) * 60000; lastTouch = Date.now(); lastPlayKey = -1;
  const t = new Date(playMs), n = findNext(new Date());
  if (!setFor && n && n.a.time === `${pad(t.getHours())}:${pad(t.getMinutes())}`) { toast(`딱 맞았어요! ${n.a.name} 시각이에요`); chime(0); matchFx(); }
};
clock.addEventListener('pointerup', endDrag);
clock.addEventListener('lostpointercapture', endDrag);
['touchstart', 'touchmove'].forEach(ev => clock.addEventListener(ev, e => e.preventDefault(), { passive: false }));
clock.addEventListener('pointercancel', endDrag);
$('#undoBtn').addEventListener('click', undo);
$('#nowBtn').addEventListener('click', goNow);
function saveTime(a) {
  const t = new Date(playMs);
  a.time = `${pad(t.getHours())}:${pad(t.getMinutes())}`;
  if (!a.on) a.on = true;
  saveAlarms();
  toast(`'${a.name}' 시각을 ${hm(t)}로 정했어요`);
  goNow();
}
$('#setBtn').addEventListener('click', () => {
  lastTouch = Date.now();
  const a = setFor && alarms.find(x => x.id === setFor);
  if (a) return saveTime(a);
  const pk = $('#pickAlarm');
  if (!pk.hidden) { pk.hidden = true; return; }
  pk.innerHTML = `<div class="q">어느 알람 시각으로 할까요?</div>` +
    alarms.map(x => `<button class="btn" data-pick="${x.id}">${icon(x.icon)}${esc(x.name)}</button>`).join('');
  pk.hidden = false;
});
$('#pickAlarm').addEventListener('click', e => {
  const b = e.target.closest('[data-pick]'); if (!b) return;
  saveTime(alarms.find(x => x.id === b.dataset.pick));
});
function setByHands(a) {
  const [hh, mm] = a.time.split(':').map(Number), t = new Date(); t.setHours(hh, mm, 0, 0);
  $('#sheet').hidden = true;
  steps = [null]; setFor = a.id;
  play = false; enterPlay(Date.now()); tweenTo(+t);
}

/* ---------- 배경 ---------- */
const urlCache = {};
async function bgURL(item) {
  if (item.kind === 'builtin') return builtinURL(item.key);
  if (urlCache[item.id]) return urlCache[item.id];
  const blob = await idb('readonly', s => s.get(item.id));
  return blob ? (urlCache[item.id] = URL.createObjectURL(blob)) : null;
}
const layers = [$('#bgA'), $('#bgB')];
let front = 0, curBg = null, lastSwap = Date.now();
function layout(img, item) {
  if (!img.naturalWidth || !item) return;
  const W = innerWidth, Hh = innerHeight;
  const f = Math.max(W / img.naturalWidth, Hh / img.naturalHeight) * item.scale;
  const w = img.naturalWidth * f, h = img.naturalHeight * f;
  img.style.width = w + 'px'; img.style.height = h + 'px';
  img.style.left = (W * item.x / 100 - w / 2) + 'px';
  img.style.top = (Hh * item.y / 100 - h / 2) + 'px';
}
async function showBg(item) {
  if (!item) { layers.forEach(l => l.classList.remove('show')); curBg = null; return; }
  const url = await bgURL(item);
  if (!url) return;
  if (curBg && curBg.id === item.id) { layout(layers[front], item); return; }
  const back = layers[1 - front];
  back.onload = () => { layout(back, item); back.classList.add('show'); layers[front].classList.remove('show'); front = 1 - front; };
  back.src = url; curBg = item;
}
const activeBgs = () => bgs.filter(b => b.on);
function nextBg() {
  const list = activeBgs();
  if (!list.length) return showBg(null);
  const i = curBg ? list.findIndex(b => b.id === curBg.id) : -1;
  showBg(list[(i + 1) % list.length]);
  lastSwap = Date.now();
}
setInterval(() => {
  if (!$('#sheet').hidden || !prefs.rotateMin) return;
  if (Date.now() - lastSwap >= prefs.rotateMin * 60000) nextBg();
}, 5000);
addEventListener('resize', () => curBg && layout(layers[front], curBg));
async function shrink(file) {
  try {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, 2400 / Math.max(bmp.width, bmp.height));
    if (k === 1 && file.size < 3e6) return file;
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    return await new Promise(r => c.toBlob(b => r(b || file), 'image/jpeg', 0.88));
  } catch { return file; }
}

/* ---------- 화면 안 꺼짐 ---------- */
let wl = null;
async function keepAwake() {
  try {
    if ('wakeLock' in navigator && document.visibilityState === 'visible' && !wl) {
      wl = await navigator.wakeLock.request('screen');
      wl.addEventListener('release', () => { wl = null; });
    }
  } catch {}
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { keepAwake(); if (actx) actx.resume(); } });
document.addEventListener('pointerdown', () => { unlockAudio(); keepAwake(); }, true);
document.addEventListener('contextmenu', e => e.preventDefault());

/* ---------- 부모 설정 (길게 누르기) ---------- */
const gear = $('#gear');
let pressT = null, opened = false;
gear.addEventListener('pointerdown', e => {
  e.preventDefault(); opened = false;
  gear.classList.add('pressing');
  pressT = setTimeout(() => { opened = true; gear.classList.remove('pressing'); openSheet(); }, 1500);
});
['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => gear.addEventListener(ev, e => {
  if (!pressT) return;
  clearTimeout(pressT); pressT = null; gear.classList.remove('pressing');
  if (!opened && ev === 'pointerup') toast('부모님: 이 단추를 길게 누르면 설정이 열려요');
}));

let tab = 'alarms', selBg = null;
function openSheet() { $('#sheet').hidden = false; render(); }
$('#closeSheet').addEventListener('click', () => { $('#sheet').hidden = true; lastSwap = Date.now(); });
document.querySelectorAll('.seg button').forEach(b => b.addEventListener('click', () => {
  tab = b.dataset.tab;
  document.querySelectorAll('.seg button').forEach(x => x.setAttribute('aria-selected', x === b));
  render();
}));
function render() {
  for (const t of ['alarms', 'bgs', 'etc']) $('#pane-' + t).hidden = t !== tab;
  if (tab === 'alarms') renderAlarms();
  else if (tab === 'bgs') renderBgs();
  else renderEtc();
}
const icon = n => `<svg class="ic"><use href="#i-${n}"/></svg>`;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function renderAlarms() {
  const p = $('#pane-alarms');
  p.innerHTML = `<p class="note">시계에는 가장 가까운 알람 하나가 보여요. 3시간 안이면 흐린 바늘과 색칠이 나오고, 10분·5분 전과 정각에 소리가 나요.</p>` +
    alarms.map(a => `<div class="box" data-id="${a.id}">
      <div class="row sp"><div class="row" style="margin:0">${ICONS.map(n => `<button class="pick" data-act="icon" data-v="${n}" aria-pressed="${a.icon === n}">${icon(n)}</button>`).join('')}</div>
        <span class="chk-l">켜기<button class="chk" data-act="on" aria-pressed="${a.on}">${icon('check')}</button></span></div>
      <div class="row"><label class="f">이름<input type="text" data-f="name" value="${esc(a.name)}"></label>
        <label class="f">시각<input type="time" data-f="time" value="${a.time}"></label></div>
      <div class="row"><label class="f">그때 나오는 말<input type="text" data-f="msg" value="${esc(a.msg || '')}"></label></div>
      <div class="row">${DAYS.map((d, i) => `<button class="day ${i === 0 ? 'sun' : i === 6 ? 'sat' : ''}" data-act="day" data-v="${i}" aria-pressed="${a.days.includes(i)}">${d}</button>`).join('')}</div>
      <div class="row"><button class="btn" data-act="wk">평일</button><button class="btn" data-act="we">주말</button><button class="btn" data-act="all">매일</button>
        <button class="btn" data-act="hands">${icon('hand')}바늘로 정하기</button>
        <span style="flex:1"></span><button class="btn danger" data-act="del">${icon('trash')}지우기</button></div>
    </div>`).join('') +
    `<button class="btn primary full" data-act="add">${icon('plus')}알람 더하기</button>`;
}
$('#pane-alarms').addEventListener('input', e => {
  const box = e.target.closest('[data-id]'), f = e.target.dataset.f;
  if (!box || !f) return;
  const a = alarms.find(x => x.id === box.dataset.id);
  if (f === 'time' && !e.target.value) return;
  a[f] = e.target.value; saveAlarms();
});
$('#pane-alarms').addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const act = b.dataset.act;
  if (act === 'add') {
    alarms.push({ id: uid(), name: '새 알람', icon: 'star', time: '08:00', days: [1, 2, 3, 4, 5], on: true, msg: '출발!' });
  } else {
    const a = alarms.find(x => x.id === b.closest('[data-id]').dataset.id);
    if (act === 'hands') return setByHands(a);
    if (act === 'icon') a.icon = b.dataset.v;
    if (act === 'on') a.on = !a.on;
    if (act === 'day') { const v = +b.dataset.v; a.days = a.days.includes(v) ? a.days.filter(x => x !== v) : [...a.days, v].sort(); }
    if (act === 'wk') a.days = [1, 2, 3, 4, 5];
    if (act === 'we') a.days = [0, 6];
    if (act === 'all') a.days = [0, 1, 2, 3, 4, 5, 6];
    if (act === 'del') { if (!confirm(`'${a.name}' 알람을 지울까요?`)) return; alarms = alarms.filter(x => x !== a); }
  }
  saveAlarms(); renderAlarms();
});

async function renderBgs() {
  const p = $('#pane-bgs');
  if (!selBg || !bgs.find(b => b.id === selBg)) selBg = (curBg && curBg.id) || (bgs[0] && bgs[0].id);
  const it = bgs.find(b => b.id === selBg);
  const thumbs = await Promise.all(bgs.map(async b => `<button class="thumb ${b.on ? 'on' : ''} ${b.id === selBg ? 'sel' : ''}" data-sel="${b.id}" style="background-image:url('${await bgURL(b)}')"><span class="badge" data-tog="${b.id}">${icon('check')}</span></button>`));
  p.innerHTML = `<p class="note">그림은 <b>이 태블릿 안에만</b> 저장돼요. 인터넷으로 보내지 않아요. 초록 표시가 있는 그림만 차례로 바뀌어요.</p>
    <div class="box"><div class="bggrid">${thumbs.join('')}</div>
      <div class="row"><label class="btn primary upload full">${icon('plus')}내 그림 넣기<input type="file" accept="image/*" multiple id="upl"></label></div></div>
    ${it ? `<h3>고른 그림 자리 옮기기</h3><div class="box">
      <label class="f">크기<input type="range" min="40" max="300" value="${Math.round(it.scale * 100)}" data-r="scale"></label>
      <label class="f">왼쪽 ↔ 오른쪽<input type="range" min="0" max="100" value="${it.x}" data-r="x"></label>
      <label class="f">위 ↕ 아래<input type="range" min="0" max="100" value="${it.y}" data-r="y"></label>
      <div class="row"><button class="btn" data-act="reset">처음 자리로</button><span style="flex:1"></span>
      ${it.kind === 'user' ? `<button class="btn danger" data-act="delbg">${icon('trash')}그림 지우기</button>` : ''}</div></div>` : ''}
    <h3>몇 분마다 바꿀까요</h3><div class="box"><select id="rot">${[[0, '바꾸지 않기'], [1, '1분'], [3, '3분'], [5, '5분'], [10, '10분'], [30, '30분'], [60, '1시간']].map(([v, t]) => `<option value="${v}" ${prefs.rotateMin === v ? 'selected' : ''}>${t}</option>`).join('')}</select></div>`;
  if (it) showBg(it);
}
$('#pane-bgs').addEventListener('click', e => {
  const tog = e.target.closest('[data-tog]');
  if (tog) { const b = bgs.find(x => x.id === tog.dataset.tog); b.on = !b.on; saveBgs(); return renderBgs(); }
  const sel = e.target.closest('[data-sel]');
  if (sel) { selBg = sel.dataset.sel; return renderBgs(); }
  const act = e.target.closest('[data-act]');
  if (!act) return;
  const it = bgs.find(b => b.id === selBg);
  if (act.dataset.act === 'reset') { Object.assign(it, { scale: 1, x: 50, y: 50 }); saveBgs(); renderBgs(); }
  if (act.dataset.act === 'delbg') {
    if (!confirm('이 그림을 지울까요?')) return;
    idb('readwrite', s => s.delete(it.id));
    if (urlCache[it.id]) { URL.revokeObjectURL(urlCache[it.id]); delete urlCache[it.id]; }
    bgs = bgs.filter(b => b !== it); saveBgs();
    if (curBg && curBg.id === it.id) { curBg = null; nextBg(); }
    selBg = null; renderBgs();
  }
});
$('#pane-bgs').addEventListener('input', e => {
  const k = e.target.dataset.r; if (!k) return;
  const it = bgs.find(b => b.id === selBg);
  it[k] = k === 'scale' ? e.target.value / 100 : +e.target.value;
  saveBgs(); if (curBg && curBg.id === it.id) layout(layers[front], it);
});
$('#pane-bgs').addEventListener('change', async e => {
  if (e.target.id === 'rot') { prefs.rotateMin = +e.target.value; savePrefs(); return; }
  if (e.target.id !== 'upl') return;
  const files = [...e.target.files];
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
  for (const f of files) {
    const blob = await shrink(f), id = 'u-' + uid();
    try { await idb('readwrite', s => s.put(blob, id)); } catch { toast('그림을 저장하지 못했어요'); continue; }
    bgs.push({ id, kind: 'user', on: true, scale: 1, x: 50, y: 50 }); selBg = id;
  }
  saveBgs(); renderBgs();
  if (files.length) toast(`그림 ${files.length}장을 넣었어요`);
});

function renderEtc() {
  $('#pane-etc').innerHTML = `<div class="box">
      <div class="row sp"><span class="chk-l">초침(노란 바늘) 보이기</span><button class="chk" data-act="sec" aria-pressed="${prefs.seconds}">${icon('check')}</button></div>
      <label class="f">소리 크기<input type="range" min="0" max="100" value="${Math.round(prefs.volume * 100)}" id="vol"></label>
      <div class="row"><button class="btn" data-act="t10">${icon('sound')}10분 전 소리</button><button class="btn" data-act="t0">${icon('sound')}출발 소리</button><button class="btn" data-act="go">${icon('flag')}출발 화면 보기</button></div></div>
    <div class="box"><div class="row"><button class="btn full" data-act="fs">${icon('expand')}전체 화면</button></div>
      <p class="note">화면 안 꺼짐: ${'wakeLock' in navigator ? (wl ? '켜져 있어요' : '화면을 한 번 누르면 켜져요') : '이 브라우저는 지원하지 않아요 (기기 설정에서 자동 잠금을 꺼 주세요)'}</p>
      <p class="note">홈 화면에 추가하면 앱처럼 열리고 인터넷이 없어도 돼요. (iPad: 공유 → 홈 화면에 추가 / 안드로이드: 메뉴 → 홈 화면에 추가)</p></div>`;
}
$('#pane-etc').addEventListener('input', e => { if (e.target.id === 'vol') { prefs.volume = e.target.value / 100; savePrefs(); } });
$('#pane-etc').addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const act = b.dataset.act;
  if (act === 'sec') { prefs.seconds = !prefs.seconds; savePrefs(); renderEtc(); }
  if (act === 't10') { unlockAudio(); setTimeout(() => chime(10), 200); }
  if (act === 't0') { unlockAudio(); setTimeout(() => chime(0), 200); }
  if (act === 'go') { $('#sheet').hidden = true; showGo(findNext(new Date())?.a || alarms[0] || { icon: 'bus', msg: '출발!' }); }
  if (act === 'fs') { const d = document.documentElement; (d.requestFullscreen || d.webkitRequestFullscreen || (() => {})).call(d); }
});

/* ---------- 시작 ---------- */
requestAnimationFrame(frame);
nextBg();
keepAwake();
unlockAudio();
if ('serviceWorker' in navigator) {
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (!reloaded) { reloaded = true; location.reload(); } });
  addEventListener('load', () => navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(r => r.update()).catch(() => {}));
}
