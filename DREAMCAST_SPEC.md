# DREAMCAST — Build Spec

A dreamy dashboard for Julia to keep track of her dreams, projects, and momentum — and propel them forward. Everything floats under a real starlit night sky — the actual constellations over San Francisco at 11:11 PM on the current day — and an anime version of Julia fishes dream bubbles out of it.

> **Redesign note (July 2026)**: the background changed from the original daytime cotton-candy sky to the real night sky specified in §3.1 and §6.7. Sections marked **CHANGED** carry the new behavior; anywhere an older section still mentions the daytime sky or the rainbow, the night-sky sections win.

This spec is written for Claude Code to implement. Do not deviate from the visual direction; where implementation details are open, sensible defaults are noted.

---

## 1. Product summary

Dreamcast is a single-page static website (hosted on GitHub Pages) that shows 8–20 "dream" cards — a mix of life dreams, goals, and active projects — plus a lightweight tray of **short-term goals for today and this week**, and a band of **someday dreams** on the horizon (big future dreams not being actively worked on yet, e.g. "meet the love of my life", "have a family", "visit all 7 continents").

Every goal has a **time horizon** (short = daily/weekly, mid, long, or someday), a **scope** (personal or professional), a **customizable category**, and a **customizable color**. The dashboard's job is twofold:

1. **Remember**: Julia can glance at the sky and instantly see everything she's juggling — today's goals, active dreams, and the dreams waiting on the horizon — click into any of them, and recall where it stands.
2. **Propel**: progress is updated on-site (check off today's goals, check milestones, log updates), and every bit of progress is celebrated — caught dream orbs collect in a jar, the sky gets more sparkly, and momentum sorting floats active dreams to the top.

Vibe words: modern, dreamy, whimsical, floating on a cloud. Pinks, purples, blues. Anime/Gaia Online-inspired art (clean, cute, 2000s-anime-avatar energy — NOT chibi-blob corporate mascot style).

---

## 2. Tech stack & hosting

- **Static site, no build step required to view.** Prefer plain HTML + CSS + vanilla JS (ES modules). If a framework is used, it must compile to static assets deployable on GitHub Pages with zero server.
- Suggested repo layout:
  ```
  /index.html
  /css/style.css
  /js/app.js        (state, rendering, persistence)
  /js/animations.js (fishing, orbs, sparkles, sounds)
  /js/nightsky.js   (real-sky math + backdrop constellations + The Sky view)
  /js/data.js       (model, storage, export/import, seed data)
  /assets/          (SVG art: avatar, clouds, orbs, jar)
  ```
  Inline SVG in the HTML/JS is also fine (often better for animating parts of the avatar).
- **Persistence: `localStorage`**, auto-saved on every change, key `dreamcast.v1`.
- **Backup: Export / Import.** An "Export my dreams" button downloads the full state as `dreamcast-backup-YYYY-MM-DD.json`; an Import button restores from such a file. This is the safety net since localStorage is per-browser.
- First load with no saved data: seed with sample content covering every zone — 2 quick goals in the Today tray, 3 active dreams (mix of mid/long, personal/professional), and 2 someday dreams on the Horizon (all clearly labeled, e.g. "Sample: Learn to surf") so the sky is never empty and the interactions are discoverable.
- Target: desktop browser on a Mac (Chrome/Safari), ~1280px+ wide. No mobile requirements — do not compromise the animations for small screens; just don't hard-break below 1024px.
- Include a `README.md` with GitHub Pages deploy steps (Settings → Pages → deploy from `main`).

---

## 3. Visual design system

### 3.1 Sky & palette — "the real night sky" **CHANGED**

A deep, dreamy night sky modeled on a real photo of the SF night: slate blue with moonlit clouds and true constellations. Full-viewport fixed background (`#sky-bg`):

- Gradient (top → bottom): near-black indigo `#12172A` → deep slate `#1C2440` → moonlit blue `#2C3654` → `#454866` → dusty violet `#5A5174` at the horizon.
- **The real starfield** (see §6.7 for the math): every bright star is drawn at its true position for **11:11 PM on the current day, as seen from San Francisco** — the sky is recomputed by `js/nightsky.js` on every page load, so July 26 shows July 26's sky and January 1 shows Orion. Constellation stick figures are drawn in very faint lavender-white (`rgba(216,224,248,.15)`), stars sized and weighted by magnitude, the brightest twinkling on staggered phases. A dim random filler layer (`.stars-small`) sits underneath for sky depth.
- Projection: horizontal panorama facing **south** — east on the left edge, west on the right, north wrapping at both edges (seam-crossing figures are drawn twice so nothing tears).
- Clouds keep rolling exactly as before (same layered blobs, same 60–180s drift loops) but recolored as **moonlit silver-grey** `#B8BFD6` at 20–40% opacity; pink tints become dusty mauve `#BCA9C6`. Stars sit BEHIND the clouds, like a real sky.
- The horizon sun becomes a soft **moon** (warm-white radial glow + wide halo).
- **No rainbow.** The old rainbow arc is deleted; its sparkle-level role is taken by the stars (§7.2).
- Text that sits directly on the sky (empty-state hints) must be light (`#E9ECFA`-ish) with a soft dark text-shadow; card shadows go dark (`rgba(8,12,28,.5)`) so surfaces still lift off the darker backdrop.

Accent palette (cool-winter, per Julia — black, white, pink, blues):

| Token | Hex | Use |
|---|---|---|
| `--ink` | `#2B2440` | Text, outlines (deep indigo-black, never pure black) |
| `--white` | `#FFFFFF` | Cards, clouds |
| `--pink` | `#F77FBE` | Primary accent, progress fills, CTA |
| `--pink-soft` | `#FBD3E9` | Card tint, hovers |
| `--blue` | `#6FA8DC` | Secondary accent, links |
| `--periwinkle` | `#8E97E8` | Buttons, chips |
| `--lilac` | `#C3A6F1` | Progress track, borders |
| `--gold` | `#FFD98E` | Stars, celebration sparkles only |

### 3.2 Cards & surfaces

- Dream cards are **cloud-shaped**: white rounded card with 2–3 soft scalloped bumps on the top edge (SVG mask or layered border-radius), gentle drop shadow tinted lavender (`0 12px 40px rgba(142,151,232,.35)`), slight glassmorphism (`backdrop-filter: blur(8px)`, background `rgba(255,255,255,.82)`).
- Every card idly **bobs**: `translateY` ±6px, 5–8s ease-in-out infinite, randomized phase/duration per card so the sky feels alive, never synchronized.
- Corners everywhere are very round (16–28px). No hard edges anywhere in the UI.

### 3.3 Typography

- Display/headers: a rounded, friendly font — **Baloo 2** or **Quicksand** (Google Fonts).
- Body/UI: **Nunito** or Quicksand regular.
- Title of the app: "Dreamcast" in the display font with a soft pink→periwinkle gradient fill and a tiny star dotting the "i" or trailing the "t".

### 3.4 Art style rules

All character/creature/object art is original inline SVG in a **2000s anime / Gaia Online avatar style**: clean dark-indigo linework, big expressive eyes with white highlights, soft cel-shading (one shade tone + one highlight tone per color area), cute proportions (avatar roughly 1:4 head:body like Gaia avatars — stylized but not extreme chibi). No emoji as art. No stock clipart. No AI-photo textures.

---

## 4. The avatar — anime Julia

A Gaia Online–style anime girl who IS Julia. She sits on a small fluffy cloud, fishing in the sky. Draw her as an inline SVG with separately animatable groups (`#hair`, `#head`, `#arm-rod`, `#rod`, `#line`, `#bobber`, `#cloud-seat`).

**Likeness spec (follow closely):**

- **Hair**: the signature feature — very long, voluminous **dark chocolate-brown curly hair** falling past her shoulders over one side (her left), drawn as layered spiral/ringlet curl shapes with **caramel/honey highlights on the lower curls**. It should move: a gentle 4–6s sway loop, and a happy bounce when she catches something.
- **Skin**: fair with a warm glow; a light dusting of **freckles across the nose and cheeks** (5–7 small dots).
- **Eyes**: large anime eyes, **hazel-green**, big white highlights; thick friendly lashes. Default expression: bright, warm, open-mouth **smile** — she is delighted to be here.
- **Outfit**: **star-pattern pajamas** — deep navy-indigo pajama set scattered with small white and pink 4-point stars, white piping/trim, cozy fit. Fuzzy white slipper-socks. Optional tiny details that fit her: a pink scrunchie on one wrist, a little crescent-moon hair clip.
- **Energy**: whimsical, cozy, playful. She swings her legs off the cloud edge while idle. Occasional idle blinks (every 4–7s) and a happy wiggle now and then.

**The fishing rig**: a whimsical rod — a slightly curved stick with a pink-to-periwinkle gradient, a tiny star charm dangling near the grip; the line is a thin white/gold shimmering thread; the hook is a **small glowing crescent moon** used to snag dream orbs.

**Placement**: she sits on her cloud in the upper-right area of the viewport, floating above/beside the card field, ~180–240px tall, never overlapping modal content. Her cloud bobs on its own phase.

---

## 5. Data model

```js
Dream {
  id: string,            // uuid
  title: string,
  why: string,           // "why it matters" — one or two sentences
  horizon: 'short' | 'mid' | 'long' | null,   // null while status === 'someday'
  cadence: 'today' | 'this-week' | null,      // only for horizon 'short'
  scope: 'personal' | 'professional',
  category: string,      // id from user-customizable category list (see below)
  color: string,         // ANY hex — palette swatches offered first, plus a full custom color picker
  milestones: [ { id, text, done: bool, doneAt: date|null } ],
  targetDate: date|null,
  pinned: bool,
  status: 'active' | 'someday' | 'achieved' | 'archived',
  notes: string,         // freeform quick notes (markdown-lite ok, plain text fine)
  updates: [ { date, text } ],   // dated timeline entries, newest first
  createdAt, achievedAt: date|null,
  lastTouchedAt: date    // bumped on ANY interaction: milestone toggle, note edit, update logged
}

Category {
  id: string,
  name: string,          // user-editable
  color: string,         // default mood color, user-editable
  icon: string|null      // optional tiny SVG glyph key
}

AppState {
  dreams: Dream[],
  categories: Category[],
  jar: [ { date, dreamId, kind: 'quick' | 'milestone' | 'achieved' } ],  // caught orbs
  settings: { muted: bool, sort: 'momentum'|'manual',
              filterCategory: string|null,
              filterScope: 'all'|'personal'|'professional',
              filterHorizon: 'all'|'short'|'mid'|'long'|'someday' },
  weeklyActivity: [ { weekKey, count } ]   // for sparkle level + momentum meter
}
```

**Time horizons** (every goal has one, shown as a small tag on the card):

- **Short** — daily or weekly goals. Created through a lightweight quick-add (just title + category + scope + cadence + optional link to a bigger dream) and shown in the Today & This Week tray (§6.2), not as full cloud cards. Checking one off completes it (mini catch → orb to jar). At local midnight, unfinished "today" goals roll over with a gentle "still chasing this?" prompt (keep / move to this-week / let it drift away); weekly goals roll over on Mondays.
- **Mid** and **Long** — the full cloud cards in the sky, with milestones, notes, and timelines.
- **Someday** — future dreams not being worked on now (status `someday`, horizon null). They live on the Horizon (§6.3) until promoted.

**Scope**: every goal is Personal or Professional, set at creation (default Personal), shown as a tiny glyph on the card — ✿ for personal, ✦ for professional — and filterable from the header.

**Categories are fully customizable**: a small "Categories" settings panel lets Julia add, rename, recolor, and delete categories (deleting prompts to reassign that category's dreams). Seed with the most common goal categories: Career, Creative, Travel, Love & Friends, Family, Health, Home, Money, Learning, Play. Each has a default color from the palette.

**Color is customizable per dream**: the card's mood color starts from its category default, but the expanded card offers the 8 palette swatches PLUS a full custom color picker (`<input type="color">`). Whatever Julia picks is auto-pastelized for surfaces (blend ~35% toward white for tints; use the raw pick for the progress fill and accents) so any color stays dreamy and text stays readable.

**Progress** is derived: `done milestones / total milestones` → percent. If a dream has no milestones, allow a manual percent slider. The card always surfaces the **next unchecked milestone** as "Next: …" so Julia never feels stuck.

---

## 6. Layout

Single page, five zones stacked top to bottom: header → the Horizon (someday band) → Today & This Week tray → the sky (mid/long cloud cards) → recently-touched strip.

### 6.1 Header (floating, translucent)
- Left: "Dreamcast" logo/title.
- Center, two slim filter rows:
  - **Scope toggle** (All / ✿ Personal / ✦ Professional) and **horizon chips** (All / Short / Mid / Long / Someday) — horizon chips scroll the matching zone into view and dim the others.
  - **Category filter chips** (All + each custom category, colored dots) and a sort toggle (Momentum ✦ / Manual).
- Right: **the Bubble Jar** (see §7.1), the mute toggle (🔔 chime icon → crossed when muted, drawn as SVG), a settings menu (Categories editor, Export/Import), and a prominent soft-pink **"＋ Catch a new dream"** button (its form asks horizon first and adapts: short → quick-goal fields; mid/long → full dream; someday → title + why + scope only).

### 6.2 Today & This Week tray — short-term goals
A slim, softly glowing tray pinned under the Horizon band, split into two labeled groups: **Today** and **This Week**.

- Each short-term goal is a small pill-shaped mini-cloud with a round checkbox, title, category dot, and scope glyph — light and fast, no milestones or timelines.
- An inline quick-add input sits at the end of each group ("＋ quick goal…"): type, Enter, done. Defaults: cadence from the group it was added to, scope Personal, category = last used.
- Checking one off = **mini catch**: the pill puffs into a tiny orb, Julia does an abbreviated 1s hook-and-reel, orb drops in the jar, soft chime. The pill fades out (completed items viewable via a small "caught today: N" counter on the tray).
- A quick goal can be **linked to a bigger dream** (optional picker); completing it logs a dated update on that dream and bumps its `lastTouchedAt` — daily action feeds long-term momentum.
- Rollover behavior per §5 (midnight / Monday prompts, never guilt-trippy).

### 6.3 The Horizon — someday dreams
A dreamy band across the very top of the sky, just below the header, where **future dreams Julia isn't working on yet** drift: smaller, semi-transparent iridescent bubbles floating slowly near the sun, each holding just its title (e.g. "Visit all 7 continents ✿").

- Visually distant: ~60% scale, 70% opacity, softer blur — clearly part of the sky but "far away".
- Clicking a horizon bubble opens a mini card: title, why it matters, scope, category — and one prominent button: **"Start chasing this dream ✦"**, which asks for a horizon (short/mid/long) and floats the bubble down into the sky as a full active cloud card with a little sparkle-trail animation. Active dreams can likewise be sent back "to the horizon" (status → someday) from their expanded card.
- Adding someday dreams is deliberately frictionless: title + why is enough.

### 6.4 The sky (main field) — floating cloud cards for mid & long-term dreams
- Dream cards float in a **loose, organic arrangement**: implemented as a responsive grid (3–4 columns at 1280–1600px) but with per-card randomized vertical offsets (±24px), slight rotations (±1.5°), and independent bobbing — reads as "floating clouds," stays scannable.
- **Pinned dreams** float in a featured row at the top, slightly larger, with a tiny gold star pin.
- Sort by momentum = order by `lastTouchedAt` desc (pinned always first). Filter chips hide non-matching cards with a gentle fade/drift-away transition.
- Anime Julia + her fishing cloud live in the upper-right of this zone.

**Card face (collapsed)**: category color ribbon/dot, title, scope glyph (✿/✦) and a small horizon tag (Mid / Long), one-line "why", progress bar (rounded track in `--lilac`, fill in the dream's custom color with a subtle shimmer), "Next: [next milestone]", tiny footprint row (target date if set, days-since-touched as "last touched 3d ago"). Pin star in the corner.

**Card expanded (modal or in-place expand)**: full why-it-matters, editable milestone checklist with add/reorder/delete, manual percent slider (when no milestones), notes textarea, the dated updates timeline with an "Add update" input, target date picker, horizon & scope selectors, category picker, **color picker (palette swatches + custom)**, pin toggle, and buttons: "Dream achieved ✦", "Send to the horizon" (→ someday), Archive, Delete (with confirm).

### 6.5 Footer strip — "Recently touched"
A slim horizontal strip of the 5 most recently touched dreams (mini cloud chips) for instant "what was I juggling?" recall. Clicking one opens that dream.

### 6.6 Caught Dreams gallery
Achieved dreams leave the sky and live in a separate view (link in header: "Caught dreams ✦ N"). Rendered as a shelf of glowing orbs, each labeled with the dream title and achieved date; clicking shows the dream's full story (read-only card with its timeline). This keeps the sky uncluttered while making wins feel collected, not deleted.

### 6.7 The Sky — interactive star map **NEW**

A third dock button at the bottom (after The Fridge and The Apartment; id `#sky-dock`, crescent-moon icon) opens **The Sky**: a full-screen overlay (`#skyview`, z-index above everything) showing tonight's constellations big enough to explore.

**The astronomy (also powers the backdrop, §3.1):**

- `js/nightsky.js` carries a hand-built catalog of **220 bright stars** (J2000 RA/Dec + magnitude) across **39 constellations** covering the whole year — the summer sky (Scorpius, Sagittarius, the Summer Triangle, Boötes…), the winter sky (Orion, Taurus + Pleiades, Auriga, Gemini, both dogs, Lepus…), spring (Leo, Virgo, Corvus, Hydra…), autumn (Pegasus, Andromeda, Aries, Cetus…), and the circumpolars (both Bears, Cassiopeia, Cepheus, Draco, Perseus).
- Position math is plain spherical trig, no libraries: JD → GMST → local sidereal time (longitude −122.4194°), then per star HA → alt/az for latitude 37.7749°. Time is **23:11 local on the current calendar day**; stars below the horizon are clipped. Positions must sanity-check against the real sky (Polaris due north at alt ≈ 37.8°; Vega essentially at zenith in late July; Orion due south at New Year).
- Constellation line figures are the classic stick figures, stored per constellation with the stars.

**The interaction:**

- Every star has an invisible hover circle; hovering shows a floating dark tooltip with the **star's proper name** (Antares, Vega, Kaus Australis…) or its Greek designation (Zeta Lyrae, Mu Geminorum…) plus its constellation as a sub-line. Hit circles are stacked faintest-first so famous bright stars win overlaps, with a larger hit radius (14 vs 10) for mag ≤ 1.2.
- Hovering anywhere on a constellation (its stars or along its lines — lines get an invisible 16px-wide hit stroke) sets the group "hot": lines brighten to lavender, all its stars glow (drop-shadow), and the tooltip names the constellation.
- Close with the ✕ button (top right) or Escape. Tooltip and highlight must never block pointer movement (tooltip is `pointer-events: none`).
- Shared stars (Elnath, Alpheratz, Capella, Spica) belong to one constellation for hover purposes but anchor the neighboring figure's lines too.

**Words note**: the button label ("The Sky") and any future labels in this view are Julia's to word; star and constellation proper names are astronomical fact and fine as-is.

---

## 7. Momentum & celebration systems

### 7.1 The Bubble Jar
A cute SVG glass jar in the header (Gaia-style: rounded, star-etched, cork lid). Every caught orb (quick goal = tiny orb, milestone = small pink/blue orb, achieved dream = large iridescent orb) drops into the jar with a little physics-ish settle animation and stays as a visible pile (cap the rendered pile at ~40 orbs; show "×N" count beyond). Hover shows "N dreams caught, M milestones, K quick goals". Clicking opens the Caught Dreams gallery.

### 7.2 Sky sparkle level **CHANGED** (rainbow → stars)
The sky reflects how active Julia has been across ALL dreams in the current week (count of quick-goal completions + milestone completions + updates logged):

- Level 0 (quiet week): base night sky.
- Level 1 (1–2 actions): more glints, one slow shooting star per minute.
- Level 2 (3–5): the stars brighten — constellations to 96% opacity, filler stars up a step.
- Level 3 (6+): full magic — constellations at full brightness, drifting star confetti, silvery moonlit shimmer on cloud edges, Julia's avatar occasionally does a happy idle animation.

Level transitions are gradual (crossfade over several seconds), never flashy or distracting.

---

## 8. The fishing animation (core feature — get this right)

All fishing animations star anime Julia on her cloud. Never block or obscure the element the user is interacting with. Use CSS transforms + JS-orchestrated SVG (or Web Animations API); GSAP is acceptable if vendored/CDN'd.

### 8.1 Hover-cast (on hovering any dream card)
When the pointer enters a dream card and rests ≥150ms (debounce so grazing the grid doesn't spam):

1. Julia perks up (tiny head tilt, hair bounce).
2. She casts: the rod tips toward the hovered card's direction and the line arcs out **over the sky, high above the cards** — the line and moon-hook drift down to hang near (not on top of) the hovered card, ~40px above its top edge, gently swaying.
3. While hover continues, the bobber/moon-hook idles there with a soft glow.
4. On pointer leave, she reels back in a quick, smooth 400ms.

**Constraints**: the line is `pointer-events: none`; nothing about the animation may shift layout, steal hover, or cover the card's content. If the user moves between cards rapidly, the line smoothly retargets rather than restarting. Skip entirely if `prefers-reduced-motion`.

### 8.2 Milestone catch (significant progress)
When a milestone is checked off:

1. A small dream orb (iridescent bubble, ~28px) rises from that dream's card into the sky.
2. Julia casts, the moon-hook snags the orb, she reels it in with a happy expression + hair bounce.
3. Soft chime plays (§9). The orb arcs from her hand into the Bubble Jar in the header and settles.
4. The dream's progress bar fills with a shimmer pulse; `lastTouchedAt` bumps (card may float up if sorted by momentum).

Total sequence ≤ 2.5s and non-blocking — Julia (the user) can keep working; animations queue if she checks several milestones fast (collapse to one catch of multiple orbs if >3 queued).

### 8.3 Dream achieved (big celebration)
When "Dream achieved ✦" is pressed:

1. The whole card glows, lifts off, and condenses into a **large glowing dream orb**.
2. Julia stands up on her cloud, big cast, hooks the big orb, and reels it in with visible effort → triumphant pose holding it up. Star confetti + sparkle burst across the sky; a shooting star crosses; a brighter, longer chime arpeggio plays.
3. The big orb drops into the jar; a toast appears: "You caught: [dream title] ✦" with a link to the Caught Dreams gallery.
4. The card gracefully leaves the sky. Sparkle level gets a temporary boost for the rest of the day regardless of weekly count.

Sequence ~4–5s, skippable with a click.

### 8.4 Adding a new dream
"＋ Catch a new dream" → Julia casts straight up; the hook pulls DOWN a new empty orb from above the viewport; the orb pops into a fresh card in edit mode (title focused). Sets the tone: new dreams are caught, not filed.

---

## 9. Sound

- Soft, gentle chimes only — synthesized with the **Web Audio API** (no audio files): 
  - Milestone catch: two-note sparkle chime (e.g. E6→B6, sine + slight shimmer, <0.5s, quiet).
  - Dream achieved: 4-note ascending arpeggio with soft reverb tail.
  - New dream caught: single warm "pop + ting".
  - UI ticks (pin, filter): barely-audible soft tick, optional.
- Global **mute toggle** in header, persisted in settings. Default: ON but volume low (~30%). Respect autoplay policies: initialize AudioContext on first user interaction.

---

## 10. Quality & acceptance checklist

- [ ] Deploys to GitHub Pages as-is; works offline after first load (no required external calls except Google Fonts — provide system-font fallback).
- [ ] All state persists across reloads via localStorage; export → wipe → import round-trips perfectly.
- [ ] Hover-cast never causes layout shift, flicker, or loss of hover on the card (test moving mouse across all cards quickly).
- [ ] All animations use transform/opacity only; steady 60fps with 20 cards on a MacBook Air; `prefers-reduced-motion` disables bobbing/fishing/sparkles but keeps all functionality.
- [ ] Avatar reads as the likeness spec in §4 (curly dark hair w/ caramel ends, freckles, star pajamas, whimsical smile).
- [ ] Empty states are charming (no dreams after filtering → a little cloud saying "No dreams in this corner of the sky yet").
- [ ] Scope, horizon, and category filters compose correctly (e.g. Professional + Short shows only professional quick goals) and persist across reloads.
- [ ] Custom colors: any hex picked stays readable and dreamy (pastelized tint + WCAG AA text contrast on the card).
- [ ] Rollover works: unfinished "today" goals prompt at next open after midnight; weekly goals prompt Mondays; nothing is silently deleted.
- [ ] Horizon promotion round-trips: someday → active (with sparkle-trail) and active → someday both preserve all data.
- [ ] Keyboard accessible: cards focusable, expand with Enter, milestones toggleable; visible focus rings (soft pink glow).
- [ ] No console errors; data model versioned (`dreamcast.v1`) with a migration hook for future versions.
- [ ] **Night sky is astronomically true**: spot-check against a planetarium app — Polaris due north at ~37.8° altitude always; Vega near zenith on late-July nights; Orion due south at 11:11 PM around New Year. Stars render behind the clouds.
- [ ] **The Sky view**: opens from the dock, hover names every star and constellation, bright stars win overlapping hovers (Antares beats Sigma Scorpii), ✕ and Escape close it, tooltip never traps the pointer.
- [ ] The sky redraws for the current date on every load — no caching a stale night.

---

## 11. Nice-to-haves (only if time permits, in order)

1. Drag-to-reorder cards in Manual sort mode.
2. Confetti color matches the achieved dream's mood color.
3. A tiny weekly check-in prompt (appears Mondays: "What's one small step this week?") — dismissible, never nagging.
4. Day-drift: sky gradient shifts subtly warmer in the evening (local time), still daytime-pastel.
