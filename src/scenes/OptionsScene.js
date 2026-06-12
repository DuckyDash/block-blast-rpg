// ─── OptionsScene ─────────────────────────────────────────────────────────────
import Phaser from "phaser";
import { GAME_W, GAME_H } from "../config/constants.js";
import { COLORS, FONT_SIZES, createButton, createPanel, createText } from "../ui/UIComponents.js";

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

  _drawTitle() 
  {
    createText(
      this,
      GAME_W / 2,
      100,
      "⚙ OPTIONS",
      {
        fontSize: "56px",
        color: COLORS.textAccent,
        fontStyle: "bold",
        depth: 5,
      }
    );

    createText(
      this,
      GAME_W / 2,
      160,
      "Customize Your Experience",
      {
        fontSize: "24px",
        color: COLORS.textMuted,
        depth: 5,
      }
    );
  }

  _drawOptions() 
  {
    const startY = 250;

    createText(
      this,
      GAME_W / 2,
      startY,
      "SETTINGS",
      {
        fontSize: "32px",
        color: COLORS.textAccent,
        fontStyle: "bold",
        depth: 6,
      }
    );

    const options = [
      "🔊 Sound Effects",
      "🎵 Music Volume",
      "📳 Vibration",
      "🎮 Difficulty",
      "📱 Graphics Quality",
      "🌙 Dark Theme",
    ];

    options.forEach((option, index) => {
      const y = startY + 80 + index * 110;

      createPanel(
        this,
        GAME_W / 2,
        y,
        GAME_W - 80,
        80,
        {
          color: COLORS.surface,
          borderColor: COLORS.surfaceBorder,
          borderWidth: 2,
          radius: 12,
          depth: 5,
        }
      );

      createText(
        this,
        120,
        y,
        option,
        {
          fontSize: "24px",
          color: COLORS.textPrimary,
          depth: 6,
        }
      ).setOrigin(0, 0.5);

      createText(
        this,
        GAME_W - 120,
        y,
        "ON",
        {
          fontSize: "24px",
          color: COLORS.success,
          fontStyle: "bold",
          depth: 6,
        }
      ).setOrigin(1, 0.5);
    });
  }

  _drawBackButton() 
  {
    createButton(
      this,
      GAME_W / 2,
      GAME_H - 120,
      320,
      70,
      "← Back",
      COLORS.primary,
      () => this.scene.start("MenuScene"),
      {
        depth: 5,
        fontSize: "28px",
      }
    );
  }
}
