import Phaser from 'phaser';
import { C, CSS, txt, pixelBox, patienceColor, patienceWord, FONT_PX } from './theme.js';
import { INGREDIENTS } from '../data/recipes.js';
import { requirements } from '../systems/RecipeSystem.js';

/** Order ticket. mode 'rail' = compact card for the café, 'full' = detailed ticket for the prep station. */
export class OrderTicket extends Phaser.GameObjects.Container {
  constructor(scene, { x, y, customer, mode = 'rail', onClick }) {
    super(scene, x, y);
    this.customer = customer; this.mode = mode;
    const o = customer.order;
    this.w = mode === 'rail' ? 212 : 248;
    this.bg = scene.add.graphics();
    this.add(this.bg);
    if (mode === 'rail') {
      this.head = txt(scene, 10, 6, `#${String(o.no).padStart(3, '0')} ${customer.def.name}`, { size: 13, color: CSS.coffee });
      this.drink = txt(scene, 10, 22, o.recipe.name + (o.special ? ' *' : ''), { size: 15, wrap: this.w - 20 });
      this.add([this.head, this.drink]);
      this.h = 74;
      this.barY = 60;
    } else {
      this.head = txt(scene, 12, 8, `ORDER #${String(o.no).padStart(3, '0')}`, { size: 15, font: FONT_PX, color: CSS.coffee });
      this.cust = txt(scene, 12, 28, `Customer: ${customer.def.name}`, { size: 14 });
      this.drink = txt(scene, 12, 48, o.recipe.name, { size: 21, font: FONT_PX, wrap: this.w - 24, color: CSS.espresso });
      this.add([this.head, this.cust, this.drink]);
      let y = 48 + this.drink.height + 8;
      this.add(txt(scene, 12, y, 'Ingredients', { size: 13, color: CSS.coffee })); y += 18;
      this.req = requirements(o.recipe, o.special);
      this.rows = {};
      Object.entries(this.req).forEach(([k, n]) => {
        const sw = scene.add.rectangle(18, y + 8, 12, 12, Phaser.Display.Color.HexStringToColor(INGREDIENTS[k].color).color).setStrokeStyle(2, 0x24160f);
        const t = txt(scene, 30, y, `${INGREDIENTS[k].name}`, { size: 14 });
        const c = txt(scene, this.w - 12, y, '', { size: 14, origin: [1, 0] });
        this.add([sw, t, c]); this.rows[k] = c; y += 22;
      });
      if (o.special) { this.add(txt(scene, 12, y + 2, `Special: ${o.special.label}`, { size: 14, color: '#8a3a32', wrap: this.w - 24 })); y += 24 + (o.special.label.length > 22 ? 16 : 0); }
      this.add(txt(scene, 12, y + 4, `Pays about ${o.price} coins`, { size: 14, color: CSS.forest })); y += 24;
      this.h = y + 44; this.barY = y + 22;
    }
    this.barW = this.w - 24;
    this.pText = txt(scene, this.w - 12, this.barY - 14, '', { size: 12, origin: [1, 0], bold: true });
    this.pLabel = txt(scene, 12, this.barY - 14, 'Patience', { size: 12, color: CSS.coffee });
    this.bar = scene.add.graphics();
    this.add([this.bar, this.pText, this.pLabel]);
    this.setSize(this.w, this.h);
    if (onClick) { this.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.w, this.h), Phaser.Geom.Rectangle.Contains); this.input.cursor = 'pointer'; this.on('pointerdown', () => onClick(customer)); this.on('pointerover', () => { this.hover = true; this.draw(); }); this.on('pointerout', () => { this.hover = false; this.draw(); }); }
    this.draw();
    this.refresh();
    scene.add.existing(this);
  }
  setActive(a) { this.active = a; this.draw(); }
  draw() {
    this.bg.clear();
    pixelBox(this.bg, 0, 0, this.w, this.h, this.active ? 0xfff3c8 : 0xf7e9d5);
    this.bg.fillStyle(0xcb6c62, 1); for (let x = 8; x < this.w - 8; x += 12) this.bg.fillRect(x, 0, 6, 3); // ticket perforation
    if (this.active || this.hover) { this.bg.lineStyle(3, C.gold, 1); this.bg.strokeRect(-1, -1, this.w + 2, this.h + 2); }
  }
  /** Updates patience bar and (full mode) ingredient counts from live data. */
  refresh() {
    const c = this.customer, f = c.patienceMax ? c.patience / c.patienceMax : 0;
    const key = `${Math.ceil(c.patience)}|${JSON.stringify(c.order.cup.contents)}`;
    if (key === this._key) return; this._key = key;
    this.bar.clear().fillStyle(0x24160f, 1).fillRect(12, this.barY, this.barW, 10);
    this.bar.fillStyle(patienceColor(f), 1).fillRect(14, this.barY + 2, Math.max(0, (this.barW - 4) * f), 6);
    this.pText.setText(`${Math.ceil(c.patience)}s · ${patienceWord(f)}`);
    if (this.rows) for (const [k, n] of Object.entries(this.req)) {
      const have = c.order.cup.contents[k] || 0;
      const t = this.rows[k];
      t.setText(have === n ? `${have}/${n}  ✓ done` : have > n ? `${have}/${n}  too much` : `${have}/${n}`);
      t.setColor(have === n ? CSS.forest : have > n ? '#8a3a32' : CSS.text);
    }
  }
}
