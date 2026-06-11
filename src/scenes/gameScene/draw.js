import { COLORS, FONT_SIZES, createText, drawHealthBar } from "../../ui/index.js";
import {
  GAME_W,
  GAME_H,
  COLS,
  ROWS,
  CELL,
  GAP,
  GRID_X,
  GRID_Y,
  TRAY_Y,
  HUD_CARD_Y,
  TRAY_PANEL_X,
  SLOT_W,
  SMALL,
  SGAP,
  CARD_W,
  CARD_H,
} from "./constants.js";

export function initGraphics(scene) {
  scene.bgGfx = scene.add.graphics();
  scene.gridGfx = scene.add.graphics();
  scene.trayGfx = scene.add.graphics();
  scene.ghostGfx = scene.add.graphics().setDepth(20);
  scene.uiGfx = scene.add.graphics();
  scene.pauseGfx = scene.add.graphics().setDepth(30);
}

export function initTexts(scene) {
  const y = HUD_CARD_Y;
  const playerCardX = 16;
  const enemyCardX = GAME_W - CARD_W - 16;
  const textX1 = playerCardX + 30;
  const textX2 = enemyCardX + 30;

  scene.hudTexts = {
    playerName: scene.add.text(textX1, y + 8, scene.player.name, {
      fontSize: "11px",
      color: `#${COLORS.textMuted.toString(16).padStart(6, "0")}`,
    }),
    playerHP: scene.add.text(textX1, y + 22, `${scene.player.currentHP} HP`, {
      fontSize: "13px",
      fontStyle: "bold",
      color: `#${COLORS.textPrimary.toString(16).padStart(6, "0")}`,
    }),
    playerDamage: scene.add.text(textX1, y + 36, "", {
      fontSize: "10px",
      color: `#${COLORS.error.toString(16).padStart(6, "0")}`,
    }),
    enemyName: scene.add.text(textX2, y + 8, scene.enemy.name, {
      fontSize: "11px",
      color: `#${COLORS.textMuted.toString(16).padStart(6, "0")}`,
    }),
    enemyHP: scene.add.text(textX2, y + 22, `${scene.enemy.currentHP} HP`, {
      fontSize: "13px",
      fontStyle: "bold",
      color: `#${COLORS.textPrimary.toString(16).padStart(6, "0")}`,
    }),
    enemyDamage: scene.add.text(textX2, y + 36, "", {
      fontSize: "10px",
      color: `#${COLORS.error.toString(16).padStart(6, "0")}`,
    }),
    score: scene.add
      .text(GAME_W / 2, 24, `POINTS: ${scene.points}`, {
        fontSize: "18px",
        color: `#${COLORS.textAccent.toString(16).padStart(6, "0")}`,
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0.5),
    playerAv: scene.add
      .text(playerCardX + 18, y + 18, "🧝", { fontSize: "15px" })
      .setOrigin(0.5),
    enemyAv: scene.add
      .text(enemyCardX + 18, y + 18, "👹", { fontSize: "15px" })
      .setOrigin(0.5),
    comboCount: scene.add
      .text(GAME_W / 2, TRAY_Y - 76, "", {
        fontSize: "11px",
        color: `#${COLORS.textAccent.toString(16).padStart(6, "0")}`,
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0),
    trayLabel: scene.add
      .text(GAME_W / 2, TRAY_Y - 54, "Tahan & seret blok ke grid", {
        fontSize: "10px",
        color: `#${COLORS.textMuted.toString(16).padStart(6, "0")}`,
      })
      .setOrigin(0.5, 0),
  };

  scene.msgText = scene.add
    .text(GAME_W / 2, GAME_H - 12, "Tahan blok dari bawah lalu seret ke grid.", {
      fontSize: "11px",
      color: `#${COLORS.textMuted.toString(16).padStart(6, "0")}`,
      wordWrap: { width: GAME_W - 20 },
      align: "center",
    })
    .setOrigin(0.5, 1);

  scene.comboText = scene.add
    .text(GAME_W / 2, GRID_Y + (ROWS * (CELL + GAP)) / 2, "", {
      fontSize: "28px",
      fontStyle: "bold",
      color: `#${COLORS.textAccent.toString(16).padStart(6, "0")}`,
      stroke: "#000000",
      strokeThickness: 5,
      align: "center",
    })
    .setOrigin(0.5)
    .setAlpha(0)
    .setDepth(10);
}

export function drawBackground(scene) {
  const g = scene.bgGfx;
  g.clear();
  g.fillStyle(COLORS.bg);
  g.fillRect(0, 0, GAME_W, GAME_H);

  const gW = COLS * (CELL + GAP) + 10;
  const gH = ROWS * (CELL + GAP) + 10;
  g.fillStyle(COLORS.surface);
  g.lineStyle(2, COLORS.primary);
  g.fillRoundedRect(GRID_X - 5, GRID_Y - 5, gW, gH, 10);
}

export function drawHUD(scene) {
  const g = scene.uiGfx;
  g.clear();
  const barY = HUD_CARD_Y + 46;
  const barW = CARD_W - 84;
  const playerCardX = 16;
  const enemyCardX = GAME_W - CARD_W - 16;

  const bx1 = playerCardX + 14;
  const bx2 = enemyCardX + 14;

  g.fillStyle(COLORS.surface);
  g.fillRoundedRect(playerCardX, HUD_CARD_Y, CARD_W, CARD_H, 12);
  g.fillRoundedRect(enemyCardX, HUD_CARD_Y, CARD_W, CARD_H, 12);

  g.fillStyle(COLORS.bg, 0.38);
  g.fillRoundedRect(14, HUD_CARD_Y + 48, barW, 8, 4);
  g.fillRoundedRect(bx2, HUD_CARD_Y + 48, barW, 8, 4);

  g.fillStyle(COLORS.secondary, 0.1);
  g.fillCircle(28, HUD_CARD_Y + 20, 14);
  g.fillStyle(0x3a1e1e);
  g.fillCircle(GAME_W / 2 + 28, HUD_CARD_Y + 20, 14);

  drawHealthBar(g, bx1, barY, barW, 10, scene.player.currentHP, scene.player.maxHP);
  drawHealthBar(g, bx2, barY, barW, 10, scene.enemy.currentHP, scene.enemy.maxHP);

  if (scene.comboTimer && scene.comboCount > 0) {
    const cooldownWidth = 160;
    const cooldownHeight = 10;
    const cooldownX = GAME_W / 2 - cooldownWidth / 2;
    const cooldownY = TRAY_Y - 34;
    const elapsed = scene.time.now - scene.comboCooldownStarted;
    const remaining = Phaser.Math.Clamp(1 - elapsed / scene.comboCooldown, 0, 1);

    g.fillStyle(0x1e2345);
    g.fillRoundedRect(cooldownX, cooldownY, cooldownWidth, cooldownHeight, 5);
    g.fillStyle(COLORS.textAccent);
    g.fillRoundedRect(cooldownX, cooldownY, cooldownWidth * remaining, cooldownHeight, 5);
    g.lineStyle(1, COLORS.surfaceBorder, 0.8);
    g.strokeRoundedRect(cooldownX, cooldownY, cooldownWidth, cooldownHeight, 5);
  }

  scene.hudTexts.playerHP.setText(`${Math.round(scene.player.currentHP)} HP`);
  scene.hudTexts.enemyHP.setText(`${Math.round(scene.enemy.currentHP)} HP`);
}

export function drawGrid(scene) {
  const g = scene.gridGfx;
  g.clear();

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = GRID_X + c * (CELL + GAP);
      const y = GRID_Y + r * (CELL + GAP);
      const cell = scene.grid[r][c];
      let color = null;

      if (cell !== null) {
        if (typeof cell === "object" && cell.color) {
          color = cell.color;
        } else {
          color = cell;
        }
      }

      if (color !== null) {
        g.fillStyle(color);
        g.fillRoundedRect(x, y, CELL, CELL, 4);
        g.fillStyle(COLORS.cellHighlight, 0.18);
        g.fillRoundedRect(x + 3, y + 3, CELL - 6, CELL - 6, 5, 2);
      } else {
        g.fillStyle(COLORS.cellEmpty);
        g.fillRoundedRect(x, y, CELL, CELL, 4);
        g.lineStyle(1, COLORS.cellBorder);
        g.strokeRoundedRect(x, y, CELL, CELL, 4);
      }
    }
  }
}

export function drawTray(scene) {
  const g = scene.trayGfx;
  g.clear();

  scene.trayPieces.forEach((p, i) => {
    if (p.used) return;

    const slotCX = TRAY_PANEL_X + SLOT_W * i + SLOT_W / 2;
    const maxC = Math.max(...p.shape.map((row) => row.length));
    const maxR = p.shape.length;
    const totalW = maxC * (SMALL + SGAP) - SGAP;
    const totalH = maxR * (SMALL + SGAP) - SGAP;
    const sx = slotCX - totalW / 2;
    const sy = TRAY_Y - totalH / 2;

    p.shape.forEach((row, ri) => {
      row.forEach((cell, dc) => {
        if (!cell) return;
        const cx = sx + dc * (SMALL + SGAP);
        const cy = sy + ri * (SMALL + SGAP);
        g.fillStyle(p.color, 1);
        g.fillRoundedRect(cx, cy, SMALL, SMALL, 2);
        g.fillStyle(0xffffff, 0.2);
        g.fillRoundedRect(cx + 1, cy + 1, SMALL - 2, 3, 1);
      });
    });
  });
}
