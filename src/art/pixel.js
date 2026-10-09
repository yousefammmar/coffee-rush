import Phaser from 'phaser';
export const S = 3; // screen pixels per art pixel

export function canvasOf(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return [c, x]; }

/** Draw art at 1x on a tiny canvas, optionally add a dark 1px outline, then scale up with nearest-neighbour. */
export function artCanvas(w, h, draw, { outline = '#2a1a14', scale = S } = {}) {
  const [small, sx] = canvasOf(w, h);
  draw(sx, w, h);
  if (outline) {
    const src = sx.getImageData(0, 0, w, h), out = sx.createImageData(w, h);
    out.data.set(src.data);
    const a = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : src.data[(y * w + x) * 4 + 3]);
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(outline.slice(i, i + 2), 16));
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!a(x, y) && (a(x - 1, y) || a(x + 1, y) || a(x, y - 1) || a(x, y + 1))) { const i = (y * w + x) * 4; out.data[i] = r; out.data[i + 1] = g; out.data[i + 2] = b; out.data[i + 3] = 255; }
    }
    sx.putImageData(out, 0, 0);
  }
  const [big, bx] = canvasOf(w * scale, h * scale);
  bx.drawImage(small, 0, 0, w * scale, h * scale);
  return big;
}

export function addArt(scene, key, w, h, draw, opts) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.addCanvas(key, artCanvas(w, h, draw, opts));
  tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
  return tex;
}

export const rect = (x) => (px, py, w, h, c) => { x.fillStyle = c; x.fillRect(px, py, w, h); };
export function shade(hex, amt) { const n = parseInt(hex.slice(1), 16); const f = (v) => Math.max(0, Math.min(255, Math.round(v + amt))); return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, '0')).join(''); }
