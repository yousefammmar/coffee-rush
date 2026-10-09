import { decorItem } from '../data/decor.js';
import { mulberry32 } from '../utils/rng.js';
import { shade } from './pixel.js';

export const W = 960, H = 540;
export const FLOOR_Y = 270;
export const GEOM = {
  machine: { x: 290, y: 168, w: 144, h: 84 },
  menu: { x: 284, y: 54, w: 280, h: 76 },
  window: { x: 776, y: 36, w: 168, h: 200 },
  door: { x: 24, y: 104, w: 92, h: 170 },
  counter: { x: 250, topY: 244, frontY: 258, bottomY: 344 },
  queue: { frontX: 700, y: 416, gap: 88, doorX: 70, doorY: 300 },
  baristaX: 560, baristaY: 262, register: { x: 690, y: 206 },
};
export const SKINS = { steel: { body: '#9aa3a8', dark: '#5d666b', light: '#c9d0d3' }, copper: { body: '#c4743c', dark: '#7a4222', light: '#e8a070' }, mint: { body: '#8fd1b8', dark: '#4c8a74', light: '#c5ecdd' } };

export function resolveLook(eq) {
  const theme = decorItem('theme', eq.theme)?.palette || decorItem('theme', 'classic').palette;
  const look = { ...theme, eq: { ...eq } };
  const w = decorItem('wall', eq.wall);
  if (w?.color) { look.wall = w.color; look.wallDark = w.dark; }
  return look;
}
export const lookKey = (eq) => Object.entries(eq).sort().map(([k, v]) => `${k}=${v}`).join('|');

const R = (ctx) => (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };

function plant(r, x, y, s = 1, leaf = '#52735D', potC = '#C68B59') {
  const lf = shade(leaf, 22), ld = shade(leaf, -28);
  r(x - 14 * s, y - 28 * s, 28 * s, 28 * s, potC); r(x - 16 * s, y - 32 * s, 32 * s, 6 * s, shade(potC, 18)); r(x - 14 * s, y - 8 * s, 28 * s, 4 * s, shade(potC, -22));
  const blobs = [[-26, -64, 18, 40], [-10, -88, 16, 56], [6, -78, 18, 46], [16, -58, 18, 30], [-34, -42, 14, 20], [24, -40, 12, 16], [-2, -62, 12, 36]];
  blobs.forEach(([bx, by, bw, bh], i) => { r(x + bx * s, y + by * s, bw * s, bh * s, i % 2 ? leaf : lf); r(x + (bx + bw - 4) * s, y + by * s, 4 * s, bh * s, ld); });
}

function jar(r, x, y, bean) { r(x, y - 22, 14, 22, 'rgba(240,248,250,0.5)'); r(x, y - 22, 14, 3, '#674735'); r(x + 1, y - 14, 12, 14, bean); r(x + 1, y - 14, 12, 2, shade(bean, 24)); r(x + 2, y - 20, 2, 16, 'rgba(255,255,255,0.35)'); }
function mug(r, x, y, c) { r(x, y - 10, 12, 10, c); r(x + 12, y - 8, 3, 6, c); r(x + 2, y - 10, 8, 2, shade(c, -30)); r(x, y - 10, 2, 10, shade(c, 25)); }
function book(r, x, y, w, h, c) { r(x, y - h, w, h, c); r(x, y - h, w, 2, shade(c, 28)); r(x + 1, y - h + 4, w - 2, 1, shade(c, 50)); }

function machine(r, x, y, skin) {
  const c = SKINS[skin] || SKINS.steel;
  r(x + 4, y - 8, 136, 8, c.body); r(x + 4, y - 8, 136, 2, c.light);
  r(x + 8, y - 14, 20, 6, '#f7efe2'); r(x + 32, y - 14, 20, 6, '#f7efe2'); r(x + 56, y - 14, 20, 6, '#e5d7c2');
  r(x, y, 144, 56, c.body); r(x, y, 144, 4, c.light); r(x, y + 52, 144, 4, c.dark); r(x + 140, y, 4, 56, c.dark);
  r(x + 10, y + 10, 24, 24, c.dark); r(x + 12, y + 12, 20, 20, '#f7efe2'); r(x + 21, y + 15, 2, 9, '#cb6c62'); r(x + 18, y + 22, 8, 2, '#674735'); // gauge
  r(x + 44, y + 12, 8, 8, '#cb6c62'); r(x + 58, y + 12, 8, 8, '#80AE73'); r(x + 72, y + 12, 8, 8, '#EDC56D'); r(x + 100, y + 14, 30, 10, c.dark); r(x + 104, y + 16, 6, 6, '#80AE73');
  r(x + 40, y + 36, 24, 8, c.dark); r(x + 48, y + 44, 8, 8, '#2a1a14'); r(x + 84, y + 36, 24, 8, c.dark); r(x + 92, y + 44, 8, 8, '#2a1a14');
  r(x + 134, y + 20, 6, 40, c.light); r(x + 130, y + 56, 12, 4, c.dark); // steam wand
  r(x + 6, y + 58, 132, 12, c.dark); for (let i = 0; i < 16; i++) r(x + 10 + i * 8, y + 62, 4, 4, shade(c.dark, 30));
  r(x - 4, y + 70, 152, 14, shade(c.dark, -20)); // base
  r(x + 40, y + 52, 28, 14, '#f7efe2'); r(x + 40, y + 52, 28, 3, '#fffaf0'); r(x + 66, y + 55, 5, 6, '#f7efe2'); // cup under spout
}

export function drawCafe(ctx, look) {
  const r = R(ctx), eq = look.eq, rng = mulberry32(11);
  const meta = { lights: [], hanging: [] };
  ctx.clearRect(0, 0, W, H);

  // ---- wall
  r(0, 0, W, FLOOR_Y, look.wall);
  for (let x = 0; x < W; x += 48) r(x, 16, 2, 150, look.wallDark); // soft panel lines
  // subway tile wainscot
  r(0, 168, W, 4, look.trim);
  const tile = shade(look.wall, 14);
  for (let row = 0, y = 172; y < FLOOR_Y; row++, y += 16) {
    r(0, y, W, 16, look.wallDark);
    for (let x = row % 2 ? -16 : 0; x < W; x += 32) r(x + 1, y + 1, 30, 14, tile);
    for (let x = row % 2 ? -16 : 0; x < W; x += 32) r(x + 1, y + 1, 30, 2, shade(tile, 14));
  }
  r(0, FLOOR_Y - 8, W, 8, look.trim); r(0, FLOOR_Y - 8, W, 2, shade(look.trim, 25));
  r(0, 0, W, 14, look.trim); r(0, 14, W, 3, shade(look.trim, -30));

  // ---- floor
  const fl = eq.floor;
  r(0, FLOOR_Y, W, H - FLOOR_Y, look.floorA);
  if (fl === 'checker') {
    for (let y = FLOOR_Y, j = 0; y < H; y += 36, j++) for (let x = 0, i = 0; x < W; x += 48, i++) r(x, y, 48, 36, (i + j) % 2 ? '#f0dfc2' : shade(look.floorB, -12));
  } else if (fl === 'herring') {
    for (let y = FLOOR_Y, j = 0; y < H; y += 20, j++) for (let x = (j % 2) * 20, i = 0; x < W + 40; x += 40, i++) { r(x, y, 36, 8, look.floorA); r(x, y + 10, 36, 8, look.floorB); r(x + 36, y, 4, 20, shade(look.floorB, -40)); r(x, y + 8, 36, 2, shade(look.floorB, -40)); r(x, y + 18, 36, 2, shade(look.floorB, -40)); }
  } else {
    for (let y = FLOOR_Y, j = 0; y < H; y += 26, j++) {
      r(0, y, W, 26, j % 2 ? look.floorB : look.floorA); r(0, y, W, 3, shade(look.floorA, -45)); r(0, y + 3, W, 2, shade(look.floorA, 20));
      for (let x = (j * 97) % 180; x < W; x += 180) r(x, y, 3, 26, shade(look.floorA, -45));
    }
  }
  r(0, FLOOR_Y, W, 6, 'rgba(0,0,0,0.22)'); // wall contact shadow

  // ---- window (glass is left transparent so the live sky layer shows through)
  const wn = GEOM.window;
  r(wn.x - 12, wn.y - 12, wn.w + 24, wn.h + 24, look.trim);
  ctx.clearRect(wn.x, wn.y, wn.w, wn.h);
  r(wn.x - 12, wn.y + wn.h, wn.w + 24, 12, shade(look.trim, 20)); // sill
  r(wn.x + wn.w / 2 - 3, wn.y, 6, wn.h, look.trim); r(wn.x, wn.y + 84, wn.w, 6, look.trim); r(wn.x, wn.y + 150, wn.w, 4, look.trim);
  if (eq.windows === 'curtains') { r(wn.x - 12, wn.y - 12, 40, wn.h + 24, '#cb6c62'); r(wn.x + wn.w - 28, wn.y - 12, 40, wn.h + 24, '#cb6c62'); for (let i = 0; i < 4; i++) { r(wn.x - 8 + i * 9, wn.y - 8, 3, wn.h + 16, shade('#cb6c62', -28)); r(wn.x + wn.w - 24 + i * 9, wn.y - 8, 3, wn.h + 16, shade('#cb6c62', -28)); } r(wn.x - 18, wn.y - 18, wn.w + 36, 8, '#674735'); }
  if (eq.windows === 'fairy') { for (let x = wn.x - 4; x < wn.x + wn.w + 4; x += 12) { r(x, wn.y - 6 + ((x / 12) % 2) * 6, 6, 6, ['#EDC56D', '#cb6c62', '#80AE73', '#fff2c0'][(x / 12) % 4 | 0]); } }

  // ---- door
  const d = GEOM.door;
  r(d.x - 8, d.y - 8, d.w + 16, d.h + 8, look.trim); r(d.x, d.y, d.w, d.h, shade(look.trim, 18));
  r(d.x + 8, d.y + 8, d.w - 16, 70, '#dff0f2'); r(d.x + 8, d.y + 8, d.w - 16, 8, '#bfdde2'); r(d.x + 12, d.y + 12, 8, 56, 'rgba(255,255,255,0.7)');
  r(d.x + d.w / 2 - 2, d.y + 8, 4, 70, shade(look.trim, 10));
  r(d.x + 8, d.y + 88, d.w - 16, 74, shade(look.trim, 5)); r(d.x + 14, d.y + 94, d.w - 28, 28, shade(look.trim, 30)); r(d.x + 14, d.y + 128, d.w - 28, 28, shade(look.trim, 30));
  r(d.x + d.w - 18, d.y + 100, 6, 10, '#EDC56D'); // handle
  r(d.x + 14, d.y - 22, 64, 14, '#35251F'); r(d.x + 16, d.y - 20, 60, 10, look.accent); r(d.x + 28, d.y - 4, 4, 4, '#EDC56D');
  r(d.x - 12, d.y + d.h, d.w + 24, 12, '#674735'); r(d.x - 8, d.y + d.h + 2, d.w + 16, 4, '#8a5a37'); // mat
  ctx.fillStyle = '#F7E9D5'; ctx.font = 'bold 9px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText('OPEN', d.x + 46, d.y - 11);

  // ---- menu board frame (text drawn live by the scene)
  const mb = GEOM.menu;
  r(mb.x - 8, mb.y - 8, mb.w + 16, mb.h + 16, '#674735'); r(mb.x - 8, mb.y - 8, mb.w + 16, 3, '#8a5a37'); r(mb.x, mb.y, mb.w, mb.h, '#24382c'); r(mb.x, mb.y, mb.w, 3, '#1a2a20');
  r(mb.x + mb.w / 2 - 70, mb.y - 14, 140, 4, '#35251F');

  // ---- posters
  const frame = (x, y, w, h, art) => { r(x - 6, y - 6, w + 12, h + 12, '#674735'); r(x, y, w, h, '#F7E9D5'); art(x, y, w, h); };
  if (eq.posters === 'coffee') {
    [610, 690].forEach((px, i) => frame(px, 60, 60, 60, (x, y) => { r(x + 14, y + 22, 32, 24, '#fffaf0'); r(x + 44, y + 28, 8, 10, '#fffaf0'); r(x + 16, y + 24, 28, 6, i ? '#c98a3e' : '#8a5a37'); r(x + 26, y + 26, 8, 4, '#f7e9d5'); r(x + 10, y + 46, 40, 4, '#C68B59'); }));
  } else if (eq.posters === 'botanical') {
    [610, 690].forEach((px, i) => frame(px, 60, 60, 60, (x, y) => { r(x + 28, y + 10, 4, 42, '#52735D'); [[14, 18], [34, 24], [16, 32], [34, 38]].forEach(([lx, ly], k) => r(x + lx, y + ly, 14, 8, k % 2 ? '#80AE73' : '#52735D')); r(x + 22, y + 50, 16, 6, '#C68B59'); }));
  } else { frame(630, 70, 80, 44, (x, y) => { r(x + 8, y + 6, 64, 6, look.accent); r(x + 8, y + 18, 40, 4, '#674735'); r(x + 8, y + 26, 52, 4, '#C68B59'); }); }

  // ---- shelves
  const S1 = 152, S2 = 200;
  const shelf = (y, x0, x1) => { r(x0, y, x1 - x0, 8, '#8a5a37'); r(x0, y, x1 - x0, 2, '#b07848'); r(x0, y + 8, x1 - x0, 3, 'rgba(0,0,0,0.25)'); [x0 + 8, x1 - 16].forEach((bx) => { r(bx, y + 8, 6, 14, '#674735'); }); };
  shelf(S1, 270, 744); shelf(S2, 270, 744);
  const beans = ['#4a2a1c', '#6b3f26', '#3a2216', '#8a5a37'];
  for (let i = 0; i < 6; i++) jar(r, 284 + i * 20, S1, beans[i % 4]);
  for (let i = 0; i < 5; i++) mug(r, 420 + i * 20, S1, ['#F7E9D5', look.accent, '#EDC56D', '#F7E9D5', '#80AE73'][i]);
  [['#CB6C62', 12], ['#52735D', 10], ['#EDC56D', 14], ['#674735', 11], ['#80AE73', 9]].forEach(([c, h], i) => book(r, 540 + i * 9, S1, 8, h + 14, c));
  for (let i = 0; i < 4; i++) { r(610 + i * 22, S1 - 24, 18, 24, '#d9c7a6'); r(610 + i * 22, S1 - 24, 18, 4, look.accent); r(613 + i * 22, S1 - 16, 12, 6, '#F7E9D5'); }
  jar(r, 700, S1, '#4a2a1c'); jar(r, 718, S1, '#6b3f26');
  for (let i = 0; i < 7; i++) mug(r, 284 + i * 18, S2, ['#F7E9D5', '#e5c9a5', '#F7E9D5', look.accent][i % 4]);
  for (let i = 0; i < 4; i++) { r(420 + i * 24, S2 - 24, 18, 24, '#e8d9bf'); r(420 + i * 24, S2 - 24, 18, 5, '#674735'); r(424 + i * 24, S2 - 14, 10, 8, look.accent); }
  r(540, S2 - 22, 30, 22, '#cb6c62'); r(542, S2 - 26, 26, 6, '#8a3a32'); r(570, S2 - 16, 8, 12, '#cb6c62'); // kettle
  for (let i = 0; i < 5; i++) mug(r, 600 + i * 22, S2, ['#F7E9D5', '#F7E9D5', '#cb6c62', '#F7E9D5', '#EDC56D'][i]);
  if (eq.plants !== 'few') { plant(r, 724, S1, 0.32, '#52735D', '#C68B59'); plant(r, 728, S2, 0.3, '#80AE73', '#F7E9D5'); }
  r(mb.x + 10, mb.y + 8, 70, 2, 'rgba(255,255,255,0.12)');

  // ---- espresso machine & counter-top props
  const m = GEOM.machine;
  machine(r, m.x, m.y, eq.machine);
  // grinder
  r(454, 178, 34, 12, '#35251F'); r(458, 190, 26, 40, '#5d4a3c'); r(462, 196, 18, 10, '#c9d0d3'); r(458, 230, 26, 14, '#35251F'); r(468, 168, 14, 12, '#674735');
  // cups stack & jug
  for (let i = 0; i < 3; i++) { r(524, 220 - i * 6, 30, 6, '#F7E9D5'); r(524, 224 - i * 6, 30, 2, '#e5d7c2'); }
  r(570, 214, 20, 30, '#c9d0d3'); r(570, 214, 20, 4, '#9aa3a8'); r(590, 220, 6, 14, '#c9d0d3');
  // register
  const rg = GEOM.register; r(rg.x, rg.y + 18, 54, 20, '#4a3a30'); r(rg.x + 4, rg.y, 46, 20, '#35251F'); r(rg.x + 8, rg.y + 3, 38, 12, '#80AE73'); r(rg.x + 12, rg.y + 6, 12, 2, '#1a3a24'); r(rg.x + 8, rg.y + 36, 38, 4, '#8a5a37');
  // pastry dome
  r(790, 222, 60, 22, '#F7E9D5'); r(796, 196, 48, 26, 'rgba(235,248,252,0.4)'); r(800, 206, 14, 12, '#e0a04a'); r(818, 208, 16, 10, '#c98a3e'); r(802, 204, 10, 4, '#fff6e0'); r(796, 194, 48, 3, 'rgba(255,255,255,0.7)');
  // tip jar
  r(868, 216, 22, 28, 'rgba(235,248,252,0.45)'); r(870, 232, 18, 10, '#EDC56D'); r(866, 212, 26, 5, '#674735');

  // ---- counter
  const c = GEOM.counter;
  const rightX = W;
  const top = eq.counter === 'marble' ? '#ece6dc' : shade(look.counter, 22);
  r(c.x, c.topY, rightX - c.x, 14, top); r(c.x, c.topY, rightX - c.x, 3, shade(top, 18)); r(c.x, c.topY + 11, rightX - c.x, 3, shade(top, -22));
  if (eq.counter === 'marble') for (let i = 0; i < 24; i++) r(c.x + 20 + i * 30 + (i % 3) * 5, c.topY + 3 + (i % 4) * 2, 18, 1, '#c6beb2');
  r(c.x, c.frontY, rightX - c.x, c.bottomY - c.frontY, look.counter);
  if (eq.counter === 'stripe') { for (let x = c.x; x < rightX; x += 28) r(x, c.frontY, 14, c.bottomY - c.frontY, '#F7E9D5'); for (let x = c.x + 14; x < rightX; x += 28) r(x, c.frontY, 14, c.bottomY - c.frontY, look.accent); }
  else for (let x = c.x; x < rightX; x += 30) { r(x, c.frontY, 3, c.bottomY - c.frontY, look.counterDark); r(x + 3, c.frontY, 2, c.bottomY - c.frontY, shade(look.counter, 24)); r(x + 6, c.frontY + 10, 18, c.bottomY - c.frontY - 28, shade(look.counter, -8)); }
  r(c.x, c.bottomY - 10, rightX - c.x, 10, look.counterDark); r(c.x, c.bottomY, rightX - c.x, 8, 'rgba(0,0,0,0.25)');
  r(c.x - 8, c.topY, 12, c.bottomY - c.topY, look.counterDark); r(c.x - 8, c.topY, 12, 4, top);

  // ---- floor furniture (right side) & rug
  if (eq.furniture === 'booth') {
    r(840, 380, 100, 90, '#8a5a37'); r(846, 386, 88, 78, look.accent); r(846, 386, 88, 10, shade(look.accent, 30)); r(850, 470, 8, 24, '#4a3326'); r(920, 470, 8, 24, '#4a3326');
    r(770, 440, 70, 8, '#d9a066'); r(796, 448, 8, 46, '#4a3326'); r(780, 494, 30, 6, '#4a3326');
  } else {
    r(800, 452, 76, 8, '#d9a066'); r(834, 460, 8, 44, '#4a3326'); r(818, 504, 40, 6, '#4a3326');
    r(784, 462, 6, 40, '#4a3326'); r(780, 430, 24, 8, '#8a5a37'); r(780, 430, 6, 34, '#8a5a37'); r(900, 462, 6, 40, '#4a3326'); r(896, 430, 24, 8, '#8a5a37'); r(914, 430, 6, 34, '#8a5a37');
    r(812, 436, 10, 14, '#F7E9D5'); r(810, 448, 14, 4, '#fffaf0'); // cup on table
  }
  // plants
  plant(r, 910, 392, 1.0, '#52735D', '#C68B59');
  if (eq.plants !== 'few') plant(r, 70, 530, 1.1, '#80AE73', '#cb6c62');
  if (eq.plants === 'jungle') { plant(r, 190, 340, 0.7, '#52735D', '#F7E9D5'); plant(r, 232, 322, 0.5, '#80AE73', '#C68B59'); }
  r(860, 232, 28, 4, 'rgba(0,0,0,0)');

  // ---- hanging lights
  const spots = { none: [[330, 14], [560, 14], [800, 14]], bulbs: [[190, 66], [610, 70], [730, 90]], lanterns: [[190, 76], [610, 80], [730, 96]] }[eq.lights] || [];
  spots.forEach(([x, y]) => {
    if (eq.lights === 'bulbs') { r(x - 1, 14, 2, y - 14, '#2a1a14'); r(x - 5, y, 10, 6, '#35251F'); r(x - 6, y + 6, 12, 12, '#fff2c0'); r(x - 4, y + 8, 4, 4, '#ffffff'); }
    else if (eq.lights === 'lanterns') { r(x - 1, 14, 2, y - 14, '#2a1a14'); r(x - 14, y, 28, 30, '#e8803a'); r(x - 14, y, 28, 4, '#8a3a1a'); r(x - 14, y + 26, 28, 4, '#8a3a1a'); r(x - 8, y + 6, 6, 18, 'rgba(255,255,255,0.45)'); }
    else { r(x - 8, 14, 16, 5, '#35251F'); r(x - 5, 19, 10, 4, '#fff2c0'); }
    meta.lights.push({ x, y: eq.lights === 'none' ? 22 : y + 12, r: eq.lights === 'lanterns' ? 120 : eq.lights === 'bulbs' ? 90 : 70 });
  });
  if (eq.plants === 'jungle') meta.hanging = [[260, 14], [660, 14], [150, 14]];
  else if (eq.plants === 'some') meta.hanging = [[640, 14]];
  return meta;
}

/** Hanging plant sprite art (drawn small, scaled by pixel helper). */
export function drawHangingPlant(ctx) {
  const r = R(ctx);
  r(10, 0, 1, 6, '#2a1a14'); r(5, 6, 12, 8, '#C68B59'); r(5, 6, 12, 2, '#e0a870');
  [[2, 12, 4, 18], [8, 12, 4, 24], [14, 12, 4, 20], [0, 18, 3, 10], [18, 18, 3, 12]].forEach(([x, y, w, h], i) => { r(x, y, w, h, i % 2 ? '#52735D' : '#80AE73'); r(x + w - 1, y, 1, h, '#3a5a44'); });
  [[3, 20], [9, 30], [15, 26], [1, 24]].forEach(([x, y]) => r(x, y, 3, 3, '#a8d49a'));
}

export function drawSkyline(ctx, t, w, h) {
  // sky gradient keyed to day progress t (0..1): morning -> noon -> golden -> dusk
  const keys = [[0, '#b9e0f2', '#e8f4f8'], [0.4, '#8fcbee', '#d6eef7'], [0.75, '#f2b56b', '#fbe3b0'], [1, '#6a5fa8', '#f08a6a']];
  let a = keys[0], b = keys[1];
  for (let i = 0; i < keys.length - 1; i++) if (t >= keys[i][0]) { a = keys[i]; b = keys[i + 1]; }
  const f = Math.min(1, Math.max(0, (t - a[0]) / (b[0] - a[0])));
  const mixc = (c1, c2) => { const p = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)); const A = p(c1), B = p(c2); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * f)).join(',')})`; };
  const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, mixc(a[1], b[1])); g.addColorStop(1, mixc(a[2], b[2]));
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  const dusk = Math.max(0, (t - 0.7) / 0.3);
  const bl = (x, y, bw, bh, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, bw, bh); };
  const tint = (hex) => { const p = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)); return `rgb(${p.map((v) => Math.round(v * (1 - dusk * 0.5))).join(',')})`; };
  bl(0, h - 70, 40, 70, tint('#c9a889')); bl(40, h - 100, 36, 100, tint('#b78f74')); bl(76, h - 60, 50, 60, tint('#d8b99a')); bl(126, h - 90, 42, 90, tint('#a9826a'));
  for (let i = 0; i < 6; i++) { bl(8 + i * 26, h - 90 + (i % 2) * 18, 8, 8, dusk > 0.4 ? '#ffe9a0' : 'rgba(255,255,255,0.5)'); }
  bl(0, h - 20, w, 20, tint('#8a7a68')); bl(0, h - 22, w, 3, tint('#bda88c'));
  ctx.fillStyle = `rgba(255,255,255,${0.8 - dusk * 0.5})`;
  [[24, 30, 36, 8], [34, 24, 22, 8], [110, 54, 40, 8], [120, 48, 22, 8]].forEach(([x, y, cw, ch]) => ctx.fillRect(x, y, cw, ch));
}
