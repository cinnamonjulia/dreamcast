/* ============================================================
   DREAMCAST — fishing, orbs, sparkles, sound
   ============================================================ */

export const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const avatar = () => document.getElementById('julia-avatar');
const rodTip = () => document.getElementById('rod-tip');
const linePath = () => document.getElementById('fish-line');
const moonHook = () => document.getElementById('moon-hook');
const orbLayer = () => document.getElementById('orb-layer');

/* ============================ SOUND ============================ */

let audioCtx = null;
let mutedFn = () => false;

export function setMuteSource(fn) { mutedFn = fn; }

function ctx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

/** Prime the AudioContext on first user gesture (autoplay policy). */
export function initAudioOnGesture() {
  const prime = () => { try { ctx(); } catch { /* no audio support */ } };
  window.addEventListener('pointerdown', prime, { once: true });
  window.addEventListener('keydown', prime, { once: true });
}

function tone(freq, start, dur, { type = 'sine', gain = 0.09 } = {}) {
  const c = ctx();
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t0 = c.currentTime + start;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function play(fn) {
  if (mutedFn()) return;
  try { fn(); } catch { /* audio unavailable — stay silent */ }
}

export const sounds = {
  /** two-note sparkle chime */
  catch: () => play(() => {
    tone(1318.5, 0, 0.35);            // E6
    tone(1975.5, 0.09, 0.45);         // B6
    tone(2637, 0.09, 0.3, { gain: 0.03 }); // shimmer octave
  }),
  /** 4-note ascending arpeggio with a soft tail */
  achieved: () => play(() => {
    const notes = [659.3, 830.6, 987.8, 1318.5]; // E5 G#5 B5 E6
    notes.forEach((f, i) => {
      tone(f, i * 0.14, 0.6);
      tone(f * 2, i * 0.14, 0.9, { gain: 0.02 }); // reverb-ish tail
    });
    tone(1318.5, 0.62, 1.4, { gain: 0.04 });
  }),
  /** warm pop + ting for a new dream */
  newDream: () => play(() => {
    tone(330, 0, 0.12, { type: 'triangle', gain: 0.12 });
    tone(1567.98, 0.1, 0.5, { gain: 0.07 }); // G6 ting
  }),
  tick: () => play(() => tone(880, 0, 0.06, { gain: 0.02 })),
};

/* ============================ AVATAR MICRO-LIFE ============================ */

export function startIdleLife() {
  if (REDUCED) return;
  const blink = () => {
    const eyes = document.querySelector('#julia-avatar #eyes');
    if (eyes) {
      eyes.classList.add('blink');
      setTimeout(() => eyes.classList.remove('blink'), 130);
    }
    setTimeout(blink, 4000 + Math.random() * 3000);
  };
  setTimeout(blink, 2500);

  // occasional happy wiggle — more often at high sparkle levels
  const wiggle = () => {
    const level = Number(document.body.dataset.sparkle || 0);
    if (Math.random() < (level >= 3 ? 0.75 : 0.3)) happyBounce();
    setTimeout(wiggle, 18000 + Math.random() * 20000);
  };
  setTimeout(wiggle, 15000);
}

export function happyBounce() {
  const av = avatar();
  if (!av || REDUCED) return;
  av.classList.remove('happy');
  void av.getBoundingClientRect(); // restart animation
  av.classList.add('happy');
  setTimeout(() => av.classList.remove('happy'), 800);
}

export function perkUp() {
  const av = avatar();
  if (!av || REDUCED) return;
  av.classList.remove('perk');
  void av.getBoundingClientRect();
  av.classList.add('perk');
  setTimeout(() => av.classList.remove('perk'), 600);
}

/* ============================ FISHING LINE ============================ */
/*
  The line lives in a fixed full-viewport SVG overlay, pointer-events: none.
  Origin = rod tip (page coords, recomputed per frame since Julia bobs).
  The end point springs toward the current target, so rapid retargeting
  between cards glides instead of restarting.
*/

const line = {
  active: false,       // line should be out
  raf: null,
  progress: 0,         // 0 reeled in → 1 fully out
  end: null,           // current end point {x, y}
  target: null,        // where the end wants to be
  sway: 0,
};

function rodTipPoint() {
  const el = rodTip();
  if (!el) return { x: window.innerWidth - 200, y: 120 };
  const r = el.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
}

function aimRig(target) {
  const rig = document.querySelector('#julia-avatar #rig');
  if (!rig || REDUCED) return;
  const tip = rodTipPoint();
  // small tilt toward the target, clamped so the pose stays natural
  const angle = Math.atan2(target.y - tip.y, target.x - tip.x) * 180 / Math.PI;
  const tilt = Math.max(-16, Math.min(16, (angle + 150) * 0.25));
  rig.style.transform = `rotate(${tilt}deg)`;
}

function restRig() {
  const rig = document.querySelector('#julia-avatar #rig');
  if (rig) rig.style.transform = '';
}

function drawLine() {
  const path = linePath();
  const moon = moonHook();
  if (!path || !moon) return;

  line.raf = null;
  const tip = rodTipPoint();

  // spring the end point toward target
  if (line.target && line.end) {
    line.end.x += (line.target.x - line.end.x) * 0.16;
    line.end.y += (line.target.y - line.end.y) * 0.16;
  }
  // extend / retract
  line.progress += (line.active ? 1 : -1) * 0.08;
  line.progress = Math.max(0, Math.min(1, line.progress));

  if (line.progress <= 0.01 && !line.active) {
    path.style.opacity = 0;
    moon.style.opacity = 0;
    restRig();
    return; // fully reeled in — stop the loop
  }

  line.sway += 0.045;
  const swayX = Math.sin(line.sway) * 5 * line.progress;
  const t = line.progress;
  const ex = tip.x + (line.end.x - tip.x) * t + swayX;
  const ey = tip.y + (line.end.y - tip.y) * t;

  // arc high over the sky: control point above both ends
  const cx = (tip.x + ex) / 2;
  const cy = Math.min(tip.y, ey) - 90 - 40 * t;
  path.setAttribute('d', `M ${tip.x} ${tip.y} Q ${cx} ${cy} ${ex} ${ey}`);
  path.style.opacity = Math.min(1, t * 2) * 0.9;

  moon.setAttribute('transform', `translate(${ex}, ${ey + 6}) rotate(${Math.sin(line.sway) * 8})`);
  moon.style.opacity = Math.min(1, t * 2);

  line.raf = requestAnimationFrame(drawLine);
}

function ensureLoop() {
  if (!line.raf) line.raf = requestAnimationFrame(drawLine);
}

/** Cast toward a page-coordinate point. Retargets smoothly if already out. */
export function castTo(x, y) {
  if (REDUCED) return;
  const target = { x, y };
  if (!line.end) line.end = rodTipPoint();
  line.target = target;
  line.active = true;
  aimRig(target);
  ensureLoop();
}

/** Cast so the hook hangs ~40px above a card's top edge. */
export function castToCard(cardEl) {
  const r = cardEl.getBoundingClientRect();
  castTo(r.x + r.width / 2, r.y - 40);
}

export function reelIn() {
  line.active = false;
  ensureLoop();
}

/* ============================ ORBS ============================ */

function makeOrbEl(size, count = 0) {
  const orb = document.createElement('div');
  orb.className = 'dream-orb';
  orb.style.width = orb.style.height = size + 'px';
  if (count > 1) {
    const n = document.createElement('span');
    n.className = 'orb-count';
    n.textContent = '×' + count;
    orb.appendChild(n);
  }
  orbLayer().appendChild(orb);
  return orb;
}

function jarPoint() {
  const jar = document.getElementById('jar-svg');
  const r = jar.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
}

function animateOrb(orb, keyframes, duration, easing = 'ease-in-out') {
  if (REDUCED) { return Promise.resolve(); }
  return orb.animate(keyframes, { duration, easing, fill: 'forwards' }).finished.catch(() => {});
}

function centerOf(el) {
  const r = el.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
}

function placeOrb(orb, p, size) {
  orb.style.left = (p.x - size / 2) + 'px';
  orb.style.top = (p.y - size / 2) + 'px';
}

/* ---- catch queue: sequences play one at a time; big backlogs collapse ---- */

const queue = [];
let running = false;

function enqueue(job) {
  queue.push(job);
  if (!running) runQueue();
}

async function runQueue() {
  running = true;
  while (queue.length) {
    // collapse: if more than 3 catches wait, merge them into one multi-orb catch
    if (queue.length > 3) {
      const batch = queue.splice(0, queue.length).filter(j => j.kind === 'catch');
      if (batch.length) {
        await catchSequence(batch[batch.length - 1].sourceEl, batch.length);
        batch.forEach(j => j.resolve());
        continue;
      }
    }
    const job = queue.shift();
    if (job.kind === 'catch') await catchSequence(job.sourceEl, 1);
    else if (job.kind === 'mini') await miniCatchSequence(job.sourceEl);
    job.resolve();
  }
  running = false;
}

/** §8.2 milestone catch — orb rises, Julia hooks it, reels it to the jar. */
export function milestoneCatch(sourceEl) {
  sounds.catch();
  if (REDUCED) return Promise.resolve();
  return new Promise(resolve => enqueue({ kind: 'catch', sourceEl, resolve }));
}

/** §6.2 mini catch for quick goals — abbreviated 1s hook-and-reel. */
export function miniCatch(sourceEl) {
  sounds.catch();
  if (REDUCED) return Promise.resolve();
  return new Promise(resolve => enqueue({ kind: 'mini', sourceEl, resolve }));
}

async function catchSequence(sourceEl, count) {
  const size = 28 + Math.min(10, (count - 1) * 4);
  const from = sourceEl?.isConnected ? centerOf(sourceEl) : { x: innerWidth / 2, y: innerHeight / 2 };
  const orb = makeOrbEl(size, count);
  placeOrb(orb, from, size);

  // 1. orb rises into the sky
  const skyPoint = { x: from.x + 30, y: Math.max(140, from.y - 130) };
  await animateOrb(orb, [
    { transform: 'translate(0,0) scale(.4)', opacity: 0 },
    { transform: `translate(${skyPoint.x - from.x}px, ${skyPoint.y - from.y}px) scale(1)`, opacity: 1 },
  ], 550, 'cubic-bezier(.3,.9,.5,1)');

  // 2. Julia casts & snags it
  castTo(skyPoint.x, skyPoint.y - 6);
  await wait(420);
  happyBounce();

  // 3. reel toward Julia, then arc into the jar
  const tip = rodTipPoint();
  reelIn();
  await animateOrb(orb, [
    { transform: `translate(${skyPoint.x - from.x}px, ${skyPoint.y - from.y}px) scale(1)` },
    { transform: `translate(${tip.x - from.x}px, ${tip.y + 30 - from.y}px) scale(.9)` },
  ], 450, 'cubic-bezier(.5,0,.6,1)');

  const jar = jarPoint();
  await animateOrb(orb, [
    { transform: `translate(${tip.x - from.x}px, ${tip.y + 30 - from.y}px) scale(.9)`, offset: 0 },
    { transform: `translate(${(tip.x + jar.x) / 2 - from.x}px, ${Math.min(tip.y, jar.y) - 60 - from.y}px) scale(.7)`, offset: 0.55 },
    { transform: `translate(${jar.x - from.x}px, ${jar.y - from.y}px) scale(.35)`, offset: 1 },
  ], 550, 'cubic-bezier(.4,.1,.6,1)');

  // settle wobble on the jar
  jarSettle();
  orb.remove();
}

async function miniCatchSequence(sourceEl) {
  const size = 16;
  const from = sourceEl?.isConnected ? centerOf(sourceEl) : { x: innerWidth / 2, y: 200 };
  const orb = makeOrbEl(size);
  placeOrb(orb, from, size);

  castTo(from.x, from.y - 10);
  await wait(300);
  happyBounce();
  reelIn();

  const jar = jarPoint();
  await animateOrb(orb, [
    { transform: 'translate(0,0) scale(.6)', opacity: 0.4 },
    { transform: `translate(${(from.x + jar.x) / 2 - from.x}px, ${Math.min(from.y, jar.y) - 70 - from.y}px) scale(1)`, opacity: 1, offset: 0.5 },
    { transform: `translate(${jar.x - from.x}px, ${jar.y - from.y}px) scale(.4)`, opacity: 1 },
  ], 650, 'cubic-bezier(.4,.1,.6,1)');

  jarSettle();
  orb.remove();
}

function jarSettle() {
  const jar = document.getElementById('jar-button');
  if (!jar || REDUCED) return;
  jar.animate([
    { transform: 'translateY(0)' },
    { transform: 'translateY(3px) scale(1.05, .95)' },
    { transform: 'translateY(0)' },
  ], { duration: 320, easing: 'ease-out' });
}

/* ============================ BIG CELEBRATION (§8.3) ============================ */

let skipCelebration = false;

export async function achievedCelebration(cardEl, onOrbInJar) {
  sounds.achieved();
  if (REDUCED) { onOrbInJar?.(); return; }

  skipCelebration = false;
  const skip = () => { skipCelebration = true; };
  window.addEventListener('click', skip, { once: true });

  const from = cardEl?.isConnected ? centerOf(cardEl) : { x: innerWidth / 2, y: innerHeight / 2 };

  // card glows & condenses (CSS class applied by caller); big orb forms
  const size = 54;
  const orb = makeOrbEl(size);
  orb.style.background = 'radial-gradient(circle at 32% 28%, rgba(255,255,255,.98), #FBD3E9 35%, #C3A6F1 60%, #6FA8DC 85%, #F77FBE)';
  placeOrb(orb, from, size);

  const skyPoint = { x: Math.min(from.x + 60, innerWidth - 340), y: Math.max(160, from.y - 160) };
  await animateOrb(orb, [
    { transform: 'translate(0,0) scale(.2)', opacity: 0 },
    { transform: `translate(${skyPoint.x - from.x}px, ${skyPoint.y - from.y}px) scale(1.05)`, opacity: 1 },
  ], skipCelebration ? 120 : 800, 'cubic-bezier(.3,.9,.5,1)');

  // Julia's big cast + visible effort
  castTo(skyPoint.x, skyPoint.y - 8);
  await wait(skipCelebration ? 80 : 700);
  happyBounce();
  starBurst(skyPoint.x, skyPoint.y);
  shootingStar();

  const tip = rodTipPoint();
  reelIn();
  await animateOrb(orb, [
    { transform: `translate(${skyPoint.x - from.x}px, ${skyPoint.y - from.y}px) scale(1.05)` },
    { transform: `translate(${tip.x - from.x}px, ${tip.y + 40 - from.y}px) scale(1.15)` },
  ], skipCelebration ? 120 : 700, 'cubic-bezier(.5,0,.6,1)');

  // triumphant pose: hold it up
  happyBounce();
  confettiBurst();
  await wait(skipCelebration ? 80 : 600);

  const jar = jarPoint();
  await animateOrb(orb, [
    { transform: `translate(${tip.x - from.x}px, ${tip.y + 40 - from.y}px) scale(1.15)` },
    { transform: `translate(${jar.x - from.x}px, ${jar.y - from.y}px) scale(.3)` },
  ], skipCelebration ? 120 : 600, 'cubic-bezier(.4,.1,.7,1)');

  jarSettle();
  orb.remove();
  window.removeEventListener('click', skip);
  onOrbInJar?.();
}

/* ============================ NEW DREAM CAST (§8.4) ============================ */

export async function newDreamCast() {
  sounds.newDream();
  if (REDUCED) return;
  const tip = rodTipPoint();
  // cast straight up
  castTo(tip.x - 30, -40);
  await wait(400);

  const size = 30;
  const orb = makeOrbEl(size);
  const from = { x: tip.x - 30, y: -30 };
  placeOrb(orb, from, size);
  await animateOrb(orb, [
    { transform: 'translate(0,0) scale(.8)', opacity: 0.4 },
    { transform: `translate(0, ${tip.y + 60 - from.y}px) scale(1)`, opacity: 1 },
  ], 550, 'cubic-bezier(.3,.9,.5,1)');
  happyBounce();
  reelIn();
  await animateOrb(orb, [
    { transform: `translate(0, ${tip.y + 60 - from.y}px) scale(1)`, opacity: 1 },
    { transform: `translate(0, ${tip.y + 60 - from.y}px) scale(2.2)`, opacity: 0 },
  ], 350, 'ease-out');
  orb.remove();
}

/* ============================ SPARKLES & SKY LIFE ============================ */

const wait = ms => new Promise(r => setTimeout(r, ms));

export function starBurst(x, y) {
  if (REDUCED) return;
  const field = document.getElementById('sparkle-field');
  for (let i = 0; i < 8; i++) {
    const g = document.createElement('div');
    g.className = 'glint';
    g.style.left = (x - 7 + (Math.random() - 0.5) * 90) + 'px';
    g.style.top = (y - 7 + (Math.random() - 0.5) * 70) + 'px';
    field.appendChild(g);
    setTimeout(() => g.remove(), 2700);
  }
}

export function shootingStar() {
  if (REDUCED) return;
  const field = document.getElementById('sparkle-field');
  const s = document.createElement('div');
  s.className = 'shooting-star';
  s.style.left = (Math.random() * 30) + 'vw';
  s.style.top = (5 + Math.random() * 20) + 'vh';
  field.appendChild(s);
  setTimeout(() => s.remove(), 1700);
}

function confettiStarSvg(color) {
  return `<svg width="12" height="12" viewBox="0 0 12 12"><path d="M6 0 L7.4 4.6 L12 6 L7.4 7.4 L6 12 L4.6 7.4 L0 6 L4.6 4.6 Z" fill="${color}"/></svg>`;
}

export function confettiBurst(colors = ['#FFD98E', '#F77FBE', '#C3A6F1', '#6FA8DC', '#FFFFFF']) {
  if (REDUCED) return;
  const field = document.getElementById('confetti-field');
  for (let i = 0; i < 26; i++) {
    const c = document.createElement('div');
    c.className = 'confetti-star';
    c.style.left = Math.random() * 100 + 'vw';
    c.style.top = '-20px';
    c.style.animationDuration = (2.4 + Math.random() * 2.2) + 's';
    c.style.animationDelay = (Math.random() * 0.9) + 's';
    c.innerHTML = confettiStarSvg(colors[i % colors.length]);
    field.appendChild(c);
    setTimeout(() => c.remove(), 6200);
  }
}

/** Sparkle-trail as a horizon bubble floats down into the sky. */
export function sparkleTrail(fromEl, toEl) {
  if (REDUCED || !fromEl || !toEl) return;
  const a = centerOf(fromEl), b = centerOf(toEl);
  for (let i = 0; i < 9; i++) {
    const t = i / 8;
    const s = document.createElement('div');
    s.className = 'sparkle-trail-star';
    s.innerHTML = confettiStarSvg(i % 2 ? '#F77FBE' : '#FFD98E');
    s.style.left = (a.x + (b.x - a.x) * t - 6) + 'px';
    s.style.top = (a.y + (b.y - a.y) * t - Math.sin(t * Math.PI) * 40 - 6) + 'px';
    s.style.animationDelay = (t * 0.35) + 's';
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 1600);
  }
}

/* ---- ambient sparkle loop, driven by body[data-sparkle] ---- */

let ambientTimer = null;
let shootingTimer = null;

export function startAmbientSky() {
  if (REDUCED) return;
  const tickGlint = () => {
    const level = Number(document.body.dataset.sparkle || 0);
    const chance = [0.25, 0.5, 0.75, 1][level] ?? 0.25;
    if (Math.random() < chance) {
      const field = document.getElementById('sparkle-field');
      const g = document.createElement('div');
      g.className = 'glint';
      g.style.left = Math.random() * 96 + 'vw';
      g.style.top = Math.random() * 45 + 'vh';
      field.appendChild(g);
      setTimeout(() => g.remove(), 2700);
    }
    const base = [4200, 2600, 1600, 900][level] ?? 4200;
    ambientTimer = setTimeout(tickGlint, base + Math.random() * 1500);
  };
  tickGlint();

  const tickStar = () => {
    const level = Number(document.body.dataset.sparkle || 0);
    if (level >= 1) shootingStar();
    if (level >= 3 && Math.random() < 0.5) confettiDrip();
    shootingTimer = setTimeout(tickStar, level >= 2 ? 35000 : 60000);
  };
  shootingTimer = setTimeout(tickStar, 20000);
}

function confettiDrip() {
  const field = document.getElementById('confetti-field');
  for (let i = 0; i < 4; i++) {
    const c = document.createElement('div');
    c.className = 'confetti-star';
    c.style.left = Math.random() * 100 + 'vw';
    c.style.top = '-20px';
    c.style.animationDuration = (5 + Math.random() * 3) + 's';
    c.innerHTML = confettiStarSvg(i % 2 ? '#FBD3E9' : '#FFD98E');
    field.appendChild(c);
    setTimeout(() => c.remove(), 8500);
  }
}

/* ============================ CARD FLOAT RANDOMIZATION ============================ */

export function randomizeFloat(cardEl) {
  cardEl.style.setProperty('--ty', ((Math.random() - 0.5) * 48).toFixed(1) + 'px');
  cardEl.style.setProperty('--rot', ((Math.random() - 0.5) * 3).toFixed(2) + 'deg');
  cardEl.style.setProperty('--bob-dur', (5 + Math.random() * 3).toFixed(2) + 's');
  cardEl.style.setProperty('--bob-delay', (-Math.random() * 6).toFixed(2) + 's');
}
