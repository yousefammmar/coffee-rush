import { el, button, openModal, confirmDialog, toast } from './Modal.js';
import { game } from '../game/state.js';
import { audio } from '../systems/AudioSystem.js';
import { RECIPES, INGREDIENTS } from '../data/recipes.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { MASTERY_STEPS } from '../data/progression.js';
import { masteryLevel } from '../systems/EconomySystem.js';
import { recipeCanvas, trophyCanvas } from '../art/icons.js';

export function applySettings() {
  const s = game.settings;
  audio.setVolumes({ master: s.master, music: s.music, sfx: s.sfx, muted: s.muted });
  document.body.classList.toggle('no-motion', game.reducedMotion);
}

export function openSettings({ onClose } = {}) {
  const s = game.settings;
  const slider = (label, key) => {
    const out = el('span', { className: 'val' }, `${Math.round(s[key] * 100)}`);
    const inp = el('input', { type: 'range', min: 0, max: 100, value: Math.round(s[key] * 100), ariaLabel: label });
    inp.addEventListener('input', () => { s[key] = inp.value / 100; out.textContent = inp.value; applySettings(); });
    inp.addEventListener('change', () => { game.saveSettings(); if (key === 'sfx') audio.play('coin'); });
    return el('div', { className: 'row' }, el('label', {}, label), inp, out);
  };
  const motion = el('input', { type: 'checkbox', checked: game.reducedMotion });
  motion.addEventListener('change', () => { s.reducedMotion = motion.checked; applySettings(); game.saveSettings(); });
  const mute = el('input', { type: 'checkbox', checked: s.muted });
  mute.addEventListener('change', () => { s.muted = mute.checked; applySettings(); game.saveSettings(); });
  const speed = el('select', { ariaLabel: 'Game speed' }, ...[[0.75, 'Relaxed (0.75x)'], [1, 'Normal (1x)'], [1.25, 'Fast (1.25x)'], [1.5, 'Rush (1.5x)']].map(([v, l]) => el('option', { value: v, selected: s.speed === v }, l)));
  speed.addEventListener('change', () => { s.speed = +speed.value; game.saveSettings(); });
  const fs = button(document.fullscreenElement ? 'Exit fullscreen' : 'Enter fullscreen', async (b) => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); } catch { toast('Fullscreen is not available here.', 'err'); } b.textContent = document.fullscreenElement ? 'Exit fullscreen' : 'Enter fullscreen'; }, 'small');
  const reset = button('Reset save data…', async () => {
    if (await confirmDialog({ title: 'Reset everything?', message: 'This permanently deletes your café, coins, upgrades, decorations and achievements. This cannot be undone.', ok: 'Delete my save', danger: true })) {
      game.resetAll(); applySettings(); toast('Save data deleted.'); m.close();
    }
  }, 'coral small');
  const m = openModal({ title: 'Settings', size: 'mid', onClose, content: [
    slider('Master volume', 'master'), slider('Music volume', 'music'), slider('Effects volume', 'sfx'),
    el('div', { className: 'row' }, el('label', { className: 'check' }, mute, 'Mute all')),
    el('div', { className: 'row' }, el('label', { className: 'check' }, motion, 'Reduce motion & animations')),
    el('div', { className: 'row' }, el('label', {}, 'Game speed'), speed),
    el('div', { className: 'row' }, el('label', {}, 'Display'), fs),
    el('div', { className: 'row' }, el('label', {}, 'Save data'), reset),
    el('p', { className: 'muted' }, 'Settings are saved automatically. Game speed scales every timer: customers, brewing and the clock.'),
  ], actions: [button('Done', () => m.close(), 'green')] });
  return m;
}

export function openCredits() {
  const m = openModal({ title: 'Credits', content: [
    el('p', {}, 'Coffee Rush — a cozy pixel-art café game.'),
    el('p', {}, 'Game design, code, pixel art and audio: all original and generated procedurally in code (no external art or sound files).'),
    el('p', {}, 'Built with Phaser 3 and Vite. Fonts: Pixelify Sans and Nunito (SIL Open Font License) via Fontsource.'),
    el('p', { className: 'muted' }, 'Inspired by the joy of small-shop management games. Brew Happiness, One Cup at a Time.'),
  ], actions: [button('Back', () => m.close(), 'green')] });
}

export function openHowTo(onTutorial) {
  const m = openModal({ title: 'How to Play', size: 'wide', content: [
    el('p', {}, 'Run your tiny café! Each day customers queue at the counter. Keep them happy before their patience runs out.'),
    el('h3', {}, 'The loop'),
    el('ol', { className: 'steps', style: 'font-size:16px' }, ...[
      'Click a customer’s speech bubble to take their order. A ticket appears at the bottom.',
      'Click the espresso machine (or press Space, or click a ticket) to open the Preparation Station.',
      'Make the drink: Grind and Brew espresso, hold Steam to steam milk, then pour milk or foam. Add water, syrups, ice or toppings as the recipe asks.',
      'Press Serve. Your drink is scored 0–100: Perfect (90+), Great (75+), Acceptable (50+) or Incorrect.',
      'Earn coins and tips, then spend them in the Shop on equipment and café decorations.',
    ].map((t) => el('li', {}, t))),
    el('h3', {}, 'Tips'),
    el('p', {}, 'Ingredient order matters: espresso goes in first. Every ingredient costs a little, so use Restart sparingly. Pause with Esc — timers freeze while paused.'),
    el('p', { className: 'muted' }, 'Keyboard shortcuts appear on the buttons in the Preparation Station. Touch and mouse work everywhere.'),
  ], actions: [button('Close', () => m.close(), 'cream'), button('Play the guided tutorial', () => { m.close(); onTutorial(); }, 'green')] });
}

const stepText = (k) => {
  const i = INGREDIENTS[k];
  return { espresso: 'Grind beans, then Brew a shot.', water: 'Add hot water.', milk: 'Hold Steam, then pour the milk.', foam: 'Steam, then pour the foam.', ice: 'Add ice.' }[k] || (i.group === 'syrup' ? `Add ${i.name.toLowerCase()}.` : `Finish with ${i.name.toLowerCase()}.`);
};

export function recipeCards(data) {
  const wrap = el('div', { className: 'cards' });
  for (const r of RECIPES) {
    const open = data.unlockedRecipes.includes(r.id);
    const count = data.mastery[r.id] || 0, lvl = masteryLevel(count);
    const next = MASTERY_STEPS[lvl];
    const card = el('div', { className: `card ${open ? '' : 'locked'}` });
    card.append(recipeCanvas(r, 3), el('h4', {}, open ? r.name : '???'));
    if (open) {
      card.append(el('div', { className: 'muted' }, r.blurb));
      card.append(el('div', {}, ...Object.entries(r.ingredients).map(([k, n]) => el('span', { className: 'tag' }, `${n}× ${INGREDIENTS[k].name}`))));
      card.append(el('ol', { className: 'steps' }, ...r.sequence.concat(Object.keys(r.ingredients).filter((k) => !r.sequence.includes(k))).map((k) => el('li', {}, stepText(k)))));
      card.append(el('div', {}, el('span', { className: 'coins' }, `${r.price + lvl}`)));
      card.append(el('div', { className: 'muted' }, `Mastery ${'★'.repeat(lvl)}${'☆'.repeat(3 - lvl)}  ${count}${next ? `/${next} good drinks` : ' — mastered! (+3 coins)'}`));
      card.append(el('div', { className: 'bar' }, el('i', { style: `width:${next ? Math.min(100, (count / next) * 100) : 100}%` })));
    } else {
      card.append(el('div', { className: 'muted' }, `Unlocks on Day ${r.unlockDay}.`));
      card.append(el('div', { className: 'muted' }, `Needs: ${Object.keys(r.ingredients).map((k) => INGREDIENTS[k].name).join(', ')}`));
    }
    wrap.append(card);
  }
  return wrap;
}
export function openRecipeBook() {
  const m = openModal({ title: 'Recipe Book', size: 'wide', content: [el('p', { className: 'muted' }, 'Make drinks well (score 75+) to master them. Each mastery level adds +1 coin to that drink’s price.'), recipeCards(game.data)], actions: [button('Close', () => m.close(), 'green')] });
}

export function openAchievements() {
  const wrap = el('div', { className: 'cards' });
  const got = game.data.achievements;
  for (const a of ACHIEVEMENTS) {
    const on = got[a.id] != null;
    const card = el('div', { className: `card ${on ? 'done' : 'locked'}` }, trophyCanvas(on), el('h4', {}, a.name), el('div', { className: 'muted' }, a.desc), el('span', { className: `tag ${on ? 'ok' : ''}` }, on ? 'Unlocked' : 'Locked'));
    wrap.append(card);
  }
  const m = openModal({ title: `Achievements ${Object.keys(got).length}/${ACHIEVEMENTS.length}`, size: 'wide', content: [wrap], actions: [button('Close', () => m.close(), 'green')] });
}

export function openPause({ onResume, onQuit }) {
  let quit = false;
  const m = openModal({ title: 'Paused', size: 'narrow', onClose: () => (quit ? onQuit() : onResume()), content: [
    el('p', {}, 'All timers are frozen. Your progress is saved at the end of every day.'),
    el('div', { className: 'row' }, button('Recipe Book', openRecipeBook, 'cream'), button('Achievements', openAchievements, 'cream'), button('Settings', openSettings, 'cream')),
  ], actions: [
    button('Quit to menu', async () => { if (await confirmDialog({ title: 'Quit to menu?', message: 'The current day will restart when you continue. Earlier days are saved.', ok: 'Quit' })) { quit = true; m.close(); } }, 'coral'),
    button('Resume', () => m.close(), 'green'),
  ] });
  return m;
}
