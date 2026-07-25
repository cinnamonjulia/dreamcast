/* ============================================================
   DREAMCAST — data model, persistence, seed content
   ============================================================ */

export const STORAGE_KEY = 'dreamcast.v1';
/* cool-toned only — anchors + darks of the four Twilight Pop families */
export const PALETTE = ['#E556EC', '#EF96F3', '#C265F8', '#D9A0FB', '#318EA3', '#7FB9C6', '#96D9F6', '#52C3F4'];

export const uuid = () =>
  crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9);

export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** ISO week key like "2026-W30" (weeks start Monday). */
export function weekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/* ---------- color helpers ---------- */

export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** Blend a color toward white — keeps any custom pick dreamy & readable. */
export function pastelize(hex, amount = 0.65) {
  try {
    const { r, g, b } = hexToRgb(hex);
    const mix = c => Math.round(c + (255 - c) * amount);
    return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
  } catch { return '#FBD3E9'; }
}

/** Darken a color enough to be AA-readable on a pastel tint.
    Lower `target` = deeper: ~.38 ≈ accent (white text fits), ~.26 ≈ deep small-text. */
export function readableAccent(hex, target = 0.62) {
  try {
    const { r, g, b } = hexToRgb(hex);
    const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    if (lum < target) return hex;
    const mul = target / lum;
    const dark = c => Math.round(c * mul);
    return `rgb(${dark(r)}, ${dark(g)}, ${dark(b)})`;
  } catch { return '#8E97E8'; }
}

/* ---------- model factories ---------- */

export function makeDream(partial = {}) {
  const now = new Date().toISOString();
  return {
    id: uuid(),
    title: '',
    why: '',
    horizon: 'mid',           // 'short' | 'mid' | 'long' | null (someday)
    cadence: null,            // 'today' | 'this-week' — short horizon only
    scope: 'personal',
    category: null,
    color: null,              // null → category default
    milestones: [],           // [{ id, text, done, doneAt, subtasks: [{ id, text, done, doneAt, scheduledFor }] }]
    links: [],                // [{ id, title, url }] — resources nested in the card
    importance: null,         // 'high' | null | 'low' — short-goal priority star
    dueTime: null,            // 'HH:MM' — optional time-bound deadline for short goals
    scheduledFor: null,       // 'YYYY-MM-DD' — short goals can be scheduled ahead
    groceries: [],            // grocery list — completing the goal stocks the fridge
    recipeLink: null,         // recipe URL — completing the goal adds a dish to the fridge
    dishName: null,           // what the cooked dish is called in the fridge
    servings: null,           // how many servings the dish makes
    manualPercent: null,      // used only when no milestones
    targetDate: null,
    pinned: false,
    status: 'active',         // 'active' | 'someday' | 'achieved' | 'archived'
    notes: '',
    updates: [],
    linkedDreamId: null,      // quick goals may feed a bigger dream
    createdAt: now,
    achievedAt: null,
    lastTouchedAt: now,
    ...partial,
  };
}

export function makeCategory(name, color, id = null) {
  return { id: id || uuid(), name, color, icon: null };
}

/* Julia's category set — Twilight Pop Pastel, every color inside the four
   scope families (orchid · ocean teal · violet · sky), anchors on the flagships */
const CATEGORY_SET = [
  ['cat-career', 'Work', '#318EA3'],       // professional anchor (ocean teal)
  ['cat-travel', 'Travel', '#52C3F4'],     // vivid sky
  ['cat-health', 'Health', '#EF96F3'],     // orchid
  ['cat-home', 'Home', '#96D9F6'],         // peace anchor (sky)
  ['cat-creative', 'Creative', '#C265F8'], // passion anchor (violet)
  ['cat-love', 'Love', '#E556EC'],         // personal anchor (orchid pop)
  ['cat-friendship', 'Friendship', '#7FB9C6'], // soft teal
  ['cat-money', 'Finances', '#B1D4DC'],    // pale teal
  ['cat-learning', 'Growth', '#D9A0FB'],   // soft violet
];

function seedCategories() {
  return CATEGORY_SET.map(([id, name, color]) => makeCategory(name, color, id));
}

/* The Apartment: six rooms, each backed by a step of one ☮ dream */
export const APARTMENT_ROOM_KEYS = ['kitchen', 'mudroom', 'foyer', 'bedroom', 'office', 'living-room', 'garage'];

function defaultApartment() {
  return { dreamId: null, rooms: APARTMENT_ROOM_KEYS.map(key => ({ key, stepId: null })) };
}

function seedDreams() {
  const iso = new Date().toISOString();
  return [
    makeDream({
      title: 'Sample: Drink a big glass of water',
      horizon: 'short', cadence: 'today', status: 'active',
      category: 'cat-health', scope: 'personal',
    }),
    makeDream({
      title: 'Sample: Send that one email',
      horizon: 'short', cadence: 'this-week', status: 'active',
      category: 'cat-career', scope: 'professional',
    }),
    makeDream({
      title: 'Sample: Learn to surf',
      why: 'Salt water, sunshine, and finally standing up on a wave.',
      horizon: 'mid', status: 'active',
      category: 'cat-learning', scope: 'personal',
      milestones: [
        { id: uuid(), text: 'Book a first lesson', done: true, doneAt: iso },
        { id: uuid(), text: 'Pop up on the foam board', done: false, doneAt: null },
        { id: uuid(), text: 'Catch an unbroken wave', done: false, doneAt: null },
      ],
    }),
    makeDream({
      title: 'Sample: Launch my dream project',
      why: 'The idea that keeps me up at night deserves daylight.',
      horizon: 'mid', status: 'active',
      category: 'cat-career', scope: 'professional', pinned: true,
      links: [{ id: uuid(), title: 'Inspiration board', url: 'https://example.com' }],
      milestones: [
        { id: uuid(), text: 'Sketch the one-page plan', done: true, doneAt: iso },
        { id: uuid(), text: 'Build a tiny prototype', done: false, doneAt: null },
        { id: uuid(), text: 'Show it to three people', done: false, doneAt: null },
      ],
    }),
    makeDream({
      title: 'Sample: Write a novel',
      why: 'A story only I can tell, one page at a time.',
      horizon: 'long', status: 'active',
      category: 'cat-creative', scope: 'personal',
      milestones: [
        { id: uuid(), text: 'Outline the first act', done: false, doneAt: null },
        { id: uuid(), text: 'Write chapter one', done: false, doneAt: null },
      ],
    }),
    makeDream({
      title: 'Sample: Visit all 7 continents',
      why: 'To see every corner of the sky.',
      horizon: null, status: 'someday',
      category: 'cat-travel', scope: 'personal',
    }),
    makeDream({
      title: 'Sample: See the northern lights',
      why: 'Stand under a sky that dances.',
      horizon: null, status: 'someday',
      category: 'cat-travel', scope: 'personal',
    }),
  ];
}

export function defaultState() {
  return {
    version: 1,
    dreams: seedDreams(),
    categories: seedCategories(),
    jar: [],
    fridge: { items: [], staples: [] },
    apartment: defaultApartment(),
    settings: {
      muted: false,
      sort: 'momentum',
      filterCategory: null,
      filterScope: 'all',
      filterHorizon: 'all',
      lastOpenDate: todayISO(),
      lastOpenWeek: weekKey(),
      sparkleBoostDate: null,
      lastUsedCategory: 'cat-health',
    },
    weeklyActivity: [],
  };
}

/* ---------- persistence ---------- */

/** Migration hook for future schema versions. */
function migrate(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (!raw.version) raw.version = 1;
  // v1 in-place upgrades for fields added after first release
  if (Array.isArray(raw.dreams)) {
    raw.dreams.forEach(d => {
      if (!Array.isArray(d.links)) d.links = [];
      if (d.importance === undefined) d.importance = null;
      if (d.dueTime === undefined) d.dueTime = null;
      if (!Array.isArray(d.groceries)) d.groceries = [];
      if (d.recipeLink === undefined) d.recipeLink = null;
      if (d.scheduledFor === undefined) d.scheduledFor = null;
      if (d.dishName === undefined) d.dishName = null;
      if (d.servings === undefined) d.servings = null;
      if (d.scope === 'haven') d.scope = 'peace';
      (d.milestones || []).forEach(m => {
        if (!Array.isArray(m.subtasks)) m.subtasks = [];
        if (!Array.isArray(m.links)) m.links = [];
        if (m.dueDate === undefined) m.dueDate = null;
        m.subtasks.forEach(st => { if (st.category === undefined) st.category = null; });
      });
    });
  }
  if (!raw.fridge || !Array.isArray(raw.fridge.items)) raw.fridge = { items: [] };
  if (!Array.isArray(raw.fridge.staples)) raw.fridge.staples = [];
  // v1 in-place: the apartment (rooms heal if a save predates a room)
  if (!raw.apartment || !Array.isArray(raw.apartment.rooms)) {
    raw.apartment = defaultApartment();
  } else {
    if (raw.apartment.dreamId === undefined) raw.apartment.dreamId = null;
    const have = new Set(raw.apartment.rooms.map(r => r && r.key));
    APARTMENT_ROOM_KEYS.forEach(key => { if (!have.has(key)) raw.apartment.rooms.push({ key, stepId: null }); });
  }
  // one-time upgrade to the pastel category set (renames in place, keeps ids)
  if (!raw.catsV2 && Array.isArray(raw.categories)) {
    const target = new Map(CATEGORY_SET.map(([id, name, color]) => [id, { name, color }]));
    raw.categories.forEach(c => {
      const t = target.get(c.id);
      if (t) { c.name = t.name; c.color = t.color; }
    });
    // drop retired defaults (Family, Play) unless dreams still use them
    const used = new Set((raw.dreams || []).map(d => d.category));
    raw.categories = raw.categories.filter(c =>
      !['cat-family', 'cat-play'].includes(c.id) || used.has(c.id));
    // add any of the new set that are missing (e.g. Friendship)
    const have = new Set(raw.categories.map(c => c.id));
    CATEGORY_SET.forEach(([id, name, color]) => {
      if (!have.has(id)) raw.categories.push({ id, name, color, icon: null });
    });
    raw.catsV2 = true;
  }
  // one-time recolor to the Twilight Pop Pastel palette (keeps ids & names,
  // custom categories untouched)
  if (!raw.catsV3 && Array.isArray(raw.categories)) {
    const colors = new Map(CATEGORY_SET.map(([id, , color]) => [id, color]));
    raw.categories.forEach(c => { const color = colors.get(c.id); if (color) c.color = color; });
    raw.catsV3 = true;
  }
  // future: if (raw.version === 1) { ...upgrade...; raw.version = 2; }
  return raw;
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = migrate(JSON.parse(raw));
    if (!parsed || !Array.isArray(parsed.dreams)) return defaultState();
    // Fill any settings added since the save was written
    const def = defaultState();
    parsed.settings = { ...def.settings, ...(parsed.settings || {}) };
    parsed.categories = parsed.categories?.length ? parsed.categories : def.categories;
    parsed.jar = parsed.jar || [];
    parsed.weeklyActivity = parsed.weeklyActivity || [];
    return parsed;
  } catch (e) {
    console.warn('Dreamcast: could not load saved state, starting fresh.', e);
    return defaultState();
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/* ---------- export / import ---------- */

export function exportState(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `dreamcast-backup-${todayISO()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

export function parseImport(text) {
  const parsed = migrate(JSON.parse(text));
  if (!parsed || !Array.isArray(parsed.dreams) || !Array.isArray(parsed.categories)) {
    throw new Error('Not a Dreamcast backup file');
  }
  const def = defaultState();
  parsed.settings = { ...def.settings, ...(parsed.settings || {}) };
  parsed.jar = parsed.jar || [];
  parsed.weeklyActivity = parsed.weeklyActivity || [];
  return parsed;
}

/* ---------- derived helpers ---------- */

export function dreamProgress(dream) {
  if (dream.milestones.length) {
    const done = dream.milestones.filter(m => m.done).length;
    return Math.round((done / dream.milestones.length) * 100);
  }
  return dream.manualPercent ?? 0;
}

export function nextMilestone(dream) {
  return dream.milestones.find(m => !m.done) || null;
}

export function dreamColor(state, dream) {
  if (dream.color) return dream.color;
  const cat = state.categories.find(c => c.id === dream.category);
  return cat ? cat.color : '#C3A6F1';
}

export function categoryOf(state, dream) {
  return state.categories.find(c => c.id === dream.category) || null;
}

export function daysAgo(isoDate) {
  const days = Math.floor((Date.now() - new Date(isoDate).getTime()) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return '1d ago';
  return `${days}d ago`;
}

/** Count of this week's actions → sparkle level 0–3. */
export function sparkleLevel(state) {
  if (state.settings.sparkleBoostDate === todayISO()) return 3;
  const wk = weekKey();
  const entry = state.weeklyActivity.find(w => w.weekKey === wk);
  const n = entry ? entry.count : 0;
  if (n >= 6) return 3;
  if (n >= 3) return 2;
  if (n >= 1) return 1;
  return 0;
}

export function bumpActivity(state) {
  const wk = weekKey();
  const entry = state.weeklyActivity.find(w => w.weekKey === wk);
  if (entry) entry.count += 1;
  else state.weeklyActivity.push({ weekKey: wk, count: 1 });
}
