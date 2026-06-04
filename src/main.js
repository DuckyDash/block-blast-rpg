// ─── Entry Point ──────────────────────────────────────────────────────────────
// Boots Phaser and initializes AdMob when running on native Android.

import Phaser from 'phaser'
import { Capacitor } from '@capacitor/core'
import { initAdMob } from './admob.js'
import { gameConfig } from './config/gameConfig.js'

async function initializeApp() {
  if (Capacitor.isNativePlatform()) {
    try {
      await initAdMob()
      console.log('AdMob initialized')
    } catch (error) {
      console.error('AdMob initialization failed:', error)
    }
  }

  new Phaser.Game(gameConfig)
}

if (Capacitor.isNativePlatform()) {
  document.addEventListener('deviceready', initializeApp, false)
} else {
  initializeApp()
}
