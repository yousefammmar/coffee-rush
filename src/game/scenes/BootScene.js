import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  create() {
    // Make sure web fonts are ready before any Phaser Text is rendered.
    const fonts = ['700 16px "Pixelify Sans"', '400 16px "Pixelify Sans"', '700 16px "Nunito"', '800 16px "Nunito"'];
    const ready = Promise.all(fonts.map((f) => document.fonts.load(f, 'Aa0'))).catch(() => {});
    Promise.race([ready, new Promise((r) => setTimeout(r, 2500))]).then(() => this.scene.start('Preload'));
  }
}
