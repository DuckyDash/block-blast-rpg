// ─── MenuScene ────────────────────────────────────────────────────────────────
import Phaser from "phaser";
import { GAME_W, GAME_H } from "../config/constants.js";
import { COLORS, FONT_SIZES, createButton, createPanel, createText } from "../ui/UIComponents.js";

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
    createText(this, GAME_W / 2, 140, "Block Blast RPG", {
      fontSize: '80px',
      color: COLORS.textAccent,
      fontStyle: 'bold',
      depth: 5,
    });

    // Subtitle
    createText(this, GAME_W / 2, 210, "Puzzle Battle RPG", {
      fontSize: "45px",
      color: COLORS.textMuted,
      depth: 5,
    });
  }

  _drawButtons() {
    const btnStartY = 600;
    const btnW = 600;
    const btnH = 170;
    const btnGap = 230;
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
      { depth: 5, fontSize: "50px" }
    );

    // Button 2: Play Campaign
    createButton(
      this,
      btnX,
      btnStartY + btnGap,
      btnW,
      btnH,
      "🗺️ Campaign",
      0x22c55e,
      () => this.scene.start("CampaignScene", { level: 0 }),
      { depth: 5, fontSize: "50px" }
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
      { depth: 5, fontSize: "50px" }
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
      { depth: 5, fontSize: "50px" }
    );
  }

  _drawFooter() {
    createText(this, GAME_W / 2, GAME_H - 25, "v1.0.0 • Made with Phaser 3", {
      fontSize: "40px",
      color: COLORS.textMuted,
      depth: 5,
    });
  }
}
