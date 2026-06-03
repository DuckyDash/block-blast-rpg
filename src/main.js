// ─── Entry Point ──────────────────────────────────────────────────────────────
// Boots Phaser and registers Capacitor plugins if running on native Android.

import Phaser from 'phaser'
import { gameConfig } from './config/gameConfig.js'

// On native Capacitor, wait for the device to be ready before launching
if (window.Capacitor?.isNativePlatform()) {
  document.addEventListener('deviceready', () => new Phaser.Game(gameConfig), false)
} else {
  new Phaser.Game(gameConfig)
}