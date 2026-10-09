export const C = { espresso: 0x35251f, coffee: 0x674735, caramel: 0xc68b59, cream: 0xf7e9d5, beige: 0xe5c9a5, forest: 0x52735d, success: 0x80ae73, gold: 0xedc56d, coral: 0xcb6c62, text: 0x30231f };
export const CSS = { espresso: '#35251F', coffee: '#674735', caramel: '#C68B59', cream: '#F7E9D5', beige: '#E5C9A5', forest: '#52735D', success: '#80AE73', gold: '#EDC56D', coral: '#CB6C62', text: '#30231F' };
export const FONT_UI = '"Nunito", system-ui, sans-serif';
export const FONT_PX = '"Pixelify Sans", "Courier New", monospace';

export function txt(scene, x, y, str, o = {}) {
  const t = scene.add.text(x, y, str, {
    fontFamily: o.font || FONT_UI, fontSize: `${o.size || 16}px`, color: o.color || CSS.text, fontStyle: o.bold === false ? 'normal' : 'bold',
    align: o.align || 'left', wordWrap: o.wrap ? { width: o.wrap, useAdvancedWrap: true } : undefined, lineSpacing: o.lineSpacing ?? 2,
    stroke: o.stroke, strokeThickness: o.strokeThickness || 0,
  });
  t.setResolution(2);
  const [ox, oy] = o.origin || [0, 0];
  t.setOrigin(ox, oy);
  if (o.depth != null) t.setDepth(o.depth);
  return t;
}

export const pixelBox = (g, x, y, w, h, face, { border = 0x24160f, hi = true, shadow = true } = {}) => {
  g.fillStyle(border, 1); g.fillRect(x + 3, y, w - 6, h); g.fillRect(x, y + 3, w, h - 6);
  g.fillStyle(face, 1); g.fillRect(x + 3, y + 3, w - 6, h - 6); g.fillRect(x + 2, y + 5, w - 4, h - 10);
  if (hi) { g.fillStyle(0xffffff, 0.18); g.fillRect(x + 4, y + 3, w - 8, 2); }
  if (shadow) { g.fillStyle(0x000000, 0.18); g.fillRect(x + 4, y + h - 5, w - 8, 2); }
};
export const patienceColor = (f) => (f > 0.5 ? 0x80ae73 : f > 0.25 ? 0xedc56d : 0xcb6c62);
export const patienceWord = (f) => (f > 0.5 ? 'Calm' : f > 0.25 ? 'Waiting' : 'Hurry!');
