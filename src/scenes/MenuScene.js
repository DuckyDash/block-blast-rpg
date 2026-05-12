// ─── MenuScene ────────────────────────────────────────────────────────────────
import Phaser from "phaser";
import { GAME_W, GAME_H } from "../config/constants.js";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x0f0f1a);
    bg.fillRect(0, 0, GAME_W, GAME_H);

    // Title
    this.add
      .text(GAME_W / 2, 60, "Block Blast RPG", {
        fontSize: "42px",
        fontStyle: "bold",
        color: "#fde047",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    // Buttons config
    const btnY = 150;
    const btnW = 200;
    const btnH = 50;
    const btnGap = 70;
    const btnX = GAME_W / 2;

    // Button 1: Play Endless
    this._createButton(
      btnX,
      btnY,
      btnW,
      btnH,
      "Play Endless",
      0x6366f1,
      false,
      () => this.scene.start("GameScene", { mode: "endless" }),
    );

    // Button 2: Play Campaign
    this._createButton(
      btnX,
      btnY + btnGap,
      btnW,
      btnH,
      "Play Campaign (Locked)",
      0x888888,
      true,
      null,
    );

    // Button 3: Options
    this._createButton(
      btnX,
      btnY + btnGap * 2,
      btnW,
      btnH,
      "Options",
      0x8b5cf6,
      false,
      () => this.scene.start("OptionsScene"),
    );

    // Button 4: Quit
    this._createButton(
      btnX,
      btnY + btnGap * 3,
      btnW,
      btnH,
      "Exit",
      0xef4444,
      false,
      () => this.game.destroy(true),
    );

    // Footer text
    this.add
      .text(GAME_W / 2, GAME_H - 20, "v1.0.0", {
        fontSize: "11px",
        color: "#666688",
      })
      .setOrigin(0.5);
  }

  _createButton(x, y, w, h, label, color, disabled, callback) {
    const btnGfx = this.add.graphics();
    btnGfx.fillStyle(disabled ? 0x444444 : color);
    btnGfx.fillRoundedRect(x - w / 2, y - h / 2, w, h, 10);

    const btnText = this.add
      .text(x, y, label, {
        fontSize: "16px",
        fontStyle: "bold",
        color: disabled ? "#888888" : "#ffffff",
      })
      .setOrigin(0.5);

    if (!disabled) {
      const hitArea = new Phaser.Geom.Rectangle(
        x - w / 2,
        y - h / 2,
        w,
        h,
      );
      btnText.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
      btnGfx.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

      const hoverHandler = () => {
        btnGfx.clear();
        btnGfx.fillStyle(0xffffff, 0.2);
        btnGfx.fillRoundedRect(x - w / 2, y - h / 2, w, h, 10);
        btnGfx.fillStyle(color);
        btnGfx.fillRoundedRect(x - w / 2, y - h / 2, w, h, 10);
      };

      const outHandler = () => {
        btnGfx.clear();
        btnGfx.fillStyle(color);
        btnGfx.fillRoundedRect(x - w / 2, y - h / 2, w, h, 10);
      };

      btnText.on("pointerover", hoverHandler);
      btnText.on("pointerout", outHandler);
      btnGfx.on("pointerover", hoverHandler);
      btnGfx.on("pointerout", outHandler);

      btnText.on("pointerdown", callback);
      btnGfx.on("pointerdown", callback);
    }
  }
}
