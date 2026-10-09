import { recipeById, SPECIALS } from '../data/recipes.js';
import { LINES } from '../data/customers.js';
import { emptyCup } from './RecipeSystem.js';
import { orderPrice } from './EconomySystem.js';
import { pick } from '../utils/rng.js';

const vowel = (s) => /^[aeiou]/i.test(s);

export function greetingFor(def, recipe, rng) {
  const t = pick(rng, LINES.greet);
  const a = vowel(recipe.name) ? 'an' : 'a';
  return t.replace('{a}', a).replace('{drink}', recipe.name.toLowerCase()).replace('{Drink}', recipe.name);
}

export function createOrder({ no, def, cfg, fx, mastery = {}, rng }) {
  const unlocked = cfg.recipeIds.map(recipeById);
  const fav = def.fav.map(recipeById).filter((r) => unlocked.includes(r));
  const recipe = fav.length && rng() < 0.6 ? pick(rng, fav) : pick(rng, unlocked);
  let special = null;
  if (rng() < cfg.specialChance) {
    const opts = SPECIALS.filter((s) => s.minDay <= cfg.day && s.applies(recipe));
    if (opts.length) {
      const s = pick(rng, opts);
      special = { id: s.id, label: s.label(recipe), mod: s.mod(recipe), extraPrice: s.extraPrice };
    }
  }
  return {
    no, recipe, special, cup: emptyCup(), accepted: false, done: false,
    price: orderPrice(recipe, special, fx, mastery[recipe.id] || 0),
    line: greetingFor(def, recipe, rng) + (special ? ` ${special.label}, please!` : ''),
    iceNeeded: !!recipe.ingredients.ice,
  };
}
