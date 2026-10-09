// Fully synthesized audio (Web Audio API): no audio files, works offline.
const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);
const CHORDS = [[60, 64, 67, 71], [57, 60, 64, 67], [62, 65, 69, 72], [55, 59, 62, 65]]; // Cmaj7 Am7 Dm7 G7

class AudioSystem {
  constructor() { this.ctx = null; this.vol = { master: 0.8, music: 0.6, sfx: 0.8, muted: false }; this.rush = false; this.step = 0; this.next = 0; }

  /** Must be called from a user gesture (browser autoplay policy). */
  unlock() {
    if (!this.ctx) {
      const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      const c = this.ctx;
      this.master = c.createGain(); this.master.connect(c.destination);
      this.musicG = c.createGain(); this.musicG.connect(this.master);
      this.sfxG = c.createGain(); this.sfxG.connect(this.master);
      this.noiseBuf = (() => { const b = c.createBuffer(1, c.sampleRate * 2, c.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; })();
      this._applyVol();
      this._startAmbient();
      this.next = c.currentTime + 0.1;
      this.timer = setInterval(() => this._schedule(), 50);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  setVolumes(v) { Object.assign(this.vol, v); this._applyVol(); }
  _applyVol() {
    if (!this.ctx) return;
    const { master, music, sfx, muted } = this.vol;
    this.master.gain.value = muted ? 0 : master;
    this.musicG.gain.value = music * 0.5;
    this.sfxG.gain.value = sfx;
  }
  setRush(on) { this.rush = on; }

  tone(freq, dur, { type = 'sine', vol = 0.2, slide = 0, delay = 0, dest = null } = {}) {
    if (!this.ctx) return;
    const c = this.ctx, t = c.currentTime + delay;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this.sfxG); o.start(t); o.stop(t + dur + 0.05);
  }
  noise(dur, { freq = 1500, type = 'bandpass', vol = 0.2, delay = 0, q = 1, dest = null } = {}) {
    if (!this.ctx) return null;
    const c = this.ctx, t = c.currentTime + delay;
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noiseBuf; s.loop = true; f.type = type; f.frequency.value = freq; f.Q.value = q;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.05); g.gain.setValueAtTime(vol, t + Math.max(0.05, dur - 0.1)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest || this.sfxG); s.start(t); s.stop(t + dur + 0.05);
    return { stop: () => { try { g.gain.cancelScheduledValues(c.currentTime); g.gain.setTargetAtTime(0.0001, c.currentTime, 0.05); s.stop(c.currentTime + 0.3); } catch { /* already stopped */ } } };
  }

  /** Play a named sound effect. Long-running ones return a handle with stop(). */
  play(name) {
    if (!this.ctx) return null;
    switch (name) {
      case 'click': this.tone(660, 0.06, { type: 'square', vol: 0.06 }); break;
      case 'add': this.tone(520, 0.08, { type: 'triangle', vol: 0.12 }); this.tone(780, 0.08, { type: 'triangle', vol: 0.08, delay: 0.05 }); break;
      case 'bell': this.tone(1568, 0.5, { vol: 0.15 }); this.tone(2093, 0.6, { vol: 0.1, delay: 0.08 }); break;
      case 'coin': this.tone(988, 0.07, { type: 'square', vol: 0.07 }); this.tone(1319, 0.2, { type: 'square', vol: 0.07, delay: 0.07 }); break;
      case 'chime': [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.35, { vol: 0.12, delay: i * 0.08 })); break;
      case 'good': [523, 659, 784].forEach((f, i) => this.tone(f, 0.25, { vol: 0.1, delay: i * 0.07 })); break;
      case 'error': this.tone(220, 0.25, { type: 'sawtooth', vol: 0.1, slide: -80 }); this.tone(165, 0.3, { type: 'sawtooth', vol: 0.1, delay: 0.15, slide: -50 }); break;
      case 'pour': return this.noise(0.5, { freq: 900, vol: 0.12, q: 0.7 });
      case 'brew': return this.noise(this._brewDur || 2.5, { freq: 350, type: 'lowpass', vol: 0.22 });
      case 'grind': return this.noise(0.9, { freq: 2600, vol: 0.14, q: 3 });
      case 'steam': return this.noise(6, { freq: 5000, type: 'highpass', vol: 0.12 });
      case 'buy': [392, 523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.18, { type: 'triangle', vol: 0.12, delay: i * 0.06 })); break;
      case 'unlock': [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.3, { vol: 0.12, delay: i * 0.1 })); break;
      case 'star': this.tone(880, 0.25, { type: 'triangle', vol: 0.14 }); this.tone(1320, 0.35, { type: 'triangle', vol: 0.1, delay: 0.06 }); break;
      default: break;
    }
    return null;
  }

  _startAmbient() {
    // Soft room murmur: low-passed noise.
    const c = this.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noiseBuf; s.loop = true; f.type = 'bandpass'; f.frequency.value = 500; f.Q.value = 0.5; g.gain.value = 0.03;
    s.connect(f); f.connect(g); g.connect(this.musicG); s.start();
  }

  _schedule() {
    const c = this.ctx; if (!c) return;
    const bpm = this.rush ? 128 : 88, stepLen = 60 / bpm / 2;
    while (this.next < c.currentTime + 0.25) {
      const s = this.step, chord = CHORDS[Math.floor(s / 8) % 4], t = this.next - c.currentTime;
      const d = this.musicG;
      if (s % 8 === 0) this.tone(NOTE(chord[0] - 24), stepLen * 6, { type: 'triangle', vol: 0.35, delay: t, dest: d });
      if (s % 8 === 4 && this.rush) this.tone(NOTE(chord[2] - 24), stepLen * 2, { type: 'triangle', vol: 0.25, delay: t, dest: d });
      const pat = [0, 1, 2, 3, 2, 1, 2, 3];
      if (s % 2 === 0 || this.rush) this.tone(NOTE(chord[pat[s % 8]] + 12), stepLen * 1.8, { type: 'sine', vol: 0.18, delay: t, dest: d });
      if (s % 8 === 0) chord.slice(0, 3).forEach((n) => this.tone(NOTE(n), stepLen * 7, { type: 'sine', vol: 0.07, delay: t, dest: d }));
      if (this.rush && s % 2 === 1) this.noise(0.05, { freq: 8000, type: 'highpass', vol: 0.05, delay: t, dest: d });
      this.step = (s + 1) % 32; this.next += stepLen;
    }
  }
}
export const audio = new AudioSystem();
