import Phaser from 'phaser';
import { txt, C, CSS } from './theme.js';

/** Speech bubble container whose origin is the tail tip (bottom centre). */
export function makeBubble(scene, text, { maxW = 200, size = 13, color = 0xfffaf0, tail = true, textColor = CSS.text } = {}) {
  const t = txt(scene, 0, 0, text, { size, wrap: maxW - 16, color: textColor, origin: [0.5, 0.5], align: 'center' });
  const w = Math.max(40, Math.min(maxW, t.width + 18)), h = t.height + 14;
  const g = scene.add.graphics();
  g.fillStyle(0x24160f, 1); g.fillRect(-w / 2 + 3, -h - 8, w - 6, h); g.fillRect(-w / 2, -h - 5, w, h - 6);
  g.fillStyle(color, 1); g.fillRect(-w / 2 + 3, -h - 5, w - 6, h - 6); g.fillRect(-w / 2 + 2, -h - 3, w - 4, h - 10);
  if (tail) { g.fillStyle(0x24160f, 1); g.fillRect(-6, -14, 12, 8); g.fillRect(-3, -8, 6, 6); g.fillStyle(color, 1); g.fillRect(-4, -14, 8, 6); g.fillRect(-2, -9, 4, 4); }
  t.setPosition(0, -h / 2 - 8);
  const c = scene.add.container(0, 0, [g, t]);
  c.bubbleW = w; c.bubbleH = h + 8; c.textObj = t;
  return c;
}

export class Tooltip {
  constructor(scene) {
    this.scene = scene;
    this.t = txt(scene, 0, 0, '', { size: 13, color: CSS.cream, wrap: 220, origin: [0.5, 1], align: 'center' });
    this.g = scene.add.graphics();
    this.c = scene.add.container(0, 0, [this.g, this.t]).setDepth(10000).setVisible(false);
  }
  show(text, obj) {
    if (!text) return;
    this.t.setText(text);
    const w = this.t.width + 16, h = this.t.height + 10;
    this.g.clear().fillStyle(0x24160f, 0.95).fillRect(-w / 2, -h, w, h).lineStyle(2, C.gold, 1).strokeRect(-w / 2, -h, w, h);
    this.t.setPosition(0, -5);
    const b = obj.getBounds ? obj.getBounds() : { centerX: obj.x, top: obj.y };
    const x = Phaser.Math.Clamp(b.centerX, w / 2 + 4, 960 - w / 2 - 4);
    this.c.setPosition(x, Math.max(h + 4, b.top - 6)).setVisible(true);
  }
  hide() { this.c.setVisible(false); }
}

/** Short message in a banner at the top-centre (errors / hints). */
export function flashMessage(scene, text, { color = CSS.cream, bg = 0x24160f, y = 64, ms = 2200, depth = 9000 } = {}) {
  scene._flash?.destroy();
  const t = txt(scene, 0, 0, text, { size: 16, color, origin: [0.5, 0.5], align: 'center', wrap: 520 });
  const w = t.width + 28, h = t.height + 16;
  const g = scene.add.graphics().fillStyle(bg, 0.94).fillRect(-w / 2, -h / 2, w, h).lineStyle(2, C.gold, 1).strokeRect(-w / 2, -h / 2, w, h);
  const c = scene.add.container(480, y, [g, t]).setDepth(depth);
  scene._flash = c;
  c.setAlpha(0);
  scene.tweens.add({ targets: c, alpha: 1, duration: 120 });
  scene.tweens.add({ targets: c, alpha: 0, delay: ms, duration: 300, onComplete: () => { c.destroy(); if (scene._flash === c) scene._flash = null; } });
  return c;
}
