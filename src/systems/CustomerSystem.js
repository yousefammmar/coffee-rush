import { CUSTOMERS } from '../data/customers.js';
import { buildSchedule } from './ProgressionSystem.js';
import { createOrder } from './OrderSystem.js';
import { TIER_SATISFACTION, TIER_REPUTATION, payout, ingredientCost, earn, spendUpTo, masteryLevel } from './EconomySystem.js';
import { recordOutcome } from './AchievementSystem.js';
import { starRating } from './ProgressionSystem.js';
import { addIngredient, canAdd, scoreDrink } from './RecipeSystem.js';
import { pick } from '../utils/rng.js';

/**
 * Pure (render-free) simulation of one business day: spawn schedule, queue,
 * patience, orders and the day's money. The scene drives it with update(dt);
 * when dt is not supplied (paused) nothing advances.
 */
export class DayRun {
  constructor({ data, cfg, fx, rng }) {
    Object.assign(this, { data, cfg, fx, rng });
    this.time = 0;
    this.schedule = buildSchedule(cfg, rng);
    this.spawnIdx = 0;
    this.queue = []; // customers still in the shop (not leaving)
    this.uid = 0;
    this.stat = { served: 0, correct: 0, incorrect: 0, missed: 0, revenue: 0, tips: 0, expenses: 0, satSum: 0, satN: 0, perfects: 0 };
    this.log = [];
  }

  get capacity() { return this.cfg.queueBase + this.fx.queueBonus; }
  get rushActive() { const r = this.cfg.rush; return !!r && this.time >= this.cfg.length * r.start && this.time <= this.cfg.length * r.end; }
  get patienceScale() { return Math.max(0.7, 1 - 0.03 * (this.cfg.day - 1)) * this.fx.patienceMult; }
  get satisfaction() { return this.stat.satN ? Math.round(this.stat.satSum / this.stat.satN) : 100; }
  get accepted() { return this.queue.filter((c) => c.accepted && !c.order.done); }
  get allSpawned() { return this.spawnIdx >= this.schedule.length; }
  get complete() { return this.allSpawned && this.queue.length === 0; }
  get clockFrac() { return Math.min(1, this.time / this.cfg.length); }

  _spawn() {
    const day = this.cfg.day;
    const inShop = new Set(this.queue.map((c) => c.def.id));
    let pool = CUSTOMERS.filter((c) => c.intro <= day && !inShop.has(c.id));
    if (!pool.length) pool = CUSTOMERS.filter((c) => c.intro <= day);
    const def = pick(this.rng, pool);
    this.data.stats.orders += 1;
    const order = createOrder({ no: this.data.stats.orders, def, cfg: this.cfg, fx: this.fx, mastery: this.data.mastery, rng: this.rng });
    const max = Math.round(def.patience * this.patienceScale);
    const c = { uid: ++this.uid, def, order, patienceMax: max, patience: max, arrived: false, accepted: false, leaving: false };
    order.customer = c;
    this.queue.push(c);
    return c;
  }

  /** Advance the simulation by dt seconds. Returns events for the view. */
  update(dt) {
    const events = [];
    this.time += dt;
    while (this.spawnIdx < this.schedule.length && this.time >= this.schedule[this.spawnIdx] && this.queue.length < this.capacity) {
      this.spawnIdx++;
      events.push({ type: 'spawn', customer: this._spawn() });
    }
    for (const c of [...this.queue]) {
      if (!c.arrived || c.leaving) continue; // the patience timer starts once they reach their place in line
      c.patience -= dt;
      if (c.patience <= 0) { c.patience = 0; events.push({ type: 'timeout', customer: c, ...this.timeout(c) }); }
    }
    return events;
  }

  arrive(c) { c.arrived = true; }

  accept(c) {
    if (c.accepted) return { ok: false, reason: 'Already taken.' };
    if (this.accepted.length >= this.fx.traySlots) return { ok: false, reason: 'Your prep tray is full — finish a drink first.' };
    c.accepted = true;
    return { ok: true };
  }

  addToCup(c, id) {
    if (!canAdd(c.order.cup, id)) return { ok: false, reason: 'The cup is full!' };
    addIngredient(c.order.cup, id);
    const cost = this._expense(ingredientCost(id, this.fx));
    return { ok: true, cost };
  }
  _expense(cost) { const paid = spendUpTo(this.data, cost); this.stat.expenses = +(this.stat.expenses + cost).toFixed(2); return paid; }

  restartCup(c) { c.order.cup = { contents: {}, log: [] }; }

  _remove(c) { c.leaving = true; this.queue = this.queue.filter((q) => q !== c); }

  _outcome(tier) {
    recordOutcome(this.data.stats, tier);
    this.stat.satSum += TIER_SATISFACTION[tier]; this.stat.satN += 1;
    this.data.reputation = Math.max(0, this.data.reputation + TIER_REPUTATION[tier]);
  }

  /** Serve the customer's cup. Returns score, payout and the reaction line key. */
  serve(c) {
    const o = c.order;
    const result = scoreDrink({ recipe: o.recipe, special: o.special, cup: o.cup, patienceFrac: c.patience / c.patienceMax });
    this._outcome(result.tier);
    const streak = this.data.stats.streak;
    const pay = payout({ price: o.price, tier: result.tier, tipRate: c.def.tip, fx: this.fx, streak, rush: this.rushActive, reputation: this.data.reputation });
    earn(this.data, pay.total);
    this.stat.revenue += pay.pay; this.stat.tips += pay.tip;
    this.stat.served += 1;
    if (result.tier === 'incorrect') this.stat.incorrect += 1; else this.stat.correct += 1;
    if (result.tier === 'perfect') this.stat.perfects += 1;
    this.data.xp += Math.round(result.total / 10);
    let masteryUp = null;
    if (result.total >= 75) {
      const before = masteryLevel(this.data.mastery[o.recipe.id]);
      this.data.mastery[o.recipe.id] = (this.data.mastery[o.recipe.id] || 0) + 1;
      const after = masteryLevel(this.data.mastery[o.recipe.id]);
      if (after > before) masteryUp = { recipe: o.recipe, level: after };
    }
    o.done = true;
    this._remove(c);
    return { ...result, ...pay, masteryUp, streak: this.data.stats.streak };
  }

  timeout(c) {
    this._outcome('missed');
    this.stat.missed += 1;
    c.order.done = true;
    this._remove(c);
    return {};
  }

  summary() {
    const s = this.stat;
    const revenue = s.revenue + s.tips;
    const stars = starRating(this.satisfaction, revenue >= this.cfg.target, s.missed);
    return { ...s, revenue: s.revenue, tips: s.tips, totalRevenue: revenue, net: +(revenue - s.expenses).toFixed(2), satisfaction: this.satisfaction, stars, target: this.cfg.target, targetMet: revenue >= this.cfg.target };
  }
}
