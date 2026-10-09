import Phaser from 'phaser';
import { canvasOf } from '../art/pixel.js';
import { drawCafe, drawSkyline, resolveLook, lookKey, GEOM, W, H } from '../art/cafeArt.js';
import { characterKey } from '../art/characters.js';
import { RECIPES } from '../data/recipes.js';
import { FONT_PX } from '../ui/theme.js';
import { mix } from '../utils/rng.js';
import { game } from './state.js';

/** The static + ambient café environment, shared by the menu, café, tutorial and shop scenes. */
export class CafeWorld {
  constructor(scene, { eq, progress = 0.1, recipeIds = ['espresso', 'latte'], ambient = true } = {}) {
    this.scene = scene; this.progress = -1; this.reduced = game.reducedMotion;
    const look = resolveLook(eq);
    const key = `bg_${lookKey(eq)}`;
    if (!scene.textures.exists(key)) {
      scene.textures.getTextureKeys().filter((k) => k.startsWith('bg_')).forEach((k) => scene.textures.remove(k)); // keep only the current look in memory
      const [c, x] = canvasOf(W, H);
      this.meta = drawCafe(x, look);
      scene.textures.addCanvas(key, c);
      const [f, fx] = canvasOf(W - 242, 108); fx.drawImage(c, 242, 244, W - 242, 108, 0, 0, W - 242, 108);
      scene.textures.addCanvas(`${key}_front`, f);
      scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST); scene.textures.get(`${key}_front`).setFilter(Phaser.Textures.FilterMode.NEAREST);
      CafeWorld.metaCache[key] = this.meta;
    }
    this.meta = CafeWorld.metaCache[key];
    this.key = key;

    // layers: sky (0) < wall/floor/counter (1) < barista (2) < counter front (3) < everything else (10+) < light (500)
    const wn = GEOM.window;
    this.skyCanvas = canvasOf(wn.w, wn.h);
    this.skyKey = `sky_${scene.sys.settings.key}`;
    if (scene.textures.exists(this.skyKey)) scene.textures.remove(this.skyKey);
    this.skyTex = scene.textures.addCanvas(this.skyKey, this.skyCanvas[0]);
    scene.add.image(wn.x, wn.y, this.skyKey).setOrigin(0).setDepth(0);
    scene.add.image(0, 0, key).setOrigin(0).setDepth(1);
    this.barista = scene.add.image(GEOM.baristaX, 278, characterKey('barista', 'idle')).setOrigin(0.5, 1).setDepth(2);
    scene.add.image(242, 244, `${key}_front`).setOrigin(0).setDepth(3);

    this.board = [];
    this.setMenu(recipeIds);

    this.light = scene.add.rectangle(480, 270, W, H, 0xffffff).setDepth(500).setBlendMode(Phaser.BlendModes.MULTIPLY);
    this.glows = this.meta.lights.map((l) => scene.add.image(l.x, l.y, 'glow').setScale((l.r * 2) / 160).setDepth(501).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.2));
    this.hanging = this.meta.hanging.map(([x, y], i) => {
      const s = scene.add.image(x, y, 'plant_hang').setOrigin(0.5, 0).setDepth(4);
      if (!this.reduced && ambient) scene.tweens.add({ targets: s, angle: { from: -3, to: 3 }, duration: 2400 + i * 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      return s;
    });
    if (!this.reduced && ambient) {
      const m = GEOM.machine;
      this.steam = scene.add.particles(m.x + 60, m.y - 4, 'dot', { speedY: { min: -26, max: -14 }, speedX: { min: -5, max: 5 }, scale: { start: 1, end: 3 }, alpha: { start: 0.32, end: 0 }, lifespan: 2000, frequency: 280 }).setDepth(5);
    }
    this.setProgress(progress);
  }

  setMenu(recipeIds) {
    this.board.forEach((t) => t.destroy()); this.board = [];
    const mb = GEOM.menu, list = RECIPES.filter((r) => recipeIds.includes(r.id));
    this.board.push(this.scene.add.text(mb.x + mb.w / 2, mb.y + 3, "TODAY'S MENU", { fontFamily: FONT_PX, fontSize: '11px', color: '#EDC56D' }).setOrigin(0.5, 0).setDepth(2).setResolution(2));
    list.slice(0, 12).forEach((r, i) => {
      const col = i < 6 ? 0 : 1, row = i % 6;
      this.board.push(this.scene.add.text(mb.x + 10 + col * 140, mb.y + 17 + row * 10, `${r.name.slice(0, 15)}`, { fontFamily: FONT_PX, fontSize: '9px', color: '#F7E9D5' }).setDepth(2).setResolution(2));
      this.board.push(this.scene.add.text(mb.x + 128 + col * 140, mb.y + 17 + row * 10, `${r.price}`, { fontFamily: FONT_PX, fontSize: '9px', color: '#EDC56D' }).setOrigin(1, 0).setDepth(2).setResolution(2));
    });
  }

  /** progress 0..1 across the business day: sky colour, ambient tint and lamp glow. */
  setProgress(p) {
    if (Math.abs(p - this.progress) < 0.008) return;
    this.progress = p;
    const [c, x] = this.skyCanvas; x.clearRect(0, 0, c.width, c.height); drawSkyline(x, p, c.width, c.height); this.skyTex.refresh();
    const tint = p < 0.6 ? '#ffffff' : p < 0.85 ? mix('#ffffff', '#ffd9a8', (p - 0.6) / 0.25) : mix('#ffd9a8', '#9d8fc4', (p - 0.85) / 0.15);
    this.light.setFillStyle(Phaser.Display.Color.HexStringToColor(tint).color);
    const dark = Math.max(0, (p - 0.55) / 0.45);
    this.glows.forEach((g) => g.setAlpha(0.14 + dark * 0.5));
  }

  baristaFrame(f) { this.barista.setTexture(characterKey('barista', f)); }
}
CafeWorld.metaCache = {};
