# Dreamcast Palette — "Twilight Pop · Pastel"

Chosen July 2026, derived from Julia's Khroma favorites (cool-toned only: orchid, violet, ocean, sky).
Live mockup: `palette-mockups.html` (Pastel tab = the chosen version).

## The system

Four scopes, one hue family each. Six colors per scope:

| Role | Used for |
|---|---|
| **anchor** | Progress fills, category ribbons/dots, checkbox rings — small vivid pops ONLY, never surfaces |
| **dark** | Mid-term dream card surface (deepest tier, still pastel) |
| **medium** | Long-term dream card surface · chip hover state |
| **pale** | Dreamstep baby clouds, Today/This-Week tray pills, chip rest state |
| **accent** | Colored labels ("Next:"), percentages, chip selected-state background, glyphs |
| **deep** | Small text sitting on tints: dates, "last touched", chip rest-state text |

Body text is always ink `#2B2440`.

## Tokens

| Scope | anchor | dark (mid) | medium (long) | pale (steps/tasks) | accent | deep |
|---|---|---|---|---|---|---|
| Personal ✿ | `#E556EC` | `#EF96F3` | `#F5BFF8` | `#FBE7FC` | `#B343B8` | `#833187` |
| Professional ✦ | `#318EA3` | `#7FB9C6` | `#B1D4DC` | `#E2EFF2` | `#2B7D90` | `#205C6A` |
| Passion ⌗ | `#C265F8` | `#D9A0FB` | `#E8C4FC` | `#F6E9FE` | `#974FC2` | `#763E97` |
| Peace ☮ | `#96D9F6` | `#96D9F6` | `#D0EEFB` | `#EFF9FE` | `#2F7EA1` | `#1F5C79` |

(Peace's anchor is already pastel, so it doubles as its dark tier.)

Suggested CSS custom properties:

```css
:root {
  --personal: #E556EC;     --personal-dark: #EF96F3;  --personal-med: #F5BFF8;
  --personal-pale: #FBE7FC; --personal-accent: #B343B8; --personal-deep: #833187;
  --professional: #318EA3; --professional-dark: #7FB9C6; --professional-med: #B1D4DC;
  --professional-pale: #E2EFF2; --professional-accent: #2B7D90; --professional-deep: #205C6A;
  --passion: #C265F8;      --passion-dark: #D9A0FB;   --passion-med: #E8C4FC;
  --passion-pale: #F6E9FE;  --passion-accent: #974FC2; --passion-deep: #763E97;
  --peace: #96D9F6;        --peace-dark: #96D9F6;     --peace-med: #D0EEFB;
  --peace-pale: #EFF9FE;    --peace-accent: #2F7EA1;   --peace-deep: #1F5C79;
}
```

## Where it plugs into the code

- `js/app.js` → `SCOPE_TINTS`: mid = the **dark** tier, long = the **medium** tier (keep the ~.9 alpha wrapper if desired).
- `js/app.js` → `STEP_TINTS`: the **pale** tier per scope (also use for tray pills).
- `css/style.css` → replace the warm gold/orange remnants; progress `.progress-fill` uses **anchor**; `.progress-pct`, `.next-label`, dates use **accent**/**deep** per scope.
- `js/data.js` → `PALETTE` swatches & category defaults: keep every offered swatch inside the four families (drop `#F7E08E` yellow and `#F7B884` orange).

## Header treatment

- Wordmark gradient: `linear-gradient(95deg, #E556EC 0%, #C265F8 45%, #52C3F4 100%)` (spans the palette).
- Scope chips: **pale** background + **deep** text at rest → **medium** on hover → solid **accent** + white text only while selected.
- "＋ Catch a new dream" CTA: solid ink `#2B2440`, white text — the one dark element in the header.

## Accessibility (verified)

- Ink `#2B2440` ≥ 6.8:1 on every dark tier, ≥ 9:1 on medium, ≥ 12:1 on pale.
- Accents ≥ 4.5:1 on white (AA); deeps ≥ 6:1 on their pale tints.
