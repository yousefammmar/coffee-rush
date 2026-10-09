import Phaser from 'phaser';
import { C, txt, pixelBox, FONT_PX } from './theme.js';
import { audio } from '../systems/AudioSystem.js';
import { game } from '../game/state.js';

/** Pixel-styled button: hover lift, press bounce, hold support, lock state, key hint, tooltip. */
export class GameButton extends Phaser.GameObjects.Container {
  constructor(scene, { x, y, w = 120, h = 48, label = '', sub = '', color = C.caramel, textColor = '#30231F', size = 16, onClick, onDown, onUp, key, tip, locked = '', icon } = {}) {
    super(scene, x, y);
    Object.assign(this, { w, h, color, onClick, onDown, onUp, tip, lockedText: locked, enabled: true, held: false, hover: false });
    this.bg = scene.add.graphics();
    this.prog = scene.add.graphics();
    this.label = txt(scene, w / 2, sub ? h / 2 - 8 : h / 2, label, { size, color: textColor, origin: [0.5, 0.5], align: 'center', wrap: w - 10 });
    this.sub = sub ? txt(scene, w / 2, h / 2 + 11, sub, { size: 12, color: textColor, origin: [0.5, 0.5], bold: false }) : null;
    this.keyHint = key ? txt(scene, w - 5, 3, String(key).toUpperCase(), { size: 10, font: FONT_PX, color: '#F7E9D5', origin: [1, 0] }) : null;
    this.add([this.bg, this.prog, this.label, ...(this.sub ? [this.sub] : []), ...(icon ? [icon] : []), ...(this.keyHint ? [this.keyHint] : [])]);
    this.setSize(w, h);
    this.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains);
    this.input.cursor = 'pointer';
    this.on('pointerover', () => { this.hover = true; this.draw(); if (this.enabled) audio.play('click'); this.scene.tooltip?.show(this.tip, this); });
    this.on('pointerout', () => { this.hover = false; if (this.held) this.release(); this.draw(); this.scene.tooltip?.hide(); });
    this.on('pointerdown', () => this.press());
    this.on('pointerup', () => { if (this.held) this.release(true); });
    this.draw();
    scene.add.existing(this);
    if (key) this.keyObj = scene.input.keyboard?.addKey(key.length === 1 ? key.toUpperCase().charCodeAt(0) : key);
    if (this.keyObj) { this.keyObj.on('down', () => this.press()); this.keyObj.on('up', () => { if (this.held) this.release(true); }); }
    this.once('destroy', () => { if (this.keyObj) { scene.input.keyboard?.removeKey(this.keyObj, true); } });
  }
  press() {
    if (game.paused) return; // keyboard shortcuts must not act while a pause/settings dialog is open
    if (!this.enabled) { this.onLockedClick?.(); return; }
    this.held = true; this.draw();
    audio.play('click');
    this.onDown?.();
  }
  release(fire) {
    this.held = false; this.draw();
    this.onUp?.();
    if (fire) { this.onClick?.(); this.bounce(); }
  }
  bounce() { if (!this.scene || this.scene.reduced) return; this.scene.tweens.add({ targets: this, scaleX: 1.06, scaleY: 0.94, duration: 70, yoyo: true, ease: 'Quad.easeOut' }); }
  /** Progress fill along the bottom edge (0..1, or null to hide). */
  setProgress(p) {
    if (p === this._p) return; this._p = p;
    this.prog.clear();
    if (p != null && p > 0) this.prog.fillStyle(0x24160f, 1).fillRect(5, this.h - 11, this.w - 10, 8).fillStyle(0x80ae73, 1).fillRect(7, this.h - 9, (this.w - 14) * Math.min(1, p), 4);
  }
  setEnabled(v) { if (this.enabled !== v) { this.enabled = v; this.draw(); } return this; }
  setLabel(s) { this.label.setText(s); return this; }
  setSub(s) { this.sub?.setText(s); return this; }
  setColor(c) { this.color = c; this.draw(); return this; }
  setLocked(text) { this.lockedText = text; this.setEnabled(!text); this.label.setAlpha(text ? 0.55 : 1); if (this.sub) this.sub.setText(text || this.sub.text); return this; }
  pulse(on) {
    this.pulsing = on; this._pt?.remove(); this._pt = null;
    if (on) this._pt = this.scene.tweens.add({ targets: this, scale: { from: 1, to: 1.06 }, duration: 380, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    else this.setScale(1);
    this.draw();
  }
  draw() {
    const g = this.bg; g.clear();
    const off = this.held ? 2 : 0;
    let face = this.enabled ? this.color : 0x9a8c80;
    if (this.hover && this.enabled) face = Phaser.Display.Color.ValueToColor(face).brighten(12).color;
    pixelBox(g, 0, off, this.w, this.h - off, face);
    if (this.pulsing) { g.lineStyle(3, C.gold, 1); g.strokeRect(-2, -2, this.w + 4, this.h + 4); }
    if (this.hover && this.enabled) { g.lineStyle(2, 0xffffff, 0.9); g.strokeRect(1, off + 1, this.w - 2, this.h - off - 2); }
    this.label.y = (this.sub ? this.h / 2 - 8 : this.h / 2) + off; if (this.sub) this.sub.y = this.h / 2 + 11 + off;
  }
}
