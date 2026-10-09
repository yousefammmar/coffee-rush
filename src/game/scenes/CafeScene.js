import Phaser from 'phaser';
import { game, States } from '../state.js';
import { DayRun } from '../../systems/CustomerSystem.js';
import { dayConfig, completeDay } from '../../systems/ProgressionSystem.js';
import { LINES } from '../../data/customers.js';
import { CafeWorld } from '../CafeWorld.js';
import { CustomerView } from '../CustomerView.js';
import { HUD, hoursLeft } from '../../ui/HUD.js';
import { OrderTicket } from '../../ui/OrderTicket.js';
import { GameButton } from '../../ui/GameButton.js';
import { Tooltip, flashMessage } from '../../ui/DialogBox.js';
import { txt, C, CSS, FONT_PX, pixelBox } from '../../ui/theme.js';
import { GEOM } from '../../art/cafeArt.js';
import { artCanvas } from '../../art/pixel.js';
import { drawCup, CUP_W, CUP_H } from '../../art/cup.js';
import { audio } from '../../systems/AudioSystem.js';
import { openPause, openSettings } from '../../ui/screens.js';
import { mulberry32, pick } from '../../utils/rng.js';
import { closeAllModals } from '../../ui/Modal.js';

const TIER_TITLE = { perfect: 'PERFECT!', great: 'GREAT!', acceptable: 'Good enough', incorrect: 'Wrong drink' };
const TIER_COLOR = { perfect: '#EDC56D', great: '#80AE73', acceptable: '#E5C9A5', incorrect: '#CB6C62' };

export default class CafeScene extends Phaser.Scene {
  constructor() { super('Cafe'); }

  create() {
    this.reduced = game.reducedMotion;
    const data = game.data, cfg = dayConfig(data.day);
    this.cfg = cfg;
    this.run = new DayRun({ data, cfg, fx: game.fx, rng: mulberry32((Date.now() ^ (data.day * 7919)) >>> 0) });
    this.views = new Map(); this.tickets = new Map(); this.prepFor = null; this.finishing = false; this._obj = null; this._flash = null;
    game.setMode(States.DAY_START);
    this.cameras.main.fadeIn(300, 53, 37, 31);

    this.world = new CafeWorld(this, { eq: data.decor.equipped, progress: 0, recipeIds: cfg.recipeIds });
    this.tooltip = new Tooltip(this);
    this.hud = new HUD(this, {
      onPause: () => this.pauseGame(),
      onSettings: () => { if (game.mode !== States.PAUSED) { game.pause(); openSettings({ onClose: () => game.resume() }); } },
    });
    this.objective = txt(this, 480, 446, '', { size: 16, color: CSS.cream, origin: [0.5, 0.5], align: 'center', wrap: 760 }).setDepth(790);
    this.objBg = this.add.graphics().setDepth(789);
    this.hint = txt(this, 390, 142, '▼ Click to prepare', { size: 15, font: FONT_PX, color: CSS.gold, origin: [0.5, 0.5], stroke: '#24160f', strokeThickness: 4 }).setDepth(30).setVisible(false);
    if (!this.reduced) this.tweens.add({ targets: this.hint, y: 150, yoyo: true, repeat: -1, duration: 450 });

    const m = GEOM.machine;
    this.zone = this.add.zone(m.x + 100, m.y + 40, 210, 130).setInteractive({ useHandCursor: true }).setDepth(30);
    this.zone.on('pointerdown', () => this.openPrep());
    this.zone.on('pointerover', () => this.tooltip.show('Espresso machine — click (or press Space) to prepare an order', { getBounds: () => ({ centerX: m.x + 100, top: m.y - 10 }) }));
    this.zone.on('pointerout', () => this.tooltip.hide());
    this.input.keyboard.on('keydown-SPACE', () => { if (this.startPanel) this.beginDay(); else this.openPrep(); });
    this.input.keyboard.on('keydown-ESC', () => { if (!this.prepFor) this.pauseGame(); }); // Esc inside the prep station means "back"
    const onVis = () => { if (document.hidden) this.pauseGame(); };
    document.addEventListener('visibilitychange', onVis);
    this.events.once('shutdown', () => { document.removeEventListener('visibilitychange', onVis); this.tooltip?.hide(); });

    this.showStartPanel();
  }

  // ---------------------------------------------------------------- day start / pause
  showStartPanel() {
    const cfg = this.cfg, g = this.add.graphics().setDepth(950), items = [g];
    items.push(this.add.rectangle(480, 270, 960, 540, 0x24160f, 0.55).setDepth(949).setInteractive());
    pixelBox(g, 230, 100, 500, 300, 0xf7e9d5);
    [[`DAY ${cfg.day}`, 40, FONT_PX, CSS.coffee, 134], [cfg.title, 24, FONT_PX, CSS.espresso, 184], [`Serve ${cfg.customers} customers  ·  Earn ${cfg.target} coins`, 17, undefined, CSS.text, 226]]
      .forEach(([t, s, f, c, y]) => items.push(txt(this, 480, y, t, { size: s, font: f, color: c, origin: [0.5, 0.5] }).setDepth(951)));
    let y = 262;
    const note = (t, color) => { items.push(txt(this, 480, y, t, { size: 16, color, origin: [0.5, 0.5], wrap: 440, align: 'center' }).setDepth(951)); y += 30; };
    if (cfg.newRecipes.length) note(`New on the menu: ${cfg.newRecipes.map((r) => r.name).join(', ')}`, CSS.forest);
    if (cfg.rush) note('Rush hour is coming — expect a crowd around midday!', '#8a3a32');
    if (cfg.day === 3) note('Customers may now add special requests, like extra syrup.', CSS.text);
    const btn = new GameButton(this, { x: 380, y: 336, w: 200, h: 52, label: 'Open the café', size: 19, color: C.success, key: 'SPACE', onClick: () => this.beginDay() }).setDepth(952);
    btn.pulse(!this.reduced);
    items.push(btn);
    this.startPanel = items;
  }
  beginDay() {
    if (!this.startPanel) return;
    this.startPanel.forEach((o) => o.destroy()); this.startPanel = null;
    audio.play('bell');
    game.setMode(States.CUSTOMER_WAITING);
  }

  pauseGame() {
    if (game.mode === States.PAUSED || game.mode === States.DAY_START || game.mode === States.DAY_COMPLETE) return;
    game.pause();
    openPause({ onResume: () => game.resume(), onQuit: () => this.quit() });
  }
  quit() {
    closeAllModals();
    this.scene.stop('Prep');
    game.reload(); // today's unsaved progress is discarded
    game.setMode(States.MAIN_MENU);
    this.scene.start('Menu');
  }

  // ---------------------------------------------------------------- customers
  slotX(i) { return GEOM.queue.frontX - i * GEOM.queue.gap; }
  addCustomer(c) {
    this.views.set(c.uid, new CustomerView(this, c, (view) => this.onCustomerClick(view)));
    audio.play('bell');
    this.layoutQueue();
  }
  layoutQueue() {
    const q = GEOM.queue;
    this.run.queue.forEach((c, i) => {
      const v = this.views.get(c.uid); if (!v || v.leaving) return;
      const x = this.slotX(i);
      if (v.targetX === x) return;
      v.targetX = x;
      const pts = v.y < q.y - 1 ? [{ x: v.x, y: q.y }, { x, y: q.y }] : [{ x, y: q.y }];
      v.moveTo(pts, () => { if (!c.arrived) this.run.arrive(c); this.refreshBubbles(); });
    });
    this.refreshBubbles();
  }
  refreshBubbles() {
    let front = true;
    for (const c of this.run.queue) {
      const v = this.views.get(c.uid); if (!v || v.leaving) continue;
      const mode = c.accepted ? 'accepted' : c.arrived ? 'order' : 'none';
      const isFront = mode === 'order' && front; if (isFront) front = false;
      if (v.mode !== mode || v.front !== isFront) v.setBubbleMode(mode, isFront);
    }
  }
  onCustomerClick(view) {
    if (game.mode !== States.CUSTOMER_WAITING) return;
    const c = view.c;
    if (!c.arrived) return;
    if (c.accepted) { this.openPrep(c); return; }
    const r = this.run.accept(c);
    if (!r.ok) { audio.play('error'); flashMessage(this, r.reason, { color: '#F7D0C8' }); return; }
    audio.play('chime');
    this.addTicket(c);
    this.refreshBubbles();
    flashMessage(this, `Order #${String(c.order.no).padStart(3, '0')} taken: ${c.order.recipe.name}`);
  }

  // ---------------------------------------------------------------- tickets
  addTicket(c) {
    this.tickets.set(c.uid, new OrderTicket(this, { x: 0, y: 0, customer: c, mode: 'rail', onClick: () => this.openPrep(c) }).setDepth(800));
    this.layoutTickets();
  }
  removeTicket(c) { this.tickets.get(c.uid)?.destroy(); this.tickets.delete(c.uid); this.layoutTickets(); }
  layoutTickets() {
    const list = [...this.tickets.values()], sc = Math.min(1, 940 / (Math.max(1, list.length) * 222));
    list.forEach((t, i) => t.setScale(sc).setPosition(10 + i * 222 * sc, 538 - t.h * sc - 4));
  }

  // ---------------------------------------------------------------- preparation
  openPrep(c) {
    if (game.mode !== States.CUSTOMER_WAITING) return;
    c = c || this.run.accepted[0];
    if (!c) { audio.play('error'); flashMessage(this, 'Take an order first: click a customer’s speech bubble.', { color: '#F7D0C8' }); return; }
    this.prepFor = c;
    game.setMode(States.PREPARING);
    this.scene.launch('Prep', { customer: c, run: this.run, cafe: this, pause: () => this.pauseGame() });
    this.tooltip.hide();
  }
  /** Called by the Prep scene. action: 'serve' | 'back' */
  prepClosed(c, action) {
    this.prepFor = null; this.world.baristaFrame('idle');
    if (action === 'serve') this.serve(c); else if (game.mode === States.PREPARING) game.setMode(States.CUSTOMER_WAITING);
  }

  serve(c) {
    game.setMode(States.SERVING);
    const v = this.views.get(c.uid);
    if (this.textures.exists('serve_cup')) this.textures.remove('serve_cup');
    this.textures.addCanvas('serve_cup', artCanvas(CUP_W, CUP_H, (x) => drawCup(x, c.order.cup, { glass: c.order.recipe.iced }), { scale: 2 }));
    const cup = this.add.image(GEOM.baristaX, 232, 'serve_cup').setDepth(40);
    const land = () => { cup.destroy(); this.showResult(c, v, this.run.serve(c)); };
    if (this.reduced) land(); else this.tweens.add({ targets: cup, x: v.x, y: { value: 300, ease: 'Quad.easeIn' }, duration: 520, onComplete: land });
  }

  showResult(c, v, res) {
    const tier = res.tier;
    const line = pick(Math.random, { perfect: LINES.perfect, great: LINES.great, acceptable: LINES.good, incorrect: LINES.bad }[tier]);
    audio.play(tier === 'incorrect' ? 'error' : tier === 'perfect' ? 'chime' : 'good');
    if (res.total > 0) { audio.play('coin'); this.floatText(v.x, 330, `+${res.total}`, '#EDC56D', true); }
    v.say(line, 2600);
    this.removeTicket(c);
    const lines = tier === 'incorrect' ? res.messages.slice(0, 3) : [`${res.pay} coins${res.tip ? ` + ${res.tip} tip` : ''}`];
    const fade = [
      txt(this, 480, 98, `${TIER_TITLE[tier]}  ${res.total}/100`, { size: 24, font: FONT_PX, color: TIER_COLOR[tier], origin: [0.5, 0], stroke: '#24160f', strokeThickness: 6 }).setDepth(900),
      txt(this, 480, 130, lines.join('\n'), { size: 15, color: CSS.cream, origin: [0.5, 0], align: 'center', stroke: '#24160f', strokeThickness: 4, wrap: 560 }).setDepth(900),
    ];
    if (res.streak >= 3 && this.run.rushActive) fade.push(txt(this, 480, 168 + (lines.length - 1) * 18, `Rush combo x${res.streak}!`, { size: 15, font: FONT_PX, color: CSS.gold, origin: [0.5, 0], stroke: '#24160f', strokeThickness: 4 }).setDepth(900));
    this.tweens.add({ targets: fade, alpha: 0, delay: 2600, duration: 400, onComplete: () => fade.forEach((o) => o.destroy()) });
    this.world.baristaFrame(tier === 'incorrect' ? 'sad' : 'happy');
    this.time.delayedCall(700, () => this.world.baristaFrame('idle'));
    if (res.masteryUp) this.time.delayedCall(900, () => { audio.play('unlock'); flashMessage(this, `${res.masteryUp.recipe.name} mastery level ${res.masteryUp.level}! (+1 coin per drink)`, { color: '#EDC56D', y: 200, ms: 3000 }); });
    game.checkAchievements().forEach((a, i) => this.time.delayedCall(1400 + i * 1800, () => { audio.play('unlock'); flashMessage(this, `Achievement unlocked: ${a.name}`, { color: '#EDC56D', y: 230, ms: 2600 }); }));
    v.react(tier, () => {
      v.leave(); this.layoutQueue();
      if (game.mode === States.SERVING) game.setMode(States.CUSTOMER_WAITING);
    });
  }

  onTimeout(c) {
    const v = this.views.get(c.uid);
    audio.play('error');
    if (this.prepFor === c) this.scene.get('Prep')?.forceClose?.(`${c.def.name} got tired of waiting and left.`);
    this.removeTicket(c);
    v.say(LINES.timeout[0], 1800);
    v.react('incorrect', () => { v.leave(); this.layoutQueue(); });
    this.refreshBubbles();
  }

  floatText(x, y, str, color, coin) {
    const parts = [txt(this, x, y, str, { size: 24, font: FONT_PX, color, origin: [0.5, 0.5], stroke: '#24160f', strokeThickness: 5 }).setDepth(900)];
    if (coin) parts.push(this.add.image(x - parts[0].width / 2 - 16, y, 'coin').setDepth(900).setScale(0.8));
    const done = () => parts.forEach((p) => p.destroy());
    if (this.reduced) this.time.delayedCall(1000, done);
    else this.tweens.add({ targets: parts, y: '-=50', alpha: 0, duration: 1300, ease: 'Quad.easeOut', onComplete: done });
  }

  // ---------------------------------------------------------------- loop
  update(time, delta) {
    const run = this.run;
    this.world.setProgress(run.clockFrac);
    const dt = game.dt(delta);
    if (dt > 0) {
      for (const e of run.update(dt)) { if (e.type === 'spawn') this.addCustomer(e.customer); else if (e.type === 'timeout') this.onTimeout(e.customer); }
      audio.setRush(run.rushActive);
    }
    this.views.forEach((v) => v.update(time));
    this.tickets.forEach((t) => t.refresh());
    this.hud.update(run, game.data);
    if (this.prepFor) this.world.baristaFrame(Math.floor(time / 280) % 2 ? 'walkA' : 'walkB'); // barista "works" while you prepare
    this.updateObjective();
    this.hint.setVisible(game.mode === States.CUSTOMER_WAITING && run.accepted.length > 0);
    if (!this.finishing && game.mode === States.CUSTOMER_WAITING && run.complete) this.finishDay();
  }

  updateObjective() {
    const run = this.run; let s;
    if (game.mode === States.DAY_START) s = `Day ${this.cfg.day}: press “Open the café” to begin.`;
    else if (game.mode === States.PREPARING) s = 'Preparing a drink…';
    else {
      const waiting = run.queue.find((c) => c.arrived && !c.accepted), next = run.accepted[0];
      if (waiting) s = `Click ${waiting.def.name}’s speech bubble to take the order.`;
      else if (next) s = `Click the espresso machine (or press Space) to make ${next.def.name}’s ${next.order.recipe.name}.`;
      else if (run.complete) s = 'All customers served — closing up!';
      else s = `Waiting for customers…  ${hoursLeft(run.clockFrac)}`;
    }
    if (s !== this._obj) {
      this._obj = s; this.objective.setText(s);
      const w = this.objective.width + 28;
      this.objBg.clear().fillStyle(0x24160f, 0.82).fillRect(480 - w / 2, 432, w, 28);
    }
  }

  finishDay() {
    this.finishing = true;
    game.setMode(States.DAY_COMPLETE);
    audio.setRush(false);
    flashMessage(this, 'Closing time!', { y: 230, ms: 1500 });
    const summary = this.run.summary();
    const newRecipes = completeDay(game.data, summary);
    const achievements = game.checkAchievements();
    game.save();
    this.time.delayedCall(1600, () => this.scene.start('Results', { summary, newRecipes, achievements, day: this.cfg.day }));
  }
}
