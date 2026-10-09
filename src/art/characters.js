import { rect, shade } from './pixel.js';

export const CHAR_W = 16, CHAR_H = 26;
export const FRAMES = ['idle', 'walkA', 'walkB', 'happy', 'sad'];

export const BARISTA = { skin: '#f0c49a', hair: '#4a2a1c', style: 'short', shirt: '#F7E9D5', pants: '#35251F', extra: 'apron', cap: '#52735D' };

/** Front-facing 16x26 character. frame: idle | walkA | walkB | happy | sad */
export function drawCharacter(ctx, look, frame = 'idle') {
  const r = rect(ctx), { skin, hair, style, shirt, pants, extra } = look;
  const dark = '#2a1a14';
  const legL = frame === 'walkA' ? 0 : frame === 'walkB' ? 1 : 0;
  const legR = frame === 'walkA' ? 1 : frame === 'walkB' ? 0 : 0;
  const armUp = frame === 'happy';

  // legs + shoes
  r(4, 17, 3, 5 - legL, pants); r(9, 17, 3, 5 - legR, pants);
  r(4 - (legL ? 0 : 0), 22 - legL, 4, 2, dark); r(8, 22 - legR, 4, 2, dark);
  // torso + arms
  r(4, 10, 8, 7, shirt); r(4, 16, 8, 1, shade(shirt, -25));
  r(2, armUp ? 6 : 10, 2, armUp ? 5 : 6, shade(shirt, -15)); r(12, armUp ? 6 : 10, 2, armUp ? 5 : 6, shade(shirt, -15));
  r(2, armUp ? 5 : 16, 2, 2, skin); r(12, armUp ? 5 : 16, 2, 2, skin);
  // neck + head
  r(6, 9, 4, 1, shade(skin, -20));
  r(4, 3, 8, 7, skin); r(4, 8, 8, 2, shade(skin, -6));
  // face
  const eye = frame === 'happy' ? null : dark;
  if (frame === 'happy') { r(5, 6, 2, 1, dark); r(9, 6, 2, 1, dark); r(5, 5, 1, 1, dark); r(10, 5, 1, 1, dark); r(6, 5, 1, 1, dark); r(9, 5, 1, 1, dark); }
  else { r(5, 5, 2, 2, eye); r(9, 5, 2, 2, eye); r(5, 5, 1, 1, '#fff'); r(9, 5, 1, 1, '#fff'); }
  if (frame === 'sad') { r(5, 4, 2, 1, dark); r(9, 4, 2, 1, dark); r(7, 9, 2, 1, '#8a3a32'); r(6, 10, 1, 1, shade(skin, -20)); }
  else if (frame === 'happy') { r(6, 8, 4, 1, '#8a3a32'); r(7, 9, 2, 1, '#cb6c62'); }
  else r(7, 8, 2, 1, '#a0584a');
  r(4, 7, 1, 1, '#f0a090'); r(11, 7, 1, 1, '#f0a090'); // cheeks

  // hair / hats
  const h = hair, hd = shade(hair, -30);
  switch (style) {
    case 'short': r(3, 1, 10, 3, h); r(3, 3, 1, 4, h); r(12, 3, 1, 4, h); r(4, 3, 3, 1, hd); break;
    case 'long': r(3, 1, 10, 3, h); r(3, 3, 2, 10, h); r(11, 3, 2, 10, h); r(5, 3, 6, 1, hd); break;
    case 'bun': r(3, 2, 10, 2, h); r(3, 3, 1, 4, h); r(12, 3, 1, 4, h); r(6, 0, 4, 3, h); r(7, 0, 2, 1, hd); break;
    case 'spiky': r(3, 2, 10, 2, h); r(3, 0, 2, 2, h); r(7, 0, 2, 2, h); r(11, 0, 2, 2, h); r(3, 3, 1, 4, h); r(12, 3, 1, 4, h); break;
    case 'beanie': r(3, 1, 10, 4, '#cb6c62'); r(3, 4, 10, 1, '#a04a42'); r(7, 0, 2, 1, '#F7E9D5'); r(3, 5, 1, 2, h); r(12, 5, 1, 2, h); break;
    case 'bald': r(5, 2, 6, 1, shade(skin, -4)); r(3, 6, 1, 3, h); r(12, 6, 1, 3, h); break;
    default: r(3, 1, 10, 3, h);
  }
  if (look.cap) { r(3, 0, 10, 3, look.cap); r(3, 3, 10, 1, shade(look.cap, -30)); r(7, -1, 2, 1, look.cap); }
  // extras
  switch (extra) {
    case 'glasses': ctx.strokeStyle = dark; ctx.lineWidth = 1; ctx.strokeRect(4.5, 4.5, 3, 2); ctx.strokeRect(8.5, 4.5, 3, 2); r(7, 5, 2, 1, dark); break;
    case 'scarf': r(4, 9, 8, 2, '#e0a04a'); r(4, 11, 2, 3, '#e0a04a'); break;
    case 'tie': r(7, 10, 2, 5, '#cb6c62'); r(7, 10, 2, 1, '#8a3a32'); break;
    case 'headphones': r(3, 0, 10, 1, dark); r(2, 4, 2, 4, '#cb6c62'); r(12, 4, 2, 4, '#cb6c62'); break;
    case 'headband': r(3, 3, 10, 1, '#cb6c62'); break;
    case 'backpack': r(1, 11, 2, 7, '#52735D'); r(13, 11, 2, 7, '#52735D'); break;
    case 'apron': r(5, 11, 6, 6, '#7a5a3a'); r(6, 10, 4, 1, '#7a5a3a'); r(6, 12, 4, 1, '#9a7a56'); break;
    default: break;
  }
  if (frame === 'sad') r(13, 3, 1, 2, '#6ab0e0'); // sweat drop
}

export const characterKey = (id, frame) => `ch_${id}_${frame}`;
