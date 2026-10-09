import { INGREDIENTS } from '../data/recipes.js';
import { liquidWeight } from '../systems/RecipeSystem.js';
import { rect, shade } from './pixel.js';

export const CUP_W = 28, CUP_H = 34;

/**
 * Renders a cup + its contents from structured data (cup.log order).
 * opts.glass: tall glass for iced drinks; opts.anim: 0..1 progress of the last liquid layer.
 */
export function drawCup(ctx, cup, { glass = false, anim = 1 } = {}) {
  const r = rect(ctx);
  const dark = '#2a1a14';
  const x0 = glass ? 7 : 6, w = glass ? 14 : 14;
  const top = glass ? 8 : 12, bottom = glass ? 29 : 28; // inner liquid area
  // body
  if (glass) {
    r(6, 6, 16, 25, 'rgba(230,245,250,0.28)'); r(7, 30, 14, 2, 'rgba(200,225,235,0.5)'); r(7, 7, 1, 22, 'rgba(255,255,255,0.45)');
  } else {
    r(4, 10, 18, 20, '#f7efe2'); r(5, 29, 16, 1, '#e5d7c2'); r(4, 11, 1, 18, '#fffaf0'); r(20, 11, 2, 18, '#e3d4bd');
    r(22, 13, 4, 2, '#f7efe2'); r(25, 15, 1, 6, '#f7efe2'); r(22, 20, 4, 2, '#e3d4bd'); r(23, 15, 1, 5, '#6b5240'); // handle (hollow look)
    r(2, 31, 22, 2, '#e8dcc8'); r(3, 33, 20, 1, '#cbb99c'); // saucer
    r(x0 - 1, top - 2, w + 2, bottom - top + 3, '#2a1a14'); // dark hollow behind liquid
  }
  // liquid layers
  const layers = [];
  for (const id of cup.log) if (liquidWeight(id)) layers.push(id);
  let y = bottom;
  layers.forEach((id, i) => {
    const k = i === layers.length - 1 ? anim : 1;
    const hgt = Math.max(1, Math.round(liquidWeight(id) * 2 * k));
    y -= hgt;
    const c = INGREDIENTS[id].color;
    r(x0, y, w, hgt, c);
    if (hgt > 1) r(x0, y, w, 1, shade(c, 28));
  });
  const surface = y;
  // ice
  const ice = cup.contents.ice || 0;
  for (let i = 0; i < Math.min(ice * 2, 8); i++) {
    const ix = x0 + 1 + ((i * 5) % (w - 4)), iy = (layers.length ? surface : bottom - 4) - 2 - Math.floor(i / 3) * 3 + (i % 2);
    r(ix, iy, 4, 4, 'rgba(235,250,255,0.85)'); r(ix, iy, 4, 1, '#ffffff'); r(ix + 3, iy + 1, 1, 3, 'rgba(150,200,220,0.9)');
  }
  // toppings
  const c = cup.contents;
  const rimY = Math.min(surface, top);
  if (c.whip) { r(x0 + 1, rimY - 3, w - 2, 3, '#fffaf0'); r(x0 + 4, rimY - 5, w - 8, 2, '#fffaf0'); r(x0 + 6, rimY - 7, w - 12, 2, '#ffffff'); }
  if (c.cinnamon) for (let i = 0; i < 7; i++) r(x0 + 1 + ((i * 7) % (w - 2)), surface - (i % 2), 1, 1, '#9a5a2a');
  if (c.choc_powder) for (let i = 0; i < 8; i++) r(x0 + 1 + ((i * 5 + 2) % (w - 2)), surface - ((i + 1) % 2), 1, 1, '#4a2a1c');
  if (c.caramel_drizzle) { for (let i = 0; i < w - 2; i += 2) r(x0 + 1 + i, surface + (i % 4 === 0 ? 0 : 1), 2, 1, '#e0a04a'); r(x0 + 2, surface - 1, 2, 1, '#e0a04a'); }
  // rim highlight
  if (glass) r(6, 6, 16, 1, 'rgba(255,255,255,0.7)');
  else r(x0 - 1, top - 2, w + 2, 1, '#fffaf0');
  return { surface, rimY };
}
