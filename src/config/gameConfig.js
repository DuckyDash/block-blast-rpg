// ─── Phaser Game Config ───────────────────────────────────────────────────────
import Phaser from 'phaser'
import { GameScene } from '../scenes/GameScene.js'
import { GAME_W, GAME_H } from './constants.js'

export const gameConfig = {
  type: Phaser.AUTO,
  width: GAME_W,
  height: GAME_H,
  backgroundColor: '#0f0f1a',
  parent: 'game-container',
  scene: [GameScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
}
