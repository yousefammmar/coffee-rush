import { describe, it, expect } from 'vitest';
import { dayConfig, buildSchedule, completeDay, unlockedRecipeIds, starRating } from '../src/systems/ProgressionSystem.js';
import { mulberry32 } from '../src/utils/rng.js';
import { defaultSave } from '../src/systems/SaveSystem.js';
import { evaluateAchievements, recordOutcome } from '../src/systems/AchievementSystem.js';
import { DayRun } from '../src/systems/CustomerSystem.js';
import { upgradeEffects } from '../src/systems/EconomySystem.js';
import { recipeById } from '../src/data/recipes.js';

describe('progression', () => {
  it('unlocks recipes on schedule', () => {
    expect(unlockedRecipeIds(1)).toEqual(['espresso', 'latte']);
    expect(unlockedRecipeIds(2)).toContain('americano');
    expect(unlockedRecipeIds(3)).toContain('caramel_latte');
    expect(unlockedRecipeIds(4)).toContain('iced_latte');
    expect(unlockedRecipeIds(9)).toContain('macchiato');
  });
  it('day 1 is gentle, later days scale, rush from day 5', () => {
    expect(dayConfig(1).customers).toBeGreaterThanOrEqual(3); expect(dayConfig(1).customers).toBeLessThanOrEqual(5);
    expect(dayConfig(1).rush).toBeNull(); expect(dayConfig(5).rush).not.toBeNull();
    expect(dayConfig(20).customers).toBeGreaterThan(dayConfig(6).customers);
    expect(dayConfig(30).title).toBeTruthy();
  });
  it('schedule has the right count, is sorted and spaced', () => {
    for (const day of [1, 5, 12]) {
      const cfg = dayConfig(day); const t = buildSchedule(cfg, mulberry32(day));
      expect(t).toHaveLength(cfg.customers);
      for (let i = 1; i < t.length; i++) expect(t[i] - t[i - 1]).toBeGreaterThanOrEqual(3.49);
    }
  });
  it('completeDay advances the day and reports new unlocks', () => {
    const d = defaultSave();
    const fresh = completeDay(d, { stars: 3 });
    expect(d.day).toBe(2); expect(fresh.map((r) => r.id)).toEqual(['americano']); expect(d.stats.daysCompleted).toBe(1);
    expect(d.stats.bestStars).toBe(0); // gentle early days don't count for Café Legend
    d.day = 5; completeDay(d, { stars: 5 }); expect(d.stats.bestStars).toBe(5);
  });
  it('star rating', () => {
    expect(starRating(95, true, 0)).toBe(5); expect(starRating(95, true, 1)).toBe(4);
    expect(starRating(95, false, 0)).toBe(4); expect(starRating(10, false)).toBe(1);
  });
});

describe('achievements', () => {
  it('unlock from real stat changes', () => {
    const d = defaultSave();
    expect(evaluateAchievements(d)).toHaveLength(0);
    recordOutcome(d.stats, 'perfect');
    expect(evaluateAchievements(d).map((a) => a.id)).toEqual(['first_cup']);
    expect(evaluateAchievements(d)).toHaveLength(0); // only once
    for (let i = 0; i < 9; i++) recordOutcome(d.stats, 'perfect');
    expect(evaluateAchievements(d).map((a) => a.id)).toContain('perfect_barista');
  });
  it('streak resets on a mistake or miss and tracks best', () => {
    const d = defaultSave();
    for (let i = 0; i < 8; i++) recordOutcome(d.stats, i % 2 ? 'great' : 'acceptable');
    expect(d.stats.bestStreak).toBe(8); recordOutcome(d.stats, 'incorrect');
    expect(d.stats.streak).toBe(0); expect(evaluateAchievements(d).map((a) => a.id)).toContain('rush_hero');
    recordOutcome(d.stats, 'missed'); expect(d.stats.streak).toBe(0);
  });
  it('gold & legend & purchases', () => {
    const d = defaultSave(); d.stats.earnedTotal = 1000; d.stats.bestStars = 5; d.upgrades.espresso = 1; d.decor.owned.push('plants:some');
    expect(evaluateAchievements(d).map((a) => a.id).sort()).toEqual(['cafe_legend', 'designer', 'golden_beans', 'shopper']);
  });
});

describe('DayRun (customers, patience, orders)', () => {
  const mk = (day = 1) => { const data = defaultSave(); data.day = day; const cfg = dayConfig(day); return new DayRun({ data, cfg, fx: upgradeEffects({}), rng: mulberry32(7) }); };
  it('spawns on schedule and never beyond capacity', () => {
    const run = mk(); const ev = run.update(run.schedule[0] + 0.1);
    expect(ev.filter((e) => e.type === 'spawn')).toHaveLength(1);
    run.update(10000); expect(run.queue.length).toBeLessThanOrEqual(run.capacity);
  });
  it('patience only drains after arrival, and not when update is not called (paused)', () => {
    const run = mk(); run.update(run.schedule[0] + 0.1);
    const c = run.queue[0]; const p0 = c.patience;
    run.update(5); expect(c.patience).toBe(p0); // still walking in
    run.arrive(c); run.update(5); expect(c.patience).toBe(p0 - 5);
    // paused => the scene does not call update => nothing changes
    expect(c.patience).toBe(p0 - 5);
  });
  it('times out unattended customers as missed', () => {
    const run = mk(); run.update(run.schedule[0] + 0.1); const c = run.queue[0]; run.arrive(c);
    const ev = run.update(c.patienceMax + 1);
    expect(ev.some((e) => e.type === 'timeout')).toBe(true); expect(run.stat.missed).toBe(1);
    expect(run.data.stats.missed).toBe(1);
  });
  it('tray limit, correct serve pays, ingredients cost coins, wrong drink does not pay', () => {
    const run = mk(); run.update(run.schedule[0] + 0.1);
    const c = run.queue[0]; run.arrive(c); run.order = c.order;
    c.order.recipe = recipeById('latte'); c.order.special = null; c.order.price = 8;
    expect(run.accept(c).ok).toBe(true);
    const m0 = run.data.money;
    run.addToCup(c, 'espresso'); run.addToCup(c, 'milk');
    expect(run.data.money).toBe(m0 - 2); expect(run.stat.expenses).toBe(2);
    const r = run.serve(c);
    expect(r.tier).toBe('perfect'); expect(r.pay).toBe(8); expect(r.tip).toBeGreaterThan(0);
    expect(run.data.money).toBe(m0 - 2 + r.total); expect(run.queue).not.toContain(c);

    run.update(60); const c2 = run.queue[0]; run.arrive(c2); c2.order.recipe = recipeById('latte'); c2.order.price = 8; run.accept(c2);
    run.addToCup(c2, 'espresso'); const w = run.serve(c2);
    expect(w.tier).toBe('incorrect'); expect(w.total).toBe(0); expect(run.stat.incorrect).toBe(1);
  });
  it('summary computes net profit and a star rating', () => {
    const run = mk(); run.stat.revenue = 30; run.stat.tips = 10; run.stat.expenses = 6; run.stat.satSum = 90; run.stat.satN = 1;
    const s = run.summary(); expect(s.net).toBe(34); expect(s.stars).toBeGreaterThanOrEqual(1);
  });
});
