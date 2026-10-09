import { DECOR_DEFAULTS, decorItem } from '../data/decor.js';
import { RECIPES } from '../data/recipes.js';
import { UPGRADES } from '../data/upgrades.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { unlockedRecipeIds } from './ProgressionSystem.js';
import { clamp } from '../utils/rng.js';

export const SAVE_KEY = 'coffeerush.save';
export const SAVE_VERSION = 2;

export const defaultStats = () => ({ served: 0, perfect: 0, great: 0, acceptable: 0, incorrect: 0, missed: 0, streak: 0, bestStreak: 0, earnedTotal: 0, bestStars: 0, daysCompleted: 0, orders: 0 });
export const defaultSettings = () => ({ master: 0.8, music: 0.6, sfx: 0.8, reducedMotion: null, speed: 1, muted: false });

export function defaultSave() {
  return {
    version: SAVE_VERSION, started: false, day: 1, money: 100, xp: 0, reputation: 0,
    unlockedRecipes: unlockedRecipeIds(1), upgrades: {}, mastery: {},
    decor: { owned: [], equipped: { ...DECOR_DEFAULTS } },
    achievements: {}, stats: defaultStats(), settings: defaultSettings(), tutorialDone: false,
  };
}

// Migrations: each upgrades a raw object from version N to N+1.
export const MIGRATIONS = {
  // v1 had no decor/mastery, `unlocked` instead of `unlockedRecipes`, achievements as an array.
  1: (s) => ({
    ...s, version: 2, started: s.started ?? true,
    unlockedRecipes: s.unlockedRecipes || s.unlocked || [],
    mastery: s.mastery || {}, decor: s.decor || { owned: [], equipped: { ...DECOR_DEFAULTS } },
    achievements: Array.isArray(s.achievements) ? Object.fromEntries(s.achievements.map((id) => [id, 0])) : s.achievements || {},
  }),
};

const num = (v, d, lo = -Infinity, hi = Infinity) => (Number.isFinite(v) ? clamp(v, lo, hi) : d);

/** Coerce arbitrary parsed JSON into a valid, current-version save (never throws). */
export function sanitize(raw) {
  const d = defaultSave();
  if (!raw || typeof raw !== 'object') return d;
  const day = Math.floor(num(raw.day, 1, 1, 999));
  const recipeIds = new Set(RECIPES.map((r) => r.id));
  const out = {
    version: SAVE_VERSION, started: !!raw.started, day,
    money: num(raw.money, d.money, 0, 1e9), xp: num(raw.xp, 0, 0, 1e9), reputation: num(raw.reputation, 0, 0, 1e6),
    tutorialDone: !!raw.tutorialDone,
    upgrades: {}, mastery: {}, achievements: {}, stats: { ...d.stats }, settings: { ...d.settings },
    decor: { owned: [], equipped: { ...DECOR_DEFAULTS } },
  };
  for (const u of UPGRADES) out.upgrades[u.id] = Math.floor(num(raw.upgrades?.[u.id], 0, 0, u.costs.length));
  for (const r of RECIPES) if (raw.mastery?.[r.id] > 0) out.mastery[r.id] = Math.floor(num(raw.mastery[r.id], 0, 0, 1e6));
  for (const a of ACHIEVEMENTS) if (raw.achievements?.[a.id] != null) out.achievements[a.id] = num(raw.achievements[a.id], 0);
  for (const k of Object.keys(d.stats)) out.stats[k] = num(raw.stats?.[k], d.stats[k], 0);
  const s = raw.settings || {};
  out.settings = {
    master: num(s.master, d.settings.master, 0, 1), music: num(s.music, d.settings.music, 0, 1), sfx: num(s.sfx, d.settings.sfx, 0, 1),
    reducedMotion: typeof s.reducedMotion === 'boolean' ? s.reducedMotion : null,
    speed: [0.75, 1, 1.25, 1.5].includes(s.speed) ? s.speed : 1, muted: !!s.muted,
  };
  // Unlocked recipes are always at least what the day grants; unknown ids are dropped.
  const saved = Array.isArray(raw.unlockedRecipes) ? raw.unlockedRecipes.filter((id) => recipeIds.has(id)) : [];
  out.unlockedRecipes = [...new Set([...saved, ...unlockedRecipeIds(day)])];
  for (const o of Array.isArray(raw.decor?.owned) ? raw.decor.owned : []) {
    const [cat, id] = String(o).split(':');
    if (decorItem(cat, id) && !out.decor.owned.includes(o)) out.decor.owned.push(o);
  }
  for (const [cat, id] of Object.entries(raw.decor?.equipped || {})) {
    const item = decorItem(cat, id);
    if (item && (item.price === 0 || out.decor.owned.includes(`${cat}:${id}`))) out.decor.equipped[cat] = id;
  }
  return out;
}

export function migrate(raw) {
  let s = raw;
  while (s && typeof s === 'object' && (s.version ?? 1) < SAVE_VERSION) s = MIGRATIONS[s.version ?? 1](s);
  return sanitize(s);
}

export const serialize = (data) => JSON.stringify(data);
export function deserialize(text) {
  try { return migrate(JSON.parse(text)); } catch { return null; }
}

const store = () => { try { return globalThis.localStorage || null; } catch { return null; } };

export function loadSave(storage = store()) {
  const text = storage?.getItem(SAVE_KEY);
  if (!text) return defaultSave();
  const data = deserialize(text);
  if (!data) { console.warn('[Coffee Rush] Save data was corrupted; starting fresh.'); return defaultSave(); }
  return data;
}
export function writeSave(data, storage = store()) {
  try { storage?.setItem(SAVE_KEY, serialize(data)); return true; } catch (e) { console.error('[Coffee Rush] Could not save:', e); return false; }
}
export function clearSave(storage = store()) { try { storage?.removeItem(SAVE_KEY); } catch { /* ignore */ } }
