import { describe, it, expect } from 'vitest';
import { RECIPES, recipeById, STATION_UNLOCK_DAY, SPECIALS } from '../src/data/recipes.js';
import { scoreDrink, identify, tierOf, canAdd, emptyCup } from '../src/systems/RecipeSystem.js';
import { cupOf } from './helpers.js';

const score = (id, cup, extra = {}) => scoreDrink({ recipe: recipeById(id), cup, ...extra });

describe('recipe data', () => {
  it('every recipe only needs stations unlocked by its own unlock day', () => {
    for (const r of RECIPES) for (const k of Object.keys(r.ingredients)) expect(STATION_UNLOCK_DAY[k], `${r.id}:${k}`).toBeLessThanOrEqual(r.unlockDay);
  });
  it('has at least the 12 required drinks with the specified prices', () => {
    expect(RECIPES.map((r) => [r.name, r.price])).toEqual(expect.arrayContaining([['Espresso', 5], ['Americano', 6], ['Latte', 8], ['Cappuccino', 9], ['Mocha', 10], ['Deluxe Macchiato', 14], ['Iced Caramel Latte', 12]]));
    expect(RECIPES.length).toBeGreaterThanOrEqual(12);
  });
});

describe('scoreDrink', () => {
  it('perfect drink scores 90+', () => {
    const r = score('latte', cupOf('espresso', 'milk'));
    expect(r.tier).toBe('perfect'); expect(r.total).toBe(100);
  });
  it('slow service lowers only the speed part', () => {
    const r = score('latte', cupOf('espresso', 'milk'), { patienceFrac: 0 });
    expect(r.total).toBe(90); expect(r.tier).toBe('perfect');
  });
  it('empty cup is incorrect with a message', () => {
    const r = score('latte', emptyCup());
    expect(r.tier).toBe('incorrect'); expect(r.messages[0]).toMatch(/empty/i);
  });
  it('missing ingredient can never succeed', () => {
    const r = score('mocha', cupOf('espresso', 'milk'));
    expect(r.total).toBeLessThanOrEqual(49); expect(r.tier).toBe('incorrect');
    expect(r.messages.join(' ')).toMatch(/Missing: Chocolate/);
  });
  it('extra ingredient caps at acceptable and names the lookalike', () => {
    const r = score('latte', cupOf('espresso', 'milk', 'caramel'));
    expect(r.total).toBeLessThanOrEqual(74); expect(r.messages.join(' ')).toMatch(/Caramel Latte/);
  });
  it('wrong quantity caps at great', () => {
    const r = score('latte', cupOf('espresso', 'milk', 'milk'));
    expect(r.total).toBeLessThanOrEqual(89); expect(r.tier).toBe('great');
  });
  it('wrong sequence loses step points', () => {
    const r = score('latte', cupOf('milk', 'espresso'));
    expect(r.breakdown.steps).toBe(0); expect(r.tier).toBe('great'); // 85 points
  });
  it('special request: met vs unmet', () => {
    const special = { mod: { caramel: 1 }, extraPrice: 1 };
    expect(score('caramel_latte', cupOf('espresso', 'milk', 'caramel', 'caramel'), { special }).tier).toBe('perfect');
    const miss = score('caramel_latte', cupOf('espresso', 'milk', 'caramel'), { special });
    expect(miss.breakdown.special).toBe(0); expect(miss.tier).not.toBe('perfect');
  });
  it('distinguishes latte / cappuccino / mocha / iced caramel latte by rules', () => {
    expect(identify(cupOf('espresso', 'milk').contents).id).toBe('latte');
    expect(identify(cupOf('espresso', 'milk', 'foam').contents).id).toBe('cappuccino');
    expect(identify(cupOf('espresso', 'milk', 'chocolate').contents).id).toBe('mocha');
    expect(identify(cupOf('ice', 'milk', 'espresso', 'caramel').contents).id).toBe('iced_caramel_latte');
  });
  it('tier thresholds', () => {
    expect([100, 90, 89, 75, 74, 50, 49, 0].map(tierOf)).toEqual(['perfect', 'perfect', 'great', 'great', 'acceptable', 'acceptable', 'incorrect', 'incorrect']);
  });
  it('cup capacity blocks liquid but not ice/toppings', () => {
    const cup = cupOf('milk', 'milk', 'milk', 'milk'); // 4 x 2 = 8 units
    expect(canAdd(cup, 'milk')).toBe(false); expect(canAdd(cup, 'caramel')).toBe(false); expect(canAdd(cup, 'ice')).toBe(true); expect(canAdd(cup, 'whip')).toBe(true);
  });
  it('special requests only apply to compatible recipes', () => {
    const ice = SPECIALS.find((s) => s.id === 'extra_ice');
    expect(ice.applies(recipeById('latte'))).toBe(false); expect(ice.applies(recipeById('iced_latte'))).toBe(true);
  });
});
