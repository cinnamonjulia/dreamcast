# POLISH-PLAN.md — Dreamcast visual polish pass

Goal: make the site feel hand-crafted and finished. Work through the tasks in order — they're sorted so nothing gets done twice. Julia has final say on anything visual; when in doubt, match the existing ink-outline illustration style (`#2B2440` strokes, rounded, pastel fills).

**Out of scope for this pass:**
- Palette token application (PALETTE_SPEC.md) — already being handled separately. If that work has landed by the time you start, use the new CSS custom properties wherever these tasks touch color. If it hasn't, use the existing vars and leave a `/* TODO: palette token */` comment at each spot.
- Sample dream copy — already customized by Julia. Do not touch dream titles/descriptions in `js/data.js` seed data.

---

## Task 1 — Replace naked native form controls

The biggest unpolished tell on the page: default browser `<select>`s and `mm/dd/yyyy` date inputs sitting inside the candy UI.

**Where:**
- Tray quick-add rows (`index.html` `.quick-add` — `.qa-date`, `.qa-scope`, `.qa-cat`; styles at `css/style.css` ~509–545)
- New-dream modal (`.field select`, `.field input[type=date]` — styles ~1055–1065)

**What:**
1. Selects: `appearance: none` (+ `-webkit-appearance`), pill-shape them to match `.chip` (border `1.5px solid rgba(142,151,232,.45)`, radius `999px`, white/translucent bg), add a small inline-SVG chevron via `background-image`. Keep them real `<select>`s — no JS dropdown rebuild needed for this pass.
2. Date inputs: hide the text field entirely. Replace each with a small icon button (calendar or crescent-moon in house style) that calls `input.showPicker()` on a visually-hidden `<input type=date>`. When a date is set, show it as a tiny pill (e.g. "Jul 28") next to the button with an × to clear. Fallback: if `showPicker` throws (unsupported), just show the styled native input.
3. The modal's target-date field can stay a visible input but styled: same border/radius family as `.field input[type=text]`, and set `::-webkit-calendar-picker-indicator` opacity/filter so the icon isn't default gray.

**Done when:** no default-gray browser widget is visible anywhere on the main view or in the new-dream modal, in Chrome and Safari.

## Task 2 — Recompose the header

**Where:** `index.html` `#app-header`, `css/style.css` ~183–330.

**What:**
1. Cap the filter area at **two rows**: row 1 = scope chips + horizon chips; row 2 = categories + sort toggle at the row's end (no more stranded "Momentum" chip on its own line).
2. Collapse the category chips into a single **"Categories" chip that opens a popover** (reuse `.settings-menu` pattern: absolute, blur, radius-md) containing the category chips. Active category shows as its dot + name on the collapsed chip.
3. Kill the dead space under the logo: `align-items: center` on `#app-header` once it's two rows, and let `.header-right` stop wrapping (it has room once center is compact).

**Done when:** header is ≤ 2 chip rows at 1280px wide, nothing wraps ragged, no empty band under the logo.

## Task 3 — Ration the ✦ sparkle glyph

Currently 11 in `index.html` alone, ~53 in `js/app.js`. When everything sparkles, nothing does.

**Keep exactly two:** the wordmark's SVG star, and the jar/gallery ("Caught dreams") — that one is load-bearing (it counts catches).

**Remove from:** "Task log ✦", "Momentum ✦" sort toggle, "Recently touched ✦", "Sync devices ✦" menu item, "The Fridge ✦" heading, "Cast it ✦" button, and every toast/label/heading in `js/app.js` (grep `✦`). Same treatment for decorative `✿ / ☮ / ⌗` **outside** the scope chips — the scope glyphs are semantic, they stay.

**Done when:** `grep -c "✦" index.html` ≤ 2 and remaining `app.js` occurrences are only the jar/catch-related strings.

## Task 4 — Replace emoji with house-style inline SVGs

**Where:** Fridge view header chips in `index.html`: `🧂 staples`, `✨ what can I cook?`, `🍲 recipe → grocery list`. Also grep `js/app.js` and `js/foods.js` for emoji rendered into UI chrome (buttons, headings, toasts) — food *items* drawn as emoji on shelves are fine to leave.

**What:** draw three small (18–20px) inline SVGs matching the existing style — `#2B2440` 1.5px strokes, pastel fills (salt shaker, sparkle-pot/pan, bowl). Follow the pattern of the existing fridge/trash SVGs in `index.html`.

**Done when:** no OS-rendered emoji in any button/heading in the Fridge view.

## Task 5 — Contrast pass on small text

**Where / what (use PALETTE_SPEC `deep`/`accent` tokens if landed):**
- `.progress-pct` ("0%", "33%") — nearly invisible on card tints. Darken + consider a subtle white text-shadow or weight bump.
- "last touched today" card meta — same fix.
- `.gallery-link` ("Caught dreams") — pale blue on white header; darken.
- `.appliance-label` + trash-can hint in Fridge view — lavender on pink sky; darken.
- `.horizon-empty-hint` and any other `opacity: .6`-ish helper text — prefer a darker solid color over low opacity.

**Done when:** every piece of text on the page hits ≥ 4.5:1 against its actual background (spot-check with a contrast picker on the rendered page, not the token on white).

## Task 6 — Small craft details

1. **Favicon:** add the wordmark star as an SVG favicon (`<link rel="icon" href="data:image/svg+xml,...">` or a small file + CSP `img-src` already allows `'self'` and `data:`). Fixes the console 404.
2. **Peony button:** at 34px the resting state reads as an ambiguous green sprig. Give `#peony-svg` a clear resting flower (closed bud with visible petals) so it looks intentional before any tasks are logged. See `js/app.js` peony render code.
3. **Card text overflow:** on cloud cards, longer flavor-text lines collide with the progress bar (visible on the "surf" card). Constrain the flavor text (`-webkit-line-clamp: 2` + `overflow: hidden`) and add breathing room above the progress track. Check step-pills don't overhang the blob edge.

**Done when:** tab shows the star favicon, no console 404, peony reads as a flower at rest, and no text collides on cards with 2-line descriptions at 1280px and 1440px.

---

## Verify (end of session)

1. Serve locally (`python3 -m http.server 8000`) and click through: main sky → Fridge → Apartment → new-dream modal → task log → gallery. No layout regressions, no console errors beyond the expected Supabase fetch when offline.
2. Screenshot before/after at 1440×900 for Julia to compare.
3. Julia clicks through herself and confirms it still feels like *her* site — nothing sanded down too far.
