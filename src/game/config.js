import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import MenuScene from './scenes/MenuScene.js';
import TutorialScene from './scenes/TutorialScene.js';
import CafeScene from './scenes/CafeScene.js';
import PreparationScene from './scenes/PreparationScene.js';
import ResultsScene from './scenes/ResultsScene.js';
import ShopScene from './scenes/ShopScene.js';

export const GAME_W = 960, GAME_H = 540;
export const config = {
  type: Phaser.AUTO, parent: 'game', width: GAME_W, height: GAME_H, backgroundColor: '#35251F',
  roundPixels: true, antialias: true, input: { activePointers: 3 },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, PreloadScene, MenuScene, TutorialScene, CafeScene, PreparationScene, ResultsScene, ShopScene],
};
