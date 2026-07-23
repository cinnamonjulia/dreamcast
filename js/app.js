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
  REDUCED, setMuteSource, initAudioOnGesture, sounds,
  startIdleLife, startAmbientSky, perkUp, happyBounce,
  castToCard, reelIn, milestoneCatch, miniCatch,
  achievedCelebration, newDreamCast, sparkleTrail, confettiBurst,
  randomizeFloat,
} from './animations.js';

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

function persist() { saveState(state); }

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
  renderJar();
  renderMute();
  updateSparkle();
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
        class: 'chip' + (s.filterCategory === cat.id ? ' active' : ''),
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
        text: `${d.title} ${d.scope === 'personal' ? '✿' : '✦'}`,
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
  return state.dreams
    .filter(d => d.status === 'active' && d.horizon === 'short' && d.cadence === cadence && matchesScopeCat(d))
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

function renderTray() {
  const today = todayISO();
  const wk = weekKey();

  for (const [cadence, listId, countId] of [
    ['today', '#tray-today', '#caught-today'],
    ['this-week', '#tray-week', '#caught-week'],
  ]) {
    const goals = shortGoals(cadence);
    const list = $(listId);
    setChildren(list,
      ...goals.map(d => renderTrayPill(d)),
      goals.length ? null :
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
    d.linkedDreamId ? h('span', { class: 'pill-link-glyph', title: 'Feeds a bigger dream', text: '☁️' }) : null,
    h('span', { class: 'scope-glyph', text: d.scope === 'personal' ? '✿' : '✦' }),
  );
  return pill;
}

function completeQuickGoal(id, pillEl) {
  const d = findDream(id);
  if (!d) return;
  d.status = 'achieved';
  d.achievedAt = new Date().toISOString();
  touch(d);
  state.jar.push({ date: new Date().toISOString(), dreamId: d.id, kind: 'quick' });
  bumpActivity(state);

  if (d.linkedDreamId) {
    const big = findDream(d.linkedDreamId);
    if (big) {
      big.updates.unshift({ date: todayISO(), text: `Caught a quick goal: ${d.title}` });
      touch(big);
    }
  }
  persist();

  pillEl?.classList.add('completing');
  miniCatch(pillEl).then(() => { renderAll(); });
  // update counters and jar promptly even while the orb flies
  setTimeout(renderAll, 450);
}

/* ---------- sky (mid/long cards) ---------- */

function skyDreams() {
  let list = state.dreams.filter(d =>
    d.status === 'active' && (d.horizon === 'mid' || d.horizon === 'long'));
  if (state.settings.sort === 'momentum') {
    list = [...list].sort((a, b) => new Date(b.lastTouchedAt) - new Date(a.lastTouchedAt));
  }
  return [...list.filter(d => d.pinned), ...list.filter(d => !d.pinned)];
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

/* 7 cartoon cloud silhouettes: puffy cumulus for personal, flat stratus for work */
function cloudTypeOf(d) {
  const hash = [...d.id].reduce((a, ch) => a + ch.charCodeAt(0), 0);
  return d.scope === 'professional'
    ? `cloud-stratus-${(hash % 3) + 1}`
    : `cloud-cumulus-${(hash % 4) + 1}`;
}

function linkHost(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}

function renderCard(d) {
  const color = dreamColor(state, d);
  const cat = categoryOf(state, d);
  const pct = dreamProgress(d);
  const next = nextMilestone(d);

  const card = h('article', {
    class: 'dream-card ' + cloudTypeOf(d) + (d.pinned ? ' pinned-card' : ''),
    'data-id': d.id,
    tabindex: '0',
    role: 'button',
    'aria-label': `Dream: ${d.title}, ${pct}% complete. Press Enter to open.`,
    onclick: () => openDreamModal(d.id),
    onkeydown: e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDreamModal(d.id); }
    },
  },
    h('div', { class: 'cloud-bumps', 'aria-hidden': 'true' }, h('span'), h('span'), h('span'), h('span'), h('span')),
    h('button', {
      class: 'pin-star' + (d.pinned ? ' pinned' : ''),
      'aria-label': d.pinned ? 'Unpin dream' : 'Pin dream',
      html: `<svg width="17" height="17" viewBox="0 0 20 20"><path d="M10 1 L12.2 7.6 L19 10 L12.2 12.4 L10 19 L7.8 12.4 L1 10 L7.8 7.6 Z" fill="${d.pinned ? '#FFD98E' : 'none'}" stroke="#B8854E" stroke-width="1.4"/></svg>`,
      onclick: e => { e.stopPropagation(); d.pinned = !d.pinned; touch(d); persist(); sounds.tick(); renderAll(); },
    }),
    h('div', { class: 'card-top' },
      h('span', { class: 'cat-ribbon', style: `background:${cat?.color || color}`, title: cat?.name || '' }),
      h('h3', { class: 'card-title', text: d.title }),
      h('span', { class: 'scope-glyph', title: d.scope, text: d.scope === 'personal' ? '✿' : '✦' }),
      h('span', { class: 'horizon-tag', text: d.horizon === 'mid' ? 'Mid' : 'Long' }),
    ),
    d.why ? h('p', { class: 'card-why', text: d.why }) : null,
    h('div', { class: 'progress-row' },
      h('div', { class: 'progress-track' },
        h('div', { class: 'progress-fill', style: `width:${pct}%;background:${color}` }),
      ),
      h('span', { class: 'progress-pct', style: `color:${readableAccent(color)}`, text: pct + '%' }),
    ),
    h('div', { class: 'card-next' },
      next
        ? [h('span', { class: 'next-label', text: 'Next: ' }), document.createTextNode(next.text)]
        : h('span', { style: 'opacity:.55', text: d.milestones.length ? 'All milestones caught ✦' : 'No milestones yet — add one?' }),
    ),
    d.links.length ? h('div', { class: 'card-links' },
      ...d.links.slice(0, 3).map(l =>
        h('a', {
          class: 'card-link-chip',
          href: l.url, target: '_blank', rel: 'noopener noreferrer',
          title: l.url,
          onclick: e => e.stopPropagation(),
        }, document.createTextNode((l.title || linkHost(l.url)) + ' ↗'))),
      d.links.length > 3 ? h('span', { class: 'card-link-more', text: `+${d.links.length - 3}` }) : null,
    ) : null,
    h('div', { class: 'card-foot' },
      h('span', { text: d.targetDate ? `target ${d.targetDate}` : '' }),
      h('span', { text: `last touched ${daysAgo(d.lastTouchedAt)}` }),
    ),
  );

  card.style.setProperty('--tint', tintOf(color));

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
  $('#jar-button').title = `${dreams} dream${dreams === 1 ? '' : 's'} caught, ${ms} milestone${ms === 1 ? '' : 's'}, ${quick} quick goal${quick === 1 ? '' : 's'}`;
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
  if (e.key === 'Escape') closeModal();
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
    const list = h('ul', { class: 'ms-list' },
      ...d.milestones.map((m, i) =>
        h('li', { class: 'ms-item' + (m.done ? ' done' : '') },
          h('button', {
            class: 'ms-check',
            'aria-label': (m.done ? 'Uncheck: ' : 'Check off: ') + m.text,
            text: m.done ? '✓' : '',
            onclick: () => toggleMilestone(d, m),
          }),
          h('span', { class: 'ms-text', text: m.text }),
          h('div', { class: 'ms-tools' },
            h('button', { text: '↑', 'aria-label': 'Move up', onclick: () => { if (i > 0) { d.milestones.splice(i - 1, 0, d.milestones.splice(i, 1)[0]); touch(d); persist(); renderMs(); renderAll(); } } }),
            h('button', { text: '↓', 'aria-label': 'Move down', onclick: () => { if (i < d.milestones.length - 1) { d.milestones.splice(i + 1, 0, d.milestones.splice(i, 1)[0]); touch(d); persist(); renderMs(); renderAll(); } } }),
            h('button', { text: '✕', 'aria-label': 'Delete milestone', onclick: () => { d.milestones.splice(i, 1); touch(d); persist(); renderMs(); renderAll(); } }),
          ),
        )
      ),
    );

    const addInput = h('input', { type: 'text', placeholder: 'Add a milestone…', maxlength: '160' });
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

    const children = [h('h3', { text: 'Milestones' }), list, addForm];

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
            h('a', { href: l.url, target: '_blank', rel: 'noopener noreferrer', text: l.title || linkHost(l.url) }),
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
        radioPills('m-scope', [['personal', '✿ Personal'], ['professional', '✦ Professional']], d.scope, v => { d.scope = v; touch(d); persist(); renderAll(); }),
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
    confettiBurst([dColor, '#FFD98E', '#FFFFFF', pastelize(dColor, 0.4)]);
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
      document.createTextNode(`${d.scope === 'personal' ? '✿ Personal' : '✦ Professional'}${cat ? ' · ' + cat.name : ''}`)),
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
        radioPills('qg-scope', [['personal', '✿ Personal'], ['professional', '✦ Professional']], d.scope, v => { d.scope = v; touch(d); persist(); renderAll(); }),
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
            radioPills('nd-scope', [['personal', '✿ Personal'], ['professional', '✦ Professional']], draft.scope, v => draft.scope = v),
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
          radioPills('nd-scope', [['personal', '✿ Personal'], ['professional', '✦ Professional']], draft.scope, v => draft.scope = v),
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
            radioPills('nd-scope', [['personal', '✿ Personal'], ['professional', '✦ Professional']], draft.scope, v => draft.scope = v),
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

/* ---------- gallery ---------- */

function showGallery() {
  $('#main-view').hidden = true;
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

  $('#gallery-empty').hidden = achieved.length > 0;
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
        `${d.scope === 'personal' ? '✿ Personal' : '✦ Professional'}${cat ? ' · ' + cat.name : ''}` +
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

  if (s.lastOpenDate !== today) {
    state.dreams
      .filter(d => d.status === 'active' && d.horizon === 'short' && d.cadence === 'today')
      .forEach(d => pending.push({ dream: d, kind: 'today' }));
    s.lastOpenDate = today;
  }
  if (s.lastOpenWeek !== wk) {
    state.dreams
      .filter(d => d.status === 'active' && d.horizon === 'short' && d.cadence === 'this-week')
      .forEach(d => pending.push({ dream: d, kind: 'week' }));
    s.lastOpenWeek = wk;
  }
  persist();
  if (pending.length) openRolloverModal(pending);
}

function openRolloverModal(items) {
  const listArea = h('div');
  const remaining = new Set(items.map(i => i.dream.id));

  const finishIfEmpty = () => {
    if (!remaining.size) { closeModal(); renderAll(); }
  };

  const rowFor = ({ dream, kind }) => {
    const row = h('div', { class: 'rollover-item' },
      h('span', { class: 'r-title', text: dream.title }),
      h('button', {
        class: 'btn btn-secondary', text: kind === 'today' ? 'Keep today' : 'Keep this week',
        onclick: () => { touch(dream); persist(); remaining.delete(dream.id); row.remove(); finishIfEmpty(); },
      }),
      kind === 'today' ? h('button', {
        class: 'btn btn-secondary', text: 'This week instead',
        onclick: () => { dream.cadence = 'this-week'; touch(dream); persist(); remaining.delete(dream.id); row.remove(); finishIfEmpty(); },
      }) : null,
      h('button', {
        class: 'btn btn-danger', text: 'Let it drift away',
        onclick: () => { dream.status = 'archived'; touch(dream); persist(); remaining.delete(dream.id); row.remove(); finishIfEmpty(); },
      }),
    );
    return row;
  };

  listArea.replaceChildren(...items.map(rowFor));

  openModal(h('div', {},
    h('h2', { text: 'Still chasing these? ☁️' }),
    h('p', { style: 'font-size:13.5px;opacity:.75', text: 'No pressure — dreams keep. Where should these go?' }),
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

function wireQuickAdd() {
  $$('.quick-add').forEach(form => {
    const input = form.querySelector('input');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const title = input.value.trim();
      if (!title) return;
      state.dreams.unshift(makeDream({
        title,
        horizon: 'short',
        cadence: form.dataset.cadence,
        scope: 'personal',
        category: state.settings.lastUsedCategory || state.categories[0]?.id,
        status: 'active',
      }));
      persist(); renderAll(); sounds.tick();
      input.value = '';
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

  // another tab saved — adopt its state so we never clobber it with ours
  window.addEventListener('storage', e => {
    if (e.key === STORAGE_KEY && e.newValue) {
      state = loadState();
      renderAll();
    }
  });
}

init();
