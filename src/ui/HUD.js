import { C, CSS, txt, pixelBox, FONT_PX } from './theme.js';
import { BUSINESS_START_HOUR, BUSINESS_HOURS } from '../data/progression.js';
import { GameButton } from './GameButton.js';

const clock = (frac) => {
  const mins = Math.floor((BUSINESS_START_HOUR + frac * BUSINESS_HOURS) * 60);
  const h = Math.floor(mins / 60), m = Math.floor((mins % 60) / 10) * 10;
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};
export const hoursLeft = (frac) => `${Math.max(0, (1 - frac) * BUSINESS_HOURS).toFixed(1)}h left`;

/** Top HUD bar: day, café name, hours, coins, satisfaction, target, rush indicator, pause/settings. */
export class HUD {
  constructor(scene, { onPause, onSettings }) {
    this.scene = scene;
    const g = scene.add.graphics().setDepth(900);
    pixelBox(g, -4, -4, 968, 52, C.espresso, { border: 0x1a0f0a });
    const mk = (x, label, size = 15) => ({ l: txt(scene, x, 5, label, { size: 11, color: '#C68B59', font: FONT_PX }).setDepth(901), v: txt(scene, x, 19, '', { size: size + 3, color: CSS.cream }).setDepth(901) });
    this.day = { l: txt(scene, 0, 0, ''), v: txt(scene, 14, 4, '', { size: 20, color: CSS.gold, font: FONT_PX }).setDepth(901) };
    this.cafe = txt(scene, 14, 28, 'Little Bean Café', { size: 12, color: CSS.beige, bold: false }).setDepth(901);
    this.time = mk(150, 'TIME');
    this.coins = mk(290, 'COINS');
    this.sat = mk(390, 'SATISFACTION');
    this.target = mk(520, 'TODAY / TARGET');
    this.rush = txt(scene, 700, 24, 'RUSH HOUR!', { size: 16, font: FONT_PX, color: CSS.gold, origin: [0.5, 0.5] }).setDepth(901).setVisible(false);
    this.pause = new GameButton(scene, { x: 840, y: 6, w: 52, h: 36, label: 'II', size: 15, color: C.caramel, onClick: onPause, tip: 'Pause (Esc)' }).setDepth(902);
    this.gear = new GameButton(scene, { x: 898, y: 6, w: 52, h: 36, label: '⚙', size: 18, color: C.beige, onClick: onSettings, tip: 'Settings' }).setDepth(902);
    this.icon = scene.add.graphics().setDepth(901);
    this._last = {};
  }
  update(run, data) {
    const cfg = run.cfg, set = (o, v) => { if (o.text !== v) o.setText(v); };
    set(this.day.v, `DAY ${cfg.day}`);
    set(this.time.v, clock(run.clockFrac));
    set(this.time.l, `TIME · ${hoursLeft(run.clockFrac)}`);
    set(this.coins.v, String(Math.floor(data.money)));
    set(this.sat.v, `${run.satisfaction}%`);
    const rev = Math.floor(run.stat.revenue + run.stat.tips);
    set(this.target.v, `${rev} / ${cfg.target}`);
    this.target.v.setColor(rev >= cfg.target ? CSS.success : CSS.cream);
    this.sat.v.setColor(run.satisfaction >= 75 ? CSS.success : run.satisfaction >= 50 ? CSS.gold : CSS.coral);
    const showRush = run.rushActive;
    if (showRush !== this.rush.visible) { this.rush.setVisible(showRush); if (showRush && !this.scene.reduced) this.scene.tweens.add({ targets: this.rush, scale: { from: 1, to: 1.12 }, yoyo: true, repeat: -1, duration: 420 }); }
  }
  destroy() { [this.day, this.time, this.coins, this.sat, this.target].forEach((o) => { o.l.destroy(); o.v.destroy(); }); this.rush.destroy(); this.pause.destroy(); this.gear.destroy(); this.cafe.destroy(); this.icon.destroy(); }
}
