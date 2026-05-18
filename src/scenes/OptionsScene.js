// ─── OptionsScene ─────────────────────────────────────────────────────────────
import Phaser from "phaser";
import { GAME_W, GAME_H } from "../config/constants.js";
import { COLORS, FONT_SIZES, createButton, createPanel, createText } from "../utils/UIComponents.js";

export class OptionsScene extends Phaser.Scene {
  constructor() {
    super("OptionsScene");
  }

  create() {
    this._drawBackground();
    this._drawTitle();
    this._drawOptions();
    this._drawBackButton();
  }

  _drawBackground() {
    const bg = this.add.graphics().setDepth(0);
    bg.fillStyle(COLORS.bg);
    bg.fillRect(0, 0, GAME_W, GAME_H);

    // Decorative shapes
    bg.fillStyle(0x8b5cf6, 0.08);
    bg.fillCircle(GAME_W * 0.15, GAME_H * 0.2, 90);
    bg.fillCircle(GAME_W * 0.85, GAME_H * 0.8, 110);
  }

  _drawTitle() {
    createText(this, GAME_W / 2, 50, "Options", {
      fontSize: '44px',
      color: COLORS.textAccent,
      fontStyle: 'bold',
      depth: 5,
    });

    createText(this, GAME_W / 2, 85, "Game Settings", {
      fontSize: FONT_SIZES.small,
      color: COLORS.textMuted,
      depth: 5,
    });
  }

  _drawOptions() {
    const panelX = GAME_W / 2;
    const panelY = GAME_H / 2 - 40;
    const panelW = 280;
    const panelH = 180;

    // Options panel
    createPanel(this, panelX, panelY, panelW, panelH, {
      color: COLORS.surface,
      borderColor: COLORS.surfaceBorder,
      borderWidth: 2,
      radius: 12,
      depth: 5,
    });

    // Options title
    createText(this, GAME_W / 2, panelY - panelH / 2 + 20, "Coming Soon", {
      fontSize: FONT_SIZES.body,
      color: COLORS.textAccent,
      fontStyle: 'bold',
      depth: 6,
    });

    // Placeholder features
    const features = [
      "🔊 Sound Effects",
      "🎵 Music Volume",
      "📱 Screen Size",
    ];

    features.forEach((feature, idx) => {
      createText(this, GAME_W / 2, panelY - panelH / 2 + 50 + idx * 30, feature, {
        fontSize: FONT_SIZES.caption,
        color: COLORS.textSecondary,
        depth: 6,
      });
    });
  }

  _drawBackButton() {
    createButton(
      this,
      GAME_W / 2,
      GAME_H - 70,
      180,
      50,
      "← Back to Menu",
      COLORS.primary,
      () => this.scene.start("MenuScene"),
      { depth: 5, fontSize: FONT_SIZES.body }
    );
  }
}
