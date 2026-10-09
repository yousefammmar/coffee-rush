import Phaser from 'phaser';
import { game, States } from '../state.js';
import { CafeWorld } from '../CafeWorld.js';
import { makeBubble } from '../../ui/DialogBox.js';
import { OrderTicket } from '../../ui/OrderTicket.js';
import { GameButton } from '../../ui/GameButton.js';
import { txt, C, CSS, FONT_PX, pixelBox } from '../../ui/theme.js';
import { CUSTOMERS } from '../../data/customers.js';
import { recipeById } from '../../data/recipes.js';
import { characterKey } from '../../art/characters.js';
import { emptyCup, addIngredient, canAdd, scoreDrink } from '../../systems/RecipeSystem.js';
import { payout, upgradeEffects } from '../../systems/EconomySystem.js';
import { audio } from '../../systems/AudioSystem.js';
import { openPause } from '../../ui/screens.js';
import { cupOf } from '../../utils/cup.js';

const LATTE = [
  { expect: 'grind', text: 'Press “Grind beans” (G). The espresso machine needs ground coffee.' },
  { expect: 'brew', text: 'Now press “Brew” (B). A shot of espresso drips into the cup (about 2.5 s).' },
  { expect: 'steam', text: 'HOLD “Steam” (S) until the bar fills. Release early and it pauses.' },
  { expect: 'milk', text: 'Press “Pour milk” (M). Order matters: espresso first, then milk!' },
  { expect: 'serve', text: 'The cup matches the ticket (1/1 ✓ for each ingredient). Press “Serve”.' },
];
const ICED = [
  { expect: 'grind', text: 'Same start: grind the beans.' },
  { expect: 'brew', text: 'Brew the espresso shot.' },
  { expect: 'steam', text: 'Hold Steam to steam the milk.' },
  { expect: 'milk', text: 'Pour the milk in.' },
  { expect: 'caramel', text: 'Syrups: each press adds one unit. Press “Caramel” once.' },
  { expect: 'ice', text: 'Iced drinks need ice. Press “Ice”.' },
  { expect: 'serve', text: 'Check the ticket and serve!' },
];
const controller = (steps) => { let i = 0; return { expect: () => steps[i]?.expect, text: () => steps[i]?.text, next: () => { i++; }, progress: () => [i, steps.length] }; };

/** Guided, playable tutorial: accept → read ticket → make a latte → make an iced caramel latte. */
export default class TutorialScene extends Phaser.Scene {
  constructor() { super('Tutorial'); }
  init(d) { this.firstRun = d?.firstRun ?? false; }

  create() {
    game.setMode(States.TUTORIAL);
    this.reduced = game.reducedMotion;
    this.cameras.main.fadeIn(300, 53, 37, 31);
    this.world = new CafeWorld(this, { eq: game.data.decor.equipped, progress: 0.15, recipeIds: ['espresso', 'latte'] });
    this.panel = null; this.stage = 0;
    this.skip = new GameButton(this, { x: 786, y: 8, w: 164, h: 34, label: this.firstRun ? 'Skip tutorial' : 'Back to menu', size: 14, color: C.beige, onClick: () => this.finish(false) }).setDepth(900);
    this.input.keyboard.on('keydown-ESC', () => this.finish(false));
    this.stage1();
  }

  fake(def, recipe) {
    const order = { no: this.stage + 1, recipe, special: null, cup: emptyCup(), price: recipe.price, line: `Hi! Could I have a ${recipe.name.toLowerCase()}, please?` };
    const c = { def, order, patience: 90, patienceMax: 90, arrived: true, accepted: false };
    order.customer = c; return c;
  }

  say(title, body, label, onClick) {
    this.panel?.forEach((o) => o.destroy());
    const g = this.add.graphics().setDepth(850); pixelBox(g, 150, 52, 660, 108, 0xf7e9d5);
    const items = [g, txt(this, 170, 62, title, { size: 18, font: FONT_PX, color: CSS.coffee }).setDepth(851), txt(this, 170, 90, body, { size: 15, wrap: 620 }).setDepth(851)];
    if (label) { const b = new GameButton(this, { x: 640, y: 166, w: 170, h: 44, label, color: C.success, size: 16, key: 'ENTER', onClick }).setDepth(852); b.pulse(!this.reduced); items.push(b); }
    this.panel = items;
  }

  // ---- stage 1: Mia orders a latte
  stage1() {
    const mia = CUSTOMERS[0], recipe = recipeById('latte');
    this.cust = this.fake(mia, recipe);
    this.sprite = this.add.image(560, 416, characterKey(mia.id, 'idle')).setOrigin(0.5, 1).setDepth(20);
    this.bubble = makeBubble(this, this.cust.order.line, { maxW: 230, size: 14 }).setDepth(30);
    this.bubble.setPosition(560, 300);
    this.bubble.setInteractive(new Phaser.Geom.Rectangle(-this.bubble.bubbleW / 2, -this.bubble.bubbleH, this.bubble.bubbleW, this.bubble.bubbleH), Phaser.Geom.Rectangle.Contains);
    this.bubble.input.cursor = 'pointer';
    if (!this.reduced) this.tweens.add({ targets: this.bubble, y: 292, yoyo: true, repeat: -1, duration: 500 });
    this.bubble.on('pointerdown', () => this.stage2());
    this.sprite.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.stage2());
    this.say('Welcome to Little Bean Café!', 'Mia just walked in. Customers tell you their order in a speech bubble.\nStep 1: click Mia’s speech bubble to take her order.');
  }
  stage2() {
    if (this.stage !== 0) return; this.stage = 1;
    audio.play('chime'); this.bubble.destroy();
    this.sprite.disableInteractive();
    this.sprite.setTexture(characterKey('mia', 'idle'));
    this.ticket = new OrderTicket(this, { x: 12, y: 172, customer: this.cust, mode: 'full' }).setDepth(40);
    this.say('The order ticket', 'It lists the drink, the ingredients you need, any special request, the pay, and Mia’s patience: the bar shrinks while she waits (green → yellow → red).', 'Start making it', () => this.prep(this.cust, LATTE, () => this.afterLatte()));
  }

  prep(cust, steps, done) {
    this.panel?.forEach((o) => o.destroy()); this.panel = null; this.ticket?.setVisible(false);
    const run = { addToCup: (c, id) => { if (!canAdd(c.order.cup, id)) return { ok: false, reason: 'The cup is full!' }; addIngredient(c.order.cup, id); return { ok: true, cost: 0 }; }, restartCup: (c) => { c.order.cup = emptyCup(); } };
    this.scene.launch('Prep', {
      customer: cust, run, tutorial: controller(steps),
      pause: () => { game.pause(); openPause({ onResume: () => game.resume(), onQuit: () => this.finish(false) }); },
      onClose: (action) => { if (action === 'serve') done(); else { this.ticket?.setVisible(true); this.say('Tutorial paused', 'You left the station. Click below to go back to your drink.', 'Back to the station', () => this.prep(cust, steps, done)); } },
    });
  }

  result(cust) {
    const r = scoreDrink({ recipe: cust.order.recipe, special: null, cup: cust.order.cup, patienceFrac: 0.9 });
    const p = payout({ price: cust.order.price, tier: r.tier, tipRate: cust.def.tip, fx: upgradeEffects({}) });
    return { r, p };
  }
  afterLatte() {
    const { r, p } = this.result(this.cust);
    audio.play('coin');
    this.sprite.setTexture(characterKey('mia', 'happy'));
    this.say(`${r.tier.toUpperCase()}! ${r.total}/100`, `Mia pays ${p.pay} coins${p.tip ? ` plus a ${p.tip} coin tip` : ''}. Scores: Perfect 90+, Great 75+, Acceptable 50+, below that the drink is Incorrect and pays nothing.\nNext: a cold drink with a syrup.`, 'Next drink', () => this.stage3());
  }

  // ---- stage 3: iced caramel latte (syrup + ice)
  stage3() {
    this.ticket?.destroy(); this.sprite.destroy();
    const ava = CUSTOMERS.find((c) => c.id === 'ava'), recipe = recipeById('iced_caramel_latte');
    this.stage = 2; this.cust = this.fake(ava, recipe);
    this.sprite = this.add.image(560, 416, characterKey('ava', 'idle')).setOrigin(0.5, 1).setDepth(20);
    this.ticket = new OrderTicket(this, { x: 12, y: 172, customer: this.cust, mode: 'full' }).setDepth(40);
    this.say('Ava wants an Iced Caramel Latte', 'Espresso + milk + caramel + ice. The ticket already lists it. Tools for syrups and ice are in the right-hand column of the station.', 'Start making it', () => this.prep(this.cust, ICED, () => this.afterIced()));
  }
  afterIced() {
    const { r, p } = this.result(this.cust);
    this.sprite.setTexture(characterKey('ava', 'happy')); audio.play('coin');
    const wrong = scoreDrink({ recipe: recipeById('latte'), special: null, cup: cupOf('espresso'), patienceFrac: 1 });
    this.say(`${r.tier.toUpperCase()}! +${p.total} coins`, `Mistakes are explained. For example, serving only espresso for a latte shows: “${wrong.messages[0]}” The customer leaves unhappy and pays nothing.\nDon’t forget: pause with Esc, and unlock more drinks every day.`, this.firstRun ? 'Start Day 1' : 'Finish', () => this.finish(true));
  }

  finish(completed) {
    this.scene.stop('Prep');
    if (completed || this.firstRun) { game.data.tutorialDone = true; if (game.data.started) game.save(); }
    game.setMode(States.MAIN_MENU);
    this.scene.start(this.firstRun ? 'Cafe' : 'Menu');
  }
}
