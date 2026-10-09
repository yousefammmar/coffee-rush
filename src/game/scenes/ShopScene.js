import Phaser from 'phaser';
import { game, States } from '../state.js';
import { CafeWorld } from '../CafeWorld.js';
import { el, button, openModal, toast } from '../../ui/Modal.js';
import { openRecipeBook } from '../../ui/screens.js';
import { UPGRADES } from '../../data/upgrades.js';
import { DECOR_CATEGORIES } from '../../data/decor.js';
import { purchaseUpgrade, purchaseDecor, equipDecor } from '../../systems/EconomySystem.js';
import { audio } from '../../systems/AudioSystem.js';

export default class ShopScene extends Phaser.Scene {
  constructor() { super('Shop'); }

  create() {
    game.setMode(States.SHOP);
    this.reduced = game.reducedMotion;
    this.tab = 'equip';
    this.cameras.main.fadeIn(300, 53, 37, 31);
    this.buildWorld();
    this.body = el('div', {});
    this.modal = openModal({
      title: 'Café Shop', size: 'narrow', side: true, closable: false, content: [this.body],
      actions: [button('Recipe Book', openRecipeBook, 'cream small'), button('Main Menu', () => this.leave('Menu'), 'cream'), button(`Start Day ${game.data.day}`, () => this.leave('Cafe'), 'green')],
    });
    this.modal.el.querySelector('.panel').style.width = 'min(520px, 100%)';
    this.events.once('shutdown', () => this.modal.el.remove());
    this.render();
  }
  buildWorld() { this.world = new CafeWorld(this, { eq: game.data.decor.equipped, progress: 0.3, recipeIds: game.data.unlockedRecipes, ambient: false }); }
  leave(to) { this.scene.start(to); }

  render() {
    const d = game.data;
    const tabs = el('div', { className: 'tabs', role: 'tablist' }, ...[['equip', 'Equipment'], ['decor', 'Café decor']].map(([id, label]) => {
      const t = el('button', { className: 'tab', type: 'button', role: 'tab', ariaSelected: String(this.tab === id) }, label);
      t.addEventListener('click', () => { audio.play('click'); this.tab = id; this.render(); });
      return t;
    }));
    const wallet = el('div', { className: 'wallet' }, el('span', { className: 'coins' }, `${Math.floor(d.money)} coins`), el('span', { className: 'muted' }, this.tab === 'equip' ? 'Every upgrade changes gameplay.' : 'Decor is cosmetic and previews live.'));
    this.body.replaceChildren(wallet, tabs, this.tab === 'equip' ? this.equipment() : this.decor());
    this.modal.body.scrollTop = this.scrollKeep ?? 0;
  }

  after(res, okMsg) {
    this.scrollKeep = this.modal.body.scrollTop;
    if (!res.ok) { audio.play('error'); toast(res.reason, 'err'); return false; }
    audio.play('buy'); toast(okMsg); game.save();
    game.checkAchievements().forEach((a) => { toast(`Achievement unlocked: ${a.name}`); audio.play('unlock'); });
    game.save();
    return true;
  }

  equipment() {
    const wrap = el('div', { className: 'cards', style: 'grid-template-columns:1fr' });
    for (const u of UPGRADES) {
      const lvl = game.data.upgrades[u.id] || 0, max = u.costs.length, cost = u.costs[lvl];
      const buy = button(lvl >= max ? 'Maxed' : `Buy · ${cost}`, () => { if (this.after(purchaseUpgrade(game.data, u.id), `${u.name} upgraded!`)) this.render(); }, 'green small');
      buy.disabled = lvl >= max || game.data.money < cost;
      if (lvl < max && game.data.money < cost) buy.title = `Need ${cost - Math.floor(game.data.money)} more coins`;
      wrap.append(el('div', { className: `card ${lvl >= max ? 'done' : ''}` },
        el('h4', {}, u.name), el('div', { className: 'muted' }, u.desc), el('div', {}, el('strong', {}, u.benefit)),
        el('div', { className: 'pips', ariaLabel: `Level ${lvl} of ${max}` }, ...Array.from({ length: max }, (_, i) => el('i', { className: `pip ${i < lvl ? 'on' : ''}` }))),
        el('div', { className: 'muted' }, `Level ${lvl}/${max}`), buy));
    }
    return wrap;
  }

  decor() {
    const wrap = el('div', {});
    const d = game.data;
    for (const cat of DECOR_CATEGORIES) {
      wrap.append(el('h3', {}, cat.name));
      const cards = el('div', { className: 'cards', style: 'grid-template-columns:1fr 1fr' });
      for (const it of cat.items) {
        const owned = it.price === 0 || d.decor.owned.includes(`${cat.id}:${it.id}`);
        const eq = d.decor.equipped[cat.id] === it.id;
        let b;
        if (eq) { b = button('Equipped', null, 'cream small'); b.disabled = true; }
        else if (owned) b = button('Equip', () => { equipDecor(d, cat.id, it.id); game.save(); this.refreshWorld(); }, 'small');
        else { b = button(`Buy · ${it.price}`, () => { if (this.after(purchaseDecor(d, cat.id, it.id), `${it.name} bought & equipped!`)) this.refreshWorld(); }, 'green small'); b.disabled = d.money < it.price; }
        cards.append(el('div', { className: `card ${eq ? 'done' : ''}` }, el('h4', {}, it.name), el('div', { className: 'muted' }, it.desc), b));
      }
      wrap.append(cards);
    }
    return wrap;
  }

  refreshWorld() {
    this.scrollKeep = this.modal.body.scrollTop;
    this.tweens.killAll(); this.children.removeAll(true);
    this.buildWorld();
    this.render();
  }
}
