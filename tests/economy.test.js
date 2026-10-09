import { describe, it, expect } from 'vitest';
import { payout, upgradeEffects, purchaseUpgrade, purchaseDecor, equipDecor, spend, spendUpTo, orderPrice, masteryLevel, ingredientCost } from '../src/systems/EconomySystem.js';
import { defaultSave } from '../src/systems/SaveSystem.js';
import { recipeById } from '../src/data/recipes.js';

const fx0 = upgradeEffects({});

describe('earnings', () => {
  it('pays full price + tip for a perfect order', () => {
    const p = payout({ price: 12, tier: 'perfect', tipRate: 1, fx: fx0 });
    expect(p.pay).toBe(12); expect(p.tip).toBe(4); expect(p.total).toBe(16);
  });
  it('acceptable pays 70% and incorrect pays nothing', () => {
    expect(payout({ price: 10, tier: 'acceptable', fx: fx0 }).pay).toBe(7);
    expect(payout({ price: 10, tier: 'incorrect', fx: fx0 })).toEqual({ pay: 0, tip: 0, total: 0 });
  });
  it('premium beans raise tips; rush combo adds bonus', () => {
    const base = payout({ price: 12, tier: 'perfect', fx: fx0 }).tip;
    expect(payout({ price: 12, tier: 'perfect', fx: upgradeEffects({ beans: 3 }) }).tip).toBeGreaterThan(base);
    expect(payout({ price: 12, tier: 'perfect', fx: fx0, streak: 5, rush: true }).tip).toBe(base + 3);
  });
  it('order price includes cups upgrade, special and mastery', () => {
    expect(orderPrice(recipeById('latte'), { extraPrice: 1 }, upgradeEffects({ cups: 2 }), 15)).toBe(8 + 1 + 2 + 2);
    expect(masteryLevel(4)).toBe(0); expect(masteryLevel(30)).toBe(3);
  });
  it('money never goes negative', () => {
    const d = defaultSave(); d.money = 3;
    expect(spend(d, 5)).toBe(false); expect(d.money).toBe(3);
    expect(spendUpTo(d, 10)).toBe(3); expect(d.money).toBe(0);
  });
});

describe('upgrades', () => {
  it('purchase deducts coins, raises level and changes effects', () => {
    const d = defaultSave(); d.money = 500;
    expect(purchaseUpgrade(d, 'espresso')).toMatchObject({ ok: true, cost: 120, level: 1 });
    expect(d.money).toBe(380);
    expect(upgradeEffects(d.upgrades).brewMult).toBeCloseTo(0.8);
  });
  it('rejects insufficient funds, max level and unknown ids', () => {
    const d = defaultSave(); d.money = 10;
    expect(purchaseUpgrade(d, 'espresso').ok).toBe(false); expect(d.upgrades.espresso).toBeUndefined();
    d.money = 9999; purchaseUpgrade(d, 'autogrind');
    expect(purchaseUpgrade(d, 'autogrind').ok).toBe(false); expect(d.upgrades.autogrind).toBe(1);
    expect(purchaseUpgrade(d, 'nope').ok).toBe(false);
  });
  it('each upgrade has a real gameplay effect', () => {
    const e = upgradeEffects({ espresso: 1, grinder: 1, autogrind: 1, steamer: 1, beans: 1, queue: 1, decor: 1, cups: 1, tray: 1, efficiency: 1 });
    expect(e).toMatchObject({ autoGrind: true, queueBonus: 1, priceBonus: 1, traySlots: 3 });
    expect(e.brewMult).toBeLessThan(1); expect(e.grindMult).toBeLessThan(1); expect(e.steamMult).toBeLessThan(1);
    expect(e.tipMult).toBeGreaterThan(1); expect(e.patienceMult).toBeGreaterThan(1); expect(e.costMult).toBeLessThan(1);
    expect(ingredientCost('espresso', e)).toBeLessThan(1);
  });
  it('decor can be bought once and equipped', () => {
    const d = defaultSave(); d.money = 300;
    expect(purchaseDecor(d, 'theme', 'forest').ok).toBe(true);
    expect(purchaseDecor(d, 'theme', 'forest').ok).toBe(false); // no duplicates
    expect(d.money).toBe(140); expect(d.decor.equipped.theme).toBe('forest');
    expect(equipDecor(d, 'theme', 'classic')).toBe(true); expect(equipDecor(d, 'theme', 'sunset')).toBe(false);
  });
});
