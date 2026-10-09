import { loadSave, writeSave, defaultSave, clearSave } from '../systems/SaveSystem.js';
import { upgradeEffects } from '../systems/EconomySystem.js';
import { evaluateAchievements } from '../systems/AchievementSystem.js';

export const States = {
  MAIN_MENU: 'MAIN_MENU', TUTORIAL: 'TUTORIAL', DAY_START: 'DAY_START', CUSTOMER_WAITING: 'CUSTOMER_WAITING',
  PREPARING: 'PREPARING', SERVING: 'SERVING', DAY_COMPLETE: 'DAY_COMPLETE', SHOP: 'SHOP', PAUSED: 'PAUSED',
};
// Modes in which the business-day clock and customer patience run.
const CLOCK_MODES = new Set([States.CUSTOMER_WAITING, States.PREPARING, States.SERVING]);

/** Central game-state manager: persistent save data + the runtime state machine. */
class GameState {
  constructor() {
    this.data = loadSave();
    this.mode = States.MAIN_MENU;
    this.prevMode = null;
    this.listeners = new Set();
  }
  onChange(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  _emit() { this.listeners.forEach((f) => f(this.mode)); }

  get fx() { return upgradeEffects(this.data.upgrades); }
  get settings() { return this.data.settings; }
  get hasSave() { return this.data.started; }
  get paused() { return this.mode === States.PAUSED; }
  get reducedMotion() {
    const r = this.settings.reducedMotion;
    return r ?? (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  get clockRunning() { return CLOCK_MODES.has(this.mode); }
  /** Convert a Phaser delta (ms) into game seconds, or 0 while frozen. */
  dt(deltaMs) { return this.clockRunning ? (Math.min(deltaMs, 100) / 1000) * this.settings.speed : 0; }
  /** Same, for interactive prep timers: run in any mode except PAUSED. */
  animDt(deltaMs) { return this.paused ? 0 : (Math.min(deltaMs, 100) / 1000) * this.settings.speed; }

  setMode(m) { if (m !== this.mode) { this.mode = m; this._emit(); } }
  pause() { if (this.mode !== States.PAUSED && this.mode !== States.MAIN_MENU) { this.prevMode = this.mode; this.setMode(States.PAUSED); } }
  resume() { if (this.paused) this.setMode(this.prevMode || States.CUSTOMER_WAITING); }

  /** Full save: only called between days / after purchases so a half-played day is never persisted. */
  save() { writeSave(this.data); }
  /** Settings change mid-day: persist only the settings, never the day's in-progress money. */
  saveSettings() { const s = loadSave(); s.settings = this.data.settings; writeSave(s); }
  /** Throw away in-memory progress and reload what is on disk (quit mid-day => the day restarts). */
  reload() { const settings = this.data.settings; this.data = loadSave(); this.data.settings = settings; }
  checkAchievements() { return evaluateAchievements(this.data); }

  newGame() {
    const settings = this.data.settings;
    this.data = { ...defaultSave(), started: true, settings };
    this.save();
  }
  resetAll() { clearSave(); this.data = defaultSave(); }
}

export const game = new GameState();
if (import.meta.env?.DEV) globalThis.__game = game;
