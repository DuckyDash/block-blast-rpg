// ─── Phaser Game Config ───────────────────────────────────────────────────────
import Phaser from 'phaser'
import { GameScene } from '../scenes/GameScene.js'
import { MenuScene } from '../scenes/MenuScene.js'
import { OptionsScene } from '../scenes/OptionsScene.js'
import { GAME_W, GAME_H } from './constants.js'
import { COLORS } from '../ui/UIComponents.js'

export const gameConfig = {
  type: Phaser.AUTO,
  backgroundColor: COLORS.bg,
  parent: 'game-container',
  scene: [MenuScene, GameScene, OptionsScene],
  width: GAME_W,
  height: GAME_H,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_W,
    height: GAME_H,
  },
  pixelArt: true,
}
