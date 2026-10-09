import Phaser from 'phaser';
import { characterKey } from '../art/characters.js';
import { makeBubble } from '../ui/DialogBox.js';
import { patienceColor, txt } from '../ui/theme.js';
import { GEOM } from '../art/cafeArt.js';

const SPEED = 150;

/** Sprite + patience bar + speech bubble for one customer. Pure presentation: the DayRun owns the data. */
export class CustomerView extends Phaser.GameObjects.Container {
  constructor(scene, customer, onClick) {
    super(scene, GEOM.queue.doorX, GEOM.queue.doorY);
    this.customer = customer; this.onClick = onClick; this.mode = 'none'; this.walking = false; this.frameT = 0; this.baseY = 0;
    this.sprite = scene.add.image(0, 0, characterKey(customer.def.id, 'idle')).setOrigin(0.5, 1);
    this.bar = scene.add.graphics();
    this.secs = txt(scene, 26, -97, '', { size: 11, origin: [0, 0.5], color: '#F7E9D5', stroke: '#24160f', strokeThickness: 3 });
    this.add([this.sprite, this.bar, this.secs]);
    this.bubble = null;
    this.setSize(60, 90);
    this.sprite.setInteractive({ useHandCursor: true, pixelPerfect: false });
    this.sprite.on('pointerdown', () => this.onClick?.(this));
    this.sprite.on('pointerover', () => { this.hover = true; this.showBubble(true); });
    this.sprite.on('pointerout', () => { this.hover = false; this.showBubble(); });
    scene.add.existing(this);
    this.setDepth(20);
    this.sprite.setAlpha(1);
  }

  get c() { return this.customer; }

  /** Move along points at constant speed, animating legs. */
  moveTo(points, done) {
    this.moveTween?.stop(); this.walking = true;
    let i = 0; const next = () => {
      if (i >= points.length) { this.walking = false; this.sprite.setTexture(characterKey(this.c.def.id, 'idle')); this.sprite.y = 0; done?.(); return; }
      const p = points[i++], dist = Phaser.Math.Distance.Between(this.x, this.y, p.x, p.y);
      this.moveTween = this.scene.tweens.add({ targets: this, x: p.x, y: p.y, duration: Math.max(1, (dist / SPEED) * 1000), ease: 'Linear', onComplete: next });
    };
    next();
  }

  update(time) {
    if (this.walking && !this.scene.reduced) {
      this.sprite.setTexture(characterKey(this.c.def.id, Math.floor(time / 160) % 2 ? 'walkA' : 'walkB'));
      this.sprite.y = -Math.abs(Math.sin(time / 160 * Math.PI)) * 2;
    }
    this.drawBar();
  }

  drawBar() {
    const c = this.c;
    if (!c.arrived || c.leaving || this.leaving) { if (this._barKey) { this.bar.clear(); this.secs.setText(''); this._barKey = null; } return; }
    const f = c.patience / c.patienceMax, key = `${Math.ceil(c.patience)}`;
    if (key === this._barKey) return; this._barKey = key;
    this.bar.clear().fillStyle(0x24160f, 1).fillRect(-24, -101, 48, 8).fillStyle(patienceColor(f), 1).fillRect(-22, -99, 44 * f, 4);
    // threshold notches so the bar reads without colour
    this.bar.fillStyle(0x24160f, 1).fillRect(-11, -99, 1, 4).fillRect(0, -99, 1, 4).fillRect(11, -99, 1, 4);
    this.secs.setText(`${Math.ceil(c.patience)}s`);
  }

  /** mode: 'order' (full speech) | 'accepted' | 'none'. Non-front customers show compact bubbles unless hovered. */
  setBubbleMode(mode, front = false) { this.mode = mode; this.front = front; this.showBubble(); }
  showBubble(force) {
    this.bubble?.destroy(); this.bubble = null;
    if (this.mode === 'none' || this.leaving) return;
    const full = this.mode === 'order' && (this.front || this.hover || force);
    const text = this.mode === 'accepted' ? `✓ ${this.c.order.recipe.name}` : full ? this.c.order.line : '!';
    const b = makeBubble(this.scene, text, { maxW: full ? 220 : 130, size: full ? 13 : 14, color: this.mode === 'accepted' ? 0xdcefc8 : 0xfffaf0 });
    b.y = -122;
    b.setInteractive(new Phaser.Geom.Rectangle(-b.bubbleW / 2, -b.bubbleH, b.bubbleW, b.bubbleH), Phaser.Geom.Rectangle.Contains);
    b.input.cursor = 'pointer';
    b.on('pointerdown', () => this.onClick?.(this));
    b.on('pointerover', () => { this.hover = true; });
    b.on('pointerout', () => { this.hover = false; this.showBubble(); });
    this.add(b); this.bubble = b;
    this.setDepth(full ? 60 : 20 + this.x / 100);
    if (!this.scene.reduced && !this._popped) { this._popped = true; b.setScale(0.6); this.scene.tweens.add({ targets: b, scale: 1, duration: 200, ease: 'Back.easeOut' }); }
  }

  /** Temporary speech (reactions). */
  say(text, ms = 2200) {
    this.bubble?.destroy();
    const b = makeBubble(this.scene, text, { maxW: 220, size: 14 }); b.y = -122; this.add(b); this.bubble = b; this.setDepth(70);
    this.scene.time.delayedCall(ms, () => { if (this.bubble === b) { b.destroy(); this.bubble = null; } });
  }

  react(kind, done) {
    const sc = this.scene, id = this.c.def.id, good = kind === 'perfect' || kind === 'great' || kind === 'acceptable';
    this.sprite.setTexture(characterKey(id, good ? 'happy' : 'sad'));
    if (!sc.reduced) {
      const t = this.c.def.react;
      if (!good) sc.tweens.add({ targets: this.sprite, x: { from: -4, to: 4 }, duration: 60, yoyo: true, repeat: 4, onComplete: () => { this.sprite.x = 0; } });
      else if (t === 'spin') sc.tweens.add({ targets: this.sprite, scaleX: { from: 1, to: -1 }, duration: 300, yoyo: true, repeat: 1 });
      else if (t === 'wiggle') sc.tweens.add({ targets: this.sprite, angle: { from: -8, to: 8 }, duration: 110, yoyo: true, repeat: 5, onComplete: () => { this.sprite.angle = 0; } });
      else if (t === 'nod') sc.tweens.add({ targets: this.sprite, scaleY: { from: 1, to: 0.9 }, duration: 160, yoyo: true, repeat: 2 });
      else sc.tweens.add({ targets: this.sprite, y: t === 'bounce' ? -22 : -14, duration: 170, yoyo: true, repeat: 1, ease: 'Quad.easeOut' });
    }
    const icon = sc.add.image(26, -96, good ? 'heart' : 'angry').setDepth(1); this.add(icon);
    if (!sc.reduced) sc.tweens.add({ targets: icon, y: -118, alpha: 0, duration: 1500, onComplete: () => icon.destroy() }); else sc.time.delayedCall(1200, () => icon.destroy());
    sc.time.delayedCall(sc.reduced ? 900 : 1500, () => done?.());
  }

  leave() {
    this.leaving = true; this.bar.clear(); this.secs.setText(''); this.bubble?.destroy(); this.bubble = null; this.sprite.disableInteractive();
    const q = GEOM.queue;
    this.moveTo([{ x: q.doorX, y: q.y }, { x: q.doorX, y: q.doorY }], () => this.destroy());
    if (!this.scene.reduced) this.scene.tweens.add({ targets: this, alpha: 0, delay: 900, duration: 500 });
  }
}
