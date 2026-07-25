/* ============================================================
   DREAMCAST — The Apartment: original SVG room scenes
   Drawn from Julia's photos (the apartment/IMG_2907–2912),
   decluttered to the goal state, in the house art style:
   ink linework, soft cel shading, very round corners.
   No <defs>/ids — these SVGs are inlined many times per page.
   ============================================================ */

const INK = '#2B2440';
const SKY = '#D8ECF8';
const FLOOR = '#CE9659';
const FLOOR_LINE = '#B97F42';

/* a 4-point Dreamcast star */
function star(cx, cy, r, fill = '#FFD98E', cls = '') {
  const k = r * 0.28;
  return `<path ${cls ? `class="${cls}"` : ''} d="M ${cx} ${cy - r} L ${cx + k} ${cy - k} L ${cx + r} ${cy} L ${cx + k} ${cy + k} L ${cx} ${cy + r} L ${cx - k} ${cy + k} L ${cx - r} ${cy} L ${cx - k} ${cy - k} Z" fill="${fill}"/>`;
}

/* warm wood floor strip with plank seams */
function floorStrip(y = 172, tone = FLOOR) {
  let seams = '';
  for (let x = 26; x < 320; x += 52) {
    seams += `<line x1="${x}" y1="${y + 2}" x2="${x}" y2="${y + 22}" stroke="${FLOOR_LINE}" stroke-width="1.4" opacity=".45"/>`;
    seams += `<line x1="${x + 26}" y1="${y + 26}" x2="${x + 26}" y2="${220}" stroke="${FLOOR_LINE}" stroke-width="1.4" opacity=".45"/>`;
  }
  return `<rect x="0" y="${y}" width="320" height="${220 - y}" fill="${tone}"/>
    <line x1="0" y1="${y + 24}" x2="320" y2="${y + 24}" stroke="${FLOOR_LINE}" stroke-width="1.4" opacity=".5"/>
    <line x1="0" y1="${y}" x2="320" y2="${y}" stroke="${INK}" stroke-width="1.6" opacity=".55"/>
    ${seams}`;
}

/* a row of little book spines */
function spines(x, y, h, colors) {
  let out = '', cx = x;
  colors.forEach((c, i) => {
    const w = 5 + (i % 3);
    const hh = h - (i % 3) * 2;
    out += `<rect x="${cx}" y="${y + (h - hh)}" width="${w}" height="${hh}" rx="1.5" fill="${c}" stroke="${INK}" stroke-width=".9"/>`;
    cx += w + 1.5;
  });
  return out;
}

const svgOpen = `<svg viewBox="0 0 320 220" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">`;

/* ---------------- KITCHEN (IMG_2908) ----------------
   honey shaker cabinets, stainless stove + microwave, subway tile,
   grey back door, black round table, teal velvet chairs, sunflowers */
function kitchen() {
  let tiles = '';
  for (let ty = 68; ty < 104; ty += 9) {
    tiles += `<line x1="6" y1="${ty}" x2="134" y2="${ty}" stroke="#E3DCD2" stroke-width="1"/>`;
    for (let tx = (ty / 9) % 2 ? 16 : 26; tx < 134; tx += 20) {
      tiles += `<line x1="${tx}" y1="${ty}" x2="${tx}" y2="${ty + 9}" stroke="#E3DCD2" stroke-width="1"/>`;
    }
  }
  return `${svgOpen}
  <rect width="320" height="172" fill="#F3E9D7"/>
  ${floorStrip(172, '#C98F55')}
  <!-- ceiling dome light -->
  <path d="M144 0 Q160 22 176 0 Z" fill="#FFF3D8" stroke="${INK}" stroke-width="1.6"/>
  <ellipse cx="160" cy="4" rx="20" ry="9" fill="#FFE9B8" opacity=".35"/>
  <!-- subway backsplash -->
  <rect x="6" y="64" width="128" height="40" fill="#FBFAF4" stroke="${INK}" stroke-width="1.2"/>
  ${tiles}
  <!-- upper cabinets -->
  <rect x="8" y="12" width="74" height="48" rx="5" fill="#DDA967" stroke="${INK}" stroke-width="2"/>
  <rect x="14" y="18" width="27" height="36" rx="3" fill="none" stroke="#B9874C" stroke-width="2"/>
  <rect x="49" y="18" width="27" height="36" rx="3" fill="none" stroke="#B9874C" stroke-width="2"/>
  <circle cx="38" cy="38" r="1.8" fill="#8A6236"/><circle cx="52" cy="38" r="1.8" fill="#8A6236"/>
  <rect x="86" y="12" width="48" height="18" rx="4" fill="#DDA967" stroke="${INK}" stroke-width="2"/>
  <rect x="91" y="16" width="38" height="10" rx="2.5" fill="none" stroke="#B9874C" stroke-width="1.6"/>
  <!-- over-range microwave -->
  <rect x="86" y="34" width="48" height="24" rx="4" fill="#C7CEDC" stroke="${INK}" stroke-width="2"/>
  <rect x="90" y="38" width="30" height="16" rx="3" fill="#8E96AA" stroke="${INK}" stroke-width="1.2"/>
  <rect x="124" y="38" width="6" height="16" rx="2" fill="#EDF1F7" stroke="${INK}" stroke-width="1"/>
  <!-- stove -->
  <rect x="84" y="104" width="52" height="9" rx="2.5" fill="#3A3350" stroke="${INK}" stroke-width="1.6"/>
  <circle cx="96" cy="108.5" r="2.4" fill="#6B647F"/><circle cx="110" cy="108.5" r="2.4" fill="#6B647F"/><circle cx="124" cy="108.5" r="2.4" fill="#6B647F"/>
  <rect x="86" y="113" width="48" height="55" rx="4" fill="#C7CEDC" stroke="${INK}" stroke-width="2"/>
  <rect x="90" y="117" width="40" height="5" rx="2.5" fill="#EDF1F7" stroke="${INK}" stroke-width="1.1"/>
  <rect x="93" y="128" width="34" height="24" rx="5" fill="#5A5470" stroke="${INK}" stroke-width="1.5"/>
  <path d="M97 132 Q110 128 123 132" fill="none" stroke="#FFFFFF" stroke-width="1.6" opacity=".5"/>
  <!-- counter + base cabinets -->
  <rect x="4" y="102" width="80" height="9" rx="3.5" fill="#E9BE85" stroke="${INK}" stroke-width="2"/>
  <rect x="8" y="111" width="72" height="57" rx="4" fill="#DDA967" stroke="${INK}" stroke-width="2"/>
  <rect x="13" y="116" width="62" height="12" rx="3" fill="none" stroke="#B9874C" stroke-width="1.8"/>
  <rect x="13" y="133" width="29" height="30" rx="3" fill="none" stroke="#B9874C" stroke-width="1.8"/>
  <rect x="46" y="133" width="29" height="30" rx="3" fill="none" stroke="#B9874C" stroke-width="1.8"/>
  <circle cx="44" cy="122" r="1.8" fill="#8A6236"/>
  <!-- kettle with steam -->
  <g class="anim-steam">
    <path d="M50 94 Q54 88 50 82 Q46 76 50 70" fill="none" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" opacity=".85"/>
    <path d="M58 92 Q61 87 58 82" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" opacity=".6"/>
  </g>
  <path d="M26 88 Q26 80 37 80 Q48 80 48 88 L46 99 Q37 103 28 99 Z" fill="#F4B7CD" stroke="${INK}" stroke-width="2"/>
  <path d="M47 86 L54 90 L46 93 Z" fill="#F4B7CD" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
  <path d="M30 82 Q37 74 44 82" fill="none" stroke="${INK}" stroke-width="2"/>
  <circle cx="37" cy="79" r="1.8" fill="${INK}"/>
  <!-- grey back door with window -->
  <rect x="150" y="46" width="54" height="122" rx="4" fill="#B3BAC9" stroke="${INK}" stroke-width="2.2"/>
  <rect x="157" y="54" width="40" height="48" rx="3" fill="${SKY}" stroke="${INK}" stroke-width="1.6"/>
  <line x1="177" y1="54" x2="177" y2="102" stroke="#FFFFFF" stroke-width="2"/>
  <line x1="157" y1="78" x2="197" y2="78" stroke="#FFFFFF" stroke-width="2"/>
  <ellipse cx="168" cy="98" rx="9" ry="5" fill="#9DC48F" opacity=".9"/>
  <rect x="157" y="110" width="40" height="22" rx="3" fill="none" stroke="#98A0B2" stroke-width="1.8"/>
  <rect x="157" y="138" width="40" height="22" rx="3" fill="none" stroke="#98A0B2" stroke-width="1.8"/>
  <circle cx="198" cy="112" r="3" fill="#E8C87E" stroke="${INK}" stroke-width="1.3"/>
  <!-- teal chair behind the table -->
  <rect x="218" y="102" width="26" height="36" rx="12" fill="#4FA8A4" stroke="${INK}" stroke-width="2"/>
  <path d="M224 108 L224 132 M231 108 L231 132 M238 108 L238 132" stroke="#3D8A87" stroke-width="1.6"/>
  <!-- black round table -->
  <rect x="252" y="146" width="9" height="24" fill="#3E3A52" stroke="${INK}" stroke-width="1.4"/>
  <path d="M240 168 L256 158 M273 168 L257 158" stroke="#3E3A52" stroke-width="4" stroke-linecap="round"/>
  <ellipse cx="256" cy="140" rx="48" ry="11" fill="#474357" stroke="${INK}" stroke-width="2.2"/>
  <path d="M214 144 Q256 156 298 144" fill="none" stroke="#332F47" stroke-width="2"/>
  <!-- sunflowers in a vase -->
  <path d="M247 122 Q243 136 253 136 Q263 136 259 122 Z" fill="#FDFCF8" stroke="${INK}" stroke-width="1.6"/>
  <path d="M250 121 Q246 112 244 106 M253 121 L253 102 M256 121 Q260 112 263 108" fill="none" stroke="#7FA86A" stroke-width="1.8"/>
  <circle cx="243" cy="103" r="6" fill="#F7C948" stroke="#D9A22E" stroke-width="1.5"/><circle cx="243" cy="103" r="2.2" fill="#7A5230"/>
  <circle cx="253" cy="97" r="7" fill="#F7C948" stroke="#D9A22E" stroke-width="1.5"/><circle cx="253" cy="97" r="2.6" fill="#7A5230"/>
  <circle cx="264" cy="105" r="5.5" fill="#F7C948" stroke="#D9A22E" stroke-width="1.5"/><circle cx="264" cy="105" r="2" fill="#7A5230"/>
  <!-- teal chair in front -->
  <rect x="286" y="110" width="15" height="44" rx="7" fill="#4FA8A4" stroke="${INK}" stroke-width="2"/>
  <rect x="272" y="150" width="33" height="10" rx="5" fill="#4FA8A4" stroke="${INK}" stroke-width="2"/>
  <path d="M276 160 L274 170 M300 160 L302 170" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>
  </svg>`;
}

/* ---------------- MUDROOM / LAUNDRY (IMG_2909) ----------------
   stacked white LG washer & dryer, shiplap + one wood wall,
   white back door with deck greenery, wicker basket, pastel towels */
function mudroom() {
  let shiplap = '';
  for (let y = 14; y < 172; y += 14) {
    shiplap += `<line x1="0" y1="${y}" x2="222" y2="${y}" stroke="#E7DFD3" stroke-width="1.6"/>`;
  }
  return `${svgOpen}
  <rect width="222" height="172" fill="#FBF8F2"/>
  ${shiplap}
  <rect x="222" width="98" height="172" fill="#BE8A5C"/>
  <line x1="222" y1="0" x2="222" y2="172" stroke="${INK}" stroke-width="1.4" opacity=".5"/>
  <line x1="248" y1="0" x2="248" y2="172" stroke="#A06E44" stroke-width="2"/>
  <line x1="272" y1="0" x2="272" y2="172" stroke="#A06E44" stroke-width="2"/>
  <line x1="296" y1="0" x2="296" y2="172" stroke="#A06E44" stroke-width="2"/>
  ${floorStrip()}
  <!-- white back door, deck & greenery through the window -->
  <rect x="14" y="26" width="66" height="142" rx="3" fill="#FDFCF9" stroke="${INK}" stroke-width="2.2"/>
  <rect x="21" y="34" width="52" height="64" rx="2.5" fill="${SKY}" stroke="${INK}" stroke-width="1.6"/>
  <ellipse cx="34" cy="88" rx="12" ry="8" fill="#9DC48F"/>
  <ellipse cx="58" cy="90" rx="14" ry="7" fill="#8FBF84"/>
  <path d="M24 80 L70 80 M30 80 L30 96 M43 80 L43 96 M56 80 L56 96" stroke="#FFFFFF" stroke-width="2"/>
  <line x1="47" y1="34" x2="47" y2="78" stroke="#FFFFFF" stroke-width="2"/>
  <rect x="21" y="108" width="52" height="24" rx="3" fill="none" stroke="#D9D2C6" stroke-width="1.8"/>
  <rect x="21" y="138" width="52" height="22" rx="3" fill="none" stroke="#D9D2C6" stroke-width="1.8"/>
  <circle cx="74" cy="102" r="3" fill="#C9CFDA" stroke="${INK}" stroke-width="1.2"/>
  <!-- stacked washer & dryer -->
  <rect x="104" y="40" width="82" height="64" rx="8" fill="#FAFAFC" stroke="${INK}" stroke-width="2.2"/>
  <circle cx="128" cy="49" r="3" fill="#C9CFDA" stroke="${INK}" stroke-width="1"/>
  <circle cx="139" cy="49" r="1.5" fill="#AEB6C6"/><circle cx="145" cy="49" r="1.5" fill="#AEB6C6"/><circle cx="151" cy="49" r="1.5" fill="#AEB6C6"/>
  <rect x="160" y="45" width="18" height="7" rx="3" fill="#DCE4F0" stroke="${INK}" stroke-width="1"/>
  <circle cx="145" cy="80" r="21" fill="#D9E0EA" stroke="${INK}" stroke-width="1.8"/>
  <circle cx="145" cy="80" r="15" fill="#BFD6EA" stroke="${INK}" stroke-width="1.2"/>
  <ellipse class="anim-glint" cx="139" cy="74" rx="6" ry="3.4" fill="#FFFFFF" opacity=".7" transform="rotate(-24 139 74)"/>
  <rect x="104" y="106" width="82" height="64" rx="8" fill="#FAFAFC" stroke="${INK}" stroke-width="2.2"/>
  <circle cx="128" cy="115" r="3" fill="#C9CFDA" stroke="${INK}" stroke-width="1"/>
  <circle cx="139" cy="115" r="1.5" fill="#AEB6C6"/><circle cx="145" cy="115" r="1.5" fill="#AEB6C6"/><circle cx="151" cy="115" r="1.5" fill="#AEB6C6"/>
  <circle cx="145" cy="145" r="20" fill="#D9E0EA" stroke="${INK}" stroke-width="1.8"/>
  <circle cx="145" cy="145" r="14" fill="#BFD6EA" stroke="${INK}" stroke-width="1.2"/>
  <path d="M136 139 Q145 133 154 139" fill="none" stroke="#FFFFFF" stroke-width="1.8" opacity=".7"/>
  <!-- folded pastel towels on the wicker basket -->
  <rect x="222" y="118" width="48" height="11" rx="4" fill="#C4D9F0" stroke="${INK}" stroke-width="1.5"/>
  <line x1="246" y1="119.5" x2="246" y2="127.5" stroke="#9FB6D0" stroke-width="1.4"/>
  <rect x="220" y="107" width="52" height="11" rx="4" fill="#BFE3D3" stroke="${INK}" stroke-width="1.5"/>
  <line x1="246" y1="108.5" x2="246" y2="116.5" stroke="#93C4AC" stroke-width="1.4"/>
  <rect x="223" y="96" width="46" height="11" rx="4" fill="#F5C6D8" stroke="${INK}" stroke-width="1.5"/>
  <line x1="246" y1="97.5" x2="246" y2="105.5" stroke="#D99BB4" stroke-width="1.4"/>
  <path d="M212 130 L280 130 L274 170 L218 170 Z" fill="#DFB273" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
  <path d="M214 143 L278 143 M216 156 L276 156" stroke="#B9884A" stroke-width="1.8"/>
  <path d="M226 131 L228 169 M243 131 L244 169 M260 131 L259 169" stroke="#B9884A" stroke-width="1.6" opacity=".7"/>
  <path d="M222 130 Q225 122 232 124 M270 130 Q267 122 260 124" fill="none" stroke="#B9884A" stroke-width="2.4" stroke-linecap="round"/>
  </svg>`;
}

/* ---------------- FOYER (IMG_2910) ----------------
   wood floor, wainscoting, glowing doorway to the kitchen, console
   with a plant, wall hooks (coat + pink tote), pink slippers, runner */
function foyer() {
  let panels = '';
  for (let x = 20; x < 320; x += 34) {
    panels += `<line x1="${x}" y1="118" x2="${x}" y2="166" stroke="#E8DFD0" stroke-width="1.6"/>`;
  }
  return `${svgOpen}
  <rect width="320" height="172" fill="#F2E9DB"/>
  <rect x="0" y="112" width="320" height="60" fill="#FBF7EF"/>
  <line x1="0" y1="112" x2="320" y2="112" stroke="#D9CDBB" stroke-width="2.4"/>
  ${panels}
  ${floorStrip(172)}
  <!-- front door + doormat -->
  <rect x="8" y="26" width="60" height="142" rx="3" fill="#FDFCF9" stroke="${INK}" stroke-width="2.2"/>
  <rect x="15" y="34" width="46" height="30" rx="3" fill="none" stroke="#D9D2C6" stroke-width="1.8"/>
  <rect x="15" y="70" width="46" height="30" rx="3" fill="none" stroke="#D9D2C6" stroke-width="1.8"/>
  <rect x="15" y="106" width="46" height="54" rx="3" fill="none" stroke="#D9D2C6" stroke-width="1.8"/>
  <circle cx="62" cy="100" r="3.2" fill="#E8C87E" stroke="${INK}" stroke-width="1.3"/>
  <!-- console with a green plant -->
  <rect x="90" y="116" width="68" height="7" rx="3" fill="#FDFCF8" stroke="${INK}" stroke-width="2"/>
  <rect x="95" y="123" width="5" height="45" fill="#FDFCF8" stroke="${INK}" stroke-width="1.6"/>
  <rect x="148" y="123" width="5" height="45" fill="#FDFCF8" stroke="${INK}" stroke-width="1.6"/>
  <line x1="97" y1="148" x2="151" y2="148" stroke="${INK}" stroke-width="1.6" opacity=".5"/>
  <path d="M116 104 L132 104 L129 116 L119 116 Z" fill="#E2AC88" stroke="${INK}" stroke-width="1.8"/>
  <ellipse cx="116" cy="96" rx="7" ry="4.5" fill="#8FBF84" transform="rotate(-28 116 96)"/>
  <ellipse cx="132" cy="96" rx="7" ry="4.5" fill="#8FBF84" transform="rotate(28 132 96)"/>
  <ellipse cx="124" cy="90" rx="4.5" ry="7.5" fill="#9DC48F"/>
  <ellipse cx="110" cy="102" rx="6" ry="3.6" fill="#7FA86A" transform="rotate(-40 110 102)"/>
  <ellipse cx="138" cy="102" rx="6" ry="3.6" fill="#7FA86A" transform="rotate(40 138 102)"/>
  <!-- hooks: one coat, one tote, one free -->
  <rect x="170" y="62" width="70" height="6" rx="3" fill="#FDFCF8" stroke="${INK}" stroke-width="1.8"/>
  <path d="M181 68 L181 74 Q181 78 185 77 M203 68 L203 74 M225 68 L225 74 Q225 78 229 77" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>
  <path d="M195 74 Q191 76 190 84 L188 112 Q188 116 192 116 L214 116 Q218 116 218 112 L216 84 Q215 76 211 74 Q207 70 203 74 Q199 70 195 74 Z" fill="#9FB6D0" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
  <path d="M203 76 L203 114" stroke="#7E96B4" stroke-width="1.6"/>
  <circle cx="200" cy="88" r="1.3" fill="#7E96B4"/><circle cx="200" cy="98" r="1.3" fill="#7E96B4"/>
  <path d="M225 74 Q219 80 218 88 L217 106 Q217 110 221 110 L241 110 Q245 110 245 106 L244 88 Q243 80 237 74" fill="#F0A8C4" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
  <path d="M224 78 Q231 70 238 78" fill="none" stroke="${INK}" stroke-width="1.8"/>
  <circle cx="226" cy="92" r="1.6" fill="#FDFCF8"/><circle cx="236" cy="99" r="1.6" fill="#FDFCF8"/>
  <path d="M228 100 Q231 96 234 92" fill="none" stroke="#D584A8" stroke-width="1.5"/>
  <!-- glowing doorway to the kitchen -->
  <rect x="248" y="38" width="62" height="132" rx="3" fill="#FDFCF9" stroke="${INK}" stroke-width="2.2"/>
  <rect x="255" y="45" width="48" height="125" fill="#FBD9A8"/>
  <rect class="anim-glow" x="261" y="52" width="36" height="118" fill="#FFEBC4"/>
  <path d="M258 122 L300 122 L300 170 L258 170 Z" fill="#E5C08A" opacity=".55"/>
  <path d="M263 122 L263 168 M292 122 L292 168" stroke="#C99B62" stroke-width="2" opacity=".5"/>
  <circle cx="279" cy="66" r="5" fill="#FFE9B8" stroke="#E3BE5C" stroke-width="1.4" opacity=".9"/>
  <line x1="279" y1="52" x2="279" y2="61" stroke="#E3BE5C" stroke-width="1.4" opacity=".8"/>
  <!-- runner rug -->
  <rect x="58" y="186" width="204" height="22" rx="9" fill="#D9A9BA" stroke="#B87E93" stroke-width="1.8"/>
  <rect x="66" y="190" width="188" height="14" rx="7" fill="none" stroke="#B87E93" stroke-width="1.2" stroke-dasharray="5 4"/>
  <path d="M96 197 l4 -3.5 4 3.5 -4 3.5 Z M156 197 l4 -3.5 4 3.5 -4 3.5 Z M216 197 l4 -3.5 4 3.5 -4 3.5 Z" fill="#B87E93" opacity=".8"/>
  <!-- pink slippers, placed neatly -->
  <ellipse cx="284" cy="204" rx="10" ry="4.5" fill="#F4A9C4" stroke="${INK}" stroke-width="1.6"/>
  <path d="M276 202 Q284 197 292 202" fill="none" stroke="${INK}" stroke-width="1.5"/>
  <ellipse cx="304" cy="206" rx="10" ry="4.5" fill="#F4A9C4" stroke="${INK}" stroke-width="1.6"/>
  <path d="M296 204 Q304 199 312 204" fill="none" stroke="${INK}" stroke-width="1.5"/>
  </svg>`;
}

/* ---------------- BEDROOM (IMG_2911) — the hero room ----------------
   bamboo four-poster canopy bed, sheer swags, white duvet, floral
   pillows, head bookshelf, cane dresser, gold mirror, pink curtain */
function bedroom() {
  const post = (x) => `
    <rect x="${x}" y="28" width="5.5" height="124" rx="2.5" fill="#C9A36A" stroke="${INK}" stroke-width="1.6"/>
    <line x1="${x}" y1="52" x2="${x + 5.5}" y2="52" stroke="#A8804C" stroke-width="1.4"/>
    <line x1="${x}" y1="80" x2="${x + 5.5}" y2="80" stroke="#A8804C" stroke-width="1.4"/>
    <line x1="${x}" y1="108" x2="${x + 5.5}" y2="108" stroke="#A8804C" stroke-width="1.4"/>`;
  let ovals = '';
  for (let x = 74; x < 188; x += 15) {
    ovals += `<ellipse cx="${x}" cy="129" rx="5" ry="4.5" fill="none" stroke="#A8804C" stroke-width="1.4"/>`;
  }
  return `${svgOpen}
  <rect width="320" height="172" fill="#F4EBDE"/>
  ${floorStrip(172)}
  <path d="M136 0 Q150 20 164 0 Z" fill="#FFF3D8" stroke="${INK}" stroke-width="1.6"/>
  <!-- window with the pink curtain -->
  <rect x="238" y="30" width="68" height="86" rx="3" fill="#FDFCF9" stroke="${INK}" stroke-width="2.2"/>
  <rect x="244" y="36" width="56" height="74" fill="${SKY}"/>
  <line x1="272" y1="36" x2="272" y2="110" stroke="#FFFFFF" stroke-width="2.4"/>
  <line x1="244" y1="73" x2="300" y2="73" stroke="#FFFFFF" stroke-width="2.4"/>
  <path d="M234 26 L310 26" stroke="#C9A36A" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M238 28 Q248 60 240 92 Q252 104 246 116 L234 116 L232 28 Z" fill="#F2B8CC" stroke="${INK}" stroke-width="1.8"/>
  <path d="M239 40 Q243 66 239 90" fill="none" stroke="#D999B4" stroke-width="1.5"/>
  <path d="M232 96 Q242 100 244 94" fill="none" stroke="${INK}" stroke-width="1.5"/>
  <!-- gold ornate mirror, leaning -->
  <g transform="rotate(-4 27 128)">
    <rect x="10" y="88" width="36" height="80" rx="16" fill="#DFE9F2" stroke="#C9A557" stroke-width="4"/>
    <rect x="10" y="88" width="36" height="80" rx="16" fill="none" stroke="${INK}" stroke-width="1.4"/>
    <circle cx="20" cy="86" r="3" fill="#D9B36A" stroke="${INK}" stroke-width="1"/>
    <circle cx="28" cy="83" r="3.8" fill="#D9B36A" stroke="${INK}" stroke-width="1"/>
    <circle cx="36" cy="86" r="3" fill="#D9B36A" stroke="${INK}" stroke-width="1"/>
    <path d="M18 140 L36 104" stroke="#FFFFFF" stroke-width="3.5" opacity=".7" stroke-linecap="round"/>
    <path d="M24 148 L38 120" stroke="#FFFFFF" stroke-width="2" opacity=".5" stroke-linecap="round"/>
  </g>
  <!-- four-poster bamboo bed with canopy sheers -->
  ${post(60)}${post(194)}
  <rect x="60" y="26" width="140" height="5" rx="2.5" fill="#C9A36A" stroke="${INK}" stroke-width="1.6"/>
  <g class="anim-sway">
    <path d="M62 32 Q130 62 198 32 L198 38 Q130 70 62 38 Z" fill="#FFFFFF" opacity=".6"/>
    <path d="M63 32 Q53 88 66 148 L72 148 Q61 90 69 32 Z" fill="#FFFFFF" opacity=".55"/>
    <path d="M197 32 Q207 88 194 148 L188 148 Q199 90 191 32 Z" fill="#FFFFFF" opacity=".55"/>
    <path d="M62 34 Q98 50 130 44" fill="none" stroke="#E4E0FA" stroke-width="1.4" opacity=".8"/>
  </g>
  <!-- duvet, pillows -->
  <path d="M68 102 Q71 92 88 92 L172 92 Q188 92 192 104 L192 122 L68 122 Z" fill="#FDFCF8" stroke="${INK}" stroke-width="2"/>
  <path d="M76 112 Q108 106 140 112 M120 94 Q124 104 120 120" fill="none" stroke="#E0DAD0" stroke-width="1.6"/>
  <rect x="72" y="96" width="34" height="21" rx="9" fill="#F6CBD9" stroke="${INK}" stroke-width="1.8"/>
  <circle cx="83" cy="104" r="1.5" fill="#D584A8"/><circle cx="88" cy="109" r="1.5" fill="#D584A8"/><circle cx="95" cy="103" r="1.5" fill="#D584A8"/>
  <rect x="108" y="97" width="30" height="19" rx="8" fill="#EADAEC" stroke="${INK}" stroke-width="1.8"/>
  <circle cx="117" cy="104" r="1.4" fill="#B79DE0"/><circle cx="127" cy="108" r="1.4" fill="#B79DE0"/>
  <!-- rattan bed frame with oval motifs -->
  <rect x="64" y="122" width="132" height="16" rx="5" fill="#C9A36A" stroke="${INK}" stroke-width="2"/>
  ${ovals}
  <path d="M70 138 L70 152 M190 138 L190 152" stroke="#A8804C" stroke-width="4" stroke-linecap="round"/>
  <!-- little bookshelf at the head -->
  <rect x="204" y="112" width="30" height="42" rx="3" fill="#8A6A48" stroke="${INK}" stroke-width="1.8"/>
  <line x1="206" y1="133" x2="232" y2="133" stroke="${INK}" stroke-width="1.4" opacity=".6"/>
  ${spines(207, 117, 14, ['#F5A8C7', '#92BDE8', '#F7E08E'])}
  ${spines(207, 137, 14, ['#8ED8CE', '#B79DE0', '#F7B884'])}
  <!-- cane dresser -->
  <rect x="242" y="122" width="66" height="46" rx="5" fill="#CBA97B" stroke="${INK}" stroke-width="2.2"/>
  <rect x="248" y="128" width="54" height="15" rx="3" fill="#DDBE8E" stroke="#A8804C" stroke-width="1.4"/>
  <rect x="248" y="147" width="54" height="15" rx="3" fill="#DDBE8E" stroke="#A8804C" stroke-width="1.4"/>
  <path d="M252 130 L262 141 M262 130 L252 141 M272 130 L282 141 M282 130 L272 141 M292 130 L300 139" stroke="#C1A06E" stroke-width="1.1"/>
  <path d="M252 149 L262 160 M262 149 L252 160 M272 149 L282 160 M282 149 L272 160 M292 149 L300 158" stroke="#C1A06E" stroke-width="1.1"/>
  <circle cx="275" cy="135.5" r="2" fill="#D9B36A" stroke="${INK}" stroke-width="1"/>
  <circle cx="275" cy="154.5" r="2" fill="#D9B36A" stroke="${INK}" stroke-width="1"/>
  <path d="M266 118 Q270 110 274 118 Z" fill="#8FBF84"/>
  <rect x="268" y="116" width="6" height="6" rx="1.5" fill="#E2AC88" stroke="${INK}" stroke-width="1.2"/>
  <!-- slippers by the bed -->
  <ellipse cx="118" cy="202" rx="9" ry="4" fill="#F4A9C4" stroke="${INK}" stroke-width="1.5"/>
  <ellipse cx="138" cy="204" rx="9" ry="4" fill="#F4A9C4" stroke="${INK}" stroke-width="1.5"/>
  </svg>`;
}

/* ---------------- OFFICE (IMG_2907) ----------------
   white desk + laptop, pink ergonomic chair, dark bookshelf, world
   map, gold étagère with trailing plants + record, floral rug,
   blue/grey curtains, fairy lights */
function office() {
  const bulbs = [
    [30, 21], [62, 25], [96, 24], [130, 19], [164, 17], [198, 15], [232, 17], [266, 21], [298, 22],
  ].map(([x, y], i) =>
    `<circle class="${i % 2 ? 'anim-tw2' : 'anim-tw1'}" cx="${x}" cy="${y}" r="2.6" fill="${i % 2 ? '#FFE9A8' : '#FFF7D8'}" stroke="#E3BE5C" stroke-width=".8"/>`).join('');
  return `${svgOpen}
  <rect width="320" height="172" fill="#F3ECE0"/>
  ${floorStrip(172)}
  <path d="M6 16 Q80 30 160 18 Q240 8 314 20" fill="none" stroke="#C9B78A" stroke-width="1.3"/>
  ${bulbs}
  <!-- world map on whitewashed planks -->
  <rect x="24" y="34" width="76" height="50" rx="2" fill="#EDE3D0" stroke="${INK}" stroke-width="2"/>
  <line x1="24" y1="47" x2="100" y2="47" stroke="#DFD3BC" stroke-width="1.2"/>
  <line x1="24" y1="60" x2="100" y2="60" stroke="#DFD3BC" stroke-width="1.2"/>
  <line x1="24" y1="73" x2="100" y2="73" stroke="#DFD3BC" stroke-width="1.2"/>
  <path d="M32 44 Q40 38 46 44 Q50 50 44 54 Q34 54 32 44 Z" fill="#A9C9A3"/>
  <path d="M40 60 Q46 56 48 62 Q46 72 40 70 Z" fill="#A9C9A3"/>
  <path d="M56 42 Q64 38 68 44 Q66 50 58 49 Z" fill="#E7C79E"/>
  <path d="M58 54 Q68 50 72 58 Q70 68 62 66 Q56 60 58 54 Z" fill="#D8B8A0"/>
  <path d="M78 46 Q88 40 92 48 Q90 58 80 56 Z" fill="#A9C9A3"/>
  <path d="M84 64 Q90 62 90 67 Q88 71 84 69 Z" fill="#E7C79E"/>
  <!-- gold étagère: trailing plant, record, books -->
  <path d="M18 92 L18 168 M60 92 L60 168 M18 96 L60 96 M18 122 L60 122 M18 148 L60 148" stroke="#C9A557" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M28 86 L44 86 L41 96 L31 96 Z" fill="#E2AC88" stroke="${INK}" stroke-width="1.6"/>
  <ellipse cx="30" cy="82" rx="6" ry="4" fill="#8FBF84" transform="rotate(-24 30 82)"/>
  <ellipse cx="42" cy="82" rx="6" ry="4" fill="#9DC48F" transform="rotate(24 42 82)"/>
  <g class="anim-plant">
    <path d="M24 96 Q18 110 22 124 Q25 134 20 142" fill="none" stroke="#7FA86A" stroke-width="1.8"/>
    <ellipse cx="21" cy="106" rx="3.4" ry="2.2" fill="#8FBF84"/>
    <ellipse cx="23" cy="120" rx="3.4" ry="2.2" fill="#9DC48F"/>
    <ellipse cx="21" cy="136" rx="3.4" ry="2.2" fill="#8FBF84"/>
  </g>
  <circle cx="40" cy="110" r="10" fill="#3A3350" stroke="${INK}" stroke-width="1.4"/>
  <circle cx="40" cy="110" r="3.4" fill="#F2B8CC"/>
  ${spines(26, 132, 14, ['#F5A8C7', '#92BDE8', '#F7E08E', '#8ED8CE'])}
  <!-- window with blue-grey curtains -->
  <rect x="118" y="30" width="76" height="82" rx="3" fill="#FDFCF9" stroke="${INK}" stroke-width="2.2"/>
  <rect x="124" y="36" width="64" height="70" fill="${SKY}"/>
  <line x1="156" y1="36" x2="156" y2="106" stroke="#FFFFFF" stroke-width="2.4"/>
  <line x1="124" y1="71" x2="188" y2="71" stroke="#FFFFFF" stroke-width="2.4"/>
  <path d="M112 26 L200 26" stroke="#8FA6C4" stroke-width="4" stroke-linecap="round"/>
  <path d="M114 28 Q124 70 112 116 L104 116 L104 28 Z" fill="#93A9C6" stroke="${INK}" stroke-width="1.8"/>
  <path d="M198 28 Q188 70 200 116 L208 116 L208 28 Z" fill="#93A9C6" stroke="${INK}" stroke-width="1.8"/>
  <path d="M109 40 Q114 72 108 104 M203 40 Q198 72 204 104" fill="none" stroke="#7E96B4" stroke-width="1.4"/>
  <!-- dark bookshelf with colorful spines -->
  <rect x="232" y="56" width="78" height="112" rx="4" fill="#4A4258" stroke="${INK}" stroke-width="2.2"/>
  <line x1="236" y1="92" x2="306" y2="92" stroke="${INK}" stroke-width="2"/>
  <line x1="236" y1="128" x2="306" y2="128" stroke="${INK}" stroke-width="2"/>
  ${spines(238, 66, 24, ['#F5A8C7', '#92BDE8', '#F7E08E', '#8ED8CE', '#B79DE0', '#F7B884', '#A5D9A2', '#D3C4EE'])}
  ${spines(238, 102, 24, ['#B79DE0', '#F7B884', '#F5A8C7', '#A5D9A2', '#92BDE8', '#F7E08E', '#8ED8CE', '#D3C4EE'])}
  ${spines(238, 138, 24, ['#8ED8CE', '#F7E08E', '#B79DE0', '#F5A8C7', '#F7B884', '#92BDE8', '#D3C4EE', '#A5D9A2'])}
  <path d="M288 50 Q292 42 296 50 Z" fill="#8FBF84"/>
  <rect x="290" y="49" width="5" height="6" rx="1.5" fill="#E2AC88" stroke="${INK}" stroke-width="1.1"/>
  <!-- dark floral rug -->
  <ellipse cx="152" cy="200" rx="104" ry="15" fill="#4A4066" stroke="#3A3355" stroke-width="2"/>
  <circle cx="110" cy="198" r="2.2" fill="#D8A7B8"/><circle cx="150" cy="204" r="2.2" fill="#8FA6C4"/>
  <circle cx="190" cy="198" r="2.2" fill="#D8A7B8"/><circle cx="132" cy="194" r="1.6" fill="#8FA6C4"/><circle cx="172" cy="206" r="1.6" fill="#D8A7B8"/>
  <!-- white desk, laptop, notebook -->
  <rect x="100" y="116" width="118" height="7" rx="3.5" fill="#FDFCF8" stroke="${INK}" stroke-width="2"/>
  <rect x="105" y="123" width="6" height="49" fill="#FDFCF8" stroke="${INK}" stroke-width="1.6"/>
  <rect x="207" y="123" width="6" height="49" fill="#FDFCF8" stroke="${INK}" stroke-width="1.6"/>
  <rect x="130" y="94" width="34" height="22" rx="3" fill="#9FB4CE" stroke="${INK}" stroke-width="1.8"/>
  <rect x="133" y="97" width="28" height="16" rx="2" fill="#D9E7F4"/>
  <rect x="126" y="114" width="42" height="4" rx="2" fill="#C7CEDC" stroke="${INK}" stroke-width="1.2"/>
  <rect x="176" y="110" width="24" height="6" rx="2" fill="#F2B8CC" stroke="${INK}" stroke-width="1.4"/>
  <!-- pink ergonomic chair -->
  <ellipse cx="170" cy="124" rx="11" ry="7.5" fill="#F5B8C8" stroke="${INK}" stroke-width="1.8"/>
  <rect x="158" y="132" width="24" height="28" rx="11" fill="#F5B8C8" stroke="${INK}" stroke-width="1.8"/>
  <path d="M163 138 Q170 142 177 138" fill="none" stroke="#D999B4" stroke-width="1.5"/>
  <rect x="152" y="158" width="36" height="9" rx="4.5" fill="#F5B8C8" stroke="${INK}" stroke-width="1.8"/>
  <line x1="170" y1="167" x2="170" y2="182" stroke="#B8B2C6" stroke-width="3"/>
  <path d="M154 192 L170 182 L186 192 M170 182 L170 194" fill="none" stroke="#B8B2C6" stroke-width="2.6" stroke-linecap="round"/>
  <circle cx="154" cy="194" r="2.4" fill="#8E8AA0"/><circle cx="186" cy="194" r="2.4" fill="#8E8AA0"/><circle cx="170" cy="196" r="2.4" fill="#8E8AA0"/>
  </svg>`;
}

/* ---------------- LIVING ROOM (IMG_2912) ----------------
   grey sectional + cozy blanket + sleeping cat, wall TV, fireplace
   with rosy tile, white lamp, cat tree, cellular-shade window */
function livingRoom() {
  let pleats = '';
  for (let y = 42; y < 76; y += 6) {
    pleats += `<line x1="96" y1="${y}" x2="172" y2="${y}" stroke="#E7DFD0" stroke-width="1.3"/>`;
  }
  let tiles = '';
  for (let ty = 92; ty < 164; ty += 14) tiles += `<line x1="252" y1="${ty}" x2="308" y2="${ty}" stroke="#C98A78" stroke-width="1.2"/>`;
  for (let tx = 266; tx < 308; tx += 14) tiles += `<line x1="${tx}" y1="90" x2="${tx}" y2="164" stroke="#C98A78" stroke-width="1.2"/>`;
  return `${svgOpen}
  <rect width="320" height="172" fill="#F4EDE1"/>
  ${floorStrip(172)}
  <line x1="0" y1="9" x2="320" y2="9" stroke="#E6DCCB" stroke-width="3"/>
  <!-- cat tree -->
  <rect x="14" y="160" width="34" height="8" rx="3" fill="#D9C4A8" stroke="${INK}" stroke-width="1.8"/>
  <rect x="27" y="108" width="8" height="52" fill="#C9B08E" stroke="${INK}" stroke-width="1.5"/>
  <path d="M27 116 L35 120 M27 128 L35 132 M27 140 L35 144 M27 152 L35 156" stroke="#A8906C" stroke-width="1.3"/>
  <ellipse cx="31" cy="106" rx="17" ry="5.5" fill="#D9C4A8" stroke="${INK}" stroke-width="1.8"/>
  <rect x="27" y="72" width="8" height="32" fill="#C9B08E" stroke="${INK}" stroke-width="1.5"/>
  <rect x="16" y="52" width="30" height="22" rx="5" fill="#D9C4A8" stroke="${INK}" stroke-width="1.8"/>
  <circle cx="31" cy="63" r="7" fill="#6B5A44"/>
  <!-- window with cellular shade, behind the sofa -->
  <rect x="90" y="30" width="88" height="66" rx="3" fill="#FDFCF9" stroke="${INK}" stroke-width="2.2"/>
  <rect x="96" y="36" width="76" height="54" fill="#F8F4EA" stroke="${INK}" stroke-width="1.2"/>
  ${pleats}
  <rect x="96" y="78" width="76" height="12" fill="${SKY}"/>
  <line x1="96" y1="78" x2="172" y2="78" stroke="${INK}" stroke-width="1.2" opacity=".5"/>
  <!-- TV above the fireplace -->
  <rect x="238" y="24" width="72" height="44" rx="3" fill="#3A3350" stroke="${INK}" stroke-width="2"/>
  <path d="M246 60 L296 32" stroke="#FFFFFF" stroke-width="4" opacity=".12"/>
  <!-- grey sectional with blanket + sleeping cat -->
  <rect x="58" y="110" width="16" height="48" rx="8" fill="#9BA3B0" stroke="${INK}" stroke-width="2"/>
  <rect x="204" y="110" width="16" height="48" rx="8" fill="#9BA3B0" stroke="${INK}" stroke-width="2"/>
  <rect x="70" y="94" width="68" height="34" rx="11" fill="#A8AFBC" stroke="${INK}" stroke-width="2"/>
  <rect x="140" y="94" width="66" height="34" rx="11" fill="#A8AFBC" stroke="${INK}" stroke-width="2"/>
  <rect x="66" y="124" width="146" height="36" rx="10" fill="#9BA3B0" stroke="${INK}" stroke-width="2.2"/>
  <line x1="139" y1="128" x2="139" y2="156" stroke="#818996" stroke-width="1.8"/>
  <path d="M60 112 Q72 108 74 118 L74 148 Q66 152 60 148 Z" fill="#D8C7E8" stroke="${INK}" stroke-width="1.6"/>
  <path d="M63 118 L71 118 M63 126 L71 126 M63 134 L71 134" stroke="#B7A3D4" stroke-width="1.3"/>
  <!-- the cat, curled up asleep -->
  <ellipse cx="176" cy="118" rx="15" ry="9.5" fill="#A67858" stroke="${INK}" stroke-width="1.8"/>
  <path d="M186 112 Q192 108 190 103 L185 107 Z" fill="#A67858" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>
  <path d="M178 108 L181 103 L184 108 Z" fill="#A67858" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>
  <path d="M163 120 Q159 126 166 127 Q174 128 175 124" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>
  <path d="M182 112 Q184 114 186 112" fill="none" stroke="${INK}" stroke-width="1.3" stroke-linecap="round"/>
  <path d="M170 114 Q173 112 176 114" fill="none" stroke="#8A5F42" stroke-width="1.3"/>
  <!-- round wood coffee table -->
  <ellipse cx="140" cy="184" rx="42" ry="9" fill="#D9A268" stroke="${INK}" stroke-width="2"/>
  <path d="M112 190 L108 204 M168 190 L172 204 M140 193 L140 206" stroke="#A8804C" stroke-width="3" stroke-linecap="round"/>
  <!-- white lamp (glow breathes) -->
  <ellipse class="anim-lamp" cx="228" cy="104" rx="16" ry="12" fill="#FFE9B8" opacity=".5"/>
  <path d="M218 92 L238 92 L242 112 L214 112 Z" fill="#FDF6E4" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>
  <line x1="228" y1="112" x2="228" y2="152" stroke="#C9B08E" stroke-width="3"/>
  <ellipse cx="228" cy="155" rx="10" ry="3.5" fill="#C9B08E" stroke="${INK}" stroke-width="1.5"/>
  <!-- fireplace: white mantel, rosy tile, warm hearth -->
  <path d="M296 78 Q300 70 304 78 Z" fill="#8FBF84"/>
  <path d="M298 78 Q294 86 300 92" fill="none" stroke="#7FA86A" stroke-width="1.5"/>
  <rect x="244" y="78" width="76" height="9" rx="3" fill="#FDFCF8" stroke="${INK}" stroke-width="2.2"/>
  <rect x="248" y="87" width="11" height="81" fill="#FDFCF8" stroke="${INK}" stroke-width="1.8"/>
  <rect x="301" y="87" width="11" height="81" fill="#FDFCF8" stroke="${INK}" stroke-width="1.8"/>
  <rect x="259" y="87" width="42" height="81" fill="#DFA593"/>
  ${tiles}
  <rect x="266" y="102" width="28" height="56" rx="4" fill="#3A3350" stroke="${INK}" stroke-width="2"/>
  <path class="anim-ember" d="M272 158 Q280 138 288 158 Z" fill="#F7C98F" opacity=".8"/>
  <rect x="270" y="152" width="20" height="5" rx="2.5" fill="#8A6A48" stroke="${INK}" stroke-width="1.2"/>
  </svg>`;
}

export const ROOM_ART = {
  kitchen,
  mudroom,
  foyer,
  bedroom,
  office,
  'living-room': livingRoom,
};

/* ---------------- house chrome: roof, cloud base, extras ---------------- */

export function houseRoof() {
  let scallops = '';
  for (const [y, x0, x1] of [[64, 220, 900], [96, 140, 980], [128, 70, 1050]]) {
    let d = `M ${x0} ${y}`;
    for (let x = x0; x < x1; x += 44) d += ` Q ${x + 22} ${y + 24} ${x + 44} ${y}`;
    scallops += `<path d="${d}" fill="none" stroke="#E0A6C2" stroke-width="2.5" opacity=".7"/>`;
  }
  return `<svg viewBox="0 -70 1120 224" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <g class="anim-smoke-1">${star(916, -14, 8)}</g>
  <g class="anim-smoke-2">${star(942, -36, 6, '#FFE9B8')}</g>
  <g class="anim-smoke-3">${star(904, -54, 4.5)}</g>
  <rect x="880" y="-4" width="64" height="66" rx="4" fill="#E3B49E" stroke="${INK}" stroke-width="3"/>
  <path d="M880 18 L944 18 M880 40 L944 40 M912 -4 L912 18 M896 18 L896 40 M928 18 L928 40 M912 40 L912 62" stroke="#C98A78" stroke-width="2"/>
  <rect x="872" y="-16" width="80" height="16" rx="6" fill="#D9A090" stroke="${INK}" stroke-width="3"/>
  <path d="M16 152 Q60 44 200 34 L920 34 Q1060 44 1104 152 Z" fill="#F2C0D6" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
  ${scallops}
  <circle cx="560" cy="100" r="22" fill="#FDFCF8" stroke="${INK}" stroke-width="2.5"/>
  <circle cx="560" cy="100" r="15" fill="#FFE9B8" stroke="${INK}" stroke-width="1.6"/>
  <path d="M560 85 L560 115 M545 100 L575 100" stroke="${INK}" stroke-width="1.6" opacity=".7"/>
  ${star(500, 60, 6, '#FFFFFF')}
  ${star(640, 74, 5, '#FFE9B8')}
  </svg>`;
}

export function houseBase() {
  return `<svg viewBox="0 0 1120 130" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <ellipse cx="560" cy="100" rx="470" ry="24" fill="#E4E0FA" opacity=".55"/>
  <ellipse cx="150" cy="58" rx="130" ry="40" fill="#FFFFFF" opacity=".96"/>
  <ellipse cx="370" cy="48" rx="170" ry="50" fill="#FFFFFF"/>
  <ellipse cx="610" cy="60" rx="190" ry="46" fill="#FFFFFF" opacity=".97"/>
  <ellipse cx="850" cy="46" rx="160" ry="48" fill="#FFFFFF"/>
  <ellipse cx="1010" cy="64" rx="115" ry="38" fill="#FFFFFF" opacity=".95"/>
  <ellipse cx="60" cy="82" rx="70" ry="26" fill="#FFFFFF" opacity=".9"/>
  <ellipse cx="1070" cy="86" rx="66" ry="24" fill="#FFFFFF" opacity=".9"/>
  </svg>`;
}

/* neat little stack of moving boxes — shown when a room has lots to do */
export function boxStack() {
  return `<svg viewBox="0 0 40 34" width="34" height="29" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <rect x="4" y="16" width="18" height="15" rx="2" fill="#E2B98A" stroke="${INK}" stroke-width="1.6"/>
  <path d="M4 21 L22 21 M13 16 L13 21" stroke="#B98F5C" stroke-width="1.3"/>
  <rect x="22" y="18" width="15" height="13" rx="2" fill="#EDCA9E" stroke="${INK}" stroke-width="1.6"/>
  <path d="M22 23 L37 23" stroke="#B98F5C" stroke-width="1.3"/>
  <rect x="10" y="4" width="16" height="13" rx="2" fill="#EDCA9E" stroke="${INK}" stroke-width="1.6"/>
  <path d="M10 9 L26 9 M18 4 L18 9" stroke="#B98F5C" stroke-width="1.3"/>
  </svg>`;
}
