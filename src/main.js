import './styles/main.css';
import Phaser from 'phaser';
import { config } from './game/config.js';
import { audio } from './systems/AudioSystem.js';
import { game } from './game/state.js';
import { applySettings } from './ui/screens.js';

applySettings();
const phaser = new Phaser.Game(config);
if (import.meta.env.DEV) globalThis.__phaser = phaser; // debugging handle (dev server only)

// Browsers block audio until a user gesture.
let unlocked = false;
const unlock = () => { audio.unlock(); if (!unlocked) { unlocked = true; applySettings(); } };
['pointerdown', 'keydown', 'touchstart'].forEach((e) => window.addEventListener(e, unlock, { once: false, passive: true }));

// Portrait phones: pause while the "rotate" hint is showing.
const portrait = matchMedia('(orientation: portrait) and (max-width: 900px)');
let rotatePaused = false;
portrait.addEventListener('change', (e) => {
  if (e.matches && !game.paused) { game.pause(); rotatePaused = true; } // state is kept; resumes when rotated back
  else if (!e.matches && rotatePaused) { rotatePaused = false; game.resume(); }
});
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', applySettings);
window.addEventListener('error', (e) => console.error('[Coffee Rush] Unhandled error:', e.message));
