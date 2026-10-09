import { RECIPES } from '../data/recipes.js';
import { DAY_TITLES, LATER_TITLES, isRushDay } from '../data/progression.js';
import { clamp } from '../utils/rng.js';

export const unlockedRecipeIds = (day) => RECIPES.filter((r) => r.unlockDay <= day).map((r) => r.id);

export function dayConfig(day) {
  const customers = day <= 5 ? [4, 6, 7, 8, 10][day - 1] : Math.min(24, 10 + (day - 5));
  const length = Math.min(260, 110 + 12 * day); // real seconds of business hours
  const rush = isRushDay(day) ? { start: 0.4, end: 0.65 } : null;
  const recipes = RECIPES.filter((r) => r.unlockDay <= day);
  const avg = recipes.reduce((s, r) => s + r.price, 0) / recipes.length;
  const target = Math.round((customers * avg * 0.7) / 5) * 5;
  return {
    day, customers, length, rush, target,
    title: DAY_TITLES[day] || LATER_TITLES[(day - 11) % LATER_TITLES.length],
    queueBase: day >= 5 ? 5 : 4,
    specialChance: day < 3 ? 0 : clamp(0.25 + (day - 3) * 0.05, 0, 0.6),
    newRecipes: RECIPES.filter((r) => r.unlockDay === day),
    recipeIds: recipes.map((r) => r.id),
  };
}

/** Spawn times (seconds from open). Rush days concentrate customers inside the rush window. */
export function buildSchedule(cfg, rng) {
  const { customers: n, length } = cfg;
  const end = length - 12;
  const times = [];
  const nRush = cfg.rush ? Math.round(n * 0.45) : 0;
  for (let i = 0; i < n - nRush; i++) times.push(3 + ((end - 3) * (i + rng() * 0.8)) / (n - nRush));
  if (cfg.rush) for (let i = 0; i < nRush; i++) times.push(length * cfg.rush.start + (length * (cfg.rush.end - cfg.rush.start) * (i + rng() * 0.8)) / nRush);
  times.sort((a, b) => a - b);
  for (let i = 1; i < times.length; i++) times[i] = Math.max(times[i], times[i - 1] + 3.5); // minimum gap
  return times;
}

export function starRating(satisfaction, targetMet, missed = 0) {
  let s = satisfaction >= 90 ? 5 : satisfaction >= 75 ? 4 : satisfaction >= 55 ? 3 : satisfaction >= 35 ? 2 : 1;
  if (!targetMet) s -= 1;
  if (s === 5 && missed > 0) s = 4;
  return clamp(s, 1, 5);
}

/** Apply a finished day's summary to the save and advance the calendar. Returns newly unlocked recipes. */
export function completeDay(data, summary) {
  data.stats.daysCompleted += 1;
  // Five stars only count toward 'Café Legend' from Day 5 on (the first days are deliberately gentle).
  if (data.day >= 5) data.stats.bestStars = Math.max(data.stats.bestStars, summary.stars);
  data.day += 1;
  const before = new Set(data.unlockedRecipes);
  data.unlockedRecipes = unlockedRecipeIds(data.day);
  return RECIPES.filter((r) => data.unlockedRecipes.includes(r.id) && !before.has(r.id));
}
