import { artCanvas, rect } from './pixel.js';
import { drawCup, CUP_W, CUP_H } from './cup.js';
import { emptyCup, addIngredient } from '../systems/RecipeSystem.js';

export const cupForRecipe = (recipe) => { const c = emptyCup(); const order = [...recipe.sequence, ...Object.keys(recipe.ingredients)]; const seen = new Set(); order.forEach((k) => { if (!seen.has(k)) { seen.add(k); for (let i = 0; i < recipe.ingredients[k]; i++) addIngredient(c, k); } }); return c; };
export const recipeCanvas = (recipe, scale = 3) => { const c = artCanvas(CUP_W, CUP_H, (x) => drawCup(x, cupForRecipe(recipe), { glass: recipe.iced }), { scale }); c.className = 'recipe-art'; return c; };
export const starCanvas = (scale = 3) => { const c = artCanvas(16, 16, (x) => { const r = rect(x); r(7, 1, 2, 3, '#EDC56D'); r(5, 4, 6, 3, '#EDC56D'); r(1, 6, 14, 3, '#EDC56D'); r(3, 9, 10, 3, '#EDC56D'); r(2, 12, 4, 3, '#EDC56D'); r(10, 12, 4, 3, '#EDC56D'); r(7, 3, 2, 6, '#fff2b0'); r(2, 7, 12, 1, '#fff2b0'); }, { scale }); c.className = 'star'; return c; };
export const trophyCanvas = (on, scale = 3) => artCanvas(14, 14, (x) => { const r = rect(x), g = on ? '#EDC56D' : '#a39588', d = on ? '#c99a3a' : '#7d7165'; r(3, 1, 8, 6, g); r(1, 2, 2, 3, g); r(11, 2, 2, 3, g); r(5, 7, 4, 3, d); r(3, 10, 8, 2, d); r(4, 2, 2, 3, on ? '#fff2b0' : '#c4baae'); }, { scale });
export const coinCanvas = (scale = 2) => artCanvas(8, 8, (x) => { const r = rect(x); r(1, 0, 6, 8, '#EDC56D'); r(0, 1, 8, 6, '#EDC56D'); r(2, 1, 4, 6, '#c99a3a'); r(3, 2, 2, 4, '#EDC56D'); r(2, 1, 1, 2, '#fff2b0'); }, { scale });
