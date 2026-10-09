import { audio } from '../systems/AudioSystem.js';

const root = () => document.getElementById('ui');
const stack = [];

export const el = (tag, props = {}, ...kids) => {
  const e = Object.assign(document.createElement(tag), props);
  kids.flat().forEach((k) => e.append(k?.nodeType ? k : document.createTextNode(k ?? '')));
  return e;
};
export const button = (label, onClick, cls = '') => { const b = el('button', { className: `btn ${cls}`, type: 'button' }, label); b.addEventListener('click', () => { audio.play('click'); onClick?.(b); }); return b; };

/** Open a modal panel. Returns { close, body, el }. Esc closes the top-most closable modal. */
export function openModal({ title, content, actions = [], size = 'mid', closable = true, onClose, side = false }) {
  const body = el('div', { className: 'body' });
  [].concat(content).forEach((c) => body.append(c?.nodeType ? c : el('div', { innerHTML: c })));
  const head = el('header', {}, el('h2', { id: 'modal-title' }, title));
  const panel = el('div', { className: `panel ${size}`, role: 'dialog', ariaModal: 'true' }, head, body);
  panel.setAttribute('aria-labelledby', 'modal-title');
  const ov = el('div', { className: `overlay${side ? ' side' : ''}` }, panel);
  const m = { el: ov, body, closable, close(result) { const i = stack.indexOf(m); if (i < 0) return; stack.splice(i, 1); ov.remove(); onClose?.(result); stack.at(-1)?.el.querySelector('button, input, select')?.focus?.(); } };
  if (closable) { const x = el('button', { className: 'x', type: 'button', ariaLabel: 'Close' }, '✕'); x.addEventListener('click', () => { audio.play('click'); m.close(); }); head.append(x); }
  if (actions.length) panel.append(el('footer', {}, ...actions));
  root().append(ov); stack.push(m);
  setTimeout(() => (panel.querySelector('footer .btn') || panel.querySelector('button, input, select'))?.focus?.(), 30);
  return m;
}
export const closeAllModals = () => [...stack].forEach((m) => m.close());
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && stack.length && stack.at(-1).closable) { e.stopPropagation(); stack.at(-1).close(); } }, true);

export function confirmDialog({ title = 'Are you sure?', message, ok = 'Yes', cancel = 'Cancel', danger = false }) {
  return new Promise((resolve) => {
    let done = false; const fin = (v) => { if (!done) { done = true; resolve(v); } };
    const m = openModal({ title, size: 'narrow', content: el('p', {}, message), onClose: () => fin(false), actions: [
      button(cancel, () => m.close()), button(ok, () => { fin(true); m.close(); }, danger ? 'coral' : 'green'),
    ] });
  });
}

export function toast(msg, kind = '') {
  const t = el('div', { className: `toast ${kind}`, role: 'status' }, msg);
  root().append(t); setTimeout(() => t.remove(), 3300);
}
