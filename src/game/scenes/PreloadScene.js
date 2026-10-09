import Phaser from 'phaser';
import { textureTasks } from '../../art/textures.js';
import { txt, FONT_PX, CSS } from '../../ui/theme.js';
import { game } from '../state.js';

const MESSAGES = ['Grinding fresh beans...', 'Heating up the espresso machine...', 'Preparing your café...', 'Frothing the milk...', 'Polishing the cups...'];

export default class PreloadScene extends Phaser.Scene {
  constructor() { super('Preload'); }
  create() {
    this.reduced = game.reducedMotion;
    this.add.rectangle(480, 270, 960, 540, 0x35251f);
    txt(this, 480, 96, 'COFFEE RUSH', { size: 64, font: FONT_PX, color: CSS.gold, origin: [0.5, 0.5], stroke: '#24160f', strokeThickness: 8 });
    txt(this, 480, 146, 'Brew Happiness, One Cup at a Time.', { size: 17, color: CSS.beige, origin: [0.5, 0.5] });
    // cup that fills with coffee as real loading progress advances
    const cx = 480, cy = 330, cw = 120, ch = 110;
    const g = this.add.graphics();
    this.fill = this.add.graphics();
    g.fillStyle(0x24160f).fillRect(cx - cw / 2 - 6, cy - ch / 2 - 6, cw + 12, ch + 12).fillRect(cx + cw / 2 + 4, cy - 28, 36, 14).fillRect(cx + cw / 2 + 28, cy - 28, 14, 56).fillRect(cx + cw / 2 + 4, cy + 14, 36, 14);
    g.fillStyle(0xf7efe2).fillRect(cx - cw / 2 - 2, cy - ch / 2 - 2, cw + 4, ch + 4).fillRect(cx + cw / 2 + 4, cy - 24, 32, 6).fillRect(cx + cw / 2 + 30, cy - 24, 6, 48).fillRect(cx + cw / 2 + 4, cy + 18, 32, 6);
    g.fillStyle(0x3a2216).fillRect(cx - cw / 2 + 4, cy - ch / 2 + 4, cw - 8, ch - 8).setAlpha(1);
    this.fill.setPosition(0, 0);
    this.bar = { cx, cy, cw, ch };
    this.msg = txt(this, 480, 440, MESSAGES[0], { size: 18, color: CSS.cream, origin: [0.5, 0.5] });
    this.pct = txt(this, 480, 468, '0%', { size: 14, color: CSS.caramel, origin: [0.5, 0.5], font: FONT_PX });
    this.steam = [];
    for (let i = 0; i < 3; i++) this.steam.push(this.add.rectangle(cx - 24 + i * 24, cy - ch / 2 - 18, 6, 18, 0xffffff, 0.45));
    if (!this.reduced) this.steam.forEach((s, i) => this.tweens.add({ targets: s, y: s.y - 24, alpha: 0, duration: 1400, repeat: -1, delay: i * 350 }));
    this.time.addEvent({ delay: 800, loop: true, callback: () => { this.mi = ((this.mi || 0) + 1) % MESSAGES.length; this.msg.setText(MESSAGES[this.mi]); } });

    this.tasks = textureTasks(this);
    this.total = this.tasks.length;
    this.done = 0; this.shown = 0; this.t0 = this.time.now;
  }
  update(_, delta) {
    for (let i = 0; i < 4 && this.tasks.length; i++) { this.tasks.shift()(); this.done++; }
    const real = this.done / this.total;
    this.shown = Math.min(real, this.shown + delta / 1000); // never ahead of real progress
    const { cx, cy, cw, ch } = this.bar;
    const h = (ch - 8) * this.shown;
    this.fill.clear().fillStyle(0xc68b59).fillRect(cx - cw / 2 + 4, cy + ch / 2 - 4 - h, cw - 8, h).fillStyle(0xe5c9a5).fillRect(cx - cw / 2 + 4, cy + ch / 2 - 4 - h, cw - 8, h > 0 ? 4 : 0);
    this.pct.setText(`${Math.round(this.shown * 100)}%`);
    if (this.shown >= 1 && !this.leaving && this.time.now - this.t0 > 900) {
      this.leaving = true;
      this.cameras.main.fadeOut(350, 53, 37, 31);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Menu'));
    }
  }
}
