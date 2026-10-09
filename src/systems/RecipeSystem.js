import { INGREDIENTS, RECIPES, LIQUID_GROUPS, CUP_CAPACITY } from '../data/recipes.js';
import { clamp } from '../utils/rng.js';

export const TIERS = [['perfect', 90], ['great', 75], ['acceptable', 50]];
export const tierOf = (score) => (TIERS.find(([, min]) => score >= min) || ['incorrect'])[0];

export const emptyCup = () => ({ contents: {}, log: [] });
// Liquid weight: espresso/water/milk fill 2 units, syrups 1 (the cup holds CUP_CAPACITY units).
export const liquidWeight = (id) => (INGREDIENTS[id].group === 'syrup' ? 1 : LIQUID_GROUPS.includes(INGREDIENTS[id].group) ? 2 : 0);
export const liquidUnits = (cup) => Object.entries(cup.contents).reduce((s, [k, n]) => s + liquidWeight(k) * n, 0);
export const canAdd = (cup, id) => liquidUnits(cup) + liquidWeight(id) <= CUP_CAPACITY;

export function addIngredient(cup, id) {
  if (!INGREDIENTS[id]) throw new Error(`Unknown ingredient: ${id}`);
  cup.contents[id] = (cup.contents[id] || 0) + 1;
  cup.log.push(id);
  return cup;
}

export function requirements(recipe, special) {
  const req = { ...recipe.ingredients };
  if (special) for (const [k, n] of Object.entries(special.mod)) req[k] = (req[k] || 0) + n;
  return req;
}

// Which known recipe does this cup look like (exact ingredient set, any quantity)?
export function identify(contents, recipes = RECIPES) {
  const keys = Object.keys(contents).filter((k) => contents[k] > 0).sort().join(',');
  return recipes.find((r) => Object.keys(r.ingredients).sort().join(',') === keys) || null;
}

const firstIdx = (log, id) => log.indexOf(id);
const name = (k) => INGREDIENTS[k].name;

/** Deterministic drink scoring (0-100). See README "Scoring". */
export function scoreDrink({ recipe, special = null, cup, patienceFrac = 1 }) {
  const req = requirements(recipe, special);
  const have = cup.contents;
  const reqKeys = Object.keys(req);
  const haveKeys = Object.keys(have).filter((k) => have[k] > 0);
  const zero = { ingredients: 0, quantities: 0, steps: 0, special: 0, speed: 0 };
  if (!haveKeys.length) {
    return { total: 0, tier: 'incorrect', breakdown: zero, missing: reqKeys, extra: [], wrongQty: [], messages: ['The cup is empty!'] };
  }
  const missing = reqKeys.filter((k) => !have[k]);
  const extra = haveKeys.filter((k) => !(k in req));
  const wrongQty = reqKeys.filter((k) => have[k] && have[k] !== req[k]);

  const ingRatio = clamp((reqKeys.length - missing.length - 0.5 * extra.length) / reqKeys.length, 0, 1);
  const qtyRatio = reqKeys.reduce((s, k) => s + (have[k] ? clamp(1 - Math.abs(have[k] - req[k]) / req[k], 0, 1) : 0), 0) / reqKeys.length;
  const pairs = recipe.sequence.slice(1).map((b, i) => [recipe.sequence[i], b]);
  const badOrder = pairs.filter(([a, b]) => !(have[a] && have[b] && firstIdx(cup.log, a) < firstIdx(cup.log, b)));
  const stepRatio = pairs.length ? (pairs.length - badOrder.length) / pairs.length : 1;
  const specialMet = !special || Object.keys(special.mod).every((k) => have[k] === req[k]);
  const speedRatio = clamp(patienceFrac / 0.5, 0, 1);

  const breakdown = {
    ingredients: 45 * ingRatio, quantities: 20 * qtyRatio, steps: 15 * stepRatio,
    special: specialMet ? 10 : 0, speed: 10 * speedRatio,
  };
  let total = Math.round(Object.values(breakdown).reduce((a, b) => a + b, 0));
  if (missing.length) total = Math.min(total, 49); // incomplete drink is never a success
  else if (extra.length) total = Math.min(total, 74); // wrong drink
  if (wrongQty.length === 1) total = Math.min(total, 89);
  else if (wrongQty.length > 1) total = Math.min(total, 74);

  const messages = [];
  if (missing.length) messages.push(`Missing: ${missing.map(name).join(', ')}.`);
  if (extra.length) messages.push(`Not in this recipe: ${extra.map(name).join(', ')}.`);
  wrongQty.forEach((k) => messages.push(`${name(k)}: you added ${have[k]}, it needs ${req[k]}.`));
  badOrder.forEach(([a, b]) => { if (have[a] && have[b]) messages.push(`${name(a)} should go in before ${name(b).toLowerCase()}.`); });
  if (special && !specialMet) messages.push('The special request was not fulfilled.');
  const look = identify(have);
  if (look && look.id !== recipe.id && (missing.length || extra.length)) messages.push(`That looks like a ${look.name}, not a ${recipe.name}.`);
  return { total: clamp(total, 0, 100), tier: tierOf(clamp(total, 0, 100)), breakdown, missing, extra, wrongQty, messages };
}
