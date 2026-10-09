import { emptyCup, addIngredient } from '../src/systems/RecipeSystem.js';
export const cupOf = (...ids) => ids.reduce((c, id) => addIngredient(c, id), emptyCup());
export const memStore = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
