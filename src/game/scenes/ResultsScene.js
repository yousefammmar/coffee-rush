import Phaser from 'phaser';
import { game, States } from '../state.js';
import { CafeWorld } from '../CafeWorld.js';
import { el, button, openModal } from '../../ui/Modal.js';
import { openAchievements } from '../../ui/screens.js';
import { starCanvas, recipeCanvas } from '../../art/icons.js';
import { audio } from '../../systems/AudioSystem.js';
import { dayConfig } from '../../systems/ProgressionSystem.js';

const fmt = (n, dec) => (dec ? n.toFixed(dec) : String(Math.round(n)));

/** End-of-day results: animated counters, star reveal, achievements. */
export default class ResultsScene extends Phaser.Scene {
  constructor() { super('Results'); }
  init(d) { this.res = d; }

  create() {
    game.setMode(States.DAY_COMPLETE);
    this.reduced = game.reducedMotion;
    this.cameras.main.fadeIn(400, 53, 37, 31);
    new CafeWorld(this, { eq: game.data.decor.equipped, progress: 1, recipeIds: [], ambient: false });
    audio.setRush(false);
    const { summary: s, newRecipes, achievements, day } = this.res;
    const grid = el('div', { className: 'stat-grid' });
    const rows = [
      ['Customers served', s.served, 0], ['Correct orders', s.correct, 0], ['Incorrect orders', s.incorrect, 0], ['Missed customers', s.missed, 0], null,
      ['Drink sales', s.revenue, 0, '+'], ['Tips', s.tips, 0, '+'], ['Ingredient expenses', s.expenses, 2, '-'], null,
      ['Net profit', s.net, 2, s.net >= 0 ? '+' : ''], ['Customer satisfaction', s.satisfaction, 0, '', '%'],
    ];
    const counters = [];
    rows.forEach((r) => {
      if (!r) { grid.append(el('hr')); return; }
      const [label, val, dec, sign = '', unit = ''] = r;
      const v = el('div', { className: `v ${sign === '-' ? 'neg' : sign === '+' ? 'pos' : ''}` }, `${fmt(0, dec)}${unit}`);
      grid.append(el('div', {}, label), v);
      counters.push({ v, val: Math.abs(val), dec, sign, unit, neg: val < 0 });
    });
    const stars = el('div', { className: 'stars', role: 'img', ariaLabel: `${s.stars} out of 5 stars` });
    const starEls = Array.from({ length: 5 }, () => starCanvas(4)); stars.append(...starEls);
    const target = el('p', { className: 'banner' }, s.targetMet ? `Target reached: ${Math.floor(s.totalRevenue)} / ${s.target} coins` : `Target missed: ${Math.floor(s.totalRevenue)} / ${s.target} coins`);
    target.style.color = s.targetMet ? '' : '#8a3a32';
    const extras = el('div', {});
    newRecipes.forEach((r) => extras.append(el('div', { className: 'ach-new' }, recipeCanvas(r, 2), el('div', {}, el('strong', {}, `New recipe unlocked: ${r.name}`), el('div', { className: 'muted' }, `Ready on Day ${r.unlockDay}`)))));
    achievements.forEach((a) => extras.append(el('div', { className: 'ach-new' }, el('strong', {}, `★ Achievement: ${a.name}`), el('span', { className: 'muted' }, a.desc))));
    const timers = [];
    const modal = openModal({
      title: `Day ${day} complete`, size: 'mid', closable: false,
      content: [el('p', { className: 'banner' }, dayConfig(day).title), stars, grid, target, extras],
      actions: [
        button('Main Menu', () => this.go('Menu'), 'cream'),
        button('Achievements', openAchievements, 'cream'),
        button('Visit Shop', () => this.go('Shop'), 'gold'),
        button(`Next Day (${game.data.day})`, () => this.go('Cafe'), 'green'),
      ],
    });
    this.modal = modal;
    this.events.once('shutdown', () => { timers.forEach(clearTimeout); modal.el.remove(); });

    const reveal = () => starEls.slice(0, s.stars).forEach((st, i) => timers.push(setTimeout(() => { st.classList.add('on'); audio.play('star'); }, this.reduced ? 0 : i * 380)));
    if (this.reduced) { counters.forEach((c) => { c.v.textContent = this.fmt(c, c.val); }); reveal(); return; }
    counters.forEach((c, i) => timers.push(setTimeout(() => {
      const t0 = performance.now();
      const tick = (now) => { const p = Math.min(1, (now - t0) / 650); c.v.textContent = this.fmt(c, c.val * (1 - Math.pow(1 - p, 3))); if (p < 1 && c.v.isConnected) requestAnimationFrame(tick); };
      requestAnimationFrame(tick); audio.play('click');
    }, 250 + i * 190)));
    timers.push(setTimeout(reveal, 250 + counters.length * 190 + 700));
  }
  fmt(c, v) { return `${(c.sign === '-' || c.neg) && v > 0.004 ? '-' : ''}${fmt(v, c.dec)}${c.unit}`; }
  go(scene) { this.scene.start(scene); }
}
