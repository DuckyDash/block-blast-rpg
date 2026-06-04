import Phaser from "phaser";
import { GAME_W, GAME_H } from "./constants.js";
import { GameScene } from '../scenes/GameScene.js'
import { MenuScene } from '../scenes/MenuScene.js'
import { OptionsScene } from '../scenes/OptionsScene.js'
import { CampaignScene } from '../scenes/CampaignScene.js'
import { COLORS } from '../ui/UIComponents.js'

export const gameConfig = {
  type: Phaser.AUTO,

  width: GAME_W,
  height: GAME_H,

  backgroundColor: "#111827",

  scene: [MenuScene, CampaignScene, GameScene, OptionsScene],

  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },

  render: {
    antialias: true,
    pixelArt: false,
  },

};