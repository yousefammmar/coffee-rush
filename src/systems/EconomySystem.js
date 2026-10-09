import { INGREDIENTS } from '../data/recipes.js';
import { upgradeById } from '../data/upgrades.js';
import { decorItem } from '../data/decor.js';
import { MASTERY_STEPS } from '../data/progression.js';

export const TIER_PAY = { perfect: 1, great: 1, acceptable: 0.7, incorrect: 0 };
export const TIER_TIP = { perfect: 0.3, great: 0.18, acceptable: 0.04, incorrect: 0 };
export const TIER_SATISFACTION = { perfect: 100, great: 85, acceptable: 60, incorrect: 15, missed: 0 };
export const TIER_REPUTATION = { perfect: 2, great: 1, acceptable: 0, incorrect: -2, missed: -3 };

export const lvl = (upgrades, id) => upgrades[id] || 0;

/** Derive every gameplay modifier from owned upgrade levels. */
export function upgradeEffects(u = {}) {
  return {
    brewMult: Math.pow(0.8, lvl(u, 'espresso')),
    grindMult: Math.pow(0.65, lvl(u, 'grinder')),
    autoGrind: lvl(u, 'autogrind') > 0,
    steamMult: Math.pow(0.8, lvl(u, 'steamer')),
    tipMult: 1 + 0.2 * lvl(u, 'beans'),
    queueBonus: lvl(u, 'queue'),
    patienceMult: 1 + 0.08 * lvl(u, 'decor'),
    priceBonus: lvl(u, 'cups'),
    traySlots: 2 + lvl(u, 'tray'),
    costMult: Math.pow(0.75, lvl(u, 'efficiency')),
  };
}

export const masteryLevel = (count = 0) => MASTERY_STEPS.filter((s) => count >= s).length;

export function orderPrice(recipe, special, fx, masteryCount = 0) {
  return recipe.price + (special?.extraPrice || 0) + fx.priceBonus + masteryLevel(masteryCount);
}

export function payout({ price, tier, tipRate = 1, fx, streak = 0, rush = false, reputation = 0 }) {
  const pay = Math.round(price * TIER_PAY[tier]);
  if (tier === 'incorrect') return { pay: 0, tip: 0, total: 0 };
  let tip = Math.round(price * tipRate * TIER_TIP[tier] * fx.tipMult * (1 + Math.min(0.2, reputation / 500)));
  if (rush && streak >= 3) tip += Math.min(5, streak - 2); // rush-hour combo bonus
  return { pay, tip, total: pay + tip };
}

export function ingredientCost(id, fx) {
  return +(INGREDIENTS[id].cost * fx.costMult).toFixed(2);
}

export const earn = (data, n) => { data.money = Math.round((data.money + Math.max(0, n)) * 100) / 100; data.stats.earnedTotal += Math.max(0, n); };
export function spend(data, n) {
  if (n > data.money) return false;
  data.money = Math.round((data.money - n) * 100) / 100;
  return true;
}
// Ingredient spend never makes the balance negative.
export const spendUpTo = (data, n) => { const s = Math.min(n, data.money); data.money = Math.round((data.money - s) * 100) / 100; return s; };

export function purchaseUpgrade(data, id) {
  const up = upgradeById(id);
  if (!up) return { ok: false, reason: 'Unknown upgrade.' };
  const level = lvl(data.upgrades, id);
  if (level >= up.costs.length) return { ok: false, reason: 'Already at max level.' };
  const cost = up.costs[level];
  if (!spend(data, cost)) return { ok: false, reason: `Not enough coins (need ${cost}).` };
  data.upgrades[id] = level + 1;
  return { ok: true, cost, level: level + 1 };
}

export function purchaseDecor(data, cat, id) {
  const item = decorItem(cat, id);
  if (!item) return { ok: false, reason: 'Unknown item.' };
  if (data.decor.owned.includes(`${cat}:${id}`) || item.price === 0) return { ok: false, reason: 'You already own this.' };
  if (!spend(data, item.price)) return { ok: false, reason: `Not enough coins (need ${item.price}).` };
  data.decor.owned.push(`${cat}:${id}`);
  data.decor.equipped[cat] = id;
  return { ok: true, cost: item.price };
}

export function equipDecor(data, cat, id) {
  const item = decorItem(cat, id);
  if (!item || !(item.price === 0 || data.decor.owned.includes(`${cat}:${id}`))) return false;
  data.decor.equipped[cat] = id;
  return true;
}
