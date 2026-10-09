import Phaser from 'phaser';
import { addArt, rect, canvasOf } from './pixel.js';
import { CUSTOMERS } from '../data/customers.js';
import { drawCharacter, BARISTA, FRAMES, characterKey, CHAR_W, CHAR_H } from './characters.js';
import { drawHangingPlant } from './cafeArt.js';
import { coinCanvas } from './icons.js';

/** Returns an array of small tasks that each create textures, so loading progress is real. */
export function textureTasks(scene) {
  const tasks = [];
  const people = [...CUSTOMERS.map((c) => [c.id, c.look]), ['barista', BARISTA]];
  for (const [id, look] of people) {
    tasks.push(() => FRAMES.forEach((f) => addArt(scene, characterKey(id, f), CHAR_W + 2, CHAR_H + 2, (ctx) => { ctx.translate(1, 2); drawCharacter(ctx, look, f); })));
  }
  const px = (key, w, h, draw, opts) => tasks.push(() => addArt(scene, key, w, h, draw, opts));
  px('plant_hang', 22, 34, drawHangingPlant, { scale: 3 });
  px('heart', 9, 8, (x) => { const r = rect(x); r(1, 0, 3, 3, '#e8566a'); r(5, 0, 3, 3, '#e8566a'); r(0, 1, 9, 3, '#e8566a'); r(1, 4, 7, 2, '#e8566a'); r(3, 6, 3, 1, '#e8566a'); r(1, 1, 2, 1, '#ff9aa8'); }, { scale: 3 });
  px('angry', 10, 10, (x) => { const r = rect(x); r(0, 3, 3, 1, '#d23a2a'); r(1, 2, 1, 3, '#d23a2a'); r(3, 0, 1, 3, '#d23a2a'); r(5, 1, 3, 1, '#d23a2a'); r(6, 0, 1, 3, '#d23a2a'); r(2, 6, 6, 1, '#d23a2a'); r(2, 7, 1, 2, '#d23a2a'); r(7, 7, 1, 2, '#d23a2a'); }, { scale: 3 });
  px('star_small', 9, 9, (x) => { const r = rect(x); r(4, 0, 1, 3, '#EDC56D'); r(3, 2, 3, 2, '#EDC56D'); r(0, 3, 9, 2, '#EDC56D'); r(2, 5, 5, 2, '#EDC56D'); r(1, 7, 2, 2, '#EDC56D'); r(6, 7, 2, 2, '#EDC56D'); }, { scale: 3 });
  px('dot', 4, 4, (x) => { x.fillStyle = '#fff'; x.fillRect(0, 0, 4, 4); }, { outline: null, scale: 1 });
  tasks.push(() => {
    if (scene.textures.exists('coin')) scene.textures.remove('coin');
    scene.textures.addCanvas('coin', coinCanvas(3)).setFilter(Phaser.Textures.FilterMode.NEAREST);
    const [c, x] = canvasOf(160, 160); const g = x.createRadialGradient(80, 80, 0, 80, 80, 80);
    g.addColorStop(0, 'rgba(255,214,140,0.95)'); g.addColorStop(0.35, 'rgba(255,190,100,0.38)'); g.addColorStop(1, 'rgba(255,170,80,0)');
    x.fillStyle = g; x.fillRect(0, 0, 160, 160);
    if (scene.textures.exists('glow')) scene.textures.remove('glow');
    scene.textures.addCanvas('glow', c);
  });
  return tasks;
}
