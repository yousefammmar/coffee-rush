import { emptyCup, addIngredient } from '../systems/RecipeSystem.js';
export const cupOf = (...ids) => ids.reduce((c, id) => addIngredient(c, id), emptyCup());
