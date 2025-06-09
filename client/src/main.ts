import * as Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { LoadingScene } from './scenes/LoadingScene';
import { UIScene } from './scenes/UIScene';

// Game configuration
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: 'game-container',
  backgroundColor: '#1a1a1a',
  scene: [LoadingScene, GameScene, UIScene],
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    touch: true,
    smoothFactor: 0.2,
  },
  render: {
    antialias: true,
    pixelArt: false,
  },
  audio: {
    disableWebAudio: false,
  },
};

// Initialize game
const game = new Phaser.Game(config);

// Handle window resize
window.addEventListener('resize', () => {
  game.scale.resize(window.innerWidth, window.innerHeight);
});

// Prevent zoom on mobile
document.addEventListener('touchmove', (e) => {
  if ((e as any).scale !== 1) {
    e.preventDefault();
  }
}, { passive: false });

// Disable context menu
document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

// Handle visibility change (mobile background/foreground)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    game.scene.pause('GameScene');
  } else {
    game.scene.resume('GameScene');
  }
});

// Export game instance for debugging
(window as any).game = game;
