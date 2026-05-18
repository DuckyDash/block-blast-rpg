// ─── MenuScene ────────────────────────────────────────────────────────────────
import Phaser from "phaser";
import { GAME_W, GAME_H } from "../config/constants.js";
import { COLORS, FONT_SIZES, createButton, createPanel, createText } from "../utils/UIComponents.js";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    this._drawBackground();
    this._drawTitle();
    this._drawButtons();
    this._drawFooter();
  }

  _drawBackground() {
    // Gradient background effect with graphics
    const bg = this.add.graphics().setDepth(0);
    
    // Main background
    bg.fillStyle(COLORS.bg);
    bg.fillRect(0, 0, GAME_W, GAME_H);

    // Decorative shapes (subtle)
    bg.fillStyle(0x6366f1, 0.08);
    bg.fillCircle(GAME_W * 0.2, GAME_H * 0.15, 80);
    bg.fillCircle(GAME_W * 0.8, GAME_H * 0.85, 100);
  }

  _drawTitle() {
    // Main title
    createText(this, GAME_W / 2, 50, "Block Blast RPG", {
      fontSize: '48px',
      color: COLORS.textAccent,
      fontStyle: 'bold',
      depth: 5,
    });

    // Subtitle
    createText(this, GAME_W / 2, 85, "Puzzle Battle RPG", {
      fontSize: FONT_SIZES.small,
      color: COLORS.textMuted,
      depth: 5,
    });
  }

  _drawButtons() {
    const btnStartY = 140;
    const btnW = 220;
    const btnH = 52;
    const btnGap = 65;
    const btnX = GAME_W / 2;

    // Button 1: Play Endless
    createButton(
      this,
      btnX,
      btnStartY,
      btnW,
      btnH,
      "🎮 Play Endless",
      COLORS.primary,
      () => this.scene.start("GameScene", { mode: "endless" }),
      { depth: 5, fontSize: FONT_SIZES.body }
    );

    // Button 2: Play Campaign (Locked)
    createButton(
      this,
      btnX,
      btnStartY + btnGap,
      btnW,
      btnH,
      "🔒 Campaign (Locked)",
      0x888888,
      null,
      { disabled: true, depth: 5, fontSize: FONT_SIZES.body }
    );

    // Button 3: Options
    createButton(
      this,
      btnX,
      btnStartY + btnGap * 2,
      btnW,
      btnH,
      "⚙️ Options",
      COLORS.secondary,
      () => this.scene.start("OptionsScene"),
      { depth: 5, fontSize: FONT_SIZES.body }
    );

    // Button 4: Quit
    createButton(
      this,
      btnX,
      btnStartY + btnGap * 3,
      btnW,
      btnH,
      "❌ Exit",
      COLORS.danger,
      () => this.game.destroy(true),
      { depth: 5, fontSize: FONT_SIZES.body }
    );
  }

  _drawFooter() {
    createText(this, GAME_W / 2, GAME_H - 25, "v1.0.0 • Made with Phaser 3", {
      fontSize: FONT_SIZES.small,
      color: COLORS.textMuted,
      depth: 5,
    });
  }
}
