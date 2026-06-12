// ─── GameScene ────────────────────────────────────────────────────────────────
import Phaser from "phaser";
import { App as CapacitorApp } from "@capacitor/app";
import { Haptics } from "@capacitor/haptics";
import { CAMPAIGN_LEVELS } from "../config/campaign.js";
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
  BLOCK_COLORS,
  PIECES,
} from "../config/constants.js";
import {
  PLAYER_STATS,
  ENEMIES,
} from "../config/entities.js";
import {
  randShape,
  randPieceColor,
  calcDamage,
  canPlace,
  findFullLines,
  clearLines,
} from "../engine/helpers.js";
import { COLORS, FONT_SIZES, createButton, createText, drawHealthBar, HUDCard } from "../ui/index.js";
import { telemetry } from "../services/TelemetryService.js";
import { checkAdSenseImpressions } from "../utils/adTracker.js";

// Powerup feature disabled for the current game mode

// ── Layout ────────────────────────────────────────────────────────────────────
const TRAY_PANEL_X = GRID_X - 7;
const TRAY_PANEL_W = GAME_W - TRAY_PANEL_X * 2;
const SLOT_W = TRAY_PANEL_W / 3;
const SMALL = 40; // tray cell preview size
const SGAP = 4;
const CARD_W = (GAME_W - 30) / 2;
const CARD_H = 120;

// Saat drag: ukuran cell yang mengikuti jari
const DRAG_CELL = 100;
const DRAG_GAP = 2;

const HEALTH_BLOCK_COLOR = 0x22c55e;
const HEALTH_BLOCK_HEAL = 5; // heal amount per special block cleared
const SPECIAL_BLOCK_CHANCE = 0.15; // peluang muncul di tray

const PREVIEW_HIGHLIGHT_STYLES = [
  { fill: 0xff6b6b, alpha: 0.35, stroke: 0xff1744 },
  { fill: 0xda77f2, alpha: 0.35, stroke: 0xbc13e4 },
  { fill: 0x38bdf8, alpha: 0.35, stroke: 0x0ea5e9 },
  { fill: 0xfbbf24, alpha: 0.35, stroke: 0xfb923c },
  { fill: 0x8b5cf6, alpha: 0.35, stroke: 0x7c3aed },
  { fill: 0x22c55e, alpha: 0.35, stroke: 0x16a34a },
];

export class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  init(data) {

    this.mode = data.mode || "endless";

    this.currentLevel = data.level || 0;

    this.levelData = data.levelData || null;

  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  create() {
    this._initState();
    this._initGraphics();
    this._initTexts();
    this._initInput();
    this._initEnemyTimer();
    this.drawBackground();
    this.drawHUD();
    this.drawGrid();
    this.spawnTray();
    this.drawTray();
    this._createSettingsButton();
    telemetry.trackEvent("/play", "game_start", {
      mode: this.mode,
      level: this.mode === 'campaign' ? this.currentLevel + 1 : undefined
    });
  }

  update() {
    // Kalau sedang drag: gambar ghost piece di posisi jari
    if (this.dragging && !this.isPaused) {
      this._updateDragGhost();
    }

    if (this.comboTimer) {
      this.drawHUD();
    }
  }

  // ── Init ───────────────────────────────────────────────────────────────────

  _initState() {
    this.grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    this.player = { ...PLAYER_STATS, currentHP: PLAYER_STATS.maxHP };
    this.enemyKeys = Object.keys(ENEMIES);
    
    if (this.mode === "campaign" && this.levelData) {
      const enemyKey = this.levelData.enemy;
      this.enemyIndex = this.enemyKeys.indexOf(enemyKey);
      if (this.enemyIndex === -1) this.enemyIndex = 0;
      this.enemy = this._createEnemy(enemyKey);
    } else {
      this.enemyIndex = 0;
      this.enemy = this._createEnemy(this.enemyKeys[this.enemyIndex]);
    }

    this.comboCount = 0;
    this.comboTimer = null;
    this.comboCooldown = 10000;
    this.comboCooldownStarted = 0;
    this.comboMaxDamage = 0;
    this.points = 0;
    this.killCount = 0;
    this.debugMode = false;
    this.debugSelectedIndex = null;
    this.trayPieces = [];
    this.gameOver = false;
    this.isClearing = false;
    this.isPaused = false;
    this.pauseMenuObjects = [];
    // powerup-related player state removed

    // Drag state
    this.dragging = false;
    this.dragPieceIdx = null; // index piece di tray yang sedang di-drag
    this.dragOffsetX = 0; // offset jari terhadap pojok kiri atas piece
    this.dragOffsetY = 0;
  }

  _initGraphics() {
    this.bgGfx = this.add.graphics();
    this.gridGfx = this.add.graphics();
    this.trayGfx = this.add.graphics();
    this.ghostGfx = this.add.graphics().setDepth(20); // ghost ngambang di atas semua
    this.uiGfx = this.add.graphics();
    this.pauseGfx = this.add.graphics().setDepth(30); // pause menu graphics
  }

  _initTexts() {
    const y = HUD_CARD_Y;
    const playerCardX = 10;
    const enemyCardX = GAME_W - CARD_W - 10;

    this.playerCard = new HUDCard(this, playerCardX, y, CARD_W, CARD_H, {
      title: this.player.name,
      icon: "🧝",
      cardColor: COLORS.surface,
      borderColor: COLORS.primary,
      iconBgColor: COLORS.secondary,
      depth: 5,
    });

    this.enemyCard = new HUDCard(this, enemyCardX, y, CARD_W, CARD_H, {
      title: this.enemy.name,
      icon: "👹",
      cardColor: COLORS.surface,
      borderColor: COLORS.danger,
      iconBgColor: 0x3a1e1e,
      depth: 5,
    });

    this.hudTexts = {
      killCount: this.add.text(GAME_W / 2, 80, "", {
        fontSize: "32px",
        color: `#${COLORS.textAccent.toString(16).padStart(6, '0')}`,
        fontStyle: "bold",
      }).setOrigin(0.5, 0.5),

      comboCount: this.add
        .text(GAME_W / 2, TRAY_Y - 340, "", {
          fontSize: "48px",
          color: `#${COLORS.textAccent.toString(16).padStart(6, '0')}`,
          fontStyle: "bold",
        })
        .setOrigin(0.5, 0),

      trayLabel: this.add
        .text(GAME_W / 2, TRAY_Y - 180, "Tahan & seret blok ke grid", {
          fontSize: "40px",
          color: `#${COLORS.textMuted.toString(16).padStart(6, '0')}`,
        })
        .setOrigin(0.5, 0),

      playerDamage: this.add.text(playerCardX + CARD_W / 2, y + CARD_H / 2, "", {
        fontSize: "36px",
        fontStyle: "bold",
        color: `#${COLORS.error.toString(16).padStart(6, '0')}`,
        stroke: "#000000",
        strokeThickness: 5,
      }).setOrigin(0.5).setDepth(21).setAlpha(0),

      enemyDamage: this.add.text(enemyCardX + CARD_W / 2, y + CARD_H / 2, "", {
        fontSize: "36px",
        fontStyle: "bold",
        color: `#${COLORS.error.toString(16).padStart(6, '0')}`,
        stroke: "#000000",
        strokeThickness: 5,
      }).setOrigin(0.5).setDepth(21).setAlpha(0),
    };

    this._updateKillCountText();

    this.msgText = this.add
      .text(
        GAME_W / 2,
        GAME_H - 45,
        "Tahan blok dari bawah lalu seret ke grid.",
        {
          fontSize: "36px",
          color: `#${COLORS.textMuted.toString(16).padStart(6, '0')}`,
          wordWrap: { width: GAME_W - 40 },
          align: "center",
        },
      )
      .setOrigin(0.5, 1);

    this.comboText = this.add
      .text(GAME_W / 2, GRID_Y + (ROWS * (CELL + GAP)) / 2, "", {
        fontSize: "100px",
        fontStyle: "bold",
        color: `#${COLORS.textAccent.toString(16).padStart(6, '0')}`,
        stroke: "#000000",
        strokeThickness: 5,
        align: "center",
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(10);
  }

  _updateKillCountText() {
    if (this.mode === 'campaign' && this.levelData) {
      this.hudTexts.killCount.setText(`Level ${this.currentLevel + 1}: ${this.levelData.name}`);
    } else {
      this.hudTexts.killCount.setText(`Kills: ${this.killCount}`);
    }
  }

  _initInput() {
    this.input.on("pointerdown", this._onPointerDown, this);
    this.input.on("pointermove", this._onPointerMove, this);
    this.input.on("pointerup", this._onPointerUp, this);
    this.input.on("pointerupoutside", this._onPointerUp, this);
  }

  _initEnemyTimer() {
    this._startEnemyTimer();
  }

  _createEnemy(key) {
    return {
      ...ENEMIES[key],
      currentHP: ENEMIES[key].maxHP,
    };
  }

  _startEnemyTimer() {
    if (this.enemyTimer) this.enemyTimer.remove();
    this.enemyTimer = this.time.addEvent({
      delay: this.enemy.attackInterval,
      callback: this._enemyAttack,
      callbackScope: this,
      loop: true,
    });
  }

  // powerup methods removed

  _spawnNextEnemy() {
    this.enemyIndex = (this.enemyIndex + 1) % this.enemyKeys.length;
    this.enemy = this._createEnemy(this.enemyKeys[this.enemyIndex]);
    this.drawHUD();
    this._startEnemyTimer();
  }

  _onEnemyDefeated() 
  {
    // Stop serangan musuh lama
    if (this.enemyTimer) {
      this.enemyTimer.remove();
    }

    if (this.mode === "campaign") {
      this.isPaused = true;
      this.gameOver = true;

      // Update progress
      const currentProgress = localStorage.getItem("knightblock_campaign_progress");
      const unlocked = currentProgress ? parseInt(currentProgress) : 1;
      const finishedLevelNum = this.currentLevel + 1;
      if (finishedLevelNum === unlocked) {
        localStorage.setItem("knightblock_campaign_progress", (unlocked + 1).toString());
      }

      // Transition effect
      const overlay = this.add.graphics().setDepth(99).setAlpha(0);
      overlay.fillStyle(0x000000, 1);
      overlay.fillRect(0, 0, GAME_W, GAME_H);
      this.tweens.add({ targets: overlay, alpha: 0.55, duration: 400 });

      const winText = this.add.text(GAME_W / 2, GAME_H / 2, "STAGE CLEARED!", {
        fontSize: "72px",
        fontStyle: "bold",
        color: "#4ade80",
        stroke: "#000",
        strokeThickness: 8,
      }).setOrigin(0.5).setDepth(100).setScale(0.5);

      this.tweens.add({
        targets: winText,
        scale: 1,
        duration: 500,
        ease: "Back.easeOut",
        onComplete: () => {
          this.time.delayedCall(1000, () => {
            winText.destroy();
            overlay.destroy();
            this._endGame(true, "Level Selesai!");
          });
        }
      });
      return;
    }

    // Endless mode: spawn next enemy with transition animation
    this.killCount += 1;
    this._updateKillCountText();
    this._setMsg(`${this.enemy.name} kalah! Musuh baru datang...`);

    // Fade out enemy card
    this.tweens.add({
      targets: [
        this.enemyCard.graphics,
        this.enemyCard.avatar,
        this.enemyCard.nameText,
        this.enemyCard.hpText,
        this.enemyCard.damageText
      ],
      alpha: 0,
      duration: 400,
      onComplete: () => {
        this._spawnNextEnemy();
        // Fade in new enemy card
        this.tweens.add({
          targets: [
            this.enemyCard.graphics,
            this.enemyCard.avatar,
            this.enemyCard.nameText,
            this.enemyCard.hpText,
            this.enemyCard.damageText
          ],
          alpha: 1,
          duration: 400
        });
      }
    });
  }

  _recordCombo(total) {
    if (this.comboCount > 0) {
      this.comboCount += 1;
    } else {
      this.comboCount = 1;
    }
    if (this.comboTimer) this.comboTimer.remove();

    this.comboCooldownStarted = this.time.now;

    this.comboTimer = this.time.delayedCall(
      this.comboCooldown,
      this._resetCombo,
      [],
      this
    );

    this.hudTexts.comboCount.setText(`Combo ${this.comboCount}`);

    return calcDamage(total) * this.comboCount;
  }

  _resetCombo() {
    this.comboCount = 0;
    this.comboTimer = null;
    this.comboCooldownStarted = 0;
    this.comboMaxDamage = 0;
    this.hudTexts.comboCount.setText("");
  }

  // ── Draw: Background ───────────────────────────────────────────────────────

  drawBackground() {
    const g = this.bgGfx;
    g.clear();
    g.fillStyle(COLORS.bg);
    g.fillRect(0, 0, GAME_W, GAME_H);

    const gW = COLS * (CELL + GAP) + 10;
    const gH = ROWS * (CELL + GAP) + 10;
    g.fillStyle(COLORS.surface);
    g.lineStyle(2, COLORS.primary);
    g.fillRoundedRect(GRID_X - 7, GRID_Y - 7, gW, gH, 8);
    g.strokeRoundedRect(GRID_X - 7, GRID_Y - 7, gW, gH, 8);

    g.fillStyle(COLORS.surface);
    g.lineStyle(1, COLORS.surfaceBorder);
    g.fillRoundedRect(TRAY_PANEL_X, TRAY_Y - 200, TRAY_PANEL_W, 300, 12);
    g.strokeRoundedRect(TRAY_PANEL_X, TRAY_Y - 200, TRAY_PANEL_W, 300, 8);
  }

  // ── Draw: HUD ──────────────────────────────────────────────────────────────

  drawHUD() {
    this.playerCard.render(this.player.currentHP, this.player.maxHP);
    this.enemyCard.render(this.enemy.currentHP, this.enemy.maxHP);

    this.playerCard.setName(this.player.name);
    this.enemyCard.setName(this.enemy.name);

    const enemyIcons = {
      goblin: "👹",
      orc: "💀",
      skeleton: "☠️",
      slime: "🟢",
      dragon: "🐉",
      Undead: "🧟",
      DuskSkeleton: "💀",
    };
    this.enemyCard.setIcon(enemyIcons[this.enemyKeys[this.enemyIndex]] || "👾");

    // Cooldown bar combo
    const g = this.uiGfx;
    g.clear();

    if (this.comboTimer && this.comboCount > 0) {
      const cooldownWidth = 160;
      const cooldownHeight = 10;
      const cooldownX = GAME_W / 2 - cooldownWidth / 2;
      const cooldownY = TRAY_Y - 300;
      const elapsed = this.time.now - this.comboCooldownStarted;
      const remaining = Phaser.Math.Clamp(1 - elapsed / this.comboCooldown, 0, 1);

      g.fillStyle(0x1e2345);
      g.fillRoundedRect(cooldownX, cooldownY, cooldownWidth, cooldownHeight, 5);
      g.fillStyle(COLORS.textAccent);
      g.fillRoundedRect(cooldownX, cooldownY, cooldownWidth * remaining, cooldownHeight, 5);
      g.lineStyle(1, COLORS.surfaceBorder, 0.8);
      g.strokeRoundedRect(cooldownX, cooldownY, cooldownWidth, cooldownHeight, 5);
    }
  }

  // ── Draw: Grid ─────────────────────────────────────────────────────────────

  drawGrid() {
    const g = this.gridGfx;
    g.clear();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = GRID_X + c * (CELL + GAP);
        const y = GRID_Y + r * (CELL + GAP);
        const tile = this.grid[r][c];
        const cell = tile;
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
          if (tile && typeof tile === "object" && tile.type === "health") {
            g.fillStyle(0xffffff, 0.95);
            g.fillRoundedRect(x + CELL / 2 - 4, y + CELL / 2 - 16, 8, 32, 3);
            g.fillRoundedRect(x + CELL / 2 - 16, y + CELL / 2 - 4, 32, 8, 3);
          }
        } else {
          g.fillStyle(COLORS.cellEmpty);
          g.fillRoundedRect(x, y, CELL, CELL, 4);
          g.lineStyle(1, COLORS.cellBorder);
          g.strokeRoundedRect(x, y, CELL, CELL, 4);
        }
      }
    }
  }

  // ── Draw: Tray ─────────────────────────────────────────────────────────────

  _createTrayPiece() {
    const isHealth = Math.random() < SPECIAL_BLOCK_CHANCE;
    return {
      shape: randShape(),
      color: isHealth ? HEALTH_BLOCK_COLOR : randPieceColor(),
      type: isHealth ? "health" : "normal",
      used: false,
    };
  }

  spawnTray() {
    this.trayPieces = [0, 1, 2].map((slotIndex) => {
      if (
        this.debugMode &&
        this.debugSelectedIndex !== null &&
        slotIndex === 0
      ) {
        return {
          shape: PIECES[this.debugSelectedIndex],
          color: this._getDebugPieceColor(),
          type: "normal",
          used: false,
        };
      }
      return this._createTrayPiece();
    });
  }

  drawTray() {
    const g = this.trayGfx;
    g.clear();
    this.trayPieces.forEach((p, i) => {
      if (p.used) return;

      // Kalau piece ini sedang di-drag, gambar agak transparan di tray
      const alpha = this.dragging && this.dragPieceIdx === i ? 0.3 : 1.0;

      const slotCX = TRAY_PANEL_X + SLOT_W * i + SLOT_W / 2;
      const maxC = Math.max(...p.shape.map((r) => r.length));
      const totalW = maxC * (SMALL + SGAP) - SGAP;
      const totalH = p.shape.length * (SMALL + SGAP) - SGAP;
      const sx = slotCX - totalW / 2;
      const sy = TRAY_Y - totalH / 1.5;

      p.shape.forEach((row, ri) => {
        row.forEach((cell, dc) => {
          if (!cell) return;
          const cx = sx + dc * (SMALL + SGAP);
          const cy = sy + ri * (SMALL + SGAP);
          g.fillStyle(p.color, alpha);
          g.fillRoundedRect(cx, cy, SMALL, SMALL, 2);
          g.fillStyle(0xffffff, 0.2 * alpha);
          g.fillRoundedRect(cx + 1, cy + 1, SMALL - 2, 3, 1);
        });
      });

      if (p.type === "health") {
        const plusX = slotCX;
        const plusY = TRAY_Y - 24;
        g.fillStyle(0xffffff, 0.9 * alpha);
        g.fillRoundedRect(plusX - 4, plusY - 16, 8, 32, 3);
        g.fillRoundedRect(plusX - 16, plusY - 4, 32, 8, 3);
      }
    });
  }

  // ── Drag: Ghost piece ngikutin jari ────────────────────────────────────────

  _updateDragGhost() {
    const g = this.ghostGfx;
    const ptr = this.input.activePointer;
    const p = this.trayPieces[this.dragPieceIdx];
    if (!p) return;

    g.clear();

    // Posisi pojok kiri atas piece ghost (dikurangi offset supaya tengah)
    const px = ptr.x - this.dragOffsetX;
    const py = ptr.y - this.dragOffsetY;

    // Hitung snap ke grid (grid cell mana yang paling dekat)
    const snapC = Math.round((px - GRID_X) / (CELL + GAP));
    const snapR = Math.round((py - GRID_Y) / (CELL + GAP));

    const onGrid = snapC >= 0 && snapC < COLS && snapR >= 0 && snapR < ROWS;
    const ok = onGrid && canPlace(this.grid, p.shape, snapR, snapC, ROWS, COLS);

    // Gambar ghost di posisi jari (floating, ukuran DRAG_CELL)
    p.shape.forEach((row, dr) => {
      row.forEach((cell, dc) => {
        if (!cell) return;
        const cx = px + dc * (DRAG_CELL + DRAG_GAP);
        const cy = py + dr * (DRAG_CELL + DRAG_GAP);
        g.fillStyle(p.color, 0.85);
        g.fillRoundedRect(cx, cy, DRAG_CELL, DRAG_CELL, 4);
        g.fillStyle(0xffffff, 0.25);
        g.fillRoundedRect(cx + 2, cy + 2, DRAG_CELL - 4, 5, 2);
      });
    });

    // Gambar snap preview di grid (kalau jari ada di atas grid)
    if (onGrid) {
      p.shape.forEach((row, dr) => {
        row.forEach((cell, dc) => {
          if (!cell) return;
          const r = snapR + dr;
          const c = snapC + dc;
          if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
          const gx = GRID_X + c * (CELL + GAP);
          const gy = GRID_Y + r * (CELL + GAP);
          const clr = ok ? p.color : 0xff4444;
          g.fillStyle(clr, ok ? 0.45 : 0.25);
          g.fillRoundedRect(gx, gy, CELL, CELL, 4);
          if (ok) {
            // Border hijau kalau bisa ditaruh
            g.lineStyle(2, 0x4ade80, 0.8);
            g.strokeRoundedRect(gx, gy, CELL, CELL, 4);
          }
        });
      });
    }

    // Highlight blocks that will be cleared if piece is placed
    if (ok && snapR !== null && snapC !== null) {
      // Create temp grid to simulate placement
      const tempGrid = this.grid.map(row => [...row]);
      p.shape.forEach((row, dr) => {
        row.forEach((cell, dc) => {
          if (cell) {
            const r = snapR + dr;
            const c = snapC + dc;
            if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
              tempGrid[r][c] = p.color;
            }
          }
        });
      });

      // Find full lines that would be cleared
      const { fullRows, fullCols } = findFullLines(tempGrid, ROWS, COLS);
      const totalClears = fullRows.length + fullCols.length;
      const styleIndex = Math.abs(snapR - snapC + totalClears) % PREVIEW_HIGHLIGHT_STYLES.length;
      const style = PREVIEW_HIGHLIGHT_STYLES[styleIndex];
      const pulsePhase = ((this.time.now + totalClears * 110) % 800) / 800;
      const pulseAlpha = 0.18 + Math.sin(pulsePhase * Math.PI * 2) * 0.08;
      const waveColors = [0xff5d9e, 0x6d28d9, 0x22d3ee, 0xfbbf24, 0x16a34a];
      const spectrum = waveColors[Math.floor(pulsePhase * waveColors.length)];
      const sparkleColor = totalClears >= 3 ? 0xffffff : style.stroke;

      fullRows.forEach((r, rowIndex) => {
        for (let c = 0; c < COLS; c++) {
          const gx = GRID_X + c * (CELL + GAP);
          const gy = GRID_Y + r * (CELL + GAP);
          g.fillStyle(style.fill, style.alpha + pulseAlpha * 0.1);
          g.fillRoundedRect(gx, gy, CELL, CELL, 4);
          g.lineStyle(2 + Math.sin(pulsePhase * Math.PI * 2) * 0.8, style.stroke, 0.92);
          g.strokeRoundedRect(gx, gy, CELL, CELL, 4);
          if (rowIndex % 2 === 0) {
            g.fillStyle(sparkleColor, pulseAlpha);
            g.fillCircle(gx + CELL * 0.22, gy + CELL * 0.22, 3);
            g.fillCircle(gx + CELL * 0.72, gy + CELL * 0.68, 2.2);
            g.fillStyle(spectrum, pulseAlpha * 0.7);
            g.fillCircle(gx - 4, gy + CELL * 0.5, 2);
            g.fillCircle(gx + CELL + 4, gy + CELL * 0.5, 2);
          }
          g.lineStyle(1.2, spectrum, 0.55);
          g.strokeRoundedRect(gx + 4, gy + 4, CELL - 8, CELL - 8, 3);
        }
      });
      fullCols.forEach((c, colIndex) => {
        for (let r = 0; r < ROWS; r++) {
          const gx = GRID_X + c * (CELL + GAP);
          const gy = GRID_Y + r * (CELL + GAP);
          g.fillStyle(style.fill, style.alpha + pulseAlpha * 0.1);
          g.fillRoundedRect(gx, gy, CELL, CELL, 4);
          g.lineStyle(2 + Math.sin(pulsePhase * Math.PI * 2) * 0.8, style.stroke, 0.92);
          g.strokeRoundedRect(gx, gy, CELL, CELL, 4);
          if (colIndex % 2 === 1) {
            g.fillStyle(sparkleColor, pulseAlpha);
            g.fillCircle(gx + CELL * 0.45, gy + CELL * 0.18, 2.5);
            g.fillCircle(gx + CELL * 0.28, gy + CELL * 0.72, 2.2);
            g.fillStyle(spectrum, pulseAlpha * 0.7);
            g.fillCircle(gx + CELL * 0.5, gy - 4, 2);
            g.fillCircle(gx + CELL * 0.5, gy + CELL + 4, 2);
          }
          g.lineStyle(1.2, spectrum, 0.55);
          g.strokeRoundedRect(gx + 4, gy + 4, CELL - 8, CELL - 8, 3);
        }
      });
    }

    // Simpan snap position buat dipakai pas pointerup
    this.dragSnapR = onGrid ? snapR : null;
    this.dragSnapC = onGrid ? snapC : null;
    this.dragCanPlace = ok;
  }

  // ── Input ──────────────────────────────────────────────────────────────────

  _onPointerDown(ptr) {
    if (this.gameOver || this.isClearing || this.dragging || this.isPaused) return;
    const { x, y } = ptr;

    // Cek apakah jari menyentuh salah satu slot tray
    for (let i = 0; i < 3; i++) {
      const p = this.trayPieces[i];
      if (!p || p.used) continue;

      const slotCX = TRAY_PANEL_X + SLOT_W * i + SLOT_W / 2;
      const maxC = Math.max(...p.shape.map((r) => r.length));
      const maxR = p.shape.length;
      const totalW = maxC * (SMALL + SGAP) - SGAP;
      const totalH = maxR * (SMALL + SGAP) - SGAP;
      const sx = slotCX - totalW / 2;
      const sy = TRAY_Y - totalH / 2;

      // Hit area sedikit lebih besar supaya gampang disentuh
      if (
        x >= sx - 8 &&
        x <= sx + totalW + 8 &&
        y >= sy - 8 &&
        y <= sy + totalH + 8
      ) {
        // Mulai drag — offset: selisih jari dengan pojok kiri atas piece
        this.dragging = true;
        this.dragPieceIdx = i;

        // Offset diset supaya piece muncul agak di atas jari (biar keliatan)
        const dragW = maxC * (DRAG_CELL + DRAG_GAP) - DRAG_GAP;
        const dragH = maxR * (DRAG_CELL + DRAG_GAP) - DRAG_GAP;
        this.dragOffsetX = dragW / 2;
        this.dragOffsetY = dragH + 20; // muncul di atas jari

        this.ghostGfx.setAlpha(1);
        this.drawTray(); // redraw tray dengan piece yang di-drag jadi transparan
        this._setMsg("Seret ke grid lalu lepas untuk menaruh.");
        return;
      }
    }
  }

  _onPointerMove(ptr) {
    // update() sudah handle ghost, tidak perlu redraw di sini
    // tapi kita force update supaya smooth
    if (this.dragging) this._updateDragGhost();
  }

  _onPointerUp(ptr) {
    if (!this.dragging) return;

    const p = this.trayPieces[this.dragPieceIdx];

    // Coba taruh ke grid kalau snap valid
    if (
      this.dragCanPlace &&
      this.dragSnapR !== null &&
      this.dragSnapC !== null
    ) {
      this._placePiece(p, this.dragSnapR, this.dragSnapC);
    } else {
      // Kembalikan ke tray (animasi bounce balik)
      this._setMsg("Taruh di area yang kosong di grid!");
    }

    // Reset drag state
    this.dragging = false;
    this.dragPieceIdx = null;
    this.dragSnapR = null;
    this.dragSnapC = null;
    this.dragCanPlace = false;
    this.ghostGfx.clear();
    this.drawTray();
  }

  // ── Logic ──────────────────────────────────────────────────────────────────

  _placePiece(p, gr, gc) {
    // Stamp piece ke grid dengan warna solid piece tersebut
    p.shape.forEach((row, dr) => {
      row.forEach((cell, dc) => {
        if (cell) {
          this.grid[gr + dr][gc + dc] = {
            color: p.color,
            type: p.type || "normal",
          };
        }
      });
    });

    p.used = true;
    this.drawGrid();
    this.drawTray();
    this._checkLines();

    // Refill kalau semua piece sudah dipakai
    if (this.trayPieces.every((t) => t.used)) {
      this.time.delayedCall(440, () => {
        this.spawnTray();
        this.drawTray();
        this._setMsg("Blok baru! Seret ke grid.");
        // Check lose condition AFTER new pieces spawn
        this._checkLoseCondition();
      });
    }
  }

  _checkLines() {
    const { fullRows, fullCols } = findFullLines(this.grid, ROWS, COLS);
    const total = fullRows.length + fullCols.length;
    if (!total) {
      if (!this.trayPieces.every((t) => t.used)) {
        this._checkLoseCondition();
      }
      return;
    }

    this.isClearing = true;
    this._flashLines(fullRows, fullCols, () => {
      const healData = this._resolveHealthClear(fullRows, fullCols);
      if (healData.totalHeal > 0) {
        this._spawnHealParticlesFromCoords(healData.coords);
      }
      clearLines(this.grid, fullRows, fullCols);
      if (healData.extraClearCoords) {
        healData.extraClearCoords.forEach(({ r, c }) => {
          if (this.grid[r][c] && this.grid[r][c].type === "health") {
            this.grid[r][c] = null;
          }
        });
      }
      // satisfying visual + tactile feedback for clears
      this._playSatisfyingEffect(fullRows, fullCols, total);
      this.drawGrid();
      if (healData.totalHeal > 0) {
        this.player.currentHP = Math.min(this.player.maxHP, this.player.currentHP + healData.totalHeal);
        this.drawHUD();
        this.showHeal(healData.totalHeal, healData.coords);
      }
      const effectiveDmg = this._recordCombo(total);
      this.enemy.currentHP = Math.max(0, this.enemy.currentHP - effectiveDmg);
      this.drawHUD();
      this.showDamage('enemy', effectiveDmg);
      this._showCombo(total, effectiveDmg);
      this.isClearing = false;
      if (this.enemy.currentHP <= 0) this._onEnemyDefeated();
      else if (!this.trayPieces.every((t) => t.used)) {
        this._checkLoseCondition();
      }
    });
  }

  _flashLines(fullRows, fullCols, onDone) {
    const flashGfx = this.add.graphics().setDepth(5);
    const total = fullRows.length + fullCols.length;
    const baseColor = total >= 3 ? 0xffd700 : 0xffffff;
    let tick = 0;
    const ev = this.time.addEvent({
      delay: 60,
      repeat: 6,
      callback: () => {
        flashGfx.clear();
        if (tick % 2 === 0) {
          flashGfx.fillStyle(baseColor, 0.65);
          fullRows.forEach((r) => {
            for (let c = 0; c < COLS; c++)
              flashGfx.fillRoundedRect(
                GRID_X + c * (CELL + GAP),
                GRID_Y + r * (CELL + GAP),
                CELL,
                CELL,
                4,
              );
          });
          fullCols.forEach((c) => {
            for (let r = 0; r < ROWS; r++)
              flashGfx.fillRoundedRect(
                GRID_X + c * (CELL + GAP),
                GRID_Y + r * (CELL + GAP),
                CELL,
                CELL,
                4,
              );
          });
        }
        tick++;
      },
    });
    this.time.delayedCall(520, () => {
      ev.remove();
      flashGfx.destroy();
      onDone();
    });
  }

  // Satisfying visual effect when lines/columns are cleared
  _playSatisfyingEffect(fullRows, fullCols, total) {
    const centers = [];
    fullRows.forEach((r) => {
      for (let c = 0; c < COLS; c++) {
        centers.push({ x: GRID_X + c * (CELL + GAP) + CELL / 2, y: GRID_Y + r * (CELL + GAP) + CELL / 2 });
      }
    });
    fullCols.forEach((c) => {
      for (let r = 0; r < ROWS; r++) {
        centers.push({ x: GRID_X + c * (CELL + GAP) + CELL / 2, y: GRID_Y + r * (CELL + GAP) + CELL / 2 });
      }
    });

    const uniq = [];
    const seen = new Set();
    centers.forEach((pos) => {
      const key = `${Math.round(pos.x)}:${Math.round(pos.y)}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniq.push(pos);
      }
    });

    const glowColor = total >= 4 ? 0xef4444 : total === 3 ? 0xd946ef : total === 2 ? 0x38bdf8 : 0x34d399;
    const spectrumColors = [0xff5d9e, 0x6d28d9, 0x22d3ee, 0xfbbf24, 0x16a34a];
    const waveColor = spectrumColors[total % spectrumColors.length];
    const pulsePhase = ((this.time.now + total * 100) % 700) / 700;
    const pulseFill = 0.2 + Math.sin(pulsePhase * Math.PI * 2) * 0.08;

    uniq.forEach((pos, posIndex) => {
      const count = 6;
      for (let i = 0; i < count; i++) {
        const g = this.add.graphics().setDepth(18);
        g.fillStyle(glowColor, 1);
        g.fillCircle(0, 0, 2 + Math.random() * 2);
        g.x = pos.x;
        g.y = pos.y;
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.8;
        const dist = 12 + Math.random() * 28;
        const tx = pos.x + Math.cos(angle) * dist;
        const ty = pos.y + Math.sin(angle) * dist;
        this.tweens.add({
          targets: g,
          x: tx,
          y: ty,
          alpha: 0,
          scale: 0.4,
          duration: 420 + Math.random() * 240,
          ease: 'Cubic.easeOut',
          onComplete: () => g.destroy(),
        });
      }
      const spark = this.add.graphics().setDepth(17);
      spark.fillStyle(spectrumColors[(posIndex + total) % spectrumColors.length], pulseFill);
      spark.fillCircle(pos.x, pos.y, 5 + Math.sin(pulsePhase * Math.PI * 2) * 2);
      this.tweens.add({ targets: spark, alpha: 0, duration: 320, ease: 'Linear', onComplete: () => spark.destroy() });
    });

    const wave = this.add.graphics().setDepth(17);
    wave.lineStyle(3, waveColor, 0.85);
    uniq.slice(0, 4).forEach((pos, index) => {
      wave.strokeCircle(pos.x, pos.y, 14 + index * 6 + Math.sin(pulsePhase * Math.PI * 2) * 2);
      wave.strokeCircle(pos.x, pos.y, 24 + index * 4 + Math.cos(pulsePhase * Math.PI * 2) * 2);
    });
    this.tweens.add({ targets: wave, alpha: 0, scale: 1.3, duration: 340, ease: 'Power1', onComplete: () => wave.destroy() });

    const flash = this.add.graphics().setDepth(19);
    flash.fillStyle(glowColor, 0.12 + Math.min(0.18, total * 0.03));
    flash.fillRect(0, 0, GAME_W, GAME_H);
    this.tweens.add({ targets: flash, alpha: 0, duration: 320, ease: 'Linear', onComplete: () => flash.destroy() });

    this._showFloatingBanner(this._getComboTitle(total), glowColor, `${total}x!`);

    const intensity = Math.min(0.025, 0.005 * total * uniq.length);
    this.cameras.main.shake(260, intensity);
  }

  _getComboTitle(total) {
    if (total >= 4) return 'ANNIHILATED!';
    if (total === 3) return 'DEVASTATING!';
    if (total === 2) return 'IMPRESSIVE!';
    return 'GOOD HIT!';
  }

  _getComboPhrase(total) {
    const phrases = {
      1: [
        'Precision strike!',
        'Nice placement!',
        'Clean line clear!',
      ],
      2: [
        'Double devastation!',
        'Crunching blow!',
        'That hit felt sharp!',
      ],
      3: [
        'Triple terror!',
        'Total grid purge!',
        'Massive damage!',
      ],
      4: [
        'Ultra annihilation!',
        'Absolute domination!',
        'Bloodbath blast!',
      ],
    };
    const list = phrases[total >= 4 ? 4 : total] || phrases[1];
    return list[Math.floor(Math.random() * list.length)];
  }

  _getEnemyDefeatPhrase() {
    const phrases = [
      'EXECUTED',
      'FINISHED',
      'GUTTED',
      'SLAUGHTER',
      'BLOOD RAIN',
      'CRITICAL STRIKE',
      'TOTAL OVERKILL',
    ];
    return phrases[Math.floor(Math.random() * phrases.length)];
  }

  _showFloatingBanner(text, color, extra = '') {
    const fullText = `${text} ${extra}`.trim();
    const banner = this.add.text(GAME_W / 2, GRID_Y - 28, fullText, {
      fontSize: '28px',
      fontStyle: 'bold',
      color: `#${color.toString(16).padStart(6, '0')}`,
      stroke: '#000000',
      strokeThickness: 6,
      shadow: { offsetX: 0, offsetY: 0, color: '#ffffff', blur: 14, fill: true },
      align: 'center',
    })
      .setOrigin(0.5)
      .setDepth(25)
      .setAlpha(0)
      .setScale(0.85);

    this.tweens.add({
      targets: banner,
      alpha: 1,
      scale: 1.2,
      y: banner.y - 14,
      duration: 320,
      ease: 'Back.easeOut',
    });
    this.tweens.add({
      targets: banner,
      alpha: 0,
      delay: 700,
      duration: 520,
      y: banner.y - 60,
      ease: 'Power2',
      onComplete: () => banner.destroy(),
    });
  }

  _showCombo(total, dmg) {
    const title = this._getComboTitle(total);
    const phrase = this._getComboPhrase(total);
    const label = total > 1
      ? `${title}\n${phrase}\n${total}x COMBO!\n-${dmg} DMG`
      : `${title}\n${phrase}\n-${dmg} DMG`;
    const textColor = total >= 4 ? 0xff5858 : total === 3 ? 0xea580c : total === 2 ? 0x0ea5e9 : 0x22c55e;
    this.comboText
      .setText(label)
      .setAlpha(1)
      .setScale(total > 1 ? 1.35 : 1.05)
      .setStyle({ color: `#${textColor.toString(16).padStart(6, '0')}`, stroke: '#000000', strokeThickness: 6 });
    this.comboText.setY(GRID_Y + (ROWS * (CELL + GAP)) / 2);
    this.tweens.add({
      targets: this.comboText,
      alpha: 0,
      y: this.comboText.y - 52,
      delay: 550,
      duration: 900,
      ease: 'Power2',
    });
    this._setMsg(
      total > 1
        ? `${title} ${phrase} ${total} baris sekaligus! Damage ${dmg}!`
        : `${phrase} Damage ${dmg} ke musuh.`,
    );
    this.hudTexts.comboCount.setText(this.comboCount ? `Combo ${this.comboCount}` : '');
  }

  _playPlayerHitEffect(dmg) {
    const redFlash = this.add.graphics().setDepth(18);
    redFlash.fillStyle(0xff0000, 0.28);
    redFlash.fillRect(0, 0, GAME_W, GAME_H);
    this.tweens.add({
      targets: redFlash,
      alpha: 0,
      duration: 420,
      ease: 'Quad.easeOut',
      onComplete: () => redFlash.destroy(),
    });

    const hitText = this.add.text(GAME_W / 2, GAME_H / 2 - 40, 'OUCH!', {
      fontSize: '32px',
      fontStyle: 'bold',
      color: '#ff4d4d',
      stroke: '#000000',
      strokeThickness: 6,
    })
      .setOrigin(0.5)
      .setDepth(25)
      .setAlpha(0);

    this.tweens.add({
      targets: hitText,
      alpha: 1,
      scale: 1.2,
      duration: 200,
      ease: 'Back.easeOut',
    });
    this.tweens.add({
      targets: hitText,
      alpha: 0,
      scale: 0.7,
      y: hitText.y - 30,
      delay: 260,
      duration: 360,
      ease: 'Power2',
      onComplete: () => hitText.destroy(),
    });

    const particles = 12;
    for (let i = 0; i < particles; i++) {
      const g = this.add.graphics().setDepth(17);
      g.fillStyle(0xff7373, 1);
      g.fillCircle(0, 0, 3 + Math.random() * 2);
      g.x = GAME_W / 2;
      g.y = GAME_H / 2;
      const angle = Math.random() * Math.PI * 2;
      const dist = 40 + Math.random() * 40;
      this.tweens.add({
        targets: g,
        x: GAME_W / 2 + Math.cos(angle) * dist,
        y: GAME_H / 2 + Math.sin(angle) * dist,
        alpha: 0,
        duration: 420 + Math.random() * 220,
        ease: 'Cubic.easeOut',
        onComplete: () => g.destroy(),
      });
    }
  }

  _enemyAttack() {
    if (this.gameOver) return;
    let dmg =
      this.enemy.damageMin +
      Math.floor(
        Math.random() * (this.enemy.damageMax - this.enemy.damageMin + 1),
      );
    if (this.player.shieldActive) {
      dmg = Math.ceil(dmg * 0.5);
      this.player.shieldActive = false;
      this._setMsg("Shield menyerap sebagian serangan!");
    }
    this.player.currentHP = Math.max(0, this.player.currentHP - dmg);
    this.drawHUD();
    this.showDamage('player', dmg);
    this.cameras.main.shake(180, 0.012 + dmg * 0.0005);
    this._triggerVibration();
    this._playPlayerHitEffect(dmg);

    if (this.player.currentHP <= 0) this._endGame(false, "HP habis!");
  }

  async _triggerVibration() {
    try {
      if (window.Capacitor?.isNativePlatform && window.Capacitor.isNativePlatform()) {
        await Haptics.vibrate({ duration: 200 });
      } else if (navigator.vibrate) {
        navigator.vibrate(200);
      }
    } catch (e) {
      console.warn("Haptics/Vibration not supported or failed:", e);
    }
  }

  _endGame(won, reason = "") {
    this.gameOver = true;
    this.enemyTimer.remove();

    checkAdSenseImpressions().then((adViewed) => {
      telemetry.trackEvent("/play", "game_over", {
        mode: this.mode,
        level: this.mode === "campaign" ? this.currentLevel + 1 : undefined,
        score: this.points,
        kills: this.killCount,
        won: won,
        reason: reason || (won ? "Kemenangan" : (this.player.currentHP <= 0 ? "HP habis" : "Tidak ada langkah"))
      }, adViewed);
    });

    const overlay = this.add.graphics().setDepth(20);
    overlay.fillStyle(COLORS.overlay, 0.72);
    overlay.fillRect(0, 0, GAME_W, GAME_H);

    if (this.mode === "campaign") {
      const titleText = won ? "Level Selesai! 🎉" : "Ksatria Gugur... 💀";
      const descText = won ? "Monster telah dibersihkan." : "Kembali dan perkuat strategimu.";
      
      this.add.text(GAME_W / 2, GAME_H / 2 - 100, titleText, {
        fontSize: "64px",
        fontStyle: "bold",
        color: won ? `#${COLORS.success.toString(16).padStart(6, '0')}` : `#${COLORS.error.toString(16).padStart(6, '0')}`,
        stroke: "#000000",
        strokeThickness: 6,
      }).setOrigin(0.5).setDepth(21);

      this.add.text(GAME_W / 2, GAME_H / 2 - 20, descText, {
        fontSize: "32px",
        color: `#${COLORS.textSecondary.toString(16).padStart(6, '0')}`
      }).setOrigin(0.5).setDepth(21);

      if (won) {
        const hasNext = this.currentLevel + 1 < CAMPAIGN_LEVELS.length;
        if (hasNext) {
          createButton(
            this,
            GAME_W / 2 - 220,
            GAME_H / 2 + 120,
            380,
            90,
            "🎮 Next Level",
            COLORS.success,
            () => {
              const nextLvlIndex = this.currentLevel + 1;
              this.scene.start("GameScene", {
                mode: "campaign",
                level: nextLvlIndex,
                levelData: CAMPAIGN_LEVELS[nextLvlIndex]
              });
            },
            { depth: 22, fontSize: "32px" }
          );

          createButton(
            this,
            GAME_W / 2 + 220,
            GAME_H / 2 + 120,
            380,
            90,
            "🗺️ Campaign Map",
            COLORS.primary,
            () => this.scene.start("CampaignScene"),
            { depth: 22, fontSize: "32px" }
          );
        } else {
          createButton(
            this,
            GAME_W / 2,
            GAME_H / 2 + 120,
            420,
            90,
            "🗺️ Campaign Map",
            COLORS.primary,
            () => this.scene.start("CampaignScene"),
            { depth: 22, fontSize: "32px" }
          );
        }
      } else {
        createButton(
          this,
          GAME_W / 2 - 220,
          GAME_H / 2 + 120,
          380,
          90,
          "🔄 Coba Lagi",
          COLORS.warning,
          () => this.scene.restart(),
          { depth: 22, fontSize: "32px" }
        );

        createButton(
          this,
          GAME_W / 2 + 220,
          GAME_H / 2 + 120,
          380,
          90,
          "🗺️ Campaign Map",
          COLORS.primary,
          () => this.scene.start("CampaignScene"),
          { depth: 22, fontSize: "32px" }
        );
      }
      return;
    }

    this.add
      .text(
        GAME_W / 2,
        GAME_H / 2 - 120,
        won ? "Kamu Menang! 🎉" : "Game Over 💀",
        {
          fontSize: "72px",
          fontStyle: "bold",
          color: won ? `#${COLORS.success.toString(16).padStart(6, '0')}` : `#${COLORS.error.toString(16).padStart(6, '0')}`,
          stroke: "#000000",
          strokeThickness: 6,
        },
      )
      .setOrigin(0.5)
      .setDepth(21);

    this.add
      .text(
        GAME_W / 2,
        GAME_H / 2 - 40,
        won ? "Musuh dikalahkan!" : "Kamu gugur...",
        { fontSize: "36px", color: `#${COLORS.textSecondary.toString(16).padStart(6, '0')}` },
      )
      .setOrigin(0.5)
      .setDepth(21);

    if (reason) {
      this.add
        .text(
          GAME_W / 2,
          GAME_H / 2 + 30,
          reason,
          { fontSize: "28px", color: `#${COLORS.textMuted.toString(16).padStart(6, '0')}`, fontStyle: "italic" },
        )
        .setOrigin(0.5)
        .setDepth(21);
    }

    const { gfx: btnGfx } = createButton(
      this,
      GAME_W / 2,
      GAME_H / 2 + 160,
      380,
      90,
      "🔄 Lagi",
      COLORS.primary,
      () => this.scene.restart(),
      { depth: 22, fontSize: "32px" }
    );
  }

  _setMsg(t) {
    if (this.msgText) this.msgText.setText(t);
  }

  showDamage(target, dmg) {
    const text = target === 'player' ? this.hudTexts.playerDamage : this.hudTexts.enemyDamage;
    const targetY = HUD_CARD_Y + CARD_H / 2;
    text.setStyle({ color: `#${COLORS.error.toString(16).padStart(6, '0')}` });
    text.setText(`-${dmg} HP`).setAlpha(1).setY(targetY);
    this.tweens.add({
      targets: text,
      y: targetY - 40,
      alpha: 0,
      duration: 1200,
      ease: 'Power2',
      onComplete: () => {
        text.setY(targetY);
      }
    });
  }

  showHeal(heal, coords = []) {
    const text = this.hudTexts.playerDamage;
    const targetY = HUD_CARD_Y + CARD_H / 2;
    text.setStyle({ color: `#${HEALTH_BLOCK_COLOR.toString(16).padStart(6, '0')}` });
    text.setText(`+${heal} HP`).setAlpha(1).setY(targetY);
    this.tweens.add({
      targets: text,
      y: targetY - 40,
      alpha: 0,
      duration: 1200,
      ease: 'Power2',
      onComplete: () => {
        text.setY(targetY);
        text.setStyle({ color: `#${COLORS.error.toString(16).padStart(6, '0')}` });
      },
    });

    this.tweens.add({
      targets: this.playerCard.hpText,
      scale: 1.15,
      duration: 120,
      yoyo: true,
      ease: 'Power2',
    });

    // Spawn heal particles centered on player card avatar (x + 50, y + 45)
    this._spawnHealParticles(10 + 50, HUD_CARD_Y + 45);
    this._spawnHealLabel(coords, heal);
  }

  _spawnHealParticles(x, y) {
    const particles = [];
    const count = 8;
    for (let i = 0; i < count; i++) {
      const particle = this.add.graphics().setDepth(12);
      particle.fillStyle(0x22c55e, 0.9);
      particle.fillCircle(0, 0, 4);
      particle.x = x;
      particle.y = y;
      particles.push(particle);

      const angle = Phaser.Math.FloatBetween(-Math.PI * 0.75, -Math.PI * 0.25);
      const distance = Phaser.Math.Between(40, 80);
      const targetX = x + Math.cos(angle) * distance;
      const targetY = y + Math.sin(angle) * distance;

      this.tweens.add({
        targets: particle,
        x: targetX,
        y: targetY,
        alpha: 0,
        scale: 0.7,
        duration: 700,
        ease: 'Expo.easeOut',
        onComplete: () => particle.destroy(),
      });
    }
  }

  _spawnHealParticlesFromCoords(coords) {
    coords.forEach((coord) => {
      const count = 5;
      for (let i = 0; i < count; i++) {
        const particle = this.add.graphics().setDepth(12);
        particle.fillStyle(HEALTH_BLOCK_COLOR, 0.9);
        particle.fillCircle(0, 0, 3);
        particle.x = coord.x;
        particle.y = coord.y;

        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const distance = Phaser.Math.Between(15, 40);
        const targetX = coord.x + Math.cos(angle) * distance;
        const targetY = coord.y + Math.sin(angle) * distance;

        this.tweens.add({
          targets: particle,
          x: targetX,
          y: targetY,
          alpha: 0,
          scale: 0.4,
          duration: 650,
          ease: 'Expo.easeOut',
          onComplete: () => particle.destroy(),
        });
      }
    });
  }

  _spawnHealLabel(coords, heal) {
    if (!coords || coords.length === 0) return;
    const center = coords.reduce(
      (acc, cur) => ({ x: acc.x + cur.x, y: acc.y + cur.y }),
      { x: 0, y: 0 },
    );
    center.x /= coords.length;
    center.y /= coords.length;

    const label = this.add
      .text(center.x, center.y, `+${heal} HP`, {
        fontSize: '36px',
        fontStyle: 'bold',
        color: `#${HEALTH_BLOCK_COLOR.toString(16).padStart(6, '0')}`,
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(21);

    this.tweens.add({
      targets: label,
      y: label.y - 40,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => label.destroy(),
    });
  }

  _resolveHealthClear(fullRows, fullCols) {
    const healed = new Set();
    fullRows.forEach((r) => {
      for (let c = 0; c < COLS; c++) {
        healed.add(`${r}:${c}`);
      }
    });
    fullCols.forEach((c) => {
      for (let r = 0; r < ROWS; r++) {
        healed.add(`${r}:${c}`);
      }
    });

    const visited = new Set();
    const extraClearCoords = [];
    const coords = [];
    let totalHeal = 0;

    const collectGroup = (startR, startC) => {
      const queue = [{ r: startR, c: startC }];
      visited.add(`${startR}:${startC}`);
      const group = [];

      while (queue.length > 0) {
        const { r, c } = queue.shift();
        group.push({ r, c });

        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => {
          const nr = r + dr;
          const nc = c + dc;
          const key = `${nr}:${nc}`;
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) return;
          if (visited.has(key)) return;
          const neighbor = this.grid[nr][nc];
          if (neighbor && neighbor.type === "health") {
            visited.add(key);
            queue.push({ r: nr, c: nc });
          }
        });
      }

      return group;
    };

    healed.forEach((coord) => {
      const [r, c] = coord.split(":").map(Number);
      const tile = this.grid[r][c];
      const key = `${r}:${c}`;
      if (tile && tile.type === "health" && !visited.has(key)) {
        const group = collectGroup(r, c);
        totalHeal += group.length * HEALTH_BLOCK_HEAL;
        group.forEach(({ r: gr, c: gc }) => {
          extraClearCoords.push({ r: gr, c: gc });
          coords.push({
            x: GRID_X + gc * (CELL + GAP) + CELL / 2,
            y: GRID_Y + gr * (CELL + GAP) + CELL / 2,
          });
        });
      }
    });

    return { totalHeal, coords, extraClearCoords };
  }

  // Check if no blocks can be placed on the grid
  _checkLoseCondition() {
    const canPlaceAny = this.trayPieces.some((piece) => {
      if (piece.used) return false;
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (canPlace(this.grid, piece.shape, r, c, ROWS, COLS)) {
            return true;
          }
        }
      }
      return false;
    });

    if (!canPlaceAny) {
      this._setMsg("Tidak ada langkah yang tersedia. Game Over!");
      this._endGame(false, "Tidak ada langkah tersedia.");
    }
  }

  // ── Pause Menu ─────────────────────────────────────────────────────────────

  _createSettingsButton() {
    const btnW = 120;
    const btnH = 120;
    const btnX = GAME_W - 85;
    const btnY = 100;

    const btnGfx = this.add.graphics().setDepth(15);
    btnGfx.fillStyle(COLORS.primary);
    btnGfx.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);

    const btnText = this.add
      .text(btnX, btnY, "⚙", { fontSize: "64px" })
      .setOrigin(0.5)
      .setDepth(15)
      .setInteractive({ useHandCursor: true });

    const hitArea = new Phaser.Geom.Rectangle(
      btnX - btnW / 2,
      btnY - btnH / 2,
      btnW,
      btnH,
    );
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

    btnText.on("pointerdown", () => this._togglePauseMenu());
    btnGfx.on("pointerdown", () => this._togglePauseMenu());

    this.settingsBtn = { gfx: btnGfx, text: btnText };
  }

  _togglePauseMenu() {
    if (this.gameOver || this.isClearing) return;

    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      this.enemyTimer.paused = true;
      this._drawPauseMenu();
    } else {
      this.enemyTimer.paused = false;
      this._closePauseMenu();
      this._setMsg("Melanjutkan permainan...");
    }
  }

  _closePauseMenu() {
    // Destroy all pause menu objects
    this.pauseMenuObjects.forEach((obj) => {
      if (obj && obj.destroy) obj.destroy();
    });
    this.pauseMenuObjects = [];
    this.pauseGfx.clear();
  }

  _toggleDebugMode() {
    this.debugMode = !this.debugMode;
    this._setMsg(
      this.debugMode
        ? "Debug mode diaktifkan. Pilih blok debug jika diperlukan."
        : "Debug mode dimatikan.",
    );
    this._drawPauseMenu();
  }

  _cycleDebugPiece() {
    if (this.debugSelectedIndex === null) {
      this.debugSelectedIndex = 0;
    } else {
      this.debugSelectedIndex = (this.debugSelectedIndex + 1) % PIECES.length;
    }
    const descriptor = this._getDebugPieceDescriptor();
    this._setMsg(`Debug blok terpilih: ${descriptor}`);
    this._drawPauseMenu();
  }

  _getDebugPieceDescriptor() {
    if (this.debugSelectedIndex === null) return "Belum ada blok";
    const shape = PIECES[this.debugSelectedIndex];
    const rows = shape.length;
    const cols = Math.max(...shape.map((row) => row.length));
    const count = shape.flat().filter(Boolean).length;
    return `${rows}x${cols} (${count} sel)`;
  }

  _getDebugPieceColor() {
    if (this.debugSelectedIndex === null) return BLOCK_COLORS[0];
    return BLOCK_COLORS[this.debugSelectedIndex % BLOCK_COLORS.length];
  }

  _drawPauseMenu() {
    // Clear previous pause menu objects
    this.pauseMenuObjects.forEach((obj) => {
      if (obj && obj.destroy) obj.destroy();
    });
    this.pauseMenuObjects = [];

    const g = this.pauseGfx;
    g.clear();

    // Semi-transparent overlay
    g.fillStyle(COLORS.overlay, 0.7);
    g.fillRect(0, 0, GAME_W, GAME_H);

    // Menu panel
    const panelW = 950;
    const panelH = 800;
    const panelX = GAME_W / 2 - panelW / 2;
    const panelY = GAME_H / 2 - panelH / 2;

    g.fillStyle(COLORS.surface);
    g.fillRoundedRect(panelX, panelY, panelW, panelH, 12);
    g.lineStyle(2, COLORS.primary);
    g.strokeRoundedRect(panelX, panelY, panelW, panelH, 12);

    // Title
    const title = createText(
      this,
      GAME_W / 2,
      panelY + 5,
      "⏸ PAUSED",
      {
        fontSize: "52px",
        color: COLORS.textAccent,
        fontStyle: "bold",
        depth: 31,
      }
    );
    this.pauseMenuObjects.push(title);

    const debugStatus = createText(
      this,
      GAME_W / 2,
      panelY + 55,
      this.debugMode
        ? `DEBUG: ON — ${this._getDebugPieceDescriptor()}`
        : "DEBUG: OFF",
      {
        fontSize: "24px",
        color: this.debugMode ? COLORS.warning : COLORS.textSecondary,
        depth: 31,
      }
    );
    this.pauseMenuObjects.push(debugStatus);

    // Menu buttons
    const btnY = panelY + 85;
    const btnW = panelW - 80;
    const btnH = 90;
    const btnGap = 120;

    let row = 0;
    this._createPauseMenuButton(
      GAME_W / 2,
      btnY + btnGap * row,
      btnW,
      btnH,
      "▶ Resume",
      COLORS.success,
      () => this._togglePauseMenu(),
    );
    row += 1;

    this._createPauseMenuButton(
      GAME_W / 2,
      btnY + btnGap * row,
      btnW,
      btnH,
      this.debugMode ? "🐞 Debug: ON" : "🐞 Debug: OFF",
      this.debugMode ? COLORS.warning : COLORS.secondary,
      () => this._toggleDebugMode(),
    );
    row += 1;

    if (this.debugMode) {
      this._createPauseMenuButton(
        GAME_W / 2,
        btnY + btnGap * row,
        btnW,
        btnH,
        "🎯 Pilih blok debug",
        COLORS.primary,
        () => this._cycleDebugPiece(),
      );
      row += 1;
    }

    this._createPauseMenuButton(
      GAME_W / 2,
      btnY + btnGap * row,
      btnW,
      btnH,
      "🔄 Restart",
      COLORS.warning,
      () => {
        this._closePauseMenu();
        this.scene.restart();
      },
    );
    row += 1;

    this._createPauseMenuButton(
      GAME_W / 2,
      btnY + btnGap * row,
      btnW,
      btnH,
      "🏠 Main Menu",
      COLORS.danger,
      () => {
        this._closePauseMenu();
        this.scene.start("MenuScene");
      },
    );
    row += 1;

    this._createPauseMenuButton(
      GAME_W / 2,
      btnY + btnGap * row,
      btnW,
      btnH,
      "❌ Quit",
      COLORS.secondary,
      () => {
        this._closePauseMenu();
        if (window.Capacitor?.isNativePlatform && window.Capacitor.isNativePlatform()) {
          CapacitorApp.exitApp();
        } else {
          this.game.destroy(true);
        }
      },
    );
  }

  _createPauseMenuButton(x, y, w, h, label, color, callback) {
    const btnGfx = this.add.graphics().setDepth(31);
    btnGfx.fillStyle(color);
    btnGfx.fillRoundedRect(x - w / 2, y - h / 2, w, h, 8);

    const btnText = this.add
      .text(x, y, label, {
        fontSize: "35px",
        fontStyle: "bold",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setDepth(32)
      .setInteractive({ useHandCursor: true });

    // Store references
    this.pauseMenuObjects.push(btnGfx);
    this.pauseMenuObjects.push(btnText);

    const hitArea = new Phaser.Geom.Rectangle(x - w / 2, y - h / 2, w, h);
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
}