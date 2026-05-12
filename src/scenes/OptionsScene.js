// ─── OptionsScene ─────────────────────────────────────────────────────────────
import Phaser from "phaser";
import { GAME_W, GAME_H } from "../config/constants.js";

export class OptionsScene extends Phaser.Scene {
  constructor() {
    super("OptionsScene");
  }

  create() {
    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x0f0f1a);
    bg.fillRect(0, 0, GAME_W, GAME_H);

    // Title
    this.add
      .text(GAME_W / 2, 60, "Options", {
        fontSize: "36px",
        fontStyle: "bold",
        color: "#fde047",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    // Options content (placeholder)
    this.add
      .text(GAME_W / 2, GAME_H / 2 - 30, "Sound Effects", {
        fontSize: "14px",
        color: "#cccccc",
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_W / 2, GAME_H / 2 + 20, "Coming Soon...", {
        fontSize: "12px",
        color: "#888888",
        fontStyle: "italic",
      })
      .setOrigin(0.5);

    // Back button
    this._createButton(
      GAME_W / 2,
      GAME_H - 80,
      150,
      50,
      "Back",
      0x6366f1,
      () => this.scene.start("MenuScene"),
    );
  }

  _createButton(x, y, w, h, label, color, callback) {
    const btnGfx = this.add.graphics();
    btnGfx.fillStyle(color);
    btnGfx.fillRoundedRect(x - w / 2, y - h / 2, w, h, 10);

    const btnText = this.add
      .text(x, y, label, {
        fontSize: "16px",
        fontStyle: "bold",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    const hitArea = new Phaser.Geom.Rectangle(x - w / 2, y - h / 2, w, h);
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
