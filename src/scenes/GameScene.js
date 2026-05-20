// ─── GameScene ────────────────────────────────────────────────────────────────
import Phaser from "phaser";
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
  DEFAULT_ENEMY_KEY,
} from "../config/entities.js";
import {
  randShape,
  randPieceColor,
  calcDamage,
  canPlace,
  findFullLines,
  clearLines,
} from "../utils/helpers.js";
import { COLORS, FONT_SIZES, createButton, createText, drawHealthBar } from "../utils/UIComponents.js";

// ── Layout ────────────────────────────────────────────────────────────────────
const TRAY_PANEL_X = GRID_X - 7;
const TRAY_PANEL_W = GAME_W - TRAY_PANEL_X * 2;
const SLOT_W = TRAY_PANEL_W / 3;
const SMALL = 13; // tray cell preview size
const SGAP = 2;
const CARD_W = (GAME_W - 30) / 2;
const CARD_H = 72;

// Saat drag: ukuran cell yang mengikuti jari
const DRAG_CELL = 28;
const DRAG_GAP = 2;

export class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
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
    this.enemyIndex = 0;
    this.enemy = this._createEnemy(this.enemyKeys[this.enemyIndex]);
    this.comboCount = 0;
    this.comboTimer = null;
    this.comboCooldown = 10000;
    this.comboCooldownStarted = 0;
    this.killCount = 0;
    this.debugMode = false;
    this.debugSelectedIndex = null;
    this.trayPieces = [];
    this.gameOver = false;
    this.isClearing = false;
    this.isPaused = false;
    this.pauseMenuObjects = [];

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
    this.hudTexts = {
      playerName: this.add.text(50, y + 8, this.player.name, {
        fontSize: "11px",
        color: `#${COLORS.textMuted.toString(16).padStart(6, '0')}`,
      }),
      playerHP: this.add.text(50, y + 22, `${this.player.currentHP} HP`, {
        fontSize: "13px",
        fontStyle: "bold",
        color: `#${COLORS.textPrimary.toString(16).padStart(6, '0')}`,
      }),
      playerDamage: this.add.text(50, y + 36, "", {
        fontSize: "10px",
        color: `#${COLORS.error.toString(16).padStart(6, '0')}`,
      }),
      enemyName: this.add.text(GAME_W / 2 + 48, y + 8, this.enemy.name, {
        fontSize: "11px",
        color: `#${COLORS.textMuted.toString(16).padStart(6, '0')}`,
      }),
      enemyHP: this.add.text(GAME_W / 2 + 48, y + 22, `${this.enemy.currentHP} HP`, {
        fontSize: "13px",
        fontStyle: "bold",
        color: `#${COLORS.textPrimary.toString(16).padStart(6, '0')}`,
      }),
      enemyDamage: this.add.text(GAME_W / 2 + 48, y + 36, "", {
        fontSize: "10px",
        color: `#${COLORS.error.toString(16).padStart(6, '0')}`,
      }),
      killCount: this.add.text(GAME_W / 2, 24, `Kills: ${this.killCount}`, {
        fontSize: "12px",
        color: `#${COLORS.textAccent.toString(16).padStart(6, '0')}`,
        fontStyle: "bold",
      }).setOrigin(0.5, 0.5),
      playerAv: this.add
        .text(28, y + 20, "🧝", { fontSize: "16px" })
        .setOrigin(0.5),
      enemyAv: this.add
        .text(GAME_W / 2 + 28, y + 20, "👹", { fontSize: "16px" })
        .setOrigin(0.5),
      comboCount: this.add
        .text(GAME_W / 2, TRAY_Y - 76, "", {
          fontSize: "11px",
          color: `#${COLORS.textAccent.toString(16).padStart(6, '0')}`,
          fontStyle: "bold",
        })
        .setOrigin(0.5, 0),
      trayLabel: this.add
        .text(GAME_W / 2, TRAY_Y - 54, "Tahan & seret blok ke grid", {
          fontSize: "10px",
          color: `#${COLORS.textMuted.toString(16).padStart(6, '0')}`,
        })
        .setOrigin(0.5, 0),
    };

    this.msgText = this.add
      .text(
        GAME_W / 2,
        GAME_H - 12,
        "Tahan blok dari bawah lalu seret ke grid.",
        {
          fontSize: "11px",
          color: `#${COLORS.textMuted.toString(16).padStart(6, '0')}`,
          wordWrap: { width: GAME_W - 20 },
          align: "center",
        },
      )
      .setOrigin(0.5, 1);

    this.comboText = this.add
      .text(GAME_W / 2, GRID_Y + (ROWS * (CELL + GAP)) / 2, "", {
        fontSize: "28px",
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

  _spawnNextEnemy() {
    this.enemyIndex = (this.enemyIndex + 1) % this.enemyKeys.length;
    this.enemy = this._createEnemy(this.enemyKeys[this.enemyIndex]);
    this._startEnemyTimer();
    this.hudTexts.enemyName.setText(this.enemy.name);
    this.drawHUD();
    this._setMsg(`Musuh berikutnya: ${this.enemy.name}!`);
  }

  _onEnemyDefeated() {
    this.killCount += 1;
    this.hudTexts.killCount.setText(`Kills: ${this.killCount}`);
    this._setMsg(`${this.enemy.name} kalah! Musuh baru datang...`);
    this.time.delayedCall(800, () => {
      this._spawnNextEnemy();
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
      this,
    );
    this.hudTexts.comboCount.setText(`Combo ${this.comboCount}`);
  }

  _resetCombo() {
    this.comboCount = 0;
    this.comboTimer = null;
    this.comboCooldownStarted = 0;
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
    g.fillRoundedRect(TRAY_PANEL_X, TRAY_Y - 58, TRAY_PANEL_W, 112, 8);
    g.strokeRoundedRect(TRAY_PANEL_X, TRAY_Y - 58, TRAY_PANEL_W, 112, 8);
  }

  // ── Draw: HUD ──────────────────────────────────────────────────────────────

  drawHUD() {
    const g = this.uiGfx;
    const y = HUD_CARD_Y;
    const barY = y + 42;
    const barH = 8;
    const barW = CARD_W - 54;
    const bx1 = 50;
    const bx2 = GAME_W / 2 + 48;
    g.clear();

    g.fillStyle(COLORS.surface);
    g.lineStyle(2, COLORS.primary);
    g.fillRoundedRect(8, y, CARD_W, CARD_H, 8);
    g.strokeRoundedRect(8, y, CARD_W, CARD_H, 8);
    g.lineStyle(2, COLORS.danger);
    g.fillRoundedRect(GAME_W / 2 + 6, y, CARD_W, CARD_H, 8);
    g.strokeRoundedRect(GAME_W / 2 + 6, y, CARD_W, CARD_H, 8);

    g.fillStyle(0x1e3a5f);
    g.fillCircle(28, y + 20, 14);
    g.fillStyle(0x3a1e1e);
    g.fillCircle(GAME_W / 2 + 28, y + 20, 14);

    drawHealthBar(g, bx1, barY, barW, barH, this.player.currentHP, this.player.maxHP);
    drawHealthBar(g, bx2, barY, barW, barH, this.enemy.currentHP, this.enemy.maxHP);

    if (this.comboTimer && this.comboCount > 0) {
      const cooldownWidth = 160;
      const cooldownHeight = 10;
      const cooldownX = GAME_W / 2 - cooldownWidth / 2;
      const cooldownY = TRAY_Y - 34;
      const elapsed = this.time.now - this.comboCooldownStarted;
      const remaining = Phaser.Math.Clamp(1 - elapsed / this.comboCooldown, 0, 1);

      g.fillStyle(0x1e2345);
      g.fillRoundedRect(cooldownX, cooldownY, cooldownWidth, cooldownHeight, 5);
      g.fillStyle(COLORS.textAccent);
      g.fillRoundedRect(cooldownX, cooldownY, cooldownWidth * remaining, cooldownHeight, 5);
      g.lineStyle(1, COLORS.surfaceBorder, 0.8);
      g.strokeRoundedRect(cooldownX, cooldownY, cooldownWidth, cooldownHeight, 5);
    }

    this.hudTexts.playerHP.setText(`${Math.round(this.player.currentHP)} HP`);
    this.hudTexts.enemyHP.setText(`${Math.round(this.enemy.currentHP)} HP`);
  }

  // ── Draw: Grid ─────────────────────────────────────────────────────────────

  drawGrid() {
    const g = this.gridGfx;
    g.clear();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = GRID_X + c * (CELL + GAP);
        const y = GRID_Y + r * (CELL + GAP);
        const col = this.grid[r][c];
        if (col !== null) {
          g.fillStyle(col);
          g.fillRoundedRect(x, y, CELL, CELL, 4);
          g.fillStyle(COLORS.cellHighlight, 0.18);
          g.fillRoundedRect(x + 3, y + 3, CELL - 6, 5, 2);
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
          used: false,
        };
      }
      return {
        shape: randShape(),
        color: randPieceColor(), // ← satu warna solid per piece
        used: false,
      };
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
      const sy = TRAY_Y - totalH / 2;

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

      // Draw highlight on blocks that will be destroyed
      fullRows.forEach((r) => {
        for (let c = 0; c < COLS; c++) {
          const gx = GRID_X + c * (CELL + GAP);
          const gy = GRID_Y + r * (CELL + GAP);
          g.fillStyle(0xff6b6b, 0.35); // Red highlight
          g.fillRoundedRect(gx, gy, CELL, CELL, 4);
          g.lineStyle(2, 0xff1744, 0.9); // Bright red border
          g.strokeRoundedRect(gx, gy, CELL, CELL, 4);
        }
      });
      fullCols.forEach((c) => {
        for (let r = 0; r < ROWS; r++) {
          const gx = GRID_X + c * (CELL + GAP);
          const gy = GRID_Y + r * (CELL + GAP);
          g.fillStyle(0xff6b6b, 0.35); // Red highlight
          g.fillRoundedRect(gx, gy, CELL, CELL, 4);
          g.lineStyle(2, 0xff1744, 0.9); // Bright red border
          g.strokeRoundedRect(gx, gy, CELL, CELL, 4);
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
        if (cell) this.grid[gr + dr][gc + dc] = p.color;
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
        this._checkLooseCondition();
      });
    }
  }

  _checkLines() {
    const { fullRows, fullCols } = findFullLines(this.grid, ROWS, COLS);
    const total = fullRows.length + fullCols.length;
    if (!total) {
      // Skip lose check if all pieces are used - will be checked after tray refill
      if (!this.trayPieces.every((t) => t.used)) {
        this._checkLooseCondition();
      }
      return;
    }
    this.isClearing = true;
    this._flashLines(fullRows, fullCols, () => {
      clearLines(this.grid, fullRows, fullCols);
      // satisfying visual + tactile feedback for clears
      this._playSatisfyingEffect(fullRows, fullCols);
      this.drawGrid();
      const dmg = calcDamage(total);
      this.enemy.currentHP = Math.max(0, this.enemy.currentHP - dmg);
      this.drawHUD();
      this.showDamage('enemy', dmg);
      this._recordCombo(total);
      this._showCombo(total, dmg);
      this.isClearing = false;
      if (this.enemy.currentHP <= 0) this._onEnemyDefeated();
      else if (!this.trayPieces.every((t) => t.used)) {
        // Only check lose if not all pieces are used
        this._checkLooseCondition();
      }
    });
  }

  _flashLines(fullRows, fullCols, onDone) {
    const flashGfx = this.add.graphics().setDepth(5);
    let tick = 0;
    const ev = this.time.addEvent({
      delay: 80,
      repeat: 5,
      callback: () => {
        flashGfx.clear();
        if (tick % 2 === 0) {
          flashGfx.fillStyle(0xffffff, 0.65);
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
  _playSatisfyingEffect(fullRows, fullCols) {
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

    // unique centers
    const uniq = [];
    const seen = new Set();
    centers.forEach((p) => {
      const k = `${Math.round(p.x)}:${Math.round(p.y)}`;
      if (!seen.has(k)) {
        seen.add(k);
        uniq.push(p);
      }
    });

    // particle burst
    uniq.forEach((pos) => {
      const pieces = 6;
      for (let i = 0; i < pieces; i++) {
        const g = this.add.graphics().setDepth(18);
        g.fillStyle(0xffffff, 1);
        g.fillCircle(0, 0, 3);
        g.x = pos.x;
        g.y = pos.y;

        const angle = (Math.PI * 2 * i) / pieces + (Math.random() - 0.5) * 0.6;
        const dist = 14 + Math.random() * 22;
        const tx = pos.x + Math.cos(angle) * dist;
        const ty = pos.y + Math.sin(angle) * dist;

        this.tweens.add({
          targets: g,
          x: tx,
          y: ty,
          alpha: 0,
          scale: 0.5,
          duration: 400 + Math.random() * 260,
          ease: 'Cubic.easeOut',
          onComplete: () => g.destroy(),
        });
      }
    });

    // subtle full-screen flash
    const flash = this.add.graphics().setDepth(19);
    flash.fillStyle(0xffffff, 0.08);
    flash.fillRect(0, 0, GAME_W, GAME_H);
    this.tweens.add({ targets: flash, alpha: 0, duration: 260, ease: 'Linear', onComplete: () => flash.destroy() });

    // camera shake scaled by cleared count
    const intensity = Math.min(0.02, 0.006 * uniq.length);
    this.cameras.main.shake(260, intensity);
  }

  _showCombo(total, dmg) {
    const label = total > 1 ? `${total}x COMBO!\n-${dmg} DMG` : `-${dmg} DMG`;
    this.comboText
      .setText(label)
      .setAlpha(1)
      .setScale(total > 1 ? 1.2 : 0.9);
    this.comboText.setY(GRID_Y + (ROWS * (CELL + GAP)) / 2);
    this.tweens.add({
      targets: this.comboText,
      alpha: 0,
      y: this.comboText.y - 40,
      duration: 950,
      ease: "Power2",
    });
    this._setMsg(
      total > 1
        ? `${total} baris sekaligus! Combo damage ${dmg}!`
        : `Baris dihancurkan! Damage ${dmg} ke musuh.`,
    );
    this.hudTexts.comboCount.setText(this.comboCount ? `Combo ${this.comboCount}` : "");
  }

  _enemyAttack() {
    if (this.gameOver) return;
    const dmg =
      this.enemy.damageMin +
      Math.floor(
        Math.random() * (this.enemy.damageMax - this.enemy.damageMin + 1),
      );
    this.player.currentHP = Math.max(0, this.player.currentHP - dmg);
    this.drawHUD();
    this.showDamage('player', dmg);
    this.cameras.main.shake(130, 0.008);

    const flash = this.add.graphics().setDepth(8);
    flash.fillStyle(0xff0000, 0.28);
    flash.fillRoundedRect(8, HUD_CARD_Y, CARD_W, CARD_H, 8);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 400,
      onComplete: () => flash.destroy(),
    });

    if (this.player.currentHP <= 0) this._endGame(false, "HP habis!");
  }

  _endGame(won, reason = "") {
    this.gameOver = true;
    this.enemyTimer.remove();

    const overlay = this.add.graphics().setDepth(20);
    overlay.fillStyle(COLORS.overlay, 0.72);
    overlay.fillRect(0, 0, GAME_W, GAME_H);

    this.add
      .text(
        GAME_W / 2,
        GAME_H / 2 - 60,
        won ? "Kamu Menang! 🎉" : "Game Over 💀",
        {
          fontSize: "30px",
          fontStyle: "bold",
          color: won ? `#${COLORS.success.toString(16).padStart(6, '0')}` : `#${COLORS.error.toString(16).padStart(6, '0')}`,
          stroke: "#000000",
          strokeThickness: 4,
        },
      )
      .setOrigin(0.5)
      .setDepth(21);

    this.add
      .text(
        GAME_W / 2,
        GAME_H / 2 - 20,
        won ? "Musuh dikalahkan!" : "Kamu gugur...",
        { fontSize: "15px", color: `#${COLORS.textSecondary.toString(16).padStart(6, '0')}` },
      )
      .setOrigin(0.5)
      .setDepth(21);

    if (reason) {
      this.add
        .text(
          GAME_W / 2,
          GAME_H / 2 + 15,
          reason,
          { fontSize: "12px", color: `#${COLORS.textMuted.toString(16).padStart(6, '0')}`, fontStyle: "italic" },
        )
        .setOrigin(0.5)
        .setDepth(21);
    }

    const { gfx: btnGfx } = createButton(
      this,
      GAME_W / 2,
      GAME_H / 2 + 83,
      150,
      46,
      "🔄 Lagi",
      COLORS.primary,
      () => this.scene.restart(),
      { depth: 22, fontSize: FONT_SIZES.body }
    );
  }

  _setMsg(t) {
    if (this.msgText) this.msgText.setText(t);
  }

  showDamage(target, dmg) {
    const text = target === 'player' ? this.hudTexts.playerDamage : this.hudTexts.enemyDamage;
    text.setText(`-${dmg} HP`).setAlpha(1);
    this.tweens.add({
      targets: text,
      alpha: 0,
      duration: 1200,
      ease: 'Power2',
    });
  }

  // Check if no blocks can be placed on the grid
  _checkLooseCondition() {
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
    const btnW = 50;
    const btnH = 50;
    const btnX = GAME_W - 35;
    const btnY = 35;

    const btnGfx = this.add.graphics().setDepth(15);
    btnGfx.fillStyle(COLORS.primary);
    btnGfx.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);

    const btnText = this.add
      .text(btnX, btnY, "⚙", { fontSize: "24px" })
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
    const panelW = 280;
    const panelH = this.debugMode ? 360 : 300;
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
      panelY + 25,
      "⏸ PAUSED",
      {
        fontSize: FONT_SIZES.subheading,
        color: COLORS.textAccent,
        fontStyle: 'bold',
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
        fontSize: FONT_SIZES.caption,
        color: this.debugMode ? COLORS.warning : COLORS.textSecondary,
        depth: 31,
      }
    );
    this.pauseMenuObjects.push(debugStatus);

    // Menu buttons
    const btnY = panelY + 85;
    const btnW = 240;
    const btnH = 40;
    const btnGap = 50;

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
        this.game.destroy(true);
      },
    );
  }

  _createPauseMenuButton(x, y, w, h, label, color, callback) {
    const btnGfx = this.add.graphics().setDepth(31);
    btnGfx.fillStyle(color);
    btnGfx.fillRoundedRect(x - w / 2, y - h / 2, w, h, 8);

    const btnText = this.add
      .text(x, y, label, {
        fontSize: FONT_SIZES.caption,
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
