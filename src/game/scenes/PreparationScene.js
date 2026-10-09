import Phaser from 'phaser';
import { game } from '../state.js';
import { INGREDIENTS, STATION_UNLOCK_DAY, CUP_CAPACITY } from '../../data/recipes.js';
import { canAdd, liquidUnits } from '../../systems/RecipeSystem.js';
import { OrderTicket } from '../../ui/OrderTicket.js';
import { GameButton } from '../../ui/GameButton.js';
import { Tooltip, flashMessage } from '../../ui/DialogBox.js';
import { txt, C, CSS, FONT_PX, pixelBox } from '../../ui/theme.js';
import { SKINS } from '../../art/cafeArt.js';
import { artCanvas } from '../../art/pixel.js';
import { drawCup, CUP_W, CUP_H } from '../../art/cup.js';
import { audio } from '../../systems/AudioSystem.js';

const CUP_X = 420, CUP_Y = 312, CUP_SCALE = 6;
const ITEMS = {
  grind: { label: 'Grind beans', key: 'G' }, brew: { label: 'Brew', key: 'B' },
  steam: { label: 'Steam (hold)', key: 'S' }, milk: { label: 'Pour milk', key: 'M', ing: 'milk' }, foam: { label: 'Pour foam', key: 'F', ing: 'foam' },
  water: { label: 'Hot water', key: 'W', ing: 'water' }, chocolate: { label: 'Chocolate', key: 'C', ing: 'chocolate' }, ice: { label: 'Ice', key: 'I', ing: 'ice' },
  vanilla: { label: 'Vanilla', key: 'V', ing: 'vanilla' }, caramel: { label: 'Caramel', key: 'A', ing: 'caramel' }, hazelnut: { label: 'Hazelnut', key: 'H', ing: 'hazelnut' },
  whip: { label: 'Whip', key: '1', ing: 'whip' }, cinnamon: { label: 'Cinnamon', key: '2', ing: 'cinnamon' }, choc_powder: { label: 'Choc pdr', key: '3', ing: 'choc_powder' }, caramel_drizzle: { label: 'Drizzle', key: '4', ing: 'caramel_drizzle' },
};
const GROUPS = [['ESPRESSO', ['grind', 'brew']], ['MILK', ['steam', 'milk', 'foam']], ['MIXERS', ['water', 'chocolate', 'ice']], ['SYRUPS', ['vanilla', 'caramel', 'hazelnut']], ['TOPPINGS', ['whip', 'cinnamon', 'choc_powder', 'caramel_drizzle']]];
const BASE = { grind: 1.2, brew: 2.5, steam: 2.0 }; // seconds, before upgrade multipliers

export default class PreparationScene extends Phaser.Scene {
  constructor() { super('Prep'); }
  // Scene instances are reused between launches, so reset per-run flags here.
  init(d) { this.opts = d; this.closing = false; this.msg = null; this.steamSfx = null; }

  create() {
    const { customer: c, run } = this.opts;
    this.c = c; this.run = run; this.reduced = game.reducedMotion; this.fx = game.fx; this.tut = this.opts.tutorial || null;
    this.day = this.tut ? 99 : game.data.day;
    Object.assign(this, { ground: false, grindP: 0, grinding: false, brewP: 0, brewing: false, steamP: 0, steaming: false, portions: 0, anim: 1 });
    this.tooltip = new Tooltip(this);
    this.add.rectangle(480, 270, 960, 540, 0x1a0f0a, 0.9).setInteractive().setDepth(0);
    const g = this.add.graphics();
    pixelBox(g, 6, 48, 252, 480, 0x4a3326, { border: 0x1a0f0a });
    pixelBox(g, 266, 48, 308, 428, 0x5a4030, { border: 0x1a0f0a });
    pixelBox(g, 580, 48, 374, 428, 0x4a3326, { border: 0x1a0f0a });
    if (!this.tut) txt(this, 14, 12, 'PREPARATION STATION', { size: 22, font: FONT_PX, color: CSS.gold });

    this.ticket = new OrderTicket(this, { x: 8, y: 54, customer: c, mode: 'full' });
    this.drawMachine();
    this.cupTex = this.textures.addCanvas('cup_live', Object.assign(document.createElement('canvas'), { width: CUP_W * CUP_SCALE, height: CUP_H * CUP_SCALE }));
    this.cupImg = this.add.image(CUP_X, CUP_Y, 'cup_live').setDepth(5);
    this.stream = this.add.graphics().setDepth(4);
    this.pitcher = this.add.graphics().setDepth(5);
    this.contents = txt(this, CUP_X, 414, '', { size: 13, color: CSS.cream, origin: [0.5, 0], align: 'center', wrap: 290 });
    this.cupName = txt(this, CUP_X, 232, '', { size: 12, color: CSS.beige, origin: [0.5, 1], bold: false });
    this.msg = null;
    this.buildButtons();
    this.buildBottomBar();
    this.renderCup();
    this.input.keyboard.on('keydown-ESC', () => this.close('back'));

    if (this.tut) {
      this.tutText = txt(this, 480, 26, '', { size: 16, color: CSS.cream, origin: [0.5, 0.5], align: 'center', wrap: 600 }).setDepth(50);
      this.tutBg = this.add.graphics().setDepth(49);
      this.refreshTutorial();
    }
    this.events.once('shutdown', () => { this.tooltip.hide(); this.steamSfx?.stop(); if (this.textures.exists('cup_live')) this.textures.remove('cup_live'); });
  }

  // ------------------------------------------------------------ layout
  drawMachine() {
    const eq = game.data.decor.equipped.machine, s = SKINS[eq] || SKINS.steel;
    const g = this.add.graphics().setDepth(2);
    const hex = (h) => Phaser.Display.Color.HexStringToColor(h).color;
    g.fillStyle(hex(s.dark)).fillRect(318, 60, 204, 14);
    g.fillStyle(hex(s.body)).fillRect(322, 70, 196, 112).fillStyle(hex(s.light)).fillRect(322, 70, 196, 5).fillStyle(hex(s.dark)).fillRect(322, 176, 196, 6);
    g.fillStyle(hex(s.dark)).fillRect(334, 84, 40, 40).fillStyle(0xf7efe2).fillRect(338, 88, 32, 32).fillStyle(0xcb6c62).fillRect(353, 92, 3, 14).fillStyle(0x674735).fillRect(348, 104, 14, 3);
    g.fillStyle(hex(s.dark)).fillRect(392, 84, 116, 26);
    g.fillStyle(hex(s.dark)).fillRect(378, 140, 84, 16).fillStyle(0x24160f).fillRect(412, 156, 16, 26);
    g.fillStyle(hex(s.dark)).fillRect(318, 182, 204, 12);
    for (let i = 0; i < 22; i++) g.fillStyle(0x000000, 0.35).fillRect(324 + i * 9, 186, 5, 4);
    this.lights = this.add.graphics().setDepth(3);
    this.drawLights(0);
    g.fillStyle(0x24160f, 0.6).fillRect(362, 408, 116, 8).fillStyle(hex(s.dark)).fillRect(358, 404, 124, 6); // drip tray
    txt(this, 402, 118, 'ESPRESSO', { size: 11, font: FONT_PX, color: s.light, origin: [0.5, 0.5] });
  }
  drawLights(t) {
    const on = this.brewing || this.grinding || this.steaming;
    const cols = [0xcb6c62, 0x80ae73, 0xedc56d];
    this.lights.clear();
    cols.forEach((c, i) => { const lit = on ? Math.floor(t / 160 + i) % 2 === 0 : (this.ground || this.portions > 0) && i === 1; this.lights.fillStyle(lit ? c : 0x3a2a22).fillRect(402 + i * 28, 90, 14, 14).lineStyle(2, 0x24160f).strokeRect(402 + i * 28, 90, 14, 14); });
  }

  buildButtons() {
    this.btn = {};
    GROUPS.forEach(([title, ids], gi) => {
      const top = 54 + gi * 84;
      txt(this, 590, top, title, { size: 12, font: FONT_PX, color: CSS.caramel });
      const n = ids.length, w = (354 - (n - 1) * 8) / n;
      ids.forEach((id, i) => {
        const it = ITEMS[id], unlockDay = it.ing ? STATION_UNLOCK_DAY[it.ing] : 1;
        const colors = { grind: C.beige, brew: C.caramel, steam: C.beige, milk: 0xf7e9d5, foam: 0xfff6e6, water: 0xcfe3ea, ice: 0xcfe9f2 };
        const b = new GameButton(this, {
          x: 592 + i * (w + 8), y: top + 18, w, h: 54, label: it.label, sub: it.ing || id === 'steam' ? ' ' : '', size: n > 3 ? 13 : 15, key: it.key,
          color: colors[id] ?? (INGREDIENTS[id]?.group === 'syrup' ? C.caramel : C.beige), tip: this.tipFor(id),
          onClick: id === 'steam' ? undefined : () => this.press(id),
          onDown: id === 'steam' ? () => this.steamDown() : undefined, onUp: id === 'steam' ? () => this.steamUp() : undefined,
        });
        if (unlockDay > this.day) { b.setLocked(`Day ${unlockDay}`); b.onLockedClick = () => this.say(`${INGREDIENTS[it.ing].name} unlocks on Day ${unlockDay}.`, 'warn'); }
        this.btn[id] = b;
      });
    });
    if (this.fx.autoGrind) { this.btn.grind.setLabel('Auto-grind ✓'); this.btn.grind.setEnabled(false); }
  }
  tipFor(id) {
    return { grind: 'Grind the beans before brewing.', brew: 'Brews one espresso shot into the cup.', steam: 'Hold to steam milk. Gives 2 pours (milk or foam).', milk: 'Pour steamed milk into the cup.', foam: 'Pour milk foam on top.', water: 'Add a pour of hot water.', ice: 'Add ice cubes.' }[id] || (INGREDIENTS[id] ? `Add ${INGREDIENTS[id].name.toLowerCase()} (1 unit per press).` : '');
  }
  buildBottomBar() {
    this.back = new GameButton(this, { x: 12, y: 482, w: 240, h: 48, label: 'Back to café', color: C.beige, key: 'ESC', onClick: () => this.close('back'), tip: 'Your cup is kept while you serve others.' });
    this.restart = new GameButton(this, { x: 592, y: 484, w: 170, h: 46, label: 'Restart drink', color: C.coral, textColor: '#fff', key: 'R', onClick: () => this.action('restart', () => this.restartCup()), tip: 'Empty the cup and start again (wasted ingredients cost coins).' });
    this.serveBtn = new GameButton(this, { x: 772, y: 480, w: 176, h: 54, label: 'Serve ✓', size: 19, color: C.success, key: 'ENTER', onClick: () => this.action('serve', () => this.serveNow()) });
    if (this.opts.pause) this.pauseBtn = new GameButton(this, { x: 902, y: 6, w: 48, h: 36, label: 'II', color: C.caramel, onClick: () => this.opts.pause(), tip: 'Pause' });
  }

  // ------------------------------------------------------------ messages / tutorial
  say(text, kind = 'info') {
    const color = { info: CSS.cream, warn: CSS.gold, error: '#F7A89E', good: '#B8E0A8' }[kind];
    this.msg?.destroy();
    const t = txt(this, CUP_X, 456, text, { size: 13, color, origin: [0.5, 0], align: 'center', wrap: 290, stroke: '#24160f', strokeThickness: 3 }).setDepth(20);
    this.msg = t; this.time.delayedCall(3200, () => { if (this.msg === t) { t.destroy(); this.msg = null; } });
    if (kind === 'error' || kind === 'warn') audio.play('error');
  }
  action(name, fn) {
    if (this.tut && this.tut.expect() !== name) { this.say(`Not yet! ${this.tut.text()}`, 'warn'); return; }
    fn();
  }
  advance(name) { if (this.tut && this.tut.expect() === name) { this.tut.next(); this.refreshTutorial(); } }
  refreshTutorial() {
    const t = this.tut, [i, n] = t.progress();
    const text = i < n ? `Step ${i + 1}/${n}: ${t.text()}` : 'All steps done!';
    this.tutText.setText(text);
    const w = this.tutText.width + 30;
    this.tutBg.clear().fillStyle(0x24160f, 0.95).fillRect(480 - w / 2, 8, w, this.tutText.height + 14).lineStyle(3, C.gold, 1).strokeRect(480 - w / 2, 8, w, this.tutText.height + 14);
    this.tutText.y = 8 + (this.tutText.height + 14) / 2;
    const exp = t.expect();
    Object.entries({ ...this.btn, restart: this.restart, serve: this.serveBtn }).forEach(([id, b]) => b.pulse(id === exp));
  }

  press(id) {
    if (id === 'grind') return this.action('grind', () => this.startGrind());
    if (id === 'brew') return this.action('brew', () => this.startBrew());
    if (id === 'steam') return;
    this.action(id, () => this.addIng(ITEMS[id].ing));
  }

  // ------------------------------------------------------------ station mechanics
  startGrind() {
    if (this.ground) return this.say('The beans are already ground. Press Brew!', 'info');
    if (this.grinding) return;
    this.grinding = true; this.grindP = 0; audio.play('grind');
  }
  startBrew() {
    if (this.brewing) return;
    if (!canAdd(this.c.order.cup, 'espresso')) return this.say('The cup is full!', 'error');
    if (!this.ground) {
      if (!this.fx.autoGrind) return this.say('Grind the beans first!', 'warn');
      this.ground = true; // automated grinder
    }
    this.brewing = true; this.brewP = 0; this.ground = false;
    audio._brewDur = BASE.brew * this.fx.brewMult; audio.play('brew');
  }
  steamDown() {
    if (this.tut && this.tut.expect() !== 'steam') return this.say(`Not yet! ${this.tut.text()}`, 'warn');
    if (this.portions > 0) return this.say('The pitcher is already steamed — pour it!', 'info');
    this.steaming = true; this.steamSfx = audio.play('steam');
  }
  steamUp() { this.steaming = false; this.steamSfx?.stop(); this.steamSfx = null; }

  addIng(id) {
    if (id === 'milk' || id === 'foam') {
      if (this.portions <= 0) return this.say('Steam the milk first: hold the Steam button.', 'warn');
    }
    const r = this.run.addToCup(this.c, id);
    if (!r.ok) return this.say(r.reason, 'error');
    if (id === 'milk' || id === 'foam') this.portions -= 1;
    audio.play(id === 'milk' || id === 'foam' || id === 'water' ? 'pour' : 'add');
    this.pour(INGREDIENTS[id].color, id);
    this.anim = 0; this.renderCup();
    this.advance(id === 'espresso' ? 'brew' : id);
    this.tweenCup();
  }
  restartCup() {
    if (!Object.keys(this.c.order.cup.contents).length) return this.say('The cup is already empty.', 'info');
    this.run.restartCup(this.c); this.anim = 1; this.renderCup(); this.say('Cup emptied. Start again!', 'info'); audio.play('error');
  }
  serveNow() {
    if (!Object.keys(this.c.order.cup.contents).length) return this.say('Add something to the cup first!', 'warn');
    this.advance('serve');
    this.close('serve');
  }
  close(action) {
    if (this.closing) return; this.closing = true;
    this.steamUp();
    this.scene.stop();
    this.opts.cafe?.prepClosed(this.c, action);
    this.opts.onClose?.(action);
  }
  forceClose(message) { if (this.closing) return; this.closing = true; this.scene.stop(); this.opts.cafe.prepClosed(this.c, 'back'); flashMessage(this.opts.cafe, message, { color: '#F7D0C8' }); }

  // ------------------------------------------------------------ visuals
  pour(color, id) {
    const col = Phaser.Display.Color.HexStringToColor(color).color;
    const x = id === 'milk' || id === 'foam' ? 470 : CUP_X, y0 = id === 'espresso' ? 184 : 200;
    this.stream.clear().fillStyle(col, 1).fillRect(x - 4, y0, 8, 262 - y0 + 20);
    if (!this.reduced) this.tweens.add({ targets: this.stream, alpha: { from: 1, to: 0 }, duration: 420, onComplete: () => { this.stream.clear().setAlpha(1); } });
    else this.time.delayedCall(250, () => this.stream.clear());
  }
  tweenCup() {
    if (this.reduced) { this.anim = 1; this.renderCup(); return; }
    this.tweens.add({ targets: this.cupImg, scaleY: { from: 1.04, to: 1 }, duration: 160 });
    this.tweens.addCounter({ from: 0, to: 1, duration: 380, onUpdate: (t) => { this.anim = t.getValue(); this.renderCup(); }, onComplete: () => { this.anim = 1; this.renderCup(); } });
  }
  renderCup() {
    const cup = this.c.order.cup, ctx = this.cupTex.getContext();
    ctx.clearRect(0, 0, this.cupTex.width, this.cupTex.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(artCanvas(CUP_W, CUP_H, (x) => drawCup(x, cup, { glass: this.c.order.recipe.iced, anim: this.anim }), { scale: CUP_SCALE }), 0, 0);
    this.cupTex.refresh();
    const text = Object.entries(cup.contents).map(([k, n]) => `${INGREDIENTS[k].name} ×${n}`).join(' · ') || 'Empty cup';
    this.contents.setText(text);
    this.cupName.setText(`${this.c.order.recipe.iced ? 'Tall glass' : 'Mug'} · liquid ${liquidUnits(cup)}/${CUP_CAPACITY}`);
    Object.entries(this.btn).forEach(([id, b]) => { const ing = ITEMS[id].ing; if (ing && !b.lockedText) b.setSub(cup.contents[ing] ? `×${cup.contents[ing]}` : ''); });
    this.ticket.refresh();
  }

  update(time, delta) {
    const dt = game.animDt(delta);
    if (dt > 0) {
      if (this.grinding) { this.grindP += dt / (BASE.grind * this.fx.grindMult); if (this.grindP >= 1) { this.grinding = false; this.ground = true; audio.play('click'); this.say('Beans ground! Now press Brew.', 'good'); this.advance('grind'); } }
      if (this.brewing) { this.brewP += dt / (BASE.brew * this.fx.brewMult); if (this.brewP >= 1) { this.brewing = false; this.brewP = 0; this.addIng('espresso'); audio.play('good'); } }
      if (this.steaming) { this.steamP += dt / (BASE.steam * this.fx.steamMult); if (this.steamP >= 1) { this.steamP = 0; this.steaming = false; this.portions = 2; this.steamUp(); audio.play('good'); this.say('Milk is steamed: 2 pours ready (milk or foam).', 'good'); this.advance('steam'); } }
    }
    this.btn.grind.setProgress(this.grinding ? this.grindP : this.ground ? 1 : null);
    this.btn.brew.setProgress(this.brewing ? this.brewP : null);
    this.btn.steam.setProgress(this.steaming ? this.steamP : this.portions > 0 ? 1 : null);
    this.btn.steam.setSub(this.portions > 0 ? `${this.portions} pour${this.portions > 1 ? 's' : ''} ready` : '');
    this.drawLights(time);
    this.drawPitcher();
    this.ticket.refresh();
    if (!this.reduced && (this.steaming || this.brewing) && Math.random() < 0.25) this.puff(this.steaming ? 536 : CUP_X, this.steaming ? 286 : 200);
  }
  drawPitcher() {
    const g = this.pitcher; g.clear();
    const x = 514, y = 300, h = 74, fill = this.portions > 0 ? 1 : this.steamP;
    g.fillStyle(0x24160f).fillRect(x - 2, y - 2, 48, h + 4).fillStyle(0xc9d0d3).fillRect(x, y, 44, h).fillStyle(0xe8edef).fillRect(x, y, 6, h);
    g.fillStyle(0xf0dcbc).fillRect(x + 4, y + h - 4 - (h - 12) * fill, 36, (h - 12) * fill).fillStyle(0xfbf3e4).fillRect(x + 4, y + h - 4 - (h - 12) * fill, 36, fill > 0 ? 4 : 0);
    g.fillStyle(0x24160f).fillRect(x + 44, y + 14, 8, 30).fillStyle(0x9aa3a8).fillRect(x + 46, y + 16, 4, 26);
  }
  puff(x, y) {
    const p = this.add.rectangle(x + Phaser.Math.Between(-10, 10), y, 6, 6, 0xffffff, 0.5).setDepth(30);
    this.tweens.add({ targets: p, y: y - 40, alpha: 0, scale: 2, duration: 900, onComplete: () => p.destroy() });
  }
}
