import { COLORS, FONT_SIZES, createText, createButton } from "../../ui/index.js";
import { GAME_W, GAME_H, BLOCK_COLORS, PIECES } from "./constants.js";

export function createSettingsButton(scene) {
  const btnW = 30;
  const btnH = 30;
  const btnX = GAME_W - 20;
  const btnY = 35;

  const btnGfx = scene.add.graphics().setDepth(15);
  btnGfx.fillStyle(COLORS.primary);
  btnGfx.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);

  const btnText = scene.add
    .text(btnX, btnY, "⚙", { fontSize: "24px" })
    .setOrigin(0.5)
    .setDepth(15);

  const hitArea = new Phaser.Geom.Rectangle(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH);
  btnText.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
  btnGfx.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

  const hoverHandler = () => {
    btnGfx.clear();
    btnGfx.fillStyle(COLORS.primaryHover);
    btnGfx.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
  };

  const outHandler = () => {
    btnGfx.clear();
    btnGfx.fillStyle(COLORS.primary);
    btnGfx.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
  };

  btnText.on("pointerover", hoverHandler);
  btnText.on("pointerout", outHandler);
  btnGfx.on("pointerover", hoverHandler);
  btnGfx.on("pointerout", outHandler);

  btnText.on("pointerdown", () => togglePauseMenu(scene));
  btnGfx.on("pointerdown", () => togglePauseMenu(scene));

  scene.settingsBtn = { gfx: btnGfx, text: btnText };
}

export function togglePauseMenu(scene) {
  if (scene.gameOver || scene.isClearing) return;
  scene.isPaused = !scene.isPaused;

  if (scene.isPaused) {
    if (scene.enemyTimer) scene.enemyTimer.paused = true;
    drawPauseMenu(scene);
  } else {
    if (scene.enemyTimer) scene.enemyTimer.paused = false;
    closePauseMenu(scene);
    scene._setMsg("Melanjutkan permainan...");
  }
}

export function closePauseMenu(scene) {
  scene.pauseMenuObjects.forEach((obj) => {
    if (obj && obj.destroy) obj.destroy();
  });
  scene.pauseMenuObjects = [];
  scene.pauseGfx.clear();
}

export function drawPauseMenu(scene) {
  scene.pauseMenuObjects.forEach((obj) => {
    if (obj && obj.destroy) obj.destroy();
  });
  scene.pauseMenuObjects = [];

  const g = scene.pauseGfx;
  g.clear();
  g.fillStyle(COLORS.overlay, 0.7);
  g.fillRect(0, 0, GAME_W, GAME_H);

  const panelW = 280;
  const panelH = scene.debugMode ? 360 : 300;
  const panelX = GAME_W / 2 - panelW / 2;
  const panelY = GAME_H / 2 - panelH / 2;

  g.fillStyle(COLORS.surface);
  g.fillRoundedRect(panelX, panelY, panelW, panelH, 12);
  g.lineStyle(2, COLORS.primary);
  g.strokeRoundedRect(panelX, panelY, panelW, panelH, 12);

  const title = createText(scene, GAME_W / 2, panelY + 25, "⏸ PAUSED", {
    fontSize: FONT_SIZES.subheading,
    color: COLORS.textAccent,
    fontStyle: "bold",
    depth: 31,
  });
  scene.pauseMenuObjects.push(title);

  const debugStatus = createText(scene, GAME_W / 2, panelY + 55, scene.debugMode ? `DEBUG: ON — ${getDebugPieceDescriptor(scene)}` : "DEBUG: OFF", {
    fontSize: FONT_SIZES.caption,
    color: scene.debugMode ? COLORS.warning : COLORS.textSecondary,
    depth: 31,
  });
  scene.pauseMenuObjects.push(debugStatus);

  const btnY = panelY + 85;
  const btnW = 240;
  const btnH = 40;
  const btnGap = 50;
  let row = 0;

  createPauseMenuButton(scene, GAME_W / 2, btnY + btnGap * row, btnW, btnH, "▶ Resume", COLORS.success, () => togglePauseMenu(scene));
  row += 1;

  createPauseMenuButton(scene, GAME_W / 2, btnY + btnGap * row, btnW, btnH, scene.debugMode ? "🐞 Debug: ON" : "🐞 Debug: OFF", scene.debugMode ? COLORS.warning : COLORS.secondary, () => toggleDebugMode(scene));
  row += 1;

  if (scene.debugMode) {
    createPauseMenuButton(scene, GAME_W / 2, btnY + btnGap * row, btnW, btnH, "🎯 Pilih blok debug", COLORS.primary, () => cycleDebugPiece(scene));
    row += 1;
  }

  createPauseMenuButton(scene, GAME_W / 2, btnY + btnGap * row, btnW, btnH, "🔄 Restart", COLORS.warning, () => {
    closePauseMenu(scene);
    scene.scene.restart();
  });
  row += 1;

  createPauseMenuButton(scene, GAME_W / 2, btnY + btnGap * row, btnW, btnH, "🏠 Main Menu", COLORS.danger, () => {
    closePauseMenu(scene);
    scene.scene.start("MenuScene");
  });
  row += 1;

  createPauseMenuButton(scene, GAME_W / 2, btnY + btnGap * row, btnW, btnH, "❌ Quit", COLORS.secondary, () => {
    closePauseMenu(scene);
    scene.game.destroy(true);
  });
}

export function createPauseMenuButton(scene, x, y, w, h, label, color, callback) {
  const btnGfx = scene.add.graphics().setDepth(31);
  btnGfx.fillStyle(color);
  btnGfx.fillRoundedRect(x - w / 2, y - h / 2, w, h, 8);

  const btnText = scene.add
    .text(x, y, label, {
      fontSize: FONT_SIZES.caption,
      fontStyle: "bold",
      color: "#ffffff",
    })
    .setOrigin(0.5)
    .setDepth(32);

  scene.pauseMenuObjects.push(btnGfx);
  scene.pauseMenuObjects.push(btnText);

  const hitArea = new Phaser.Geom.Rectangle(x - w / 2, y - h / 2, w, h);
  btnText.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
  btnGfx.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

  const hoverHandler = () => {
    btnGfx.clear();
    btnGfx.fillStyle(COLORS.textPrimary, 0.2);
    btnGfx.fillRoundedRect(x - w / 2, y - h / 2, w, h, 8);
    btnGfx.fillStyle(color);
    btnGfx.fillRoundedRect(x - w / 2, y - h / 2, w, h, 8);
  };

  const outHandler = () => {
    btnGfx.clear();
    btnGfx.fillStyle(color);
    btnGfx.fillRoundedRect(x - w / 2, y - h / 2, w, h, 8);
  };

  btnText.on("pointerover", hoverHandler);
  btnText.on("pointerout", outHandler);
  btnGfx.on("pointerover", hoverHandler);
  btnGfx.on("pointerout", outHandler);

  btnText.on("pointerdown", callback);
  btnGfx.on("pointerdown", callback);
}

export function toggleDebugMode(scene) {
  scene.debugMode = !scene.debugMode;
  scene._setMsg(scene.debugMode ? "Debug mode diaktifkan. Pilih blok debug jika diperlukan." : "Debug mode dimatikan.");
  drawPauseMenu(scene);
}

export function cycleDebugPiece(scene) {
  if (scene.debugSelectedIndex === null) {
    scene.debugSelectedIndex = 0;
  } else {
    scene.debugSelectedIndex = (scene.debugSelectedIndex + 1) % PIECES.length;
  }
  scene._setMsg(`Debug blok terpilih: ${getDebugPieceDescriptor(scene)}`);
  drawPauseMenu(scene);
}

export function getDebugPieceDescriptor(scene) {
  if (scene.debugSelectedIndex === null) return "Belum ada blok";
  const shape = PIECES[scene.debugSelectedIndex];
  const rows = shape.length;
  const cols = Math.max(...shape.map((row) => row.length));
  const count = shape.flat().filter(Boolean).length;
  return `${rows}x${cols} (${count} sel)`;
}

export function getDebugPieceColor(scene) {
  if (scene.debugSelectedIndex === null) return BLOCK_COLORS[0];
  return BLOCK_COLORS[scene.debugSelectedIndex % BLOCK_COLORS.length];
}
