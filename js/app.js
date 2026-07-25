/* ============================================================
   DREAMCAST — state, rendering, interactions
   ============================================================ */

import {
  STORAGE_KEY,
  loadState, saveState, exportState, parseImport, defaultState,
  makeDream, makeCategory, uuid, todayISO, weekKey,
  dreamProgress, nextMilestone, dreamColor, categoryOf, daysAgo,
  sparkleLevel, bumpActivity, pastelize, readableAccent, hexToRgb, PALETTE,
} from './data.js';

import {
  syncEnabled, currentUser, sendCode, verifyCode, signOut, pullRemote, pushRemote, onAuth,
} from './sync.js';

import { matchFood, dishFood, foodIconSvg, parseRecipeIngredients, STAPLES, suggestRecipes } from './foods.js';

import {
  REDUCED, setMuteSource, initAudioOnGesture, sounds,
  startIdleLife, startAmbientSky, perkUp, happyBounce,
  castTo, castToCard, reelIn, milestoneCatch, miniCatch,
  achievedCelebration, newDreamCast, sparkleTrail, confettiBurst,
  starBurst, randomizeFloat,
} from './animations.js';

import { ROOM_ART, houseRoof, garageRoof, houseBase, boxStack } from './apartment-art.js';

let state = loadState();
setMuteSource(() => state.settings.muted);

const $ = sel => document.querySelector(sel);
const $$ = sel => [...document.querySelectorAll(sel)];

/* replaceChildren that ignores null/undefined entries */
function setChildren(el, ...kids) {
  el.replaceChildren(...kids.flat().filter(k => k != null));
}

/* Cache per-dream float randomization so re-renders don't make cards jump. */
const floatCache = new Map();

/* Merge another tab's saved state into ours: per dream, freshest lastTouchedAt wins.
   Protects against a stale tab overwriting work done here. */
let lastSync = Date.now();

function mergeDisk(onDisk) {
  if (!onDisk || !Array.isArray(onDisk.dreams)) return;
  const ours = new Map(state.dreams.map(d => [d.id, d]));
  for (const disk of onDisk.dreams) {
    const mine = ours.get(disk.id);
    const diskTouched = new Date(disk.lastTouchedAt || 0).getTime();
    if (!mine) {
      // unknown dream: adopt it only if touched since our last sync (i.e. created
      // in another tab) — otherwise it's one we deliberately deleted here
      if (diskTouched > lastSync - 2000) state.dreams.push(disk);
    } else if (diskTouched > new Date(mine.lastTouchedAt || 0).getTime()) {
      Object.assign(mine, disk);
    }
  }
  if (Array.isArray(onDisk.jar) && onDisk.jar.length > state.jar.length) state.jar = onDisk.jar;
  if (onDisk.fridge && Array.isArray(onDisk.fridge.items)) {
    const have = new Set(state.fridge.items.map(i => i.id));
    onDisk.fridge.items.forEach(i => {
      if (!have.has(i.id) && new Date(i.addedAt).getTime() > lastSync - 2000) state.fridge.items.push(i);
    });
  }
  if (Array.isArray(onDisk.weeklyActivity)) {
    for (const wa of onDisk.weeklyActivity) {
      const mine = state.weeklyActivity.find(w => w.weekKey === wa.weekKey);
      if (!mine) state.weeklyActivity.push(wa);
      else mine.count = Math.max(mine.count, wa.count);
    }
  }
}

function persist() {
  try { mergeDisk(JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')); } catch { /* disk unreadable — our state wins */ }
  lastSync = Date.now();
  saveState(state);
  schedulePush();
}

/* ---------- cloud sync (Supabase) ---------- */

let pushTimer = null;
let syncStatus = 'off'; // 'off' | 'signed-out' | 'ok' | 'error'

function schedulePush() {
  if (!syncEnabled()) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(async () => {
    try {
      const pushed = await pushRemote(state);
      syncStatus = pushed ? 'ok' : 'signed-out';
    } catch (e) {
      syncStatus = 'error';
      console.warn('Dreamcast sync push failed', e);
    }
  }, 1500);
}

async function pullAndMerge({ quiet = true } = {}) {
  try {
    const remote = await pullRemote();
    if (remote) {
      mergeDisk(remote);
      lastSync = Date.now();
      saveState(state);
      renderAll();
    }
    syncStatus = 'ok';
    if (!quiet) toast('Dreams synced ✦');
  } catch (e) {
    syncStatus = 'error';
    console.warn('Dreamcast sync pull failed', e);
    if (!quiet) toast('Couldn’t reach the cloud — your dreams are safe on this device.');
  }
}

function touch(dream) { dream.lastTouchedAt = new Date().toISOString(); }

function findDream(id) { return state.dreams.find(d => d.id === id); }

/* ---------- tiny DOM builder (all user text goes through textContent) ---------- */

function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k === 'html') el.innerHTML = v; // trusted static markup only
    else if (k === 'style') el.style.cssText = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'value') el.value = v;
    else if (k === 'checked') el.checked = v;
    else el.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null) continue;
    el.append(c);
  }
  return el;
}

function tintOf(color) {
  try {
    const { r, g, b } = hexToRgb(color.startsWith('rgb') ? '#C3A6F1' : color);
    const mix = c => Math.round(c + (255 - c) * 0.72);
    return `rgba(${mix(r)}, ${mix(g)}, ${mix(b)}, .85)`;
  } catch { return 'rgba(255,255,255,.82)'; }
}

/* ============================ RENDER: EVERYTHING ============================ */

function renderAll() {
  renderFilters();
  renderHorizon();
  renderTray();
  renderSky();
  renderRecent();
  renderQuickAddSelects();
  renderJar();
  renderPeony();
  renderMute();
  updateSparkle();
  if (!$('#fridge-view').hidden) renderFridge();
  if (!$('#apartment-view').hidden) renderApartment();
  $('#gallery-count').textContent =
    state.dreams.filter(d => d.status === 'achieved' && d.horizon !== 'short').length;
  if (!$('#gallery-view').hidden) renderGallery();
}

function updateSparkle() {
  document.body.dataset.sparkle = sparkleLevel(state);
}

/* ---------- filters ---------- */

function matchesScopeCat(d) {
  const s = state.settings;
  if (s.filterScope !== 'all' && d.scope !== s.filterScope) return false;
  if (s.filterCategory && d.category !== s.filterCategory) return false;
  return true;
}

function renderFilters() {
  const s = state.settings;
  $$('#scope-filter .chip').forEach(c =>
    c.classList.toggle('active', c.dataset.scope === s.filterScope));
  $$('#horizon-filter .chip').forEach(c =>
    c.classList.toggle('active', c.dataset.horizon === s.filterHorizon));

  const catWrap = $('#category-filter');
  catWrap.replaceChildren(
    h('button', {
      class: 'chip' + (!s.filterCategory ? ' active' : ''),
      text: 'All',
      onclick: () => { s.filterCategory = null; persist(); renderAll(); },
    }),
    ...state.categories.map(cat =>
      h('button', {
        class: 'chip cat-chip' + (s.filterCategory === cat.id ? ' active' : ''),
        // pale/med/accent/deep tiers derived from the category color (custom picks included)
        style: `--c-pale:${pastelize(cat.color, 0.72)};--c-med:${pastelize(cat.color, 0.52)};`
          + `--c-accent:${readableAccent(cat.color, 0.38)};--c-deep:${readableAccent(cat.color, 0.26)}`,
        onclick: () => { s.filterCategory = s.filterCategory === cat.id ? null : cat.id; persist(); renderAll(); },
      },
        h('span', { class: 'cat-dot', style: `background:${cat.color}` }),
        document.createTextNode(cat.name),
      )
    ),
  );

  $('#sort-toggle').textContent = s.sort === 'momentum' ? 'Momentum ✦' : 'Manual ↕';

  // horizon zone dimming
  const hz = s.filterHorizon;
  $('#horizon').classList.toggle('zone-dim', hz !== 'all' && hz !== 'someday');
  $('#tray').classList.toggle('zone-dim', hz !== 'all' && hz !== 'short');
  $('#sky-field').classList.toggle('zone-dim', hz !== 'all' && hz !== 'mid' && hz !== 'long');
}

/* ---------- horizon (someday) ---------- */

function renderHorizon() {
  const wrap = $('#horizon-bubbles');
  const somedays = state.dreams.filter(d => d.status === 'someday' && matchesScopeCat(d));
  setChildren(wrap,
    ...somedays.map((d, i) => {
      const b = h('button', {
        class: 'horizon-bubble',
        style: `animation-duration:${(6 + (i % 5) * 1.7).toFixed(1)}s`,
        'aria-label': `Someday dream: ${d.title}`,
        onclick: () => openSomedayModal(d.id),
        text: `${d.title} ${scopeGlyph(d.scope)}`,
      });
      return b;
    }),
    somedays.length ? null :
      h('span', { class: 'horizon-empty-hint', text: 'The horizon is clear — add a someday dream ✦' }),
  );
}

/* ---------- tray (short-term) ---------- */

function shortGoals(cadence) {
  const rank = { high: 0, low: 2 };
  const today = todayISO();
  const wk = weekKey();
  return state.dreams
    .filter(d => {
      if (d.status !== 'active' || d.horizon !== 'short' || !matchesScopeCat(d)) return false;
      if (d.scheduledFor && d.scheduledFor > today) {
        // scheduled ahead: surfaces in This Week when its week arrives, else lives in the task log
        return cadence === 'this-week' && weekKey(new Date(d.scheduledFor + 'T12:00')) === wk;
      }
      return d.cadence === cadence;
    })
    .sort((a, b) =>
      ((rank[a.importance] ?? 1) - (rank[b.importance] ?? 1)) ||
      ((a.dueTime || '99:99') > (b.dueTime || '99:99') ? 1 : (a.dueTime || '99:99') < (b.dueTime || '99:99') ? -1 : 0) ||
      (new Date(a.createdAt) - new Date(b.createdAt)));
}

function formatTime(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

function isOverdue(d) {
  if (d.cadence !== 'today' || !d.dueTime) return false;
  const now = new Date();
  const [h, m] = d.dueTime.split(':').map(Number);
  return now.getHours() * 60 + now.getMinutes() > h * 60 + m;
}

function cycleImportance(d) {
  d.importance = d.importance === null ? 'high' : d.importance === 'high' ? 'low' : null;
  touch(d); persist(); sounds.tick(); renderAll();
}

function caughtCount(cadence, sinceFn) {
  return state.dreams.filter(d =>
    d.horizon === 'short' && d.cadence === cadence &&
    d.status === 'achieved' && d.achievedAt && sinceFn(d.achievedAt)).length;
}

/* milestone subtasks scheduled into the tray */
function scheduledSubtasks(cadence) {
  const today = todayISO();
  const wk = weekKey();
  const out = [];
  for (const d of state.dreams) {
    if (d.status !== 'active') continue;
    if (!matchesScopeCat(d)) continue;
    for (const m of d.milestones) {
      for (const st of (m.subtasks || [])) {
        if (st.done || !st.scheduledFor) continue;
        const inToday = st.scheduledFor <= today;
        const inWeek = !inToday && weekKey(new Date(st.scheduledFor + 'T12:00')) === wk;
        if ((cadence === 'today' && inToday) || (cadence === 'this-week' && inWeek)) {
          out.push({ dream: d, ms: m, st, overdue: st.scheduledFor < today });
        }
      }
    }
  }
  return out.sort((a, b) => (a.st.scheduledFor < b.st.scheduledFor ? -1 : 1));
}

function renderSubtaskPill({ dream, ms, st, overdue }) {
  const cat = state.categories.find(c => c.id === (st.category || dream.category));
  const pill = h('li', {
    class: `tray-pill pill-subtask pill-${dream.scope}` + (overdue ? ' overdue' : ''),
    'data-id': st.id,
  },
    h('button', {
      class: 'tray-check',
      'aria-label': `Complete: ${st.text}`,
      onclick: e => { e.stopPropagation(); completeSubtask(dream.id, ms.id, st.id, pill); },
    }),
    cat ? h('span', { class: 'cat-dot', style: `background:${cat.color}`, title: cat.name }) : null,
    h('button', {
      class: 'pill-title', style: 'background:none;border:none;padding:0;font:inherit;font-weight:700;cursor:pointer;',
      text: st.text,
      title: `Step of "${ms.text}" in "${dream.title}" — click to edit`,
      onclick: () => openTaskModal(dream.id, ms.id, st.id),
    }),
    h('span', { class: 'pill-time', text: st.scheduledFor.slice(5).replace('-', '/') }),
    h('span', { class: 'pill-parent', text: dream.title.slice(0, 14) + (dream.title.length > 14 ? '…' : '') }),
    h('span', { class: 'scope-glyph', text: scopeGlyph(dream.scope) }),
  );
  return pill;
}

function completeSubtask(dreamId, msId, stId, pillEl) {
  const d = findDream(dreamId);
  const m = d?.milestones.find(x => x.id === msId);
  const st = m?.subtasks.find(x => x.id === stId);
  if (!st) return;
  st.done = true;
  st.doneAt = new Date().toISOString();
  touch(d);
  state.jar.push({ date: new Date().toISOString(), dreamId: d.id, kind: 'quick', scope: d.scope });
  bumpActivity(state);
  persist();
  pillEl?.classList.add('completing');
  miniCatch(pillEl).then(() => renderAll());
  setTimeout(renderAll, 450);
}

function renderTray() {
  const today = todayISO();
  const wk = weekKey();

  for (const [cadence, listId, countId] of [
    ['today', '#tray-today', '#caught-today'],
    ['this-week', '#tray-week', '#caught-week'],
  ]) {
    const goals = shortGoals(cadence);
    const subs = scheduledSubtasks(cadence);
    const list = $(listId);
    setChildren(list,
      ...goals.map(d => renderTrayPill(d)),
      ...subs.map(s => renderSubtaskPill(s)),
      (goals.length + subs.length) ? null :
        h('li', { class: 'tray-empty-hint', text: cadence === 'today' ? 'Nothing yet — what would make today feel good?' : 'A clear week of sky.' }),
    );
    const n = cadence === 'today'
      ? caughtCount('today', a => a.startsWith(today))
      : caughtCount('this-week', a => weekKey(new Date(a)) === wk);
    $(countId).textContent = n ? `caught: ${n} ✦` : '';
  }
}

function renderTrayPill(d) {
  const cat = categoryOf(state, d);
  const impLabel = d.importance === 'high' ? 'most important'
    : d.importance === 'low' ? 'least important' : 'normal importance';
  const pill = h('li', {
    class: 'tray-pill'
      + ` pill-${d.scope}`
      + (d.importance === 'high' ? ' imp-high' : d.importance === 'low' ? ' imp-low' : '')
      + (isOverdue(d) ? ' overdue' : ''),
    'data-id': d.id,
  },
    h('button', {
      class: 'tray-check',
      'aria-label': `Complete: ${d.title}`,
      onclick: e => { e.stopPropagation(); completeQuickGoal(d.id, pill); },
    }),
    h('button', {
      class: 'imp-star',
      'aria-label': `${d.title}: ${impLabel} — click to change`,
      title: `Importance: ${impLabel}`,
      text: d.importance === 'high' ? '★' : d.importance === 'low' ? '▾' : '☆',
      onclick: e => { e.stopPropagation(); cycleImportance(d); },
    }),
    h('span', { class: 'cat-dot', style: `background:${cat?.color || '#C3A6F1'}` }),
    h('button', {
      class: 'pill-title', style: 'background:none;border:none;padding:0;font:inherit;font-weight:700;cursor:pointer;',
      text: d.title,
      onclick: () => openQuickGoalModal(d.id),
    }),
    d.dueTime ? h('span', { class: 'pill-time', text: formatTime(d.dueTime) }) : null,
    d.scheduledFor && d.scheduledFor > todayISO()
      ? h('span', { class: 'pill-time', text: d.scheduledFor.slice(5).replace('-', '/') }) : null,
    d.linkedDreamId ? h('span', { class: 'pill-link-glyph', title: 'Feeds a bigger dream', text: '☁️' }) : null,
    isGroceryTask(d) ? h('button', {
      class: 'pill-note-btn', title: 'Grocery list', text: '▤',
      onclick: e => {
        e.stopPropagation();
        if (d.groceries?.length) openGroceryNote(d.id); else openQuickGoalModal(d.id);
      },
    }) : null,
    h('span', { class: 'scope-glyph', text: scopeGlyph(d.scope) }),
  );
  return pill;
}

function isGroceryTask(d) {
  return /grocer|market|food ?shop/i.test(d.title) || (d.groceries?.length > 0);
}

/* recipe URLs almost always carry the dish name in their slug — mine it */
function urlToDishName(url) {
  if (!url) return null;
  try {
    const segs = new URL(url).pathname.split('/').filter(Boolean);
    let seg = [...segs].reverse().find(s => /[a-z]/i.test(s) && !/^\d+$/.test(s)) || '';
    seg = decodeURIComponent(seg)
      .replace(/\.(html?|php|aspx?)$/i, '')
      .replace(/[-_+]+/g, ' ')
      .replace(/\b(recipe|recipes|video|print)\b/gi, '')
      .replace(/\d{4,}/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!seg || seg.length < 3) return null;
    return seg.split(' ').map(w => (w ? w[0].toUpperCase() + w.slice(1) : '')).join(' ').trim();
  } catch { return null; }
}

function completeQuickGoal(id, pillEl) {
  const d = findDream(id);
  if (!d) return;
  d.status = 'achieved';
  d.achievedAt = new Date().toISOString();
  touch(d);
  state.jar.push({ date: new Date().toISOString(), dreamId: d.id, kind: 'quick', scope: d.scope });
  bumpActivity(state);

  if (d.linkedDreamId) {
    const big = findDream(d.linkedDreamId);
    if (big) {
      big.updates.unshift({ date: todayISO(), text: `Caught a quick goal: ${d.title}` });
      touch(big);
    }
  }
  // kitchen magic: groceries stock the fridge, recipes become dishes
  if (d.groceries?.length) stockFridge(d.groceries);
  if (d.recipeLink || /\b(cook|meal prep|bake|dinner|lunch|breakfast)\b/i.test(d.title)) {
    const name = d.dishName
      || urlToDishName(d.recipeLink)
      || d.title.replace(/^(cook|make|bake|meal prep:?|prep)\s*/i, '')
      || 'Home-cooked meal';
    addFoodItem(name, dishFood(), { servings: d.servings || null });
    toast(`"${name}" landed in the fridge ✦`);
  }
  persist();

  pillEl?.classList.add('completing');
  miniCatch(pillEl).then(() => { renderAll(); });
  // update counters and jar promptly even while the orb flies
  setTimeout(renderAll, 450);
}

/* ---------- sky (mid/long cards) ---------- */

function skyDreams() {
  // altitude rule: long-term dreams ride high (top rows), mid-term sit lower
  const list = state.dreams.filter(d =>
    d.status === 'active' && (d.horizon === 'mid' || d.horizon === 'long'));
  const altitude = d => (d.horizon === 'long' ? 0 : 1);
  return [...list].sort((a, b) =>
    altitude(a) - altitude(b) ||
    (b.pinned === true) - (a.pinned === true) ||
    (state.settings.sort === 'momentum'
      ? new Date(b.lastTouchedAt) - new Date(a.lastTouchedAt)
      : 0));
}

function cardVisible(d) {
  const hz = state.settings.filterHorizon;
  if ((hz === 'mid' || hz === 'long') && d.horizon !== hz) return false;
  return matchesScopeCat(d);
}

function renderSky() {
  const grid = $('#cards-grid');
  const dreams = skyDreams();
  grid.replaceChildren(...dreams.map(d => renderCard(d)));
  applyCardFilters();
}

function applyCardFilters() {
  let visible = 0;
  $$('#cards-grid .dream-card').forEach(card => {
    const d = findDream(card.dataset.id);
    const show = d && cardVisible(d);
    card.classList.toggle('filtered-out', !show);
    if (show) visible++;
  });
  $('#sky-empty').hidden = visible > 0;
}

/* 7 real cloud silhouettes: puffy cumulus for personal, flat stratus for work.
   Each is a full outline (bumps on every edge) stretched behind the card. */
const CLOUD_PATHS = {
  'cloud-cumulus-1': 'M14 100 Q6 66 40 58 Q46 26 92 30 Q118 6 162 14 Q206 4 228 32 Q272 26 278 62 Q296 78 288 108 Q296 142 262 156 Q248 186 204 180 Q170 198 130 186 Q88 196 62 176 Q22 172 18 140 Q4 122 14 100 Z',
  'cloud-cumulus-2': 'M16 106 Q4 74 36 62 Q40 30 84 34 Q104 2 152 10 Q198 0 224 28 Q268 24 274 58 Q298 74 288 106 Q298 140 260 152 Q244 184 198 178 Q160 198 118 184 Q76 194 54 172 Q16 168 14 138 Q2 122 16 106 Z',
  'cloud-cumulus-3': 'M20 110 Q8 70 48 60 Q58 24 108 26 Q158 4 204 26 Q252 22 262 62 Q292 76 284 112 Q290 146 252 158 Q228 188 178 180 Q132 196 96 180 Q54 186 38 158 Q6 148 20 110 Z',
  'cloud-cumulus-4': 'M18 112 Q8 82 40 72 Q36 44 76 40 Q88 12 134 18 Q178 6 200 34 Q242 32 248 66 Q286 70 282 104 Q294 138 256 152 Q240 182 196 176 Q158 196 118 182 Q78 192 56 170 Q20 166 20 138 Q6 124 18 112 Z',
  'cloud-stratus-1': 'M10 64 Q2 34 46 26 Q108 6 172 18 Q240 8 270 28 Q298 40 290 72 Q298 108 288 138 Q294 170 248 176 Q182 194 118 184 Q56 192 28 170 Q2 160 10 128 Q2 94 10 64 Z',
  'cloud-stratus-2': 'M8 72 Q4 44 48 38 Q120 22 196 32 Q258 24 284 44 Q298 58 290 84 Q300 118 288 144 Q292 168 246 172 Q176 186 104 178 Q46 184 20 164 Q0 152 8 122 Q0 96 8 72 Z',
  'cloud-stratus-3': 'M12 68 Q6 40 52 34 Q116 14 184 26 Q250 18 276 38 Q300 50 292 80 Q300 112 290 140 Q296 168 250 174 Q186 190 116 180 Q52 188 24 166 Q0 154 12 124 Q4 96 12 68 Z',
  'cloud-stratus-4': 'M10 76 Q0 48 44 42 Q104 26 168 34 Q236 24 268 42 Q300 52 292 82 Q302 116 290 142 Q296 166 252 172 Q192 188 124 180 Q60 188 30 168 Q2 158 12 128 Q2 100 10 76 Z',
};

function cloudTypeOf(d) {
  const hash = [...d.id].reduce((a, ch) => a + ch.charCodeAt(0), 0);
  return d.scope === 'professional'
    ? `cloud-stratus-${(hash % 4) + 1}`
    : `cloud-cumulus-${(hash % 4) + 1}`;
}

function cloudShapeEl(type) {
  return h('div', {
    class: 'cloud-shape-wrap',
    'aria-hidden': 'true',
    html: `<svg class="cloud-shape" viewBox="0 0 300 200" preserveAspectRatio="none"><path d="${CLOUD_PATHS[type]}"/></svg>`,
  });
}

function linkHost(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}

/* stored URLs may come from imports/sync, not just our validated forms —
   never let a non-http(s) scheme reach an href */
function safeHref(url) {
  try {
    const u = new URL(url);
    if (u.protocol === 'http:' || u.protocol === 'https:') return u.href;
  } catch { /* fall through */ }
  return '#';
}

/* Twilight Pop Pastel (see PALETTE_SPEC.md) — six tiers per scope: the vivid
   anchor stays reserved for small pops (progress fills, rings), surfaces wear
   the pastel tiers, and accent/deep carry the hue in text */
const SCOPE_COLORS = {
  personal: {                          // orchid
    anchor: '#E556EC', dark: '#EF96F3', medium: '#F5BFF8',
    pale: '#FBE7FC', accent: '#B343B8', deep: '#833187',
  },
  professional: {                      // ocean teal
    anchor: '#318EA3', dark: '#7FB9C6', medium: '#B1D4DC',
    pale: '#E2EFF2', accent: '#2B7D90', deep: '#205C6A',
  },
  passion: {                           // violet — the apps she builds
    anchor: '#C265F8', dark: '#D9A0FB', medium: '#E8C4FC',
    pale: '#F6E9FE', accent: '#974FC2', deep: '#763E97',
  },
  peace: {                             // sky — home, order, self-care
    anchor: '#96D9F6', dark: '#96D9F6', medium: '#D0EEFB',
    pale: '#EFF9FE', accent: '#2F7EA1', deep: '#1F5C79',
  },
};

/* card surfaces: mid-term wears the dark tier, long-term the medium */
const SCOPE_TINTS = {
  personal: {
    mid: 'rgba(239, 150, 243, .9)',
    long: 'rgba(245, 191, 248, .88)',
  },
  professional: {
    mid: 'rgba(127, 185, 198, .9)',
    long: 'rgba(177, 212, 220, .88)',
  },
  peace: {
    mid: 'rgba(150, 217, 246, .9)',
    long: 'rgba(208, 238, 251, .88)',
  },
  passion: {
    mid: 'rgba(217, 160, 251, .9)',
    long: 'rgba(232, 196, 252, .88)',
  },
};

const SCOPE_GLYPHS = { personal: '✿', professional: '✦', peace: '☮', passion: '⌗' };
const scopeGlyph = s => SCOPE_GLYPHS[s] || '✿';
const SCOPE_OPTIONS = [
  ['personal', '✿ Personal'], ['professional', '✦ Professional'],
  ['peace', '☮ Peace'], ['passion', '⌗ Passion'],
];
const NEGLECT_DAYS = 5;

/* catch a dream step (milestone) straight from the sky */
function catchMilestoneFromSky(d, m) {
  m.done = true;
  m.doneAt = new Date().toISOString();
  touch(d);
  state.jar.push({ date: new Date().toISOString(), dreamId: d.id, kind: 'milestone', scope: d.scope });
  bumpActivity(state);
  persist();
  const cardEl = document.querySelector(`.dream-card[data-id="${d.id}"]`);
  cardEl?.querySelector('.progress-fill')?.classList.add('pulse');
  milestoneCatch(cardEl).then(renderAll);
  setTimeout(renderAll, 500);
}

/* the task editor: every task is click-to-edit wherever it appears */
function openTaskModal(dreamId, msId, stId) {
  const d = findDream(dreamId);
  const m = d?.milestones.find(x => x.id === msId);
  const st = m?.subtasks.find(x => x.id === stId);
  if (!st) return;
  openModal(h('div', {},
    h('h2', { text: 'Task ✦' }),
    h('p', { style: 'font-size:12px;font-weight:700;color:var(--periwinkle);margin:0 0 10px', text: `In step “${m.text}” of “${d.title}”` }),
    h('div', { class: 'field' },
      h('label', { text: 'Task' }),
      h('input', {
        type: 'text', value: st.text, maxlength: '140',
        onchange: e => { st.text = e.target.value.trim() || st.text; touch(d); persist(); renderAll(); },
      }),
    ),
    h('div', { class: 'field-row' },
      h('div', { class: 'field' },
        h('label', {
          text: (!st.scheduledFor && (m.dueDate || d.targetDate))
            ? `Scheduled for — due ${m.dueDate || d.targetDate} with its step`
            : 'Scheduled for',
        }),
        h('input', {
          type: 'date', value: st.scheduledFor || '',
          onchange: e => { st.scheduledFor = e.target.value || null; touch(d); persist(); renderAll(); },
        }),
      ),
      h('div', { class: 'field' },
        h('label', { text: 'Category' }),
        categorySelect(st.category || d.category, v => { st.category = v; touch(d); persist(); renderAll(); }),
      ),
    ),
    h('div', { class: 'modal-actions' },
      st.done
        ? h('button', { class: 'btn btn-secondary', text: '↩ Not done after all', onclick: () => { st.done = false; st.doneAt = null; touch(d); persist(); renderAll(); closeModal(); } })
        : h('button', { class: 'btn btn-primary', text: 'Catch it ✦', onclick: () => { closeModal(); completeSubtask(d.id, m.id, st.id, null); } }),
      h('button', { class: 'btn btn-secondary', text: 'Open the step', onclick: () => openStepModal(d.id, m.id) }),
      h('button', {
        class: 'btn btn-danger', text: 'Delete',
        onclick: () => { m.subtasks = m.subtasks.filter(x => x.id !== st.id); touch(d); persist(); renderAll(); closeModal(); },
      }),
    ),
  ), { slim: true });
}

/* the step editor: a dream step sits between a dream and a task — it holds
   its own schedulable tasks and can be caught when it's ready */
function openStepModal(dreamId, msId) {
  const d = findDream(dreamId);
  const m = d?.milestones.find(x => x.id === msId);
  if (!m) return;
  const body = h('div');
  const catInfo = id => state.categories.find(c => c.id === id);
  const render = () => {
    const stText = h('input', { type: 'text', placeholder: '＋ task…', maxlength: '140', style: 'flex:2;min-width:0' });
    const stDate = h('input', { type: 'date', 'aria-label': 'Schedule task', style: 'flex:1;min-width:0' });
    const stCat = h('select', { 'aria-label': 'Task category', style: 'flex:1;min-width:0' },
      ...state.categories.map(c => h('option', { value: c.id, text: c.name })));
    stCat.value = d.category || state.categories[0]?.id;
    setChildren(body,
      h('p', { style: 'font-size:12px;font-weight:700;color:var(--periwinkle);margin:0 0 10px', text: `A step of “${d.title}”` }),
      h('div', { class: 'field' },
        h('label', { text: 'Step' }),
        h('input', {
          type: 'text', value: m.text, maxlength: '160',
          onchange: e => { m.text = e.target.value.trim() || m.text; touch(d); persist(); renderAll(); },
        }),
      ),
      h('div', { class: 'field' },
        h('label', { text: d.targetDate && !m.dueDate ? `Due date — inheriting the dream's target (${d.targetDate})` : 'Due date' }),
        h('input', {
          type: 'date', value: m.dueDate || '',
          onchange: e => { m.dueDate = e.target.value || null; touch(d); persist(); render(); renderAll(); },
        }),
      ),
      h('h3', { text: 'Tasks inside this step' }),
      (m.subtasks || []).length ? h('ul', { class: 'ms-list' },
        ...m.subtasks.map((st, si) => {
          const cat = catInfo(st.category || d.category);
          return h('li', { class: 'subtask-item-wrap' },
            cat ? h('span', { class: 'st-cat-tag' },
              h('span', { class: 'cat-dot', style: `background:${cat.color}` }),
              document.createTextNode(cat.name)) : null,
            h('div', { class: 'ms-item subtask-item' + (st.done ? ' done' : '') },
              h('button', {
                class: 'ms-check st-check', text: st.done ? '✓' : '',
                'aria-label': (st.done ? 'Uncheck: ' : 'Complete: ') + st.text,
                onclick: () => {
                  if (st.done) { st.done = false; st.doneAt = null; touch(d); persist(); render(); renderAll(); }
                  else { completeSubtask(d.id, m.id, st.id, null); render(); }
                },
              }),
              h('button', { class: 'ms-text ms-text-btn', text: st.text, title: 'Edit this task', onclick: () => openTaskModal(d.id, m.id, st.id) }),
              st.scheduledFor ? h('span', { class: 'pill-time', text: st.scheduledFor.slice(5).replace('-', '/') }) : null,
              h('div', { class: 'ms-tools' },
                h('button', { text: '✕', 'aria-label': 'Delete task', onclick: () => { m.subtasks.splice(si, 1); touch(d); persist(); render(); renderAll(); } }),
              ),
            ),
          );
        }))
        : h('p', { style: 'font-size:13px;opacity:.6;font-style:italic', text: 'No tasks yet — break this step into little catches.' }),
      h('form', {
        class: 'ms-add subtask-add',
        onsubmit: e => {
          e.preventDefault();
          const text = stText.value.trim();
          if (!text) return;
          m.subtasks.push({ id: uuid(), text, done: false, doneAt: null, scheduledFor: stDate.value || null, category: stCat.value || null });
          touch(d); persist(); render(); renderAll();
        },
      }, stText, stDate, stCat, h('button', { class: 'btn btn-secondary', type: 'submit', text: '＋' })),
      h('h3', { text: 'Links' }),
      (m.links || []).length ? h('ul', { class: 'ms-list' },
        ...m.links.map((l, li) =>
          h('li', { class: 'ms-item link-row' },
            h('a', { href: safeHref(l.url), target: '_blank', rel: 'noopener noreferrer', text: l.title || linkHost(l.url) }),
            h('span', { class: 'link-url', text: linkHost(l.url) }),
            h('div', { class: 'ms-tools' },
              h('button', { text: '✕', 'aria-label': 'Remove link', onclick: () => { m.links.splice(li, 1); touch(d); persist(); render(); renderAll(); } }),
            ),
          ))) : null,
      (() => {
        const urlIn = h('input', { type: 'text', placeholder: 'https://…', 'aria-label': 'Link URL', maxlength: '500', style: 'flex:2;min-width:0' });
        const labelIn = h('input', { type: 'text', placeholder: 'Label', 'aria-label': 'Link label', maxlength: '80', style: 'flex:1;min-width:0' });
        return h('form', {
          class: 'ms-add subtask-add',
          onsubmit: e => {
            e.preventDefault();
            let url = urlIn.value.trim();
            if (!url) return;
            if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
            try { new URL(url); } catch { toast('That link doesn’t look like a URL.'); return; }
            m.links.push({ id: uuid(), title: labelIn.value.trim() || null, url });
            touch(d); persist(); render(); renderAll(); sounds.tick();
          },
        }, urlIn, labelIn, h('button', { class: 'btn btn-secondary', type: 'submit', text: '＋' }));
      })(),
      h('div', { class: 'modal-actions' },
        h('button', { class: 'btn btn-primary', text: 'Catch this step ✦', onclick: () => { closeModal(); catchMilestoneFromSky(d, m); } }),
        h('button', { class: 'btn btn-secondary', text: 'Open the dream', onclick: () => { closeModal(); openDreamModal(d.id); } }),
      ),
    );
  };
  render();
  openModal(h('div', {}, h('h2', { text: 'Dream step ☁' }), body), { slim: true });
}

function renderCard(d) {
  const color = dreamColor(state, d);
  const sc = SCOPE_COLORS[d.scope] || SCOPE_COLORS.personal;
  const cat = categoryOf(state, d);
  const pct = dreamProgress(d);
  const next = nextMilestone(d);
  const daysSinceTouch = Math.floor((Date.now() - new Date(d.lastTouchedAt).getTime()) / 86400000);
  const neglected = daysSinceTouch >= NEGLECT_DAYS;

  const card = h('article', {
    class: 'dream-card ' + cloudTypeOf(d) + ` h-${d.horizon}`
      + (d.pinned ? ' pinned-card' : '') + (neglected ? ' neglected' : ''),
    'data-id': d.id,
    tabindex: '0',
    role: 'button',
    'aria-label': `Dream: ${d.title}, ${pct}% complete. Press Enter to open.`,
    onclick: () => openDreamModal(d.id),
    onkeydown: e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDreamModal(d.id); }
    },
  },
    cloudShapeEl(cloudTypeOf(d)),
    neglected ? h('div', { class: 'rain', 'aria-hidden': 'true' },
      ...[12, 30, 48, 66, 84].map((left, i) =>
        h('span', { style: `left:${left}%;animation-delay:${(i * 0.28).toFixed(2)}s` }))) : null,
    h('button', {
      class: 'pin-star' + (d.pinned ? ' pinned' : ''),
      'aria-label': d.pinned ? 'Unpin dream' : 'Pin dream',
      html: `<svg width="17" height="17" viewBox="0 0 20 20"><path d="M10 1 L12.2 7.6 L19 10 L12.2 12.4 L10 19 L7.8 12.4 L1 10 L7.8 7.6 Z" fill="${d.pinned ? '#C265F8' : 'none'}" stroke="#974FC2" stroke-width="1.4"/></svg>`,
      onclick: e => { e.stopPropagation(); d.pinned = !d.pinned; touch(d); persist(); sounds.tick(); renderAll(); },
    }),
    h('div', { class: 'card-top' },
      h('span', { class: 'cat-ribbon', style: `background:${cat?.color || color}`, title: cat?.name || '' }),
      h('h3', { class: 'card-title', text: d.title }),
      h('span', { class: 'scope-glyph', style: `color:${sc.deep}`, title: d.scope, text: scopeGlyph(d.scope) }),
      h('span', { class: 'horizon-tag' + (d.horizon === 'long' ? ' tag-long' : ''), text: d.horizon === 'mid' ? 'Mid' : 'Long' }),
    ),
    d.why ? h('p', { class: 'card-why', text: d.why }) : null,
    h('div', { class: 'progress-row' },
      h('div', { class: 'progress-track' },
        h('div', { class: 'progress-fill', style: `width:${pct}%;background:${sc.anchor}` }),
      ),
      h('span', { class: 'progress-pct', style: `color:${sc.deep}`, text: pct + '%' }),
    ),
    h('div', { class: 'card-next' },
      next
        ? [h('span', { class: 'next-label', style: `color:${sc.accent}`, text: 'Next: ' }), document.createTextNode(next.text)]
        : h('span', { style: 'opacity:.55', text: d.milestones.length ? 'All dream steps caught ✦' : 'No dream steps yet — add one?' }),
    ),
    d.links.length ? h('div', { class: 'card-links' },
      ...d.links.slice(0, 3).map(l =>
        h('a', {
          class: 'card-link-chip',
          href: safeHref(l.url), target: '_blank', rel: 'noopener noreferrer',
          title: l.url,
          onclick: e => e.stopPropagation(),
        }, document.createTextNode((l.title || linkHost(l.url)) + ' ↗'))),
      d.links.length > 3 ? h('span', { class: 'card-link-more', text: `+${d.links.length - 3}` }) : null,
    ) : null,
    h('div', { class: 'card-foot', style: `color:${sc.deep}` },
      h('span', { text: d.targetDate ? `target ${d.targetDate}` : '' }),
      h('span', { text: `last touched ${daysAgo(d.lastTouchedAt)}` }),
    ),
  );

  const scopeTint = SCOPE_TINTS[d.scope] || SCOPE_TINTS.personal;

  // dream steps: baby clouds in the palest wash of their parent's hue
  const STEP_TINTS = {
    personal: 'rgba(251, 231, 252, .96)',
    professional: 'rgba(226, 239, 242, .96)',
    peace: 'rgba(239, 249, 254, .96)',
    passion: 'rgba(246, 233, 254, .96)',
  };
  const steps = d.milestones.filter(m => !m.done);
  const stepTint = STEP_TINTS[d.scope] || STEP_TINTS.personal;
  if (steps.length) {
    card.append(h('div', { class: 'dream-steps', 'aria-hidden': 'false' },
      ...steps.slice(0, 8).map((m, i) => {
        const stTotal = (m.subtasks || []).length;
        const stDone = (m.subtasks || []).filter(s => s.done).length;
        const pct = stTotal ? Math.round((stDone / stTotal) * 100) : 0;
        const effDue = m.dueDate || d.targetDate; // steps inherit the dream's target
        return h('button', {
          class: `step-cloud sc-${i}`,
          style: `background:${stepTint}`,
          title: `Dream step: ${m.text}${effDue ? ` · due ${effDue}${m.dueDate ? '' : ' (from the dream)'}` : ''} — click to open`,
          onclick: e => { e.stopPropagation(); openStepModal(d.id, m.id); },
        },
          h('span', { class: 'step-text', text: m.text }),
          (effDue || stTotal || (m.links || []).length) ? h('span', { class: 'step-row' },
            effDue ? h('span', { class: 'st-count' + (m.dueDate ? '' : ' st-inherited'), text: effDue.slice(5).replace('-', '/') }) : null,
            stTotal ? h('span', { class: 'st-count', text: `${stDone}/${stTotal}` }) : null,
            (m.links || []).length ? h('span', { class: 'st-count', text: `${m.links.length} ↗` }) : null,
          ) : null,
          stTotal ? h('span', { class: 'step-progress' },
            h('span', { class: 'step-progress-fill', style: `width:${pct}%;background:${sc.anchor}` })) : null,
        );
      }),
      steps.length > 8 ? h('button', {
        class: 'step-cloud step-more',
        title: `${steps.length - 8} more steps — open the dream`,
        text: `+${steps.length - 8}`,
        onclick: e => { e.stopPropagation(); openDreamModal(d.id); },
      }) : null,
    ));
  }

  card.style.setProperty('--tint', scopeTint[d.horizon] || scopeTint.mid);

  // stable float randomization per dream
  if (!floatCache.has(d.id)) {
    randomizeFloat(card);
    floatCache.set(d.id, {
      ty: card.style.getPropertyValue('--ty'),
      rot: card.style.getPropertyValue('--rot'),
      dur: card.style.getPropertyValue('--bob-dur'),
      delay: card.style.getPropertyValue('--bob-delay'),
    });
  } else {
    const f = floatCache.get(d.id);
    card.style.setProperty('--ty', f.ty);
    card.style.setProperty('--rot', f.rot);
    card.style.setProperty('--bob-dur', f.dur);
    card.style.setProperty('--bob-delay', f.delay);
  }
  return card;
}

/* ---------- recent strip ---------- */

function renderRecent() {
  const wrap = $('#recent-chips');
  const recent = state.dreams
    .filter(d => d.status === 'active' && d.horizon !== 'short')
    .sort((a, b) => new Date(b.lastTouchedAt) - new Date(a.lastTouchedAt))
    .slice(0, 5);
  setChildren(wrap,
    ...recent.map(d => {
      const cat = categoryOf(state, d);
      return h('button', {
        class: 'recent-chip',
        onclick: () => d.status === 'someday' ? openSomedayModal(d.id) : openDreamModal(d.id),
      },
        h('span', { class: 'cat-dot', style: `background:${cat?.color || '#C3A6F1'}` }),
        document.createTextNode(d.title),
      );
    }),
    recent.length ? null : h('span', { class: 'tray-empty-hint', text: 'Touch a dream and it will appear here.' }),
  );
}

/* ---------- jar ---------- */

function renderJar() {
  const g = $('#jar-orbs');
  const entries = state.jar;
  const shown = entries.slice(-40);
  const frag = document.createDocumentFragment();
  shown.forEach((e, i) => {
    const r = e.kind === 'achieved' ? 4.2 : e.kind === 'milestone' ? 3 : 2.2;
    const col = i % 6, row = Math.floor(i / 6);
    const jitter = ((i * 7919) % 10) / 10 - 0.5;
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('cx', 12.5 + col * 4.6 + jitter * 2);
    c.setAttribute('cy', 51 - row * 5 - jitter);
    c.setAttribute('r', r);
    c.setAttribute('fill', e.kind === 'achieved' ? 'url(#orbBig)' : e.kind === 'milestone' ? 'url(#orbPink)' : 'url(#orbTiny)');
    c.setAttribute('opacity', '.95');
    frag.appendChild(c);
  });
  g.replaceChildren(frag);

  const overflow = $('#jar-overflow');
  overflow.hidden = entries.length <= 40;
  if (entries.length > 40) overflow.textContent = '×' + entries.length;

  const dreams = entries.filter(e => e.kind === 'achieved').length;
  const ms = entries.filter(e => e.kind === 'milestone').length;
  const quick = entries.filter(e => e.kind === 'quick').length;
  $('#jar-button').title = `${dreams} dream${dreams === 1 ? '' : 's'} caught, ${ms} dream step${ms === 1 ? '' : 's'}, ${quick} quick goal${quick === 1 ? '' : 's'}`;
}

/* ---------- mute ---------- */

function renderMute() {
  $('#mute-toggle').classList.toggle('muted', state.settings.muted);
}

/* ============================ MODALS ============================ */

function closeModal() {
  $('#modal-root').replaceChildren();
}

function openModal(contentEl, { slim = false } = {}) {
  const modal = h('div', { class: 'modal' + (slim ? ' modal-slim' : ''), role: 'dialog', 'aria-modal': 'true' },
    h('button', { class: 'modal-close', 'aria-label': 'Close', text: '✕', onclick: closeModal }),
    contentEl,
  );
  const root = $('#modal-root');
  root.replaceChildren(modal);
  root.onclick = e => { if (e.target === root) closeModal(); };
  const first = modal.querySelector('input, textarea, button:not(.modal-close)');
  if (first) first.focus();
  return modal;
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if ($('#modal-root').childElementCount) closeModal();
    else closeRoomPanel();
  }
});

/* ---------- shared field builders ---------- */

function radioPills(name, options, current, onChange) {
  return h('div', { class: 'radio-pills', role: 'radiogroup' },
    ...options.map(([value, label]) =>
      h('label', {},
        h('input', {
          type: 'radio', name, value,
          checked: current === value,
          onchange: () => onChange(value),
        }),
        document.createTextNode(label),
      )
    ),
  );
}

function categorySelect(current, onChange) {
  const sel = h('select', { onchange: e => onChange(e.target.value) },
    ...state.categories.map(c =>
      h('option', { value: c.id, text: c.name, selected: c.id === current ? 'selected' : null })));
  if (current) sel.value = current;
  return sel;
}

function colorPickerRow(current, onChange) {
  const row = h('div', { class: 'swatch-row' });
  const rebuild = picked => {
    row.replaceChildren(
      ...PALETTE.map(hex =>
        h('button', {
          class: 'swatch' + (picked === hex ? ' selected' : ''),
          style: `background:${hex}`,
          'aria-label': `Color ${hex}`,
          onclick: () => { onChange(hex); rebuild(hex); },
        })),
      h('input', {
        type: 'color',
        value: picked && picked.startsWith('#') ? picked : '#F77FBE',
        'aria-label': 'Custom color',
        oninput: e => { onChange(e.target.value); rebuild(e.target.value); },
      }),
    );
  };
  rebuild(current);
  return row;
}

/* ---------- expanded dream modal (§6.4) ---------- */

function openDreamModal(id) {
  const d = findDream(id);
  if (!d) return;

  const debounced = fn => {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), 400); };
  };
  const saveSoft = debounced(() => { persist(); renderAll(); });

  const msSection = h('div');
  const renderMs = () => {
    const subtaskBlock = m => {
      const stText = h('input', { type: 'text', placeholder: '＋ subtask…', maxlength: '140', style: 'flex:2;min-width:0' });
      const stDate = h('input', { type: 'date', 'aria-label': 'Schedule subtask', style: 'flex:1;min-width:0' });
      return h('div', { class: 'subtask-block' },
        (m.subtasks || []).length ? h('ul', { class: 'subtask-list' },
          ...m.subtasks.map((st, si) =>
            h('li', { class: 'ms-item subtask-item' + (st.done ? ' done' : '') },
              h('button', {
                class: 'ms-check st-check',
                'aria-label': (st.done ? 'Uncheck: ' : 'Complete: ') + st.text,
                text: st.done ? '✓' : '',
                onclick: () => {
                  if (st.done) { st.done = false; st.doneAt = null; touch(d); persist(); renderMs(); renderAll(); }
                  else { completeSubtask(d.id, m.id, st.id, null); renderMs(); }
                },
              }),
              h('button', { class: 'ms-text ms-text-btn', text: st.text, title: 'Edit this task', onclick: () => openTaskModal(d.id, m.id, st.id) }),
              st.scheduledFor ? h('span', { class: 'pill-time', text: st.scheduledFor.slice(5).replace('-', '/') }) : null,
              h('div', { class: 'ms-tools' },
                h('button', { text: '✕', 'aria-label': 'Delete subtask', onclick: () => { m.subtasks.splice(si, 1); touch(d); persist(); renderMs(); renderAll(); } }),
              ),
            )),
        ) : null,
        h('form', {
          class: 'ms-add subtask-add',
          onsubmit: e => {
            e.preventDefault();
            const text = stText.value.trim();
            if (!text) return;
            m.subtasks.push({ id: uuid(), text, done: false, doneAt: null, scheduledFor: stDate.value || null });
            touch(d); persist(); renderMs(); renderAll();
          },
        }, stText, stDate, h('button', { class: 'btn btn-secondary', type: 'submit', text: '＋' })),
      );
    };

    const list = h('ul', { class: 'ms-list' },
      ...d.milestones.map((m, i) =>
        h('li', { class: 'ms-item-wrap' },
          h('div', { class: 'ms-item' + (m.done ? ' done' : '') },
            h('button', {
              class: 'ms-check',
              'aria-label': (m.done ? 'Uncheck: ' : 'Check off: ') + m.text,
              text: m.done ? '✓' : '',
              onclick: () => toggleMilestone(d, m),
            }),
            h('button', { class: 'ms-text ms-text-btn', text: m.text, title: 'Open this dream step', onclick: () => openStepModal(d.id, m.id) }),
            (m.subtasks || []).length ? h('span', { class: 'st-count', text: `${m.subtasks.filter(s => s.done).length}/${m.subtasks.length}` }) : null,
            h('div', { class: 'ms-tools' },
              h('button', { text: '↑', 'aria-label': 'Move up', onclick: () => { if (i > 0) { d.milestones.splice(i - 1, 0, d.milestones.splice(i, 1)[0]); touch(d); persist(); renderMs(); renderAll(); } } }),
              h('button', { text: '↓', 'aria-label': 'Move down', onclick: () => { if (i < d.milestones.length - 1) { d.milestones.splice(i + 1, 0, d.milestones.splice(i, 1)[0]); touch(d); persist(); renderMs(); renderAll(); } } }),
              h('button', { text: '✕', 'aria-label': 'Delete dream step', onclick: () => { d.milestones.splice(i, 1); touch(d); persist(); renderMs(); renderAll(); } }),
            ),
          ),
          subtaskBlock(m),
        )
      ),
    );

    const addInput = h('input', { type: 'text', placeholder: 'Add a dream step…', maxlength: '160' });
    const addForm = h('form', {
      class: 'ms-add',
      onsubmit: e => {
        e.preventDefault();
        const text = addInput.value.trim();
        if (!text) return;
        d.milestones.push({ id: uuid(), text, done: false, doneAt: null });
        touch(d); persist(); renderMs(); renderAll();
        addInput.value = ''; addInput.focus();
      },
    }, addInput, h('button', { class: 'btn btn-secondary', type: 'submit', text: 'Add' }));

    const children = [h('h3', { text: 'Dream Steps' }), list, addForm];

    if (!d.milestones.length) {
      children.push(
        h('div', { class: 'field range-field' },
          h('label', { text: `Progress by feel — ${d.manualPercent ?? 0}%` }),
          h('input', {
            type: 'range', min: '0', max: '100', value: String(d.manualPercent ?? 0),
            oninput: e => {
              d.manualPercent = Number(e.target.value);
              e.target.previousElementSibling.textContent = `Progress by feel — ${d.manualPercent}%`;
              touch(d); saveSoft();
            },
          }),
        ),
      );
    }
    msSection.replaceChildren(...children);
  };

  const toggleMilestone = (dream, m) => {
    m.done = !m.done;
    m.doneAt = m.done ? new Date().toISOString() : null;
    touch(dream);
    if (m.done) {
      state.jar.push({ date: new Date().toISOString(), dreamId: dream.id, kind: 'milestone' });
      bumpActivity(state);
      persist();
      renderMs(); renderAll();
      const cardEl = document.querySelector(`.dream-card[data-id="${dream.id}"]`);
      cardEl?.querySelector('.progress-fill')?.classList.add('pulse');
      milestoneCatch(cardEl).then(renderAll);
    } else {
      persist(); renderMs(); renderAll();
    }
  };

  const linksSection = h('div');
  const renderLinks = () => {
    const urlInput = h('input', { type: 'text', placeholder: 'https://…', 'aria-label': 'Link URL', maxlength: '500' });
    const titleInput = h('input', { type: 'text', placeholder: 'Label (optional)', 'aria-label': 'Link label', maxlength: '80', style: 'max-width:150px' });
    linksSection.replaceChildren(
      h('h3', { text: 'Links' }),
      d.links.length ? h('ul', { class: 'ms-list' },
        ...d.links.map((l, i) =>
          h('li', { class: 'ms-item link-row' },
            h('a', { href: safeHref(l.url), target: '_blank', rel: 'noopener noreferrer', text: l.title || linkHost(l.url) }),
            h('span', { class: 'link-url', text: linkHost(l.url) }),
            h('div', { class: 'ms-tools' },
              h('button', { text: '✕', 'aria-label': 'Remove link', onclick: () => { d.links.splice(i, 1); touch(d); persist(); renderLinks(); renderAll(); } }),
            ),
          ))) : null,
      h('form', {
        class: 'ms-add',
        onsubmit: e => {
          e.preventDefault();
          let url = urlInput.value.trim();
          if (!url) return;
          if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
          try { new URL(url); } catch { toast('That link doesn’t look like a URL.'); return; }
          d.links.push({ id: uuid(), title: titleInput.value.trim() || null, url });
          touch(d); persist(); renderLinks(); renderAll(); sounds.tick();
        },
      }, urlInput, titleInput, h('button', { class: 'btn btn-secondary', type: 'submit', text: 'Add' })),
    );
  };

  const updatesSection = h('div');
  const renderUpdates = () => {
    const input = h('input', { type: 'text', placeholder: 'Log an update…', maxlength: '300' });
    updatesSection.replaceChildren(
      h('h3', { text: 'Updates' }),
      h('form', {
        class: 'ms-add',
        onsubmit: e => {
          e.preventDefault();
          const text = input.value.trim();
          if (!text) return;
          d.updates.unshift({ date: todayISO(), text });
          touch(d); bumpActivity(state); persist();
          renderUpdates(); renderAll(); sounds.tick();
        },
      }, input, h('button', { class: 'btn btn-secondary', type: 'submit', text: 'Add update' })),
      d.updates.length
        ? h('ul', { class: 'updates-list' },
            ...d.updates.map(u => h('li', {},
              h('span', { class: 'u-date', text: u.date }),
              document.createTextNode(u.text))))
        : h('p', { style: 'font-size:13px;opacity:.6;font-style:italic', text: 'No updates yet — every little step counts.' }),
    );
  };

  const content = h('div', {},
    h('div', { class: 'field' },
      h('label', { text: 'Dream' }),
      h('input', { type: 'text', value: d.title, maxlength: '120', oninput: e => { d.title = e.target.value; touch(d); saveSoft(); } }),
    ),
    h('div', { class: 'field' },
      h('label', { text: 'Why it matters' }),
      h('textarea', { maxlength: '400', oninput: e => { d.why = e.target.value; touch(d); saveSoft(); }, text: d.why }),
    ),
    msSection,
    linksSection,
    h('div', { class: 'field-row' },
      h('div', { class: 'field' },
        h('label', { text: 'Horizon' }),
        radioPills('m-horizon', [['mid', 'Mid'], ['long', 'Long']], d.horizon, v => { d.horizon = v; touch(d); persist(); renderAll(); }),
      ),
      h('div', { class: 'field' },
        h('label', { text: 'Scope' }),
        radioPills('m-scope', SCOPE_OPTIONS, d.scope, v => { d.scope = v; touch(d); persist(); renderAll(); }),
      ),
    ),
    h('div', { class: 'field-row' },
      h('div', { class: 'field' },
        h('label', { text: 'Category' }),
        categorySelect(d.category, v => { d.category = v; touch(d); persist(); renderAll(); }),
      ),
      h('div', { class: 'field' },
        h('label', { text: 'Target date' }),
        h('input', { type: 'date', value: d.targetDate || '', onchange: e => { d.targetDate = e.target.value || null; touch(d); persist(); renderAll(); } }),
      ),
    ),
    h('div', { class: 'field' },
      h('label', { text: 'Mood color' }),
      colorPickerRow(dreamColor(state, d), v => { d.color = v; touch(d); persist(); renderAll(); }),
    ),
    h('div', { class: 'field' },
      h('label', { text: 'Notes' }),
      h('textarea', { placeholder: 'Quick thoughts, links, anything…', oninput: e => { d.notes = e.target.value; touch(d); saveSoft(); }, text: d.notes }),
    ),
    updatesSection,
    h('div', { class: 'modal-actions' },
      h('button', { class: 'btn btn-primary', text: 'Dream achieved ✦', onclick: () => achieveDream(d.id) }),
      h('button', {
        class: 'btn btn-secondary', text: d.pinned ? 'Unpin' : 'Pin ★',
        onclick: e => { d.pinned = !d.pinned; touch(d); persist(); e.target.textContent = d.pinned ? 'Unpin' : 'Pin ★'; sounds.tick(); renderAll(); },
      }),
      h('button', { class: 'btn btn-secondary', text: 'Send to the horizon', onclick: () => sendToHorizon(d.id) }),
      h('button', { class: 'btn btn-secondary', text: 'Archive', onclick: () => { d.status = 'archived'; touch(d); persist(); closeModal(); renderAll(); toast('Tucked away. Find it under Settings → Archived dreams.'); } }),
      h('button', {
        class: 'btn btn-danger', text: 'Delete',
        onclick: e => {
          if (e.target.dataset.arm) {
            state.dreams = state.dreams.filter(x => x.id !== d.id);
            persist(); closeModal(); renderAll();
          } else {
            e.target.dataset.arm = '1';
            e.target.textContent = 'Really delete forever?';
          }
        },
      }),
    ),
  );

  renderMs();
  renderLinks();
  renderUpdates();
  openModal(content);
}

/* ---------- achieve / horizon transitions ---------- */

function achieveDream(id) {
  const d = findDream(id);
  if (!d) return;
  closeModal();
  const cardEl = document.querySelector(`.dream-card[data-id="${id}"]`);
  cardEl?.classList.add('achieving');

  d.status = 'achieved';
  d.achievedAt = new Date().toISOString();
  touch(d);
  state.jar.push({ date: new Date().toISOString(), dreamId: d.id, kind: 'achieved' });
  bumpActivity(state);
  state.settings.sparkleBoostDate = todayISO();
  persist();

  const dColor = dreamColor(state, d);
  achievedCelebration(cardEl, () => {
    renderAll();
    confettiBurst([dColor, '#96D9F6', '#FFFFFF', pastelize(dColor, 0.4)]);
    toast(`You caught: ${d.title} ✦`, { linkText: 'See it in the gallery', onLink: showGallery });
  });
}

function sendToHorizon(id) {
  const d = findDream(id);
  if (!d) return;
  d.status = 'someday';
  d.horizon = null;
  d.cadence = null;
  touch(d);
  persist();
  closeModal();
  renderAll();
  toast('Sent to the horizon — it will wait for you there. ✨');
}

/* ---------- someday mini card (§6.3) ---------- */

function openSomedayModal(id) {
  const d = findDream(id);
  if (!d) return;
  const cat = categoryOf(state, d);

  const chaseArea = h('div');
  const renderChase = (choosing = false) => {
    if (!choosing) {
      chaseArea.replaceChildren(
        h('button', {
          class: 'btn btn-primary', style: 'width:100%;padding:12px;font-size:15px;',
          text: 'Start chasing this dream ✦',
          onclick: () => renderChase(true),
        }),
      );
    } else {
      chaseArea.replaceChildren(
        h('div', { class: 'field' },
          h('label', { text: 'How far away does it feel?' }),
          radioPills('promote-h', [['short', 'Short — this week'], ['mid', 'Mid'], ['long', 'Long']], null, v => promoteDream(d.id, v)),
        ),
      );
    }
  };
  renderChase();

  openModal(h('div', {},
    h('h2', { text: d.title }),
    d.why ? h('p', { style: 'font-style:italic;opacity:.8', text: d.why }) : null,
    h('p', { style: 'font-size:13px;font-weight:700;color:var(--periwinkle)' },
      document.createTextNode(`${scopeGlyph(d.scope)} ${d.scope[0].toUpperCase() + d.scope.slice(1)}${cat ? ' · ' + cat.name : ''}`)),
    chaseArea,
    h('div', { class: 'modal-actions' },
      h('button', {
        class: 'btn btn-danger', text: 'Let it drift away',
        onclick: e => {
          if (e.target.dataset.arm) { state.dreams = state.dreams.filter(x => x.id !== d.id); persist(); closeModal(); renderAll(); }
          else { e.target.dataset.arm = '1'; e.target.textContent = 'Really let it go?'; }
        },
      }),
    ),
  ), { slim: true });
}

function promoteDream(id, horizon) {
  const d = findDream(id);
  if (!d) return;
  const bubble = [...document.querySelectorAll('.horizon-bubble')]
    .find(b => b.textContent.startsWith(d.title));
  d.status = 'active';
  d.horizon = horizon;
  d.cadence = horizon === 'short' ? 'this-week' : null;
  touch(d);
  persist();
  closeModal();
  renderAll();
  const target = horizon === 'short'
    ? $('#tray')
    : document.querySelector(`.dream-card[data-id="${id}"]`) || $('#cards-grid');
  sparkleTrail(bubble || $('#horizon'), target);
  happyBounce();
  sounds.newDream();
}

/* ---------- quick goal editor ---------- */

function openQuickGoalModal(id) {
  const d = findDream(id);
  if (!d) return;
  const bigDreams = state.dreams.filter(x => x.status === 'active' && (x.horizon === 'mid' || x.horizon === 'long'));

  openModal(h('div', {},
    h('h2', { text: 'Quick goal' }),
    h('div', { class: 'field' },
      h('label', { text: 'Title' }),
      h('input', { type: 'text', value: d.title, maxlength: '120', oninput: e => { d.title = e.target.value; touch(d); persist(); renderAll(); } }),
    ),
    h('div', { class: 'field-row' },
      h('div', { class: 'field' },
        h('label', { text: 'When' }),
        radioPills('qg-cadence', [['today', 'Today'], ['this-week', 'This week']], d.cadence, v => { d.cadence = v; touch(d); persist(); renderAll(); }),
      ),
      h('div', { class: 'field' },
        h('label', { text: 'By what time? (optional)' }),
        h('input', {
          type: 'time', value: d.dueTime || '',
          onchange: e => { d.dueTime = e.target.value || null; touch(d); persist(); renderAll(); },
        }),
      ),
      h('div', { class: 'field' },
        h('label', { text: 'Scheduled for (optional)' }),
        h('input', {
          type: 'date', value: d.scheduledFor || '',
          onchange: e => { d.scheduledFor = e.target.value || null; touch(d); persist(); renderAll(); },
        }),
      ),
    ),
    h('div', { class: 'field' },
      h('label', { text: 'Importance' }),
      radioPills('qg-importance',
        [['high', '★ Most important'], ['normal', 'Normal'], ['low', '▾ Least important']],
        d.importance || 'normal',
        v => { d.importance = v === 'normal' ? null : v; touch(d); persist(); renderAll(); }),
    ),
    h('div', { class: 'field-row' },
      h('div', { class: 'field' },
        h('label', { text: 'Scope' }),
        radioPills('qg-scope', SCOPE_OPTIONS, d.scope, v => { d.scope = v; touch(d); persist(); renderAll(); }),
      ),
      h('div', { class: 'field' },
        h('label', { text: 'Category' }),
        categorySelect(d.category, v => { d.category = v; state.settings.lastUsedCategory = v; touch(d); persist(); renderAll(); }),
      ),
    ),
    h('div', { class: 'field' },
      h('label', { text: 'Feeds a bigger dream (optional)' }),
      h('select', {
        onchange: e => { d.linkedDreamId = e.target.value || null; touch(d); persist(); renderAll(); },
      },
        h('option', { value: '', text: '— none —' }),
        ...bigDreams.map(b => h('option', { value: b.id, text: b.title, selected: b.id === d.linkedDreamId ? 'selected' : null })),
      ),
    ),
    h('div', { class: 'field' },
      h('label', { text: 'Grocery list (one per line — completing this goal stocks the fridge)' }),
      h('textarea', {
        placeholder: 'milk\neggs\nstrawberries\n…paste a whole list here',
        oninput: e => {
          d.groceries = e.target.value.split('\n').map(x => x.trim()).filter(Boolean);
          touch(d); persist(); renderAll();
        },
        text: (d.groceries || []).join('\n'),
      }),
      d.groceries?.length ? h('button', {
        class: 'btn btn-secondary', style: 'margin-top:6px',
        text: `View list as a note ✎ (${d.groceries.length})`,
        onclick: () => openGroceryNote(d.id),
      }) : null,
    ),
    h('div', { class: 'field' },
      h('label', { text: 'Recipe link (optional — completing adds the dish to the fridge)' }),
      h('input', {
        type: 'text', placeholder: 'https://…', value: d.recipeLink || '',
        onchange: e => {
          d.recipeLink = e.target.value.trim() || null;
          touch(d); persist(); renderAll();
          const dn = document.getElementById('qg-dishname');
          if (dn && !dn.value && d.recipeLink) dn.placeholder = urlToDishName(d.recipeLink) || 'Home-cooked meal';
        },
      }),
    ),
    h('div', { class: 'field-row' },
      h('div', { class: 'field' },
        h('label', { text: 'Dish name (what shows in the fridge)' }),
        h('input', {
          type: 'text', id: 'qg-dishname', maxlength: '80',
          value: d.dishName || '',
          placeholder: urlToDishName(d.recipeLink) || 'auto-named from the recipe link',
          onchange: e => { d.dishName = e.target.value.trim() || null; touch(d); persist(); },
        }),
      ),
      h('div', { class: 'field' },
        h('label', { text: 'Servings' }),
        h('input', {
          type: 'number', min: '1', max: '99', value: d.servings || '',
          placeholder: 'e.g. 4',
          onchange: e => { d.servings = Number(e.target.value) || null; touch(d); persist(); },
        }),
      ),
    ),
    h('div', { class: 'modal-actions' },
      h('button', {
        class: 'btn btn-danger', text: 'Delete',
        onclick: e => {
          if (e.target.dataset.arm) { state.dreams = state.dreams.filter(x => x.id !== d.id); persist(); closeModal(); renderAll(); }
          else { e.target.dataset.arm = '1'; e.target.textContent = 'Really delete?'; }
        },
      }),
    ),
  ), { slim: true });
}

/* ---------- new dream (§8.4) ---------- */

function openNewDreamModal() {
  newDreamCast();

  const draft = {
    horizon: 'mid', cadence: 'today', scope: 'personal',
    category: state.settings.lastUsedCategory || state.categories[0]?.id,
    title: '', why: '', targetDate: null, linkedDreamId: null,
  };

  const fieldsArea = h('div');
  const titleField = () => h('div', { class: 'field' },
    h('label', { text: 'What is the dream?' }),
    h('input', { type: 'text', id: 'nd-title', value: draft.title, maxlength: '120', placeholder: 'Name it and it becomes real…', oninput: e => draft.title = e.target.value }),
  );

  const renderFields = () => {
    const common = [
      titleField(),
    ];
    if (draft.horizon === 'short') {
      const bigDreams = state.dreams.filter(x => x.status === 'active' && (x.horizon === 'mid' || x.horizon === 'long'));
      common.push(
        h('div', { class: 'field' },
          h('label', { text: 'When' }),
          radioPills('nd-cadence', [['today', 'Today'], ['this-week', 'This week']], draft.cadence, v => draft.cadence = v),
        ),
        h('div', { class: 'field-row' },
          h('div', { class: 'field' },
            h('label', { text: 'Scope' }),
            radioPills('nd-scope', SCOPE_OPTIONS, draft.scope, v => draft.scope = v),
          ),
          h('div', { class: 'field' },
            h('label', { text: 'Category' }),
            categorySelect(draft.category, v => draft.category = v),
          ),
        ),
        h('div', { class: 'field' },
          h('label', { text: 'Feeds a bigger dream (optional)' }),
          h('select', { onchange: e => draft.linkedDreamId = e.target.value || null },
            h('option', { value: '', text: '— none —' }),
            ...bigDreams.map(b => h('option', { value: b.id, text: b.title })),
          ),
        ),
      );
    } else if (draft.horizon === 'someday') {
      common.push(
        h('div', { class: 'field' },
          h('label', { text: 'Why it matters' }),
          h('textarea', { placeholder: 'One sentence is plenty.', oninput: e => draft.why = e.target.value, text: draft.why }),
        ),
        h('div', { class: 'field' },
          h('label', { text: 'Scope' }),
          radioPills('nd-scope', SCOPE_OPTIONS, draft.scope, v => draft.scope = v),
        ),
      );
    } else {
      common.push(
        h('div', { class: 'field' },
          h('label', { text: 'Why it matters' }),
          h('textarea', { placeholder: 'The reason this one is worth chasing.', oninput: e => draft.why = e.target.value, text: draft.why }),
        ),
        h('div', { class: 'field-row' },
          h('div', { class: 'field' },
            h('label', { text: 'Scope' }),
            radioPills('nd-scope', SCOPE_OPTIONS, draft.scope, v => draft.scope = v),
          ),
          h('div', { class: 'field' },
            h('label', { text: 'Category' }),
            categorySelect(draft.category, v => draft.category = v),
          ),
        ),
        h('div', { class: 'field' },
          h('label', { text: 'Target date (optional)' }),
          h('input', { type: 'date', onchange: e => draft.targetDate = e.target.value || null }),
        ),
      );
    }
    fieldsArea.replaceChildren(...common);
  };
  renderFields();

  openModal(h('div', {},
    h('h2', { text: 'Cast a new dream ✦' }),
    h('div', { class: 'field' },
      h('label', { text: 'How far away is it?' }),
      radioPills('nd-horizon',
        [['short', 'Short — today / this week'], ['mid', 'Mid'], ['long', 'Long'], ['someday', 'Someday']],
        draft.horizon,
        v => { draft.horizon = v; renderFields(); }),
    ),
    fieldsArea,
    h('div', { class: 'modal-actions' },
      h('button', {
        class: 'btn btn-primary', text: 'Cast it ✦',
        onclick: () => {
          const title = draft.title.trim();
          if (!title) { $('#nd-title')?.focus(); return; }
          const dream = makeDream({
            title,
            why: draft.why.trim(),
            scope: draft.scope,
            category: draft.category,
            horizon: draft.horizon === 'someday' ? null : draft.horizon,
            cadence: draft.horizon === 'short' ? draft.cadence : null,
            status: draft.horizon === 'someday' ? 'someday' : 'active',
            targetDate: draft.targetDate,
            linkedDreamId: draft.linkedDreamId,
          });
          state.dreams.unshift(dream);
          state.settings.lastUsedCategory = draft.category;
          persist();
          closeModal();
          renderAll();
          happyBounce();
          if (dream.status === 'someday') {
            // catch it onto the far horizon: cast at the new bubble, reel, sparkle
            const bubble = [...document.querySelectorAll('.horizon-bubble')]
              .find(b => (b.getAttribute('aria-label') || '').includes(dream.title));
            if (bubble && !REDUCED) {
              const r = bubble.getBoundingClientRect();
              castTo(r.x + r.width / 2, r.y + r.height + 22);
              setTimeout(() => {
                reelIn();
                sparkleTrail(document.getElementById('julia-avatar'), bubble);
                happyBounce();
              }, 900);
            }
          }
          // open the full editor for mid/long so milestones can be added right away
          if (dream.horizon === 'mid' || dream.horizon === 'long') openDreamModal(dream.id);
        },
      }),
      h('button', { class: 'btn btn-secondary', text: 'Cancel', onclick: closeModal }),
    ),
  ));
}

/* ---------- categories editor ---------- */

function openCategoriesModal() {
  const listArea = h('div');

  const renderList = () => {
    listArea.replaceChildren(
      ...state.categories.map(cat => {
        const row = h('div', { class: 'cat-row' },
          h('input', { type: 'color', value: cat.color, 'aria-label': `Color for ${cat.name}`, oninput: e => { cat.color = e.target.value; persist(); renderAll(); } }),
          h('input', { type: 'text', value: cat.name, maxlength: '40', 'aria-label': 'Category name', oninput: e => { cat.name = e.target.value; persist(); renderAll(); } }),
          h('button', {
            class: 'btn btn-danger', text: '✕', 'aria-label': `Delete ${cat.name}`,
            onclick: () => {
              const used = state.dreams.filter(d => d.category === cat.id);
              if (!used.length) {
                state.categories = state.categories.filter(c => c.id !== cat.id);
                persist(); renderList(); renderAll();
                return;
              }
              const others = state.categories.filter(c => c.id !== cat.id);
              if (!others.length) { toast('Keep at least one category ✦'); return; }
              const sel = h('select', {}, ...others.map(c => h('option', { value: c.id, text: c.name })));
              row.replaceChildren(
                h('span', { style: 'font-size:13px;font-weight:700', text: `Move ${used.length} dream${used.length > 1 ? 's' : ''} to:` }),
                sel,
                h('button', {
                  class: 'btn btn-primary', text: 'Move & delete',
                  onclick: () => {
                    used.forEach(d => d.category = sel.value);
                    state.categories = state.categories.filter(c => c.id !== cat.id);
                    persist(); renderList(); renderAll();
                  },
                }),
                h('button', { class: 'btn btn-secondary', text: 'Cancel', onclick: renderList }),
              );
            },
          }),
        );
        return row;
      }),
    );
  };
  renderList();

  const addInput = h('input', { type: 'text', placeholder: 'New category…', maxlength: '40' });
  openModal(h('div', {},
    h('h2', { text: 'Categories' }),
    listArea,
    h('form', {
      class: 'ms-add',
      onsubmit: e => {
        e.preventDefault();
        const name = addInput.value.trim();
        if (!name) return;
        state.categories.push(makeCategory(name, PALETTE[state.categories.length % PALETTE.length]));
        persist(); renderList(); renderAll();
        addInput.value = '';
      },
    }, addInput, h('button', { class: 'btn btn-secondary', type: 'submit', text: 'Add' })),
  ), { slim: true });
}

/* ---------- archived ---------- */

function openArchivedModal() {
  const archived = state.dreams.filter(d => d.status === 'archived');
  openModal(h('div', {},
    h('h2', { text: 'Archived dreams' }),
    archived.length
      ? h('div', {}, ...archived.map(d =>
          h('div', { class: 'rollover-item' },
            h('span', { class: 'r-title', text: d.title }),
            h('button', {
              class: 'btn btn-secondary', text: 'Restore',
              onclick: () => { d.status = d.horizon ? 'active' : 'someday'; if (!d.horizon && d.status === 'active') d.horizon = 'mid'; touch(d); persist(); closeModal(); renderAll(); },
            }),
            h('button', {
              class: 'btn btn-danger', text: 'Delete',
              onclick: e => {
                if (e.target.dataset.arm) { state.dreams = state.dreams.filter(x => x.id !== d.id); persist(); closeModal(); renderAll(); openArchivedModal(); }
                else { e.target.dataset.arm = '1'; e.target.textContent = 'Sure?'; }
              },
            }),
          )))
      : h('p', { style: 'opacity:.7;font-style:italic', text: 'Nothing tucked away.' }),
  ), { slim: true });
}

/* ---------- sync devices modal ---------- */

async function openSyncModal() {
  if (!syncEnabled()) {
    openModal(h('div', {},
      h('h2', { text: 'Sync devices ✦' }),
      h('p', { style: 'font-size:14px;line-height:1.5', text: 'Cloud sync isn’t set up yet. It takes about five minutes with a free Supabase project — the steps are in the README, or ask Claude to finish the setup once you have your project URL and anon key.' }),
    ), { slim: true });
    return;
  }

  const user = await currentUser();

  if (user) {
    openModal(h('div', {},
      h('h2', { text: 'Sync devices ✦' }),
      h('p', { style: 'font-size:14px' },
        document.createTextNode('Syncing as '),
        h('strong', { text: user.email }),
        document.createTextNode(' — your dreams follow you to any device where you sign in.')),
      h('div', { class: 'modal-actions' },
        h('button', { class: 'btn btn-primary', text: 'Sync now', onclick: async e => { e.target.disabled = true; await pullAndMerge({ quiet: false }); schedulePush(); e.target.disabled = false; } }),
        h('button', { class: 'btn btn-secondary', text: 'Sign out on this device', onclick: async () => { await signOut(); closeModal(); toast('Signed out — dreams stay saved on this device.'); } }),
      ),
    ), { slim: true });
    return;
  }

  // signed out: email → code flow
  const area = h('div');
  const emailStep = () => {
    const emailInput = h('input', { type: 'text', placeholder: 'you@example.com', 'aria-label': 'Email address' });
    setChildren(area,
      h('p', { style: 'font-size:13.5px;opacity:.8', text: 'Enter your email and we’ll send you a sign-in link — no password needed.' }),
      h('form', {
        class: 'ms-add',
        onsubmit: async e => {
          e.preventDefault();
          const email = emailInput.value.trim();
          if (!email.includes('@')) return;
          try {
            await sendCode(email);
            codeStep(email);
          } catch (err) {
            toast('Couldn’t send the code — check the address and try again.');
            console.warn(err);
          }
        },
      }, emailInput, h('button', { class: 'btn btn-primary', type: 'submit', text: 'Send code' })),
    );
  };
  const codeStep = email => {
    const codeInput = h('input', { type: 'text', placeholder: '6-digit code', 'aria-label': 'Sign-in code', maxlength: '10' });
    setChildren(area,
      h('p', { style: 'font-size:13.5px;opacity:.8' },
        document.createTextNode('We emailed a sign-in link to '),
        h('strong', { text: email }),
        document.createTextNode(' — click it and Dreamcast signs in by itself. If your email shows a code instead, type it here:')),
      h('form', {
        class: 'ms-add',
        onsubmit: async e => {
          e.preventDefault();
          try {
            await verifyCode(email, codeInput.value.trim());
            closeModal();
            toast('Signed in ✦ syncing your dreams…');
            await pullAndMerge();
            schedulePush();
          } catch (err) {
            toast('That code didn’t work — try again or resend.');
            console.warn(err);
          }
        },
      }, codeInput, h('button', { class: 'btn btn-primary', type: 'submit', text: 'Verify' })),
      h('button', { class: 'btn btn-secondary', text: '← Different email', onclick: emailStep }),
    );
  };
  emailStep();

  openModal(h('div', {},
    h('h2', { text: 'Sync devices ✦' }),
    area,
  ), { slim: true });
}

/* ---------- the peony: a petal per task done TODAY, colored by scope ---------- */

const PETAL_COLORS = {
  personal: ['#EF96F3', '#B343B8'],      // orchid
  professional: ['#7FB9C6', '#2B7D90'],  // ocean teal
  peace: ['#96D9F6', '#2F7EA1'],         // sky
  passion: ['#D9A0FB', '#974FC2'],       // violet
};

function localDateOf(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function tasksTodayScopes() {
  const today = todayISO();
  return state.jar
    .filter(e => e.kind === 'quick' && localDateOf(e.date) === today)
    .map(e => e.scope || findDream(e.dreamId)?.scope || 'personal');
}

function renderPeony() {
  const svg = $('#peony-svg');
  if (!svg) return;
  const scopes = tasksTodayScopes();
  const count = scopes.length;
  const shown = Math.min(count, 126);

  // concentric rings that grow with the day's harvest
  const rings = [[6, 8], [10, 12.5], [14, 17], [18, 21.5], [22, 26], [26, 30.5], [30, 35]]; // [capacity, radius]
  const cx = 32, cy = 30;
  let placed = 0;
  const ringDraws = [];
  for (let r = 0; r < rings.length && placed < shown; r++) {
    const [cap, radius] = rings[r];
    const inRing = Math.min(cap, shown - placed);
    let ring = '';
    for (let i = 0; i < inRing; i++) {
      const scope = scopes[placed + i] || 'personal';
      const [fill, edge] = PETAL_COLORS[scope] || PETAL_COLORS.personal;
      const a = (360 / cap) * i + r * 17;
      const ry = Math.max(4, 9 - r * 0.7);
      const rx = Math.max(2.6, 5 - r * 0.35);
      ring += `<g transform="rotate(${a} ${cx} ${cy})"><ellipse cx="${cx}" cy="${cy - radius}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${edge}" stroke-width=".8" opacity=".95"/></g>`;
    }
    ringDraws.push(ring);
    placed += inRing;
  }

  let parts = `
    <path d="M${cx} ${cy + 12} L${cx} 68" stroke="#8FBF84" stroke-width="2.4" stroke-linecap="round"/>
    <ellipse cx="${cx - 7}" cy="60" rx="6" ry="2.8" fill="#A5D9A2" transform="rotate(-28 ${cx - 7} 60)"/>
    <ellipse cx="${cx + 7}" cy="64" rx="6" ry="2.8" fill="#A5D9A2" transform="rotate(28 ${cx + 7} 64)"/>`;
  parts += ringDraws.reverse().join(''); // outer rings under, inner rings on top
  parts += `<circle cx="${cx}" cy="${cy}" r="${count ? 4.5 : 3.5}" fill="#FBE7A2" stroke="#E8CF7E" stroke-width="1.2"/>`;
  svg.setAttribute('viewBox', '0 0 64 72');
  // the flower physically grows with the day's blooms
  const size = 34 + Math.min(count, 100) * 0.22;
  svg.setAttribute('width', size);
  svg.setAttribute('height', size * 72 / 64);
  svg.innerHTML = parts;

  const badge = $('#peony-count');
  badge.hidden = count === 0;
  badge.textContent = count;
  $('#peony-button').title = count
    ? `${count} task${count === 1 ? '' : 's'} bloomed today ✿ — click for the task log`
    : 'Finish tasks to bloom today’s peony — click for the task log';
}

/* ---------- drag-to-decide: shared future/trash drop zones ---------- */

function tomorrowISO() {
  const t = new Date(); t.setDate(t.getDate() + 1);
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}

/* rows carry their id in the drag payload; zones look up what to do in `handlers` */
function dropZones(handlers) {
  const dateIn = h('input', {
    type: 'date', class: 'zone-date', value: tomorrowISO(),
    'aria-label': 'Date for tasks dropped on the future zone',
  });
  const makeZone = (cls, apply, ...kids) => {
    const z = h('div', { class: `drop-zone ${cls}` }, ...kids);
    z.addEventListener('dragover', e => { e.preventDefault(); z.classList.add('drag-over'); });
    z.addEventListener('dragleave', () => z.classList.remove('drag-over'));
    z.addEventListener('drop', e => {
      e.preventDefault();
      z.classList.remove('drag-over');
      const hnd = handlers.get(e.dataTransfer.getData('text/plain'));
      if (hnd) apply(hnd);
    });
    return z;
  };
  return h('div', { class: 'drop-zones' },
    makeZone('zone-done', hnd => hnd.done?.(),
      h('span', { text: '✓ drop here → done' })),
    makeZone('zone-future', hnd => hnd.future(dateIn.value || tomorrowISO()),
      h('span', { text: '🗓 drop here → tomorrow, or' }), dateIn),
    makeZone('zone-trash', hnd => hnd.trash(),
      h('span', { text: '🗑 drop here → let it go' })),
  );
}

/* ---------- task log: scheduled ahead & caught in the past ---------- */

function openTasksModal() {
  const today = todayISO();
  // "move to this week" for a dated step: tomorrow if it's still this week, else today
  const tmrISO = tomorrowISO();
  const laterThisWeek = weekKey(new Date(tmrISO + 'T12:00')) === weekKey() ? tmrISO : today;
  const upcoming = [];
  const inFlight = [];
  const past = [];
  for (const d of state.dreams) {
    if (d.horizon === 'short' && d.status === 'achieved' && d.achievedAt) {
      past.push({ date: d.achievedAt, text: d.title, kind: 'goal', restore: () => { d.status = 'active'; d.achievedAt = null; touch(d); } });
    }
    if (d.horizon === 'short' && d.status === 'active') {
      const entry = {
        id: d.id,
        date: d.scheduledFor, text: d.title, dream: null, scope: d.scope, category: d.category,
        open: () => openQuickGoalModal(d.id),
        reschedule: v => { d.scheduledFor = v || null; touch(d); },
        complete: () => completeQuickGoal(d.id, null),
        moveToday: () => { d.scheduledFor = null; d.cadence = 'today'; touch(d); },
        moveWeek: () => { d.scheduledFor = null; d.cadence = 'this-week'; touch(d); },
        trash: () => { d.status = 'archived'; touch(d); },
      };
      if (d.scheduledFor && d.scheduledFor > today) upcoming.push(entry);
      else inFlight.push({ ...entry, overdue: Boolean(d.scheduledFor && d.scheduledFor < today), where: d.cadence === 'today' ? 'today' : 'this week' });
    }
    for (const m of d.milestones) {
      for (const st of (m.subtasks || [])) {
        if (st.done && st.doneAt) {
          past.push({ date: st.doneAt, text: st.text, kind: 'subtask', dream: d.title, restore: () => { st.done = false; st.doneAt = null; touch(d); } });
        } else if (!st.done && st.scheduledFor && d.status === 'active') {
          const entry = {
            id: `${d.id}:${st.id}`,
            date: st.scheduledFor, text: st.text, dream: d.title, scope: d.scope,
            category: st.category || d.category,
            open: () => openDreamModal(d.id),
            reschedule: v => { st.scheduledFor = v || null; touch(d); },
            complete: () => completeSubtask(d.id, m.id, st.id, null),
            moveToday: () => { st.scheduledFor = today; touch(d); },
            moveWeek: () => { st.scheduledFor = laterThisWeek; touch(d); },
            trash: () => { m.subtasks.splice(m.subtasks.findIndex(x => x.id === st.id), 1); touch(d); },
          };
          if (st.scheduledFor > today) upcoming.push(entry);
          else inFlight.push({ ...entry, overdue: st.scheduledFor < today, where: 'dream step' });
        }
      }
    }
  }
  upcoming.sort((a, b) => (a.date < b.date ? -1 : 1));
  inFlight.sort((a, b) => ((a.date || '9999') < (b.date || '9999') ? -1 : 1));
  past.sort((a, b) => (a.date > b.date ? -1 : 1));

  const handlers = new Map();
  const refresh = () => { persist(); renderAll(); closeModal(); openTasksModal(); };
  [...upcoming, ...inFlight].forEach(u => handlers.set(u.id, {
    done: () => { closeModal(); u.complete(); toast('Caught it ✦'); },
    future: v => { u.reschedule(v); refresh(); toast('Sent to the future ✦'); },
    trash: () => { u.trash(); refresh(); toast('Let it go 🗑'); },
  }));
  const rowBase = u => ({ class: 'log-row', draggable: 'true', ondragstart: e => e.dataTransfer.setData('text/plain', u.id) });
  const catDot = u => { const c = state.categories.find(x => x.id === u.category); return c ? h('span', { class: 'cat-dot', style: `background:${c.color}`, title: c.name }) : null; };

  openModal(h('div', {},
    h('h2', { text: 'Task log ✦' }),
    h('p', { style: 'font-size:13px;opacity:.7', text: 'Drag any task onto a zone below — catch it done, send it to tomorrow (or any date), or let it go.' }),
    dropZones(handlers),
    h('h3', { text: 'Yesterday\'s Tasks (and others still in flight)' }),
    inFlight.length ? h('ul', { class: 'updates-list log-list' },
      ...inFlight.slice(0, 40).map(u => h('li', rowBase(u),
        u.overdue
          ? h('span', { class: 'overdue-badge', text: 'overdue' })
          : h('span', { class: 'where-badge', text: u.where }),
        h('span', { class: 'scope-glyph', text: scopeGlyph(u.scope) }),
        catDot(u),
        h('a', { href: '#', text: u.text, onclick: e => { e.preventDefault(); closeModal(); u.open(); } }),
        u.dream ? h('span', { style: 'opacity:.55;font-size:11.5px', text: ` — ${u.dream}` }) : null,
        h('button', {
          class: 'btn btn-secondary log-restore', text: '✓ done', title: 'Mark it complete',
          onclick: () => { closeModal(); u.complete(); toast('Caught it ✦'); },
        }),
        h('button', {
          class: 'btn btn-secondary log-restore', text: '→ tomorrow', title: 'Move it to tomorrow',
          onclick: () => { u.reschedule(tomorrowISO()); refresh(); toast('See you tomorrow ✦'); },
        }),
        h('button', {
          class: 'btn btn-secondary log-restore', text: '🗑', title: 'Let it go',
          onclick: () => { u.trash(); refresh(); toast('Let it go 🗑'); },
        }),
      )))
      : h('p', { style: 'font-size:13px;opacity:.6;font-style:italic', text: 'Nothing waiting — the trays are all caught up ✦' }),
    h('h3', { text: 'Scheduled ahead — click a date to move it' }),
    upcoming.length ? h('ul', { class: 'updates-list log-list' },
      ...upcoming.slice(0, 40).map(u => h('li', rowBase(u),
        h('input', {
          type: 'date', class: 'log-date', value: u.date, 'aria-label': `Reschedule ${u.text}`,
          onchange: e => { u.reschedule(e.target.value); persist(); renderAll(); toast('Rescheduled ✦'); },
        }),
        h('span', { class: 'scope-glyph', text: scopeGlyph(u.scope) }),
        catDot(u),
        h('a', { href: '#', text: u.text, onclick: e => { e.preventDefault(); closeModal(); u.open(); } }),
        u.dream ? h('span', { style: 'opacity:.55;font-size:11.5px', text: ` — ${u.dream}` }) : null,
        h('button', {
          class: 'btn btn-secondary log-restore', text: '✓ done', title: 'Mark it complete',
          onclick: () => { closeModal(); u.complete(); toast('Caught it ✦'); },
        }),
        h('button', {
          class: 'btn btn-secondary log-restore', text: '→ today', title: 'Move into the Today tray',
          onclick: () => { u.moveToday(); refresh(); toast('Moved to today ✦'); },
        }),
        h('button', {
          class: 'btn btn-secondary log-restore', text: '→ this week', title: 'Move into the This Week tray',
          onclick: () => { u.moveWeek(); refresh(); toast('Moved to this week ✦'); },
        }),
      )))
      : h('p', { style: 'font-size:13px;opacity:.6;font-style:italic', text: 'Nothing scheduled yet — date a task in the tray or a subtask inside a dream.' }),
    h('h3', { text: 'Caught in the past — bring one back if it needs another round' }),
    past.length ? h('ul', { class: 'updates-list log-list' },
      ...past.slice(0, 60).map(u => h('li', { class: 'log-row' },
        h('span', { class: 'u-date', text: u.date.slice(0, 10) }),
        document.createTextNode(u.text),
        u.dream ? h('span', { style: 'opacity:.55;font-size:11.5px', text: ` — ${u.dream}` }) : null,
        h('button', {
          class: 'btn btn-secondary log-restore', text: '↩ bring back',
          onclick: () => { u.restore(); persist(); renderAll(); closeModal(); openTasksModal(); toast('Back in the tray ✦'); },
        }),
      )))
      : h('p', { style: 'font-size:13px;opacity:.6;font-style:italic', text: 'No tasks caught yet — today is a fine day to start.' }),
  ));
}

/* ---------- handwritten grocery note ---------- */

function openGroceryNote(id) {
  const d = findDream(id);
  if (!d) return;
  openModal(h('div', { class: 'paper-note' },
    h('div', { class: 'note-tape' }),
    h('h2', { class: 'note-title', text: d.title }),
    h('ul', { class: 'note-list' },
      ...(d.groceries || []).map(g => h('li', {},
        h('span', { class: 'note-box' }),
        document.createTextNode(g),
      ))),
    h('p', { class: 'note-footer', text: '— caught with love ♡' }),
  ), { slim: true });
}

/* ---------- the fridge ---------- */

function addFoodItem(name, info, extra = {}) {
  const now = Date.now();
  state.fridge.items.push({
    id: uuid(),
    name: name.trim(),
    icon: info.icon,
    area: info.area,
    addedAt: new Date(now).toISOString(),
    expiresAt: info.days ? new Date(now + info.days * 86400000).toISOString() : null,
    ...extra,
  });
}

function stockFridge(names) {
  names.forEach(n => addFoodItem(n, matchFood(n)));
  toast(`Fridge stocked ✦ ${names.length} item${names.length === 1 ? '' : 's'} put away`);
  if (!$('#fridge-view').hidden) renderFridge();
}

function expiryLabel(item) {
  if (!item.expiresAt) return 'keeps well';
  const days = Math.ceil((new Date(item.expiresAt).getTime() - Date.now()) / 86400000);
  if (days < 0) return 'expired!';
  if (days === 0) return 'use today';
  return `~${days}d left`;
}

function isExpired(item) {
  return item.expiresAt && new Date(item.expiresAt).getTime() < Date.now();
}

function expiryMotionClass(item) {
  if (!item.expiresAt) return '';
  const days = (new Date(item.expiresAt).getTime() - Date.now()) / 86400000;
  if (days < 1) return ' exp-now';    // frantic — use me!
  if (days < 3) return ' exp-soon';   // getting antsy
  return '';
}

function renderFridge() {
  const items = state.fridge.items;
  const areas = { fridge: '.fridge-shelf', pantry: '.pantry-shelf' };
  for (const [area, sel] of Object.entries(areas)) {
    const shelves = $$(sel);
    shelves.forEach(s => s.replaceChildren());
    items.filter(i => i.area === area).forEach((item, idx) => {
      const used = item.usedPct ? ` · ${100 - item.usedPct}% left` : '';
      const servings = item.servings ? ` · ${item.servings} serving${item.servings === 1 ? '' : 's'}` : '';
      const hash = [...item.id].reduce((a, c) => a + c.charCodeAt(0), 0);
      const el = h('span', {
        class: 'food-item' + (isExpired(item) ? ' expired' : '') + expiryMotionClass(item),
        draggable: 'true',
        'data-id': item.id,
        'data-label': `${item.name} · ${expiryLabel(item)}${servings}${used}`,
        style: `--hue:${((hash % 7) - 3) * 9}deg`,
        html: foodIconSvg(item.icon),
        ondragstart: e => e.dataTransfer.setData('text/plain', item.id),
        onclick: e => { e.stopPropagation(); openFoodModal(item.id); },
      });
      shelves[idx % shelves.length].appendChild(el);
    });
  }
  const total = items.length;
  const expired = items.filter(isExpired).length;
  $('#fridge-summary').textContent = total
    ? `${total} item${total === 1 ? '' : 's'}${expired ? ` · ${expired} expired` : ''}`
    : 'empty — finish a grocery-shopping task to stock it';
}

function openFoodModal(id) {
  const item = state.fridge.items.find(i => i.id === id);
  if (!item) return;
  openModal(h('div', {},
    h('div', { style: 'text-align:center', html: foodIconSvg(item.icon, 72) }),
    h('p', { style: 'text-align:center;font-size:13px;font-weight:700;color:var(--periwinkle)', text: expiryLabel(item) }),
    h('div', { class: 'field' },
      h('label', { text: 'Name' }),
      h('input', {
        type: 'text', value: item.name, maxlength: '80',
        onchange: e => { item.name = e.target.value.trim() || item.name; persist(); renderFridge(); },
      }),
    ),
    item.icon === 'dish' ? h('div', { class: 'field' },
      h('label', { text: 'Servings left' }),
      h('input', {
        type: 'number', min: '0', max: '99', value: item.servings || '',
        placeholder: 'e.g. 4',
        onchange: e => { item.servings = Number(e.target.value) || null; persist(); renderFridge(); },
      }),
    ) : null,
    h('div', { class: 'field' },
      h('label', { text: 'Expiration date' }),
      h('input', {
        type: 'date', value: item.expiresAt ? item.expiresAt.slice(0, 10) : '',
        onchange: e => {
          item.expiresAt = e.target.value ? new Date(e.target.value + 'T20:00').toISOString() : null;
          persist(); renderFridge();
        },
      }),
    ),
    h('div', { class: 'field range-field' },
      h('label', { text: `How much is used — ${item.usedPct || 0}%` }),
      h('input', {
        type: 'range', min: '0', max: '100', value: String(item.usedPct || 0),
        oninput: e => {
          item.usedPct = Number(e.target.value);
          e.target.previousElementSibling.textContent = `How much is used — ${item.usedPct}%`;
          persist(); renderFridge();
        },
      }),
    ),
    h('div', { class: 'modal-actions' },
      h('button', { class: 'btn btn-danger', text: 'Toss in the trash', onclick: () => { removeFoodItem(id); closeModal(); } }),
    ),
  ), { slim: true });
}

function openStockModal() {
  const ta = h('textarea', {
    placeholder: 'milk\nrice\nfrozen peas\n…everything you have, one per line',
    style: 'min-height:160px',
  });
  const file = h('input', { type: 'file', accept: '.txt,.csv,text/plain,text/csv', hidden: '' });
  file.addEventListener('change', () => {
    const f = file.files?.[0];
    if (!f) return;
    f.text().then(txt => {
      const names = txt.split(/[\n,;]+/)
        .map(x => x.replace(/^["']|["']$/g, '').trim())
        .filter(x => x && !/^(items?|name|groceries)$/i.test(x)); // skip a CSV header row
      if (!names.length) { toast('That file looked empty — try a plain list ✦'); return; }
      ta.value = (ta.value.trim() ? ta.value.trim() + '\n' : '') + names.join('\n');
    });
    file.value = '';
  });
  openModal(h('div', {},
    h('h2', { text: 'Stock the kitchen ✦' }),
    h('p', { style: 'font-size:13px;opacity:.75', text: 'Write down everything in your fridge and pantry — or upload a list — and each item lands on the right shelf with an estimated shelf life.' }),
    h('div', { class: 'field' }, ta),
    file,
    h('div', { class: 'modal-actions' },
      h('button', { class: 'btn', text: '📄 upload a list (.txt / .csv)', onclick: () => file.click() }),
      h('button', {
        class: 'btn btn-primary', text: 'Put it all away ✦',
        onclick: () => {
          const names = ta.value.split('\n').map(x => x.trim()).filter(Boolean);
          if (!names.length) return;
          stockFridge(names);
          persist();
          closeModal();
        },
      }),
    ),
  ), { slim: true });
}

function openStaplesModal() {
  const have = new Set(state.fridge.staples);
  openModal(h('div', {},
    h('h2', { text: 'Staples I always have 🧂' }),
    h('p', { style: 'font-size:13px;opacity:.75', text: 'Tick the basics living in your pantry — salt, oil, spices. Recipe ideas will assume these are covered and never nag you to buy them.' }),
    h('div', { class: 'staples-grid' },
      ...STAPLES.map(s =>
        h('label', { class: 'staple-check' },
          h('input', {
            type: 'checkbox', checked: have.has(s.id),
            onchange: e => {
              if (e.target.checked) state.fridge.staples.push(s.id);
              else state.fridge.staples = state.fridge.staples.filter(x => x !== s.id);
              persist();
            },
          }),
          h('span', { text: s.name }),
        ),
      ),
    ),
  ), { slim: true });
}

function openRecipeIdeasModal() {
  const fresh = state.fridge.items.filter(i => !isExpired(i));
  const ideas = suggestRecipes(fresh, new Set(state.fridge.staples));
  if (!ideas.length) {
    openModal(h('div', {},
      h('h2', { text: 'What can I cook? ✨' }),
      h('p', { style: 'font-size:13px;opacity:.75', text: 'The shelves are looking bare — stock a few items first and ideas will appear here.' }),
    ), { slim: true });
    return;
  }
  const ideaCard = r => {
    const staplesNote = r.missingStaples.length
      ? h('p', { class: 'idea-staples', text: `staples to check: ${r.missingStaples.join(', ')}` })
      : null;
    return h('div', { class: 'idea-card' + (r.ready ? ' ready' : '') },
      h('div', { class: 'idea-head' },
        h('span', { class: 'idea-name', text: `${r.emoji} ${r.name}` }),
        h('span', { class: 'idea-badge', text: r.ready ? 'ready to cook ✦' : `missing ${r.missing.length}` }),
      ),
      h('p', { class: 'idea-have', text: `uses: ${r.have.join(', ')}` }),
      r.missing.length ? h('p', { class: 'idea-missing', text: `missing: ${r.missing.join(', ')}` }) : null,
      staplesNote,
      r.missing.length ? h('button', {
        class: 'chip', text: '＋ add missing to a grocery run',
        onclick: () => {
          const dream = makeDream({
            title: `Grocery run — ${r.name}`,
            horizon: 'short', cadence: 'today', scope: 'personal',
            category: 'cat-home',
            groceries: r.missing,
            dishName: r.name,
          });
          state.dreams.unshift(dream);
          persist();
          closeModal();
          renderAll();
          toast(`Shopping list for ${r.name} is in your Today tray ✦`);
        },
      }) : null,
    );
  };
  const searchNames = [...new Set(fresh.map(i => i.name))].slice(0, 6);
  openModal(h('div', {},
    h('h2', { text: 'What can I cook? ✨' }),
    h('p', { style: 'font-size:13px;opacity:.75', text: 'Ideas matched to what’s on your shelves right now. Tick your staples first so it knows what you already have.' }),
    h('div', { class: 'idea-list' }, ...ideas.slice(0, 8).map(ideaCard)),
    h('div', { class: 'modal-actions' },
      h('button', { class: 'btn', text: '🧂 my staples', onclick: () => { closeModal(); openStaplesModal(); } }),
      searchNames.length ? h('button', {
        class: 'btn btn-primary', text: 'find more recipes online ✦',
        onclick: () => window.open(
          'https://www.google.com/search?q=' + encodeURIComponent(`easy recipe with ${searchNames.join(' ')}`),
          '_blank', 'noopener'),
      }) : null,
    ),
  ), { slim: true });
}

function openRecipeModal() {
  const link = h('input', { type: 'text', placeholder: 'https://… (optional)' });
  const dish = h('input', { type: 'text', maxlength: '80', placeholder: 'e.g. Lemon Ricotta Pasta' });
  const ta = h('textarea', {
    placeholder: 'paste the whole recipe here — ingredients, steps, everything',
    style: 'min-height:140px',
  });
  const listTa = h('textarea', {
    placeholder: 'the grocery list appears here — edit it freely',
    style: 'min-height:110px',
  });
  ta.addEventListener('input', () => {
    listTa.value = parseRecipeIngredients(ta.value).join('\n');
  });
  link.addEventListener('change', () => {
    const name = urlToDishName(link.value.trim());
    if (name && !dish.value) dish.placeholder = name;
  });
  openModal(h('div', {},
    h('h2', { text: 'Recipe → grocery list ✦' }),
    h('p', { style: 'font-size:13px;opacity:.75', text: 'Paste a recipe and the ingredients become a shopping list in your Today tray. Finishing the grocery run stocks the fridge — and completing it drops the cooked dish in too.' }),
    h('div', { class: 'field' }, h('label', { text: 'Recipe link (optional)' }), link),
    h('div', { class: 'field' }, h('label', { text: 'Recipe' }), ta),
    h('div', { class: 'field' }, h('label', { text: 'Grocery list (tweak before saving)' }), listTa),
    h('div', { class: 'field' }, h('label', { text: 'Dish name (what shows in the fridge)' }), dish),
    h('div', { class: 'modal-actions' },
      h('button', {
        class: 'btn btn-primary', text: 'Make my list ✦',
        onclick: () => {
          const groceries = listTa.value.split('\n').map(x => x.trim()).filter(Boolean);
          if (!groceries.length) { toast('Paste a recipe first — no ingredients found yet ✦'); return; }
          const dishName = dish.value.trim() || urlToDishName(link.value.trim()) || null;
          const dream = makeDream({
            title: `Grocery run — ${dishName || 'new recipe'}`,
            horizon: 'short', cadence: 'today', scope: 'personal',
            category: 'cat-home',
            groceries,
            recipeLink: link.value.trim() || null,
            dishName,
          });
          state.dreams.unshift(dream);
          persist();
          closeModal();
          renderAll();
          toast(`Shopping list ready — ${groceries.length} ingredient${groceries.length === 1 ? '' : 's'} ✦`);
          openGroceryNote(dream.id);
        },
      }),
    ),
  ), { slim: true });
}

function removeFoodItem(id) {
  state.fridge.items = state.fridge.items.filter(i => i.id !== id);
  persist();
  sounds.tick();
  renderFridge();
}

function clearExpired() {
  const expired = state.fridge.items.filter(isExpired);
  if (!expired.length) { toast('Nothing expired — the fridge is fresh ✦'); return; }
  state.fridge.items = state.fridge.items.filter(i => !isExpired(i));
  persist();
  renderFridge();
  toast(`Tossed ${expired.length} expired item${expired.length === 1 ? '' : 's'} 🗑`);
}

function showFridge() {
  closeRoomPanel();
  $('#main-view').hidden = true;
  $('#gallery-view').hidden = true;
  $('#apartment-view').hidden = true;
  $('#apartment-dock').hidden = false;
  $('#fridge-view').hidden = false;
  $('#fridge-dock').hidden = true;
  renderFridge();
  window.scrollTo({ top: 0 });
}

function hideFridge() {
  $('#fridge-view').hidden = true;
  $('#main-view').hidden = false;
  $('#fridge-dock').hidden = false;
}

/* the fridge remembers whether the apartment sent you — back goes home */
function backFromFridge() {
  const from = fridgeFrom;
  fridgeFrom = null;
  $('#fridge-back').textContent = '← Back to the sky';
  if (from === 'apartment') {
    $('#fridge-view').hidden = true;
    $('#fridge-dock').hidden = false;
    showApartment();
  } else {
    hideFridge();
  }
}

function wireFridge() {
  $('#fridge-dock')?.addEventListener('click', () => {
    fridgeFrom = null;
    $('#fridge-back').textContent = '← Back to the sky';
    showFridge();
  });
  $('#fridge-back')?.addEventListener('click', backFromFridge);
  $('#stock-kitchen')?.addEventListener('click', openStockModal);
  $('#staples-btn')?.addEventListener('click', openStaplesModal);
  $('#recipe-ideas')?.addEventListener('click', openRecipeIdeasModal);
  $('#recipe-list')?.addEventListener('click', openRecipeModal);
  $('#fridge-unit')?.addEventListener('click', e => {
    if (e.target.closest('.food-item')) return;
    $('#fridge-unit').classList.toggle('open');
    sounds.tick();
  });
  const trash = $('#trash-can');
  if (!trash) return;
  trash.addEventListener('click', clearExpired);
  trash.addEventListener('dragover', e => { e.preventDefault(); trash.classList.add('drag-over'); });
  trash.addEventListener('dragleave', () => trash.classList.remove('drag-over'));
  trash.addEventListener('drop', e => {
    e.preventDefault();
    trash.classList.remove('drag-over');
    const id = e.dataTransfer.getData('text/plain');
    if (id) removeFoodItem(id);
  });
}

/* ---------- the apartment: a dollhouse view of one ☮ dream ---------- */

const APARTMENT_ROOM_META = [
  { key: 'kitchen', step: 'The Kitchen', label: 'Kitchen' },
  { key: 'mudroom', step: 'The Mudroom', label: 'Mudroom' },
  { key: 'foyer', step: 'The Foyer', label: 'Foyer' },
  { key: 'bedroom', step: 'The Bedroom', label: 'Bedroom' },
  { key: 'office', step: 'The Office', label: 'Office' },
  { key: 'living-room', step: 'The Living Room', label: 'Living Room' },
  { key: 'garage', step: 'The Garage', label: 'Garage' },
];
const HOME_DREAM_TITLE = 'An Organized Home';

let panelRoomKey = null;
let fridgeFrom = null;             // 'apartment' when the kitchen sent you to the fridge
const roomPeaceSeen = new Map();   // detects the moment a room reaches peace → shimmer

/* Provision (and heal) the wiring: one ☮ dream, six room steps.
   Always find-before-create so re-opening never duplicates anything. */
function ensureApartment() {
  if (!state.apartment || !Array.isArray(state.apartment.rooms)) {
    state.apartment = { dreamId: null, rooms: APARTMENT_ROOM_META.map(r => ({ key: r.key, stepId: null })) };
  }
  let changed = false;

  let dream = state.dreams.find(d => d.id === state.apartment.dreamId && d.status === 'active');
  if (!dream) {
    dream = state.dreams.find(d =>
      d.status === 'active' && d.scope === 'peace' &&
      d.title.trim().toLowerCase() === HOME_DREAM_TITLE.toLowerCase());
    if (!dream) {
      dream = makeDream({
        title: HOME_DREAM_TITLE,
        why: 'A home where everything has a place, and my mind can rest.',
        scope: 'peace', horizon: 'long', category: 'cat-home', status: 'active',
      });
      state.dreams.push(dream);
    }
    state.apartment.dreamId = dream.id;
    changed = true;
  }

  for (const meta of APARTMENT_ROOM_META) {
    let entry = state.apartment.rooms.find(r => r.key === meta.key);
    if (!entry) { entry = { key: meta.key, stepId: null }; state.apartment.rooms.push(entry); changed = true; }
    let m = dream.milestones.find(x => x.id === entry.stepId);
    if (!m) {
      m = dream.milestones.find(x => (x.text || '').trim().toLowerCase() === meta.step.toLowerCase());
      if (!m) {
        m = { id: uuid(), text: meta.step, done: false, doneAt: null, subtasks: [], links: [], dueDate: null };
        dream.milestones.push(m);
      }
      entry.stepId = m.id;
      changed = true;
    }
    if (!Array.isArray(m.subtasks)) m.subtasks = [];
  }

  if (changed) persist();
  return dream;
}

function apartmentRooms(dream) {
  return APARTMENT_ROOM_META.map(meta => {
    const entry = state.apartment.rooms.find(x => x.key === meta.key);
    const m = dream.milestones.find(x => x.id === entry?.stepId) || null;
    const subs = m?.subtasks || [];
    const total = subs.length;
    const done = subs.filter(s => s.done).length;
    const open = total - done;
    const atPeace = !!m && m.done && open === 0;
    return { ...meta, m, subs, total, done, open, atPeace };
  });
}

function renderApartment() {
  const dream = ensureApartment();
  const rooms = apartmentRooms(dream);
  let openTotal = 0, peaceCount = 0;

  rooms.forEach(r => {
    openTotal += r.open;
    if (r.atPeace) peaceCount++;
    const btn = document.querySelector(`.dollhouse .room[data-room="${r.key}"]`);
    if (!btn) return;
    btn.querySelector('.room-count').textContent =
      r.open ? `· ${r.open} task${r.open === 1 ? '' : 's'}` : '';
    btn.querySelector('.room-peace-badge').hidden = !r.atPeace;
    btn.classList.toggle('at-peace', r.atPeace);
    btn.querySelector('.room-boxes').hidden = r.open < 5;
    btn.setAttribute('aria-label',
      `${r.step}${r.atPeace ? ' — at peace' : r.open ? ` — ${r.open} task${r.open === 1 ? '' : 's'} to tidy` : ''}. Press Enter to open.`);
    if (roomPeaceSeen.get(r.key) === false && r.atPeace && !REDUCED) {
      btn.classList.add('shimmer');
      setTimeout(() => btn.classList.remove('shimmer'), 1400);
    }
    roomPeaceSeen.set(r.key, r.atPeace);
  });

  $('#apartment-summary').textContent =
    `${peaceCount} of ${rooms.length} rooms at peace · ${openTotal} task${openTotal === 1 ? '' : 's'} open`;
  const pct = dreamProgress(dream);
  $('#hp-fill').style.width = pct + '%';
  $('#hp-label').textContent = `${HOME_DREAM_TITLE} ☮ — ${pct}%`;

  renderRoomPanel();
}

/* checking a room task mirrors completeSubtask, with the room as orb origin */
function completeRoomTask(dream, m, st, originEl) {
  st.done = true;
  st.doneAt = new Date().toISOString();
  touch(dream);
  state.jar.push({ date: new Date().toISOString(), dreamId: dream.id, kind: 'quick', scope: dream.scope });
  bumpActivity(state);
  persist();
  miniCatch(originEl).then(renderAll);
  setTimeout(renderAll, 450);
}

function catchRoomPeace(dream, m, roomEl) {
  m.done = true;
  m.doneAt = new Date().toISOString();
  touch(dream);
  state.jar.push({ date: new Date().toISOString(), dreamId: dream.id, kind: 'milestone', scope: dream.scope });
  bumpActivity(state);
  persist();
  milestoneCatch(roomEl).then(renderAll);
  setTimeout(renderAll, 500);
  const allRooms = state.apartment.rooms.every(r => dream.milestones.find(x => x.id === r.stepId)?.done);
  if (allRooms) {
    confettiBurst(['#96D9F6', '#52C3F4', '#FFFFFF', '#E556EC']);
    toast('Your home is at peace ☮ — catch this dream?', {
      linkText: 'Catch it ✦', onLink: () => achieveDream(dream.id), duration: 9000,
    });
  }
}

function openRoomPanel(key) {
  panelRoomKey = key;
  sounds.tick();
  renderRoomPanel();
}

function closeRoomPanel() {
  if (!panelRoomKey) return;
  panelRoomKey = null;
  renderRoomPanel();
}

function renderRoomPanel() {
  const panel = $('#room-panel');
  const section = $('#apartment-view');
  if (!panel) return;
  if (!panelRoomKey || section.hidden) {
    panel.classList.remove('open');
    section.classList.remove('panel-open');
    return;
  }
  const dream = ensureApartment();
  const r = apartmentRooms(dream).find(x => x.key === panelRoomKey);
  if (!r || !r.m) { panelRoomKey = null; panel.classList.remove('open'); return; }
  const m = r.m;
  const roomBtn = document.querySelector(`.dollhouse .room[data-room="${r.key}"]`);
  const allDone = r.open === 0;

  const addInput = h('input', {
    type: 'text', placeholder: '＋ tidy task…', maxlength: '140',
    'aria-label': `Add a tidy task for ${r.step}`,
  });

  panel.replaceChildren(
    h('button', { class: 'rp-close', text: '✕', 'aria-label': 'Close room panel', onclick: closeRoomPanel }),
    h('div', { class: 'rp-portrait', 'aria-hidden': 'true', html: ROOM_ART[r.key]() }),
    h('div', { class: 'rp-head' },
      h('h2', { text: r.step }),
      r.atPeace ? h('span', { class: 'rp-peace', text: 'at peace ☮' }) : null,
    ),
    h('div', { class: 'rp-progress' },
      h('span', { class: 'hp-track' },
        h('span', { class: 'hp-fill', style: `width:${r.total ? Math.round((r.done / r.total) * 100) : (m.done ? 100 : 0)}%` })),
      h('span', { class: 'rp-progress-label', text: r.total ? `${r.done} of ${r.total} tidy` : 'no tasks yet' }),
    ),
    r.subs.length ? h('ul', { class: 'rp-tasks' },
      ...r.subs.map(st => h('li', { class: 'rp-task' + (st.done ? ' done' : '') },
        h('button', {
          class: 'tray-check',
          style: st.done ? 'background:var(--pink);border-color:var(--pink)' : '',
          'aria-label': (st.done ? 'Uncheck: ' : 'Tidy done: ') + st.text,
          onclick: e => {
            if (st.done) {
              st.done = false; st.doneAt = null;
              if (m.done) { m.done = false; m.doneAt = null; } // the room gently wakes
              touch(dream); persist(); renderAll();
            } else {
              const rect = e.target.getBoundingClientRect();
              starBurst(rect.x + rect.width / 2, rect.y);
              completeRoomTask(dream, m, st, roomBtn);
            }
          },
        }),
        h('button', { class: 'rp-task-text', text: st.text, title: 'Edit this task', onclick: () => openTaskModal(dream.id, m.id, st.id) }),
        st.scheduledFor ? h('span', { class: 'pill-time', text: st.scheduledFor.slice(5).replace('-', '/') }) : null,
      ))) :
      h('p', { class: 'rp-empty', text: 'Nothing to tidy here yet — add the little things below ✦' }),
    h('form', {
      class: 'rp-add',
      onsubmit: e => {
        e.preventDefault();
        const text = addInput.value.trim();
        if (!text) return;
        m.subtasks.push({ id: uuid(), text, done: false, doneAt: null, scheduledFor: null, category: dream.category || null });
        if (m.done) { m.done = false; m.doneAt = null; } // new mess: no penalty, just back to normal
        touch(dream); persist(); sounds.tick(); renderAll();
        $('#room-panel .rp-add input')?.focus();
      },
    }, addInput, h('button', { class: 'btn btn-secondary', type: 'submit', text: '＋' })),
    h('div', { class: 'rp-actions' },
      m.done
        ? h('button', {
            class: 'btn btn-secondary', text: '↩ not at peace after all',
            onclick: () => { m.done = false; m.doneAt = null; touch(dream); persist(); renderAll(); },
          })
        : h('button', {
            class: 'btn btn-peace', text: 'room at peace ☮',
            disabled: allDone ? null : 'disabled',
            title: allDone ? 'Catch this room for the dream' : 'finish the little tasks first ✦',
            onclick: () => catchRoomPeace(dream, m, roomBtn),
          }),
      h('button', { class: 'btn btn-secondary', text: 'open in dream ✦', onclick: () => openStepModal(dream.id, m.id) }),
      r.key === 'kitchen' ? h('button', {
        class: 'btn btn-secondary', text: 'open the fridge →',
        onclick: () => {
          fridgeFrom = 'apartment';
          $('#fridge-back').textContent = '← Back to the apartment';
          showFridge();
        },
      }) : null,
    ),
  );
  panel.classList.add('open');
  section.classList.add('panel-open');
}

function showApartment() {
  $('#main-view').hidden = true;
  $('#gallery-view').hidden = true;
  $('#fridge-view').hidden = true;
  $('#fridge-dock').hidden = false;
  $('#apartment-view').hidden = false;
  $('#apartment-dock').hidden = true;
  renderApartment();
  window.scrollTo({ top: 0 });
}

function hideApartment() {
  closeRoomPanel();
  $('#apartment-view').hidden = true;
  $('#apartment-dock').hidden = false;
  $('#main-view').hidden = false;
}

function wireApartment() {
  const roof = $('#house-roof');
  if (!roof) return;
  roof.innerHTML = houseRoof();
  $('#garage-roof').innerHTML = garageRoof();
  $('#house-base').innerHTML = houseBase();
  $$('.dollhouse .room').forEach(btn => {
    const key = btn.dataset.room;
    const meta = APARTMENT_ROOM_META.find(x => x.key === key);
    btn.querySelector('.room-scene').innerHTML = ROOM_ART[key]();
    btn.setAttribute('aria-label', `${meta.step} — press Enter to open its tidy list`);
    btn.append(
      h('span', { class: 'room-label' },
        h('span', { class: 'room-name', text: meta.label }),
        h('span', { class: 'room-count' }),
        h('span', { class: 'room-peace-badge', text: '☮', hidden: 'hidden' }),
      ),
      h('span', { class: 'room-boxes', 'aria-hidden': 'true', html: boxStack(), hidden: 'hidden' }),
    );
    btn.addEventListener('click', () => openRoomPanel(key));
  });
  $('#apartment-dock')?.addEventListener('click', showApartment);
  $('#apartment-back')?.addEventListener('click', hideApartment);
  $('#home-progress')?.addEventListener('click', () => openDreamModal(ensureApartment().id));
  // clicking the sky around the house closes the panel
  $('#apartment-view')?.addEventListener('click', e => {
    if (e.target.closest('.room') || e.target.closest('#room-panel') ||
        e.target.closest('.gallery-head') || e.target.closest('#home-progress')) return;
    closeRoomPanel();
  });
}

/* ---------- gallery ---------- */

function showGallery() {
  closeRoomPanel();
  $('#main-view').hidden = true;
  $('#fridge-view').hidden = true;
  $('#fridge-dock').hidden = false;
  $('#apartment-view').hidden = true;
  $('#apartment-dock').hidden = false;
  $('#gallery-view').hidden = false;
  renderGallery();
  window.scrollTo({ top: 0 });
}

function hideGallery() {
  $('#gallery-view').hidden = true;
  $('#main-view').hidden = false;
}

function renderGallery() {
  const shelf = $('#gallery-shelf');
  const achieved = state.dreams
    .filter(d => d.status === 'achieved' && d.horizon !== 'short')
    .sort((a, b) => new Date(b.achievedAt || 0) - new Date(a.achievedAt || 0));

  const empty = $('#gallery-empty');
  empty.hidden = achieved.length > 0;
  if (!achieved.length) {
    // the jar fills with every little catch — explain why it can glow while this shelf waits
    const quick = state.jar.filter(e => e.kind === 'quick').length;
    const ms = state.jar.filter(e => e.kind === 'milestone').length;
    const bits = [
      quick ? `${quick} little task${quick === 1 ? '' : 's'}` : null,
      ms ? `${ms} dream step${ms === 1 ? '' : 's'}` : null,
    ].filter(Boolean).join(' and ');
    empty.querySelector('p').textContent = bits
      ? `No whole dreams caught yet — but your jar is glowing with ${bits}. Achieve a dream and it lands here as a big orb. ✦`
      : 'No dreams caught yet — but the sky is full of them. ✦';
  }
  shelf.replaceChildren(
    ...achieved.map(d => {
      const c = dreamColor(state, d);
      const orbBtn = h('button', { class: 'gallery-orb', onclick: () => openStoryModal(d.id) },
        h('div', {
          class: 'orb-visual',
          style: `background: radial-gradient(circle at 32% 28%, rgba(255,255,255,.98), ${pastelize(c, 0.45)} 40%, ${c} 78%, #8E97E8)`,
        }),
        h('span', { class: 'orb-title', text: d.title }),
        h('span', { class: 'orb-date', text: d.achievedAt ? `caught ${d.achievedAt.slice(0, 10)}` : '' }),
      );
      return orbBtn;
    }),
  );
}

function openStoryModal(id) {
  const d = findDream(id);
  if (!d) return;
  const cat = categoryOf(state, d);
  openModal(h('div', {},
    h('h2', { text: d.title }),
    h('p', { style: 'font-size:13px;font-weight:700;color:var(--periwinkle)' },
      document.createTextNode(
        `${scopeGlyph(d.scope)} ${d.scope[0].toUpperCase() + d.scope.slice(1)}${cat ? ' · ' + cat.name : ''}` +
        `${d.achievedAt ? ' · caught ' + d.achievedAt.slice(0, 10) : ''}`)),
    d.why ? h('p', { style: 'font-style:italic', text: d.why }) : null,
    d.milestones.length ? h('div', {},
      h('h3', { text: 'The journey' }),
      h('ul', { class: 'ms-list' },
        ...d.milestones.map(m => h('li', { class: 'ms-item' + (m.done ? ' done' : '') },
          h('span', { class: 'ms-check', style: m.done ? 'background:var(--pink);border-color:var(--pink)' : '', text: m.done ? '✓' : '' }),
          h('span', { class: 'ms-text', text: m.text }))))) : null,
    d.updates.length ? h('div', {},
      h('h3', { text: 'Updates' }),
      h('ul', { class: 'updates-list' },
        ...d.updates.map(u => h('li', {},
          h('span', { class: 'u-date', text: u.date }),
          document.createTextNode(u.text))))) : null,
    h('div', { class: 'modal-actions' },
      h('button', {
        class: 'btn btn-secondary', text: 'Return it to the sky',
        onclick: () => { d.status = 'active'; d.horizon = d.horizon || 'mid'; d.achievedAt = null; touch(d); persist(); closeModal(); renderAll(); renderGallery(); },
      }),
    ),
  ));
}

/* ---------- rollover (§5) ---------- */

function checkRollover() {
  const s = state.settings;
  const today = todayISO();
  const wk = weekKey();
  const pending = [];

  // tasks deliberately scheduled for today or later were already decided — don't re-ask
  const undecided = d => !d.scheduledFor || d.scheduledFor < today;
  if (s.lastOpenDate !== today) {
    state.dreams
      .filter(d => d.status === 'active' && d.horizon === 'short' && d.cadence === 'today' && undecided(d))
      .forEach(d => pending.push({ dream: d, kind: 'today' }));
    s.lastOpenDate = today;
  }
  if (s.lastOpenWeek !== wk) {
    state.dreams
      .filter(d => d.status === 'active' && d.horizon === 'short' && d.cadence === 'this-week' && undecided(d))
      .forEach(d => pending.push({ dream: d, kind: 'week' }));
    s.lastOpenWeek = wk;
  }
  persist();
  if (pending.length) openRolloverModal(pending);
}

function openRolloverModal(items) {
  const listArea = h('div');
  const remaining = new Set(items.map(i => i.dream.id));
  const handlers = new Map();

  const finishIfEmpty = () => {
    if (!remaining.size) { closeModal(); renderAll(); }
  };

  const rowFor = ({ dream, kind }) => {
    const settle = fn => {
      fn();
      touch(dream); persist(); renderAll();
      remaining.delete(dream.id); row.remove(); finishIfEmpty();
    };
    const row = h('div', {
      class: 'rollover-item', draggable: 'true',
      ondragstart: e => e.dataTransfer.setData('text/plain', dream.id),
    },
      h('span', { class: 'r-title', text: dream.title }),
      h('button', {
        class: 'btn btn-secondary', text: kind === 'today' ? 'Keep today' : 'Keep this week',
        onclick: () => settle(() => {}),
      }),
      h('button', {
        class: 'btn btn-secondary', text: '→ tomorrow',
        onclick: () => settle(() => { dream.scheduledFor = tomorrowISO(); }),
      }),
      kind === 'today' ? h('button', {
        class: 'btn btn-secondary', text: 'This week instead',
        onclick: () => settle(() => { dream.cadence = 'this-week'; }),
      }) : null,
      h('button', {
        class: 'btn btn-danger', text: 'Let it drift away',
        onclick: () => settle(() => { dream.status = 'archived'; }),
      }),
    );
    handlers.set(dream.id, {
      done: () => { remaining.delete(dream.id); row.remove(); completeQuickGoal(dream.id, null); finishIfEmpty(); },
      future: v => settle(() => { dream.scheduledFor = v; }),
      trash: () => settle(() => { dream.status = 'archived'; }),
    });
    return row;
  };

  listArea.replaceChildren(...items.map(rowFor));

  openModal(h('div', {},
    h('h2', { text: 'Still chasing these? ☁️' }),
    h('p', { style: 'font-size:13.5px;opacity:.75', text: 'No pressure — dreams keep. Choose for each, or drag a task onto a zone below.' }),
    dropZones(handlers),
    listArea,
    h('div', { class: 'modal-actions' },
      h('button', { class: 'btn btn-secondary', text: 'Keep them all', onclick: () => { items.forEach(i => touch(i.dream)); persist(); closeModal(); renderAll(); } }),
    ),
  ), { slim: true });
}

/* ---------- toast ---------- */

function toast(message, { linkText, onLink, duration = 5200 } = {}) {
  const t = h('div', { class: 'toast' },
    document.createTextNode(message + ' '),
    linkText ? h('a', { href: '#', text: linkText, onclick: e => { e.preventDefault(); onLink?.(); } }) : null,
  );
  $('#toast-root').appendChild(t);
  setTimeout(() => {
    t.classList.add('leaving');
    setTimeout(() => t.remove(), 450);
  }, duration);
}

/* ============================ WIRING ============================ */

function wireHeader() {
  $$('#scope-filter .chip').forEach(c =>
    c.addEventListener('click', () => {
      state.settings.filterScope = c.dataset.scope;
      persist(); sounds.tick(); renderAll();
    }));

  $$('#horizon-filter .chip').forEach(c =>
    c.addEventListener('click', () => {
      const hz = c.dataset.horizon;
      state.settings.filterHorizon = hz;
      persist(); sounds.tick(); renderAll();
      const target = hz === 'someday' ? '#horizon' : hz === 'short' ? '#tray' : hz === 'all' ? null : '#sky-field';
      if (target) $(target)?.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
    }));

  $('#sort-toggle').addEventListener('click', () => {
    state.settings.sort = state.settings.sort === 'momentum' ? 'manual' : 'momentum';
    persist(); sounds.tick(); renderAll();
  });

  $('#add-dream').addEventListener('click', openNewDreamModal);
  $('#gallery-link').addEventListener('click', e => { e.preventDefault(); showGallery(); });
  $('#gallery-back').addEventListener('click', hideGallery);
  $('#jar-button').addEventListener('click', showGallery);

  $('#mute-toggle').addEventListener('click', () => {
    state.settings.muted = !state.settings.muted;
    persist(); renderMute();
    if (!state.settings.muted) sounds.tick();
  });

  // settings menu
  const menu = $('#settings-menu');
  $('#settings-button').addEventListener('click', e => {
    e.stopPropagation();
    menu.hidden = !menu.hidden;
  });
  document.addEventListener('click', e => {
    if (!menu.hidden && !menu.contains(e.target)) menu.hidden = true;
  });
  $('#menu-categories').addEventListener('click', () => { menu.hidden = true; openCategoriesModal(); });
  $('#menu-sync').addEventListener('click', () => { menu.hidden = true; openSyncModal(); });
  $('#menu-archived').addEventListener('click', () => { menu.hidden = true; openArchivedModal(); });
  $('#menu-export').addEventListener('click', () => { menu.hidden = true; exportState(state); toast('Backup downloaded — keep it somewhere cozy. ✦'); });
  $('#menu-import').addEventListener('click', () => { menu.hidden = true; $('#import-file').click(); });
  $('#import-file').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      state = parseImport(text);
      setMuteSource(() => state.settings.muted);
      persist();
      floatCache.clear();
      renderAll();
      toast('Dreams restored ✦ Welcome back.');
    } catch {
      toast('That file doesn’t look like a Dreamcast backup.');
    }
    e.target.value = '';
  });
}

/* quick-add inherits whichever scope/category tab is active — make a task on the
   Professional tab and it's professional; on the Finances view, it's Finances */
function renderQuickAddSelects() {
  $$('.quick-add .qa-cat').forEach(sel => {
    const prev = sel.value;
    setChildren(sel, ...state.categories.map(c => h('option', { value: c.id, text: c.name })));
    const preferred = state.settings.filterCategory || prev || state.settings.lastUsedCategory;
    if (preferred && state.categories.some(c => c.id === preferred)) sel.value = preferred;
  });
  $$('.quick-add .qa-scope').forEach(sel => {
    const prev = sel.value;
    setChildren(sel, ...SCOPE_OPTIONS.map(([v, label]) => h('option', { value: v, text: label })));
    // follow the active P tab; otherwise keep whatever was picked
    sel.value = state.settings.filterScope !== 'all' ? state.settings.filterScope : (prev || 'personal');
  });
}

function wireQuickAdd() {
  $$('.quick-add').forEach(form => {
    const input = form.querySelector('input[type=text]');
    const dateInput = form.querySelector('.qa-date');
    const catSel = form.querySelector('.qa-cat');
    const scopeSel = form.querySelector('.qa-scope');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const title = input.value.trim();
      if (!title) return;
      const scope = scopeSel?.value
        || (state.settings.filterScope !== 'all' ? state.settings.filterScope : 'personal');
      state.dreams.unshift(makeDream({
        title,
        horizon: 'short',
        cadence: form.dataset.cadence,
        scope,
        category: catSel?.value || state.settings.lastUsedCategory || state.categories[0]?.id,
        scheduledFor: dateInput?.value || null,
        status: 'active',
      }));
      if (catSel?.value) state.settings.lastUsedCategory = catSel.value;
      persist(); renderAll(); sounds.tick();
      input.value = '';
      if (dateInput) dateInput.value = '';
      input.focus();
    });
  });
}

/* hover-cast (§8.1) — delegated, debounced, retarget-friendly */
function wireHoverCast() {
  if (REDUCED) return;
  let hoverTimer = null;
  let currentCard = null;

  document.addEventListener('pointerover', e => {
    const card = e.target.closest?.('.dream-card');
    if (card && card !== currentCard) {
      currentCard = card;
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => {
        if (currentCard === card && card.isConnected) {
          perkUp();
          castToCard(card);
        }
      }, 150);
    }
  });

  document.addEventListener('pointerout', e => {
    const card = e.target.closest?.('.dream-card');
    if (card && card === currentCard) {
      const to = e.relatedTarget?.closest?.('.dream-card');
      if (to && to !== card) return; // pointerover will retarget
      currentCard = null;
      clearTimeout(hoverTimer);
      reelIn();
    }
  });
}

/* ============================ INIT ============================ */

function init() {
  wireHeader();
  wireQuickAdd();
  wireHoverCast();
  wireFridge();
  wireApartment();
  $('#tasks-log')?.addEventListener('click', openTasksModal);
  $('#peony-button')?.addEventListener('click', openTasksModal);
  initAudioOnGesture();
  renderAll();
  startIdleLife();
  startAmbientSky();
  checkRollover();

  // watch for midnight / Monday while the tab stays open
  setInterval(() => {
    if (state.settings.lastOpenDate !== todayISO() || state.settings.lastOpenWeek !== weekKey()) {
      checkRollover();
      renderAll();
    }
  }, 60000);

  // another tab saved — merge its changes in (freshest edit per dream wins)
  window.addEventListener('storage', e => {
    if (e.key !== STORAGE_KEY || !e.newValue) return;
    try { mergeDisk(JSON.parse(e.newValue)); } catch { /* ignore malformed writes */ }
    lastSync = Date.now();
    renderAll();
  });

  // cloud sync: pull on load and whenever the tab comes back into view
  if (syncEnabled()) {
    let syncAnnounced = false;
    const onSignedIn = user => {
      if (!user) return;
      pullAndMerge().then(() => schedulePush());
      if (!syncAnnounced) {
        syncAnnounced = true;
        toast(`Synced ✦ signed in as ${user.email}`);
      }
    };
    currentUser().then(u => { if (u) onSignedIn(u); else syncStatus = 'signed-out'; });
    // catches the moment an emailed sign-in link finishes (avoids racing page load)
    onAuth((event, session) => { if (event === 'SIGNED_IN') onSignedIn(session?.user); });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        currentUser().then(u => { if (u) pullAndMerge(); });
      }
    });
  }
}

init();
