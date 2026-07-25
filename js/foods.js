/* ============================================================
   DREAMCAST — kawaii groceries: icons, matching, shelf life
   ============================================================ */

/* tiny face every food wears */
const face = (x = 20, y = 22) =>
  `<circle cx="${x - 4}" cy="${y}" r="1.3" fill="#4A3222"/><circle cx="${x + 4}" cy="${y}" r="1.3" fill="#4A3222"/>` +
  `<path d="M${x - 2} ${y + 3} Q${x} ${y + 5} ${x + 2} ${y + 3}" stroke="#4A3222" stroke-width="1.2" fill="none" stroke-linecap="round"/>`;

const O = 'stroke="#4A3222" stroke-width="1.3"'; // soft outline

const ICONS = {
  milk: `<path d="M13 14 L16 8 L24 8 L27 14 L27 33 Q27 35 25 35 L15 35 Q13 35 13 33 Z" fill="#EAF4FD" ${O}/><path d="M13 14 L27 14" ${O}/><path d="M16 8 L20 14 L20 35" stroke="#BFD9F2" stroke-width="1.2"/>${face(20, 24)}`,
  eggs: `<path d="M8 20 Q8 16 12 16 L28 16 Q32 16 32 20 L32 28 Q32 32 28 32 L12 32 Q8 32 8 28 Z" fill="#F7EBDC" ${O}/><ellipse cx="14" cy="16" rx="4" ry="5" fill="#FFF9F0" ${O}/><ellipse cx="26" cy="16" rx="4" ry="5" fill="#FFF9F0" ${O}/>${face(20, 24)}`,
  bread: `<path d="M8 20 Q8 12 20 12 Q32 12 32 20 L32 30 Q32 32 30 32 L10 32 Q8 32 8 30 Z" fill="#F2D8AE" ${O}/><path d="M14 12 Q14 20 14 30 M26 12 Q26 20 26 30" stroke="#DDB77F" stroke-width="1.2"/>${face(20, 23)}`,
  cheese: `<path d="M6 28 L34 28 L34 18 Q20 10 6 18 Z" fill="#FBE7A2" ${O}/><circle cx="14" cy="22" r="2.2" fill="#F5D778"/><circle cx="27" cy="24" r="1.8" fill="#F5D778"/>${face(20, 23)}`,
  yogurt: `<path d="M12 14 L28 14 L26 33 Q26 35 24 35 L16 35 Q14 35 14 33 Z" fill="#FBEFF5" ${O}/><rect x="11" y="10" width="18" height="4" rx="2" fill="#F5A8C7" ${O}/>${face(20, 24)}`,
  butter: `<path d="M8 18 L32 18 L32 28 Q32 30 30 30 L10 30 Q8 30 8 28 Z" fill="#FBE7A2" ${O}/><path d="M8 22 L32 22" stroke="#E8CF7E" stroke-width="1.2"/>${face(20, 26)}`,
  apple: `<circle cx="20" cy="23" r="11" fill="#F5A8B8" ${O}/><path d="M20 12 Q20 8 23 7" fill="none" ${O} stroke-linecap="round"/><ellipse cx="25" cy="9" rx="3.5" ry="2" fill="#A5D9A2" ${O}/>${face(20, 23)}`,
  banana: `<path d="M10 12 Q8 28 22 32 Q32 34 34 26 Q30 30 22 27 Q12 23 14 12 Q14 10 12 10 Q10 10 10 12 Z" fill="#FBE7A2" ${O}/>${face(22, 24)}`,
  berries: `<path d="M20 12 Q30 14 29 24 Q28 32 20 34 Q12 32 11 24 Q10 14 20 12 Z" fill="#F58BB8" ${O}/><ellipse cx="20" cy="10" rx="5" ry="2.5" fill="#A5D9A2" ${O}/><g fill="#FBE7A2"><circle cx="16" cy="20" r=".9"/><circle cx="24" cy="20" r=".9"/><circle cx="20" cy="28" r=".9"/><circle cx="15" cy="26" r=".9"/><circle cx="25" cy="26" r=".9"/></g>${face(20, 22)}`,
  grapes: `<circle cx="14" cy="18" r="5" fill="#CBAEE8" ${O}/><circle cx="26" cy="18" r="5" fill="#CBAEE8" ${O}/><circle cx="20" cy="24" r="5.5" fill="#B79DE0" ${O}/><path d="M20 12 Q20 8 23 7" fill="none" ${O} stroke-linecap="round"/>${face(20, 24)}`,
  citrus: `<circle cx="20" cy="22" r="11" fill="#FBCB8E" ${O}/><path d="M20 11 L20 33 M9 22 L31 22 M12 14 L28 30 M28 14 L12 30" stroke="#F0AC5F" stroke-width="1" opacity=".7"/>${face(20, 22)}`,
  avocado: `<path d="M20 8 Q28 8 29 18 Q33 32 20 34 Q7 32 11 18 Q12 8 20 8 Z" fill="#B9DBA8" ${O}/><circle cx="20" cy="25" r="5" fill="#C89272" ${O}/>${face(20, 15)}`,
  tomato: `<circle cx="20" cy="23" r="10.5" fill="#F58BA0" ${O}/><path d="M20 12 L17 8 M20 12 L23 8 M20 12 L20 7" stroke="#A5D9A2" stroke-width="1.6" stroke-linecap="round"/>${face(20, 23)}`,
  carrot: `<path d="M16 12 L24 12 L21.5 34 Q20 36 18.5 34 Z" fill="#FBCB8E" ${O}/><path d="M18 12 L15 6 M20 12 L20 5 M22 12 L25 6" stroke="#A5D9A2" stroke-width="1.6" stroke-linecap="round"/>${face(20, 20)}`,
  broccoli: `<circle cx="14" cy="16" r="6" fill="#A5D9A2" ${O}/><circle cx="26" cy="16" r="6" fill="#A5D9A2" ${O}/><circle cx="20" cy="12" r="6" fill="#B9DBA8" ${O}/><path d="M17 22 L17 32 Q20 34 23 32 L23 22" fill="#D4EDC4" ${O}/>${face(20, 17)}`,
  greens: `<path d="M20 8 Q32 12 30 24 Q28 34 20 34 Q12 34 10 24 Q8 12 20 8 Z" fill="#C4E8B4" ${O}/><path d="M20 10 Q20 22 20 33 M14 14 Q17 22 19 32 M26 14 Q23 22 21 32" stroke="#93C388" stroke-width="1.1" opacity=".8"/>${face(20, 24)}`,
  onion: `<circle cx="20" cy="23" r="10" fill="#DCC3EE" ${O}/><path d="M20 13 Q19 8 20 6 M20 13 Q23 9 25 8" stroke="#B79DE0" stroke-width="1.4" stroke-linecap="round"/><path d="M14 18 Q20 22 26 18 M13 25 Q20 29 27 25" stroke="#C7A9E4" stroke-width="1" opacity=".8"/>${face(20, 23)}`,
  potato: `<ellipse cx="20" cy="23" rx="12" ry="9" fill="#E0C39E" ${O}/><g fill="#C6A176"><circle cx="14" cy="20" r="1"/><circle cx="26" cy="26" r="1"/><circle cx="24" cy="18" r=".9"/></g>${face(19, 24)}`,
  chicken: `<ellipse cx="17" cy="19" rx="10" ry="8.5" fill="#F2D8AE" ${O}/><path d="M25 25 L31 31" stroke="#F2D8AE" stroke-width="5" stroke-linecap="round"/><path d="M25 25 L31 31" stroke="#4A3222" stroke-width="5.5" fill="none" opacity="0"/><circle cx="31.5" cy="31.5" r="2.6" fill="#FFF9F0" ${O}/>${face(16, 19)}`,
  fish: `<path d="M8 22 Q14 12 24 14 Q32 16 32 22 Q32 28 24 30 Q14 32 8 22 Z" fill="#AFD7EE" ${O}/><path d="M32 22 L38 16 L36 22 L38 28 Z" fill="#AFD7EE" ${O}/>${face(16, 21)}`,
  meat: `<ellipse cx="20" cy="22" rx="12" ry="9" fill="#F0A8A8" ${O}/><ellipse cx="24" cy="22" rx="4" ry="3" fill="#FBEFF5" ${O}/>${face(15, 21)}`,
  tofu: `<rect x="9" y="14" width="22" height="16" rx="3" fill="#FFF9F0" ${O}/>${face(20, 22)}`,
  rice: `<path d="M8 22 L32 22 Q32 32 20 32 Q8 32 8 22 Z" fill="#AFD7EE" ${O}/><path d="M13 22 Q13 15 20 14 Q27 15 27 22" fill="#FFF9F0" ${O}/>${face(20, 26)}`,
  pasta: `<rect x="10" y="10" width="20" height="24" rx="2.5" fill="#FBCB8E" ${O}/><path d="M14 15 L14 29 M18 15 L18 29 M22 15 L22 29 M26 15 L26 29" stroke="#F0AC5F" stroke-width="1.6"/>${face(20, 24)}`,
  cereal: `<rect x="10" y="9" width="20" height="26" rx="2.5" fill="#DCC3EE" ${O}/><g fill="#FBE7A2" ${O}><circle cx="16" cy="16" r="2"/><circle cx="24" cy="15" r="2"/><circle cx="20" cy="20" r="2"/></g>${face(20, 28)}`,
  can: `<rect x="11" y="11" width="18" height="22" rx="3" fill="#C9E4F5" ${O}/><ellipse cx="20" cy="11" rx="9" ry="2.6" fill="#EAF4FD" ${O}/><path d="M11 17 L29 17 M11 27 L29 27" stroke="#9CC4E0" stroke-width="1"/>${face(20, 22)}`,
  juice: `<path d="M14 12 L26 12 L28 33 Q28 35 26 35 L14 35 Q12 35 12 33 Z" fill="#FBCB8E" ${O}/><rect x="16" y="6" width="8" height="6" rx="1.5" fill="#F0AC5F" ${O}/>${face(20, 25)}`,
  coffee: `<path d="M10 14 Q10 10 14 10 L26 10 Q30 10 30 14 L30 30 Q30 34 26 34 L14 34 Q10 34 10 30 Z" fill="#D8B79A" ${O}/><path d="M10 18 L30 18" ${O}/><ellipse cx="20" cy="14" rx="4" ry="2" fill="#B98D66" ${O}/>${face(20, 26)}`,
  snacks: `<path d="M12 10 L28 10 L31 34 L9 34 Z" fill="#F5C0A0" ${O}/><g fill="#E89B6E"><circle cx="17" cy="18" r="1.2"/><circle cx="24" cy="22" r="1.2"/><circle cx="18" cy="28" r="1.2"/></g>${face(20, 21)}`,
  dip: `<path d="M9 20 Q9 17 12 17 L28 17 Q31 17 31 20 L31 28 Q31 33 26 33 L14 33 Q9 33 9 28 Z" fill="#F7E8D2" ${O}/><ellipse cx="20" cy="17" rx="11" ry="2.5" fill="#FBF3E4" ${O}/>${face(20, 25)}`,
  dish: `<path d="M15 9 Q16 6 15 4 M21 9 Q22 6 21 4 M27 9 Q28 6 27 4" stroke="#C9C4D8" stroke-width="1.3" fill="none" stroke-linecap="round"/><rect x="8" y="17" width="24" height="15" rx="4" fill="#CDE6F7" opacity=".9" ${O}/><rect x="6" y="12" width="28" height="6.5" rx="3.2" fill="#F5A8C7" ${O}/><path d="M11 24 Q14 27 17 24 Q20 27 23 24 Q26 27 29 24" stroke="#8FB8DC" stroke-width="1.3" fill="none"/>${face(20, 28)}`,
  generic: `<path d="M12 14 Q12 8 20 8 Q28 8 28 14 L30 30 Q30 34 26 34 L14 34 Q10 34 10 30 Z" fill="#DCE6F8" ${O}/><path d="M15 14 Q15 11 20 11 Q25 11 25 14" fill="none" ${O}/>${face(20, 24)}`,
};

/* keyword → icon, shelf-life days (null = nonperishable), storage area */
const DB = [
  [/milk|oat ?milk|almond ?milk|cream/i, 'milk', 7, 'fridge'],
  [/egg/i, 'eggs', 21, 'fridge'],
  [/bread|bagel|baguette|tortilla|pita/i, 'bread', 5, 'fridge'],
  [/cheese|mozzarella|cheddar|parm|feta|brie/i, 'cheese', 21, 'fridge'],
  [/yogurt|yoghurt|kefir/i, 'yogurt', 14, 'fridge'],
  [/butter|margarine/i, 'butter', 60, 'fridge'],
  [/apple|pear|peach|plum|nectarine/i, 'apple', 21, 'fridge'],
  [/banana/i, 'banana', 6, 'pantry'],
  [/strawberr|raspberr|blueberr|blackberr|berr/i, 'berries', 4, 'fridge'],
  [/grape|cherr/i, 'grapes', 7, 'fridge'],
  [/orange|lemon|lime|citrus|clementine|grapefruit|mandarin/i, 'citrus', 14, 'fridge'],
  [/avocado/i, 'avocado', 5, 'fridge'],
  [/tomato/i, 'tomato', 6, 'fridge'],
  [/carrot/i, 'carrot', 21, 'fridge'],
  [/broccoli|cauliflower|brussels/i, 'broccoli', 6, 'fridge'],
  [/lettuce|spinach|kale|salad|greens|arugula|cabbage|cucumber|zucchini|pepper|celery/i, 'greens', 5, 'fridge'],
  [/onion|garlic|shallot/i, 'onion', 30, 'pantry'],
  [/potato/i, 'potato', 30, 'pantry'],
  [/chicken|turkey|poultry/i, 'chicken', 2, 'fridge'],
  [/salmon|tuna|shrimp|seafood|fish/i, 'fish', 2, 'fridge'],
  [/beef|steak|pork|lamb|sausage|bacon|meat|deli|ham/i, 'meat', 3, 'fridge'],
  [/tofu|tempeh/i, 'tofu', 7, 'fridge'],
  [/rice|quinoa|grain|couscous|farro/i, 'rice', null, 'pantry'],
  [/pasta|noodle|spaghetti|macaroni|ramen/i, 'pasta', null, 'pantry'],
  [/cereal|granola|oat|muesli/i, 'cereal', null, 'pantry'],
  [/bean|chickpea|lentil|canned|can of|soup|broth|sauce|tomato paste/i, 'can', null, 'pantry'],
  [/juice|smoothie|lemonade|kombucha/i, 'juice', 10, 'fridge'],
  [/coffee|tea|matcha|cocoa/i, 'coffee', null, 'pantry'],
  [/chip|cracker|snack|pretzel|cookie|popcorn|granola bar/i, 'snacks', null, 'pantry'],
  [/hummus|dip|salsa|guac|pesto/i, 'dip', 7, 'fridge'],
  [/flour|sugar|honey|syrup|oil|vinegar|salt|spice|peanut butter|jam|nutella/i, 'can', null, 'pantry'],
];

/* ---------- staples & recipe ideas ---------- */

/* the boring-but-essential things everyone forgets to list */
export const STAPLES = [
  { id: 'salt', name: 'salt' },
  { id: 'pepper', name: 'black pepper' },
  { id: 'olive-oil', name: 'olive oil' },
  { id: 'oil', name: 'cooking oil' },
  { id: 'flour', name: 'flour' },
  { id: 'sugar', name: 'sugar' },
  { id: 'honey', name: 'honey / maple syrup' },
  { id: 'soy', name: 'soy sauce' },
  { id: 'vinegar', name: 'vinegar' },
  { id: 'mustard', name: 'mustard' },
  { id: 'mayo', name: 'mayo' },
  { id: 'ketchup', name: 'ketchup' },
  { id: 'hot-sauce', name: 'hot sauce' },
  { id: 'spices', name: 'dried spices (cumin, paprika…)' },
  { id: 'herbs', name: 'dried herbs (oregano, basil…)' },
  { id: 'garlic', name: 'garlic' },
  { id: 'stock', name: 'stock / bouillon' },
  { id: 'baking', name: 'baking powder & soda' },
  { id: 'vanilla', name: 'vanilla' },
  { id: 'breadcrumbs', name: 'breadcrumbs' },
];

const stapleName = id => STAPLES.find(s => s.id === id)?.name || id;

/* each need is a group of interchangeable icon keys; `label` names the group
   and doubles as the shopping-list entry when the group is missing */
const RECIPES = [
  { name: 'Veggie fried rice', emoji: '🍚',
    needs: [
      { any: ['rice'], label: 'rice' },
      { any: ['eggs'], label: 'eggs' },
      { any: ['carrot', 'broccoli', 'greens', 'onion'], label: 'a veggie' },
    ],
    staples: ['oil', 'soy'] },
  { name: 'Cozy pasta night', emoji: '🍝',
    needs: [
      { any: ['pasta'], label: 'pasta' },
      { any: ['tomato', 'can', 'cheese'], label: 'sauce or cheese' },
    ],
    staples: ['olive-oil', 'salt', 'garlic'] },
  { name: 'Cheesy omelette', emoji: '🍳',
    needs: [
      { any: ['eggs'], label: 'eggs' },
      { any: ['cheese', 'greens', 'tomato'], label: 'a filling' },
    ],
    staples: ['salt', 'pepper'] },
  { name: 'Grilled cheese', emoji: '🥪',
    needs: [
      { any: ['bread'], label: 'bread' },
      { any: ['cheese'], label: 'cheese' },
    ],
    staples: [] },
  { name: 'Weeknight stir-fry', emoji: '🥡',
    needs: [
      { any: ['chicken', 'tofu', 'meat', 'fish'], label: 'a protein' },
      { any: ['broccoli', 'carrot', 'greens', 'onion'], label: 'a veggie' },
      { any: ['rice', 'pasta'], label: 'rice or noodles' },
    ],
    staples: ['oil', 'soy', 'garlic'] },
  { name: 'Berry smoothie', emoji: '🥤',
    needs: [
      { any: ['berries', 'banana'], label: 'berries or a banana' },
      { any: ['milk', 'yogurt', 'juice'], label: 'milk, yogurt, or juice' },
    ],
    staples: ['honey'] },
  { name: 'Sheet-pan chicken', emoji: '🍗',
    needs: [
      { any: ['chicken'], label: 'chicken' },
      { any: ['potato', 'carrot', 'broccoli', 'onion'], label: 'a roastable veg' },
    ],
    staples: ['olive-oil', 'spices', 'salt'] },
  { name: 'Avocado toast', emoji: '🥑',
    needs: [
      { any: ['bread'], label: 'bread' },
      { any: ['avocado'], label: 'an avocado' },
    ],
    staples: ['salt', 'pepper'] },
  { name: 'Yogurt parfait', emoji: '🍓',
    needs: [
      { any: ['yogurt'], label: 'yogurt' },
      { any: ['berries', 'banana', 'cereal', 'apple'], label: 'fruit or granola' },
    ],
    staples: ['honey'] },
  { name: 'Pantry soup', emoji: '🥣',
    needs: [
      { any: ['can'], label: 'canned beans or soup base' },
      { any: ['carrot', 'potato', 'onion', 'greens', 'tomato'], label: 'a veggie' },
    ],
    staples: ['stock', 'salt', 'herbs'] },
  { name: 'Loaded baked potato', emoji: '🥔',
    needs: [
      { any: ['potato'], label: 'potatoes' },
      { any: ['cheese', 'yogurt', 'butter'], label: 'a topping' },
    ],
    staples: ['salt', 'pepper'] },
  { name: 'Fish & greens', emoji: '🐟',
    needs: [
      { any: ['fish'], label: 'fish' },
      { any: ['greens', 'broccoli', 'rice'], label: 'a side' },
    ],
    staples: ['olive-oil', 'salt'] },
  { name: 'Snack board', emoji: '🧀',
    needs: [
      { any: ['cheese', 'dip'], label: 'cheese or a dip' },
      { any: ['grapes', 'apple', 'snacks', 'bread', 'citrus'], label: 'something to pair' },
    ],
    staples: [] },
  { name: 'Breakfast for dinner', emoji: '🥞',
    needs: [
      { any: ['eggs'], label: 'eggs' },
      { any: ['milk'], label: 'milk' },
    ],
    staples: ['flour', 'sugar', 'baking'] },
];

/**
 * Rank recipe ideas against what's on the shelves.
 * items: fridge items (pass unexpired ones); stapleSet: Set of checked staple ids.
 * Returns [{ name, emoji, ready, have:[item names], missing:[labels], missingStaples:[names] }]
 */
export function suggestRecipes(items, stapleSet) {
  const byIcon = new Map();
  items.forEach(i => { if (!byIcon.has(i.icon)) byIcon.set(i.icon, i.name); });
  return RECIPES.map(r => {
    const have = [], missing = [];
    r.needs.forEach(g => {
      const hit = g.any.find(icon => byIcon.has(icon));
      if (hit) have.push(byIcon.get(hit));
      else missing.push(g.label);
    });
    const missingStaples = r.staples.filter(s => !stapleSet.has(s)).map(stapleName);
    return { name: r.name, emoji: r.emoji, ready: missing.length === 0, have, missing, missingStaples };
  })
    .filter(r => r.have.length > 0)
    .sort((a, b) => a.missing.length - b.missing.length || b.have.length - a.have.length);
}

/* ---------- recipe → grocery list ---------- */

const QTY_RE = /^((\d+\s+\d+\/\d+)|(\d+\/\d+)|(\d+([.,]\d+)?)|[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])(\s*(-|–|—|to)\s*((\d+\/\d+)|(\d+([.,]\d+)?)|[½⅓⅔¼¾⅛]))?\s*/;

const UNIT_RE = /^(cups?|c\.|tablespoons?|tbsps?|tbsp|tbs|teaspoons?|tsps?|tsp|fl\.? ?oz|ounces?|oz|pounds?|lbs?|lb|grams?|g|kilograms?|kgs?|kg|milliliters?|millilitres?|ml|liters?|litres?|l|quarts?|qts?|pints?|pts?|gallons?|sticks?|cloves?|cans?|jars?|packages?|pkgs?|packets?|bunch(es)?|heads?|stalks?|ribs?|sprigs?|slices?|pieces?|pinch(es)?|dash(es)?|handfuls?|knobs?|bags?|box(es)?|containers?|bottles?)\b\.?\s*/i;

const SECTION_RE = /^(ingredients?|instructions?|directions?|method|steps?|preparation|notes?|equipment|nutrition|for (the )?serving|to serve|garnish|topping|serves?|servings?|yields?|prep time|cook time|total time|course|cuisine|author|rating)\b/i;

const VERB_RE = /^(preheat|heat|mix|stir|bake|cook|serve|combine|add|whisk|pour|place|remove|let|transfer|season|bring|reduce|simmer|boil|drain|set aside|meanwhile|once|when|then|repeat|cover|garnish|sprinkle|enjoy|in a|using)\b/i;

function cleanIngredientLine(raw) {
  let s = raw.trim()
    .replace(/^[-–—*•▢☐■□✓✔·◦○●☐•]+\s*/, '') // bullets & checkboxes
    .replace(/\([^)]*\)/g, ' ')                          // parentheticals like "(14 oz)"
    .replace(/\s+/g, ' ')
    .trim();
  if (!s || /[:：]$/.test(s)) return null;               // "For the sauce:"
  if (SECTION_RE.test(s) || VERB_RE.test(s)) return null;
  s = s.replace(/^(about|approx\.?|roughly|optional:?)\s+/i, '');
  s = s.replace(QTY_RE, '').replace(UNIT_RE, '');
  s = s.replace(QTY_RE, '').replace(UNIT_RE, '');        // "2 15-oz cans …" leftovers
  s = s.replace(/^of\s+/i, '');
  s = s.split(/,| — | – /)[0];                           // drop ", finely chopped"
  s = s.replace(/\s+(to taste|for garnish|for serving|divided|as needed)$/i, '');
  s = s.replace(/\s+/g, ' ').trim().replace(/[.;]+$/, '');
  if (s.length < 2 || s.split(' ').length > 8) return null;
  return s;
}

/** Pull a shoppable ingredient list out of pasted recipe text. */
export function parseRecipeIngredients(text) {
  if (!text) return [];
  let lines = text.split('\n');
  // if the paste includes the whole page, keep only the ingredients section
  const start = lines.findIndex(l => /^\s*ingredients?\b/i.test(l));
  if (start !== -1) {
    const rest = lines.slice(start + 1);
    const end = rest.findIndex(l => /^\s*(instructions?|directions?|method|steps?|preparation|nutrition|notes?)\b/i.test(l));
    lines = end === -1 ? rest : rest.slice(0, end);
  }
  const out = [];
  const seen = new Set();
  for (const raw of lines) {
    const name = cleanIngredientLine(raw);
    if (!name) continue;
    const key = name.toLowerCase();
    if (!seen.has(key)) { seen.add(key); out.push(name); }
  }
  return out;
}

/** Match a grocery name to icon/shelf-life/area. */
export function matchFood(name) {
  for (const [re, icon, days, area] of DB) {
    if (re.test(name)) return { icon, days, area };
  }
  return { icon: 'generic', days: 7, area: 'fridge' };
}

/** A cooked dish (from a recipe/meal-prep task). */
export function dishFood() {
  return { icon: 'dish', days: 4, area: 'fridge' };
}

export function foodIconSvg(icon, size = 44) {
  // own-property lookup only: `icon` can arrive via imported backups, and this
  // string lands in innerHTML — inherited keys like 'constructor' must not resolve
  const body = Object.prototype.hasOwnProperty.call(ICONS, icon) ? ICONS[icon] : ICONS.generic;
  return `<svg viewBox="0 0 40 40" width="${size}" height="${size}" aria-hidden="true">${body}</svg>`;
}
