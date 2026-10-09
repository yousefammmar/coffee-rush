import Phaser from 'phaser';
import { game, States } from '../state.js';
import { CafeWorld } from '../CafeWorld.js';
import { CUSTOMERS } from '../../data/customers.js';
import { characterKey } from '../../art/characters.js';
import { GEOM } from '../../art/cafeArt.js';
import { el, button, confirmDialog } from '../../ui/Modal.js';
import { openSettings, openCredits, openHowTo, openRecipeBook, openAchievements } from '../../ui/screens.js';
import { unlockedRecipeIds } from '../../systems/ProgressionSystem.js';
import { pick } from '../../utils/rng.js';

export default class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    this.reduced = game.reducedMotion;
    game.setMode(States.MAIN_MENU);
    this.cameras.main.fadeIn(400, 53, 37, 31);
    this.world = new CafeWorld(this, { eq: game.data.decor.equipped, progress: 0.38, recipeIds: unlockedRecipeIds(Math.max(4, game.data.day)) });
    this.walkers = [];
    if (!this.reduced) { this.time.addEvent({ delay: 4200, loop: true, callback: () => this.spawnWalker() }); this.spawnWalker(); }
    else this.staticCustomers();
    this.ui = el('div', { className: 'menu' });
    document.getElementById('ui').append(this.ui);
    this.events.once('shutdown', () => this.ui.remove());
    this.build();
  }

  build() {
    const has = game.hasSave;
    const box = el('div', { className: 'menu-box' },
      el('h1', {}, 'COFFEE RUSH'),
      el('p', { className: 'tag-line' }, 'Brew Happiness, One Cup at a Time.'),
    );
    const newGame = button('New Game', async () => {
      if (has && !(await confirmDialog({ title: 'Start a new game?', message: `You have a saved café (Day ${game.data.day}, ${Math.floor(game.data.money)} coins). Starting over will replace it.`, ok: 'Replace my save', danger: true }))) return;
      game.newGame();
      this.scene.start('Tutorial', { firstRun: true });
    }, 'green');
    const cont = button(has ? `Continue · Day ${game.data.day}` : 'Continue', () => this.scene.start('Cafe'), 'gold');
    cont.disabled = !has; if (!has) cont.title = 'No saved game yet';
    box.append(newGame, cont,
      button('How to Play', () => openHowTo(() => this.scene.start('Tutorial', { firstRun: false }))),
      button('Settings', () => openSettings({ onClose: () => this.rebuild() })),
      button('Credits', openCredits));
    box.append(el('div', { className: 'menu-links' }, button('Recipe Book', openRecipeBook, 'cream small'), button('Achievements', openAchievements, 'cream small'), ...(has ? [button('Shop', () => this.scene.start('Shop'), 'cream small')] : [])));
    box.append(el('span', { className: 'ver' }, 'v1.0 · progress saves automatically'));
    this.ui.replaceChildren(box);
    setTimeout(() => (has ? cont : newGame).focus(), 50);
  }
  rebuild() { if (this.ui?.isConnected) this.build(); }

  // Ambient customers wander in, linger, and leave.
  spawnWalker() {
    if (this.walkers.length >= 3) return;
    const def = pick(Math.random, CUSTOMERS);
    const s = this.add.image(GEOM.queue.doorX, GEOM.queue.doorY, characterKey(def.id, 'idle')).setOrigin(0.5, 1).setDepth(20);
    const w = { s, def, walking: true };
    this.walkers.push(w);
    const x = Phaser.Math.Between(400, 820), y = Phaser.Math.Between(400, 460);
    const go = (pts, done) => { let i = 0; const next = () => { if (i >= pts.length) return done(); const p = pts[i++]; this.tweens.add({ targets: s, x: p.x, y: p.y, duration: Phaser.Math.Distance.Between(s.x, s.y, p.x, p.y) / 0.11, onComplete: next }); }; next(); };
    go([{ x: GEOM.queue.doorX, y }, { x, y }], () => { w.walking = false; s.setTexture(characterKey(def.id, 'idle')); this.time.delayedCall(3200, () => { w.walking = true; go([{ x: GEOM.queue.doorX, y }, { x: GEOM.queue.doorX, y: GEOM.queue.doorY }], () => { s.destroy(); this.walkers = this.walkers.filter((q) => q !== w); }); }); });
  }
  staticCustomers() { [[560, 430, 'mia'], [680, 420, 'noah']].forEach(([x, y, id]) => this.add.image(x, y, characterKey(id, 'idle')).setOrigin(0.5, 1).setDepth(20)); }
  update(time) { this.walkers.forEach((w) => { if (w.walking) { w.s.setTexture(characterKey(w.def.id, Math.floor(time / 170) % 2 ? 'walkA' : 'walkB')); } }); }
}
