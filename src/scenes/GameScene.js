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
  MAX_HP,
  ENEMY_ATTACK_MS,
  ENEMY_DMG_MIN,
  ENEMY_DMG_MAX,
} from "../config/constants.js";
import {
  randShape,
  randPieceColor,
  calcDamage,
  canPlace,
  findFullLines,
  clearLines,
} from "../utils/helpers.js";

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
  }

  update() {
    // Kalau sedang drag: gambar ghost piece di posisi jari
    if (this.dragging) {
      this._updateDragGhost();
    }
  }

  // ── Init ───────────────────────────────────────────────────────────────────

  _initState() {
    this.grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    this.playerHP = MAX_HP;
    this.enemyHP = MAX_HP;
    this.trayPieces = [];
    this.gameOver = false;
    this.isClearing = false;

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
  }

  _initTexts() {
    const y = HUD_CARD_Y;
    this.hudTexts = {
      playerName: this.add.text(50, y + 8, "You", {
        fontSize: "11px",
        color: "#aaaacc",
      }),
      playerHP: this.add.text(50, y + 22, `${MAX_HP} HP`, {
        fontSize: "13px",
        fontStyle: "bold",
        color: "#ffffff",
      }),
      enemyName: this.add.text(GAME_W / 2 + 48, y + 8, "Dust Bandit", {
        fontSize: "11px",
        color: "#aaaacc",
      }),
      enemyHP: this.add.text(GAME_W / 2 + 48, y + 22, `${MAX_HP} HP`, {
        fontSize: "13px",
        fontStyle: "bold",
        color: "#ffffff",
      }),
      playerAv: this.add
        .text(28, y + 20, "🧝", { fontSize: "16px" })
        .setOrigin(0.5),
      enemyAv: this.add
        .text(GAME_W / 2 + 28, y + 20, "👹", { fontSize: "16px" })
        .setOrigin(0.5),
      trayLabel: this.add
        .text(GAME_W / 2, TRAY_Y - 54, "Tahan & seret blok ke grid", {
          fontSize: "10px",
          color: "#555577",
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
          color: "#8888aa",
          wordWrap: { width: GAME_W - 20 },
          align: "center",
        },
      )
      .setOrigin(0.5, 1);

    this.comboText = this.add
      .text(GAME_W / 2, GRID_Y + (ROWS * (CELL + GAP)) / 2, "", {
        fontSize: "28px",
        fontStyle: "bold",
        color: "#fde047",
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
    this.enemyTimer = this.time.addEvent({
      delay: ENEMY_ATTACK_MS,
      callback: this._enemyAttack,
      callbackScope: this,
      loop: true,
    });
  }

  // ── Draw: Background ───────────────────────────────────────────────────────

  drawBackground() {
    const g = this.bgGfx;
    g.clear();
    g.fillStyle(0x0f0f1a);
    g.fillRect(0, 0, GAME_W, GAME_H);

    const gW = COLS * (CELL + GAP) + 10;
    const gH = ROWS * (CELL + GAP) + 10;
    g.fillStyle(0x1a1a2e);
    g.lineStyle(1, 0x2a2a4a);
    g.fillRoundedRect(GRID_X - 7, GRID_Y - 7, gW, gH, 8);
    g.strokeRoundedRect(GRID_X - 7, GRID_Y - 7, gW, gH, 8);

    g.fillStyle(0x1a1a2e);
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

    g.fillStyle(0x1a1a2e);
    g.lineStyle(1, 0x2a2a4a);
    g.fillRoundedRect(8, y, CARD_W, CARD_H, 8);
    g.strokeRoundedRect(8, y, CARD_W, CARD_H, 8);
    g.fillRoundedRect(GAME_W / 2 + 6, y, CARD_W, CARD_H, 8);
    g.strokeRoundedRect(GAME_W / 2 + 6, y, CARD_W, CARD_H, 8);

    g.fillStyle(0x1e3a5f);
    g.fillCircle(28, y + 20, 14);
    g.fillStyle(0x3a1e1e);
    g.fillCircle(GAME_W / 2 + 28, y + 20, 14);

    g.fillStyle(0x333355);
    g.fillRoundedRect(bx1, barY, barW, barH, 4);
    g.fillRoundedRect(bx2, barY, barW, barH, 4);

    const pPct = Math.max(0, this.playerHP / MAX_HP);
    g.fillStyle(pPct > 0.5 ? 0x4ade80 : pPct > 0.25 ? 0xf59e0b : 0xef4444);
    if (pPct > 0) g.fillRoundedRect(bx1, barY, barW * pPct, barH, 4);

    const ePct = Math.max(0, this.enemyHP / MAX_HP);
    g.fillStyle(0xf87171);
    if (ePct > 0) g.fillRoundedRect(bx2, barY, barW * ePct, barH, 4);

    this.hudTexts.playerHP.setText(`${Math.round(this.playerHP)} HP`);
    this.hudTexts.enemyHP.setText(`${Math.round(this.enemyHP)} HP`);
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
          g.fillStyle(0xffffff, 0.18);
          g.fillRoundedRect(x + 3, y + 3, CELL - 6, 5, 2);
        } else {
          g.fillStyle(0x252540);
          g.fillRoundedRect(x, y, CELL, CELL, 4);
          g.lineStyle(1, 0x2a2a4a);
          g.strokeRoundedRect(x, y, CELL, CELL, 4);
        }
      }
    }
  }

  // ── Draw: Tray ─────────────────────────────────────────────────────────────

  spawnTray() {
    this.trayPieces = [0, 1, 2].map(() => ({
      shape: randShape(),
      color: randPieceColor(), // ← satu warna solid per piece
      used: false,
    }));
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

    // Simpan snap position buat dipakai pas pointerup
    this.dragSnapR = onGrid ? snapR : null;
    this.dragSnapC = onGrid ? snapC : null;
    this.dragCanPlace = ok;
  }

  // ── Input ──────────────────────────────────────────────────────────────────

  _onPointerDown(ptr) {
    if (this.gameOver || this.isClearing || this.dragging) return;
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
      });
    }
  }

  _checkLines() {
    const { fullRows, fullCols } = findFullLines(this.grid, ROWS, COLS);
    const total = fullRows.length + fullCols.length;
    if (!total) return;
    this.isClearing = true;
    this._flashLines(fullRows, fullCols, () => {
      clearLines(this.grid, fullRows, fullCols);
      this.drawGrid();
      const dmg = calcDamage(total);
      this.enemyHP = Math.max(0, this.enemyHP - dmg);
      this.drawHUD();
      this._showCombo(total, dmg);
      this.isClearing = false;
      if (this.enemyHP <= 0) this._endGame(true);
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
  }

  _enemyAttack() {
    if (this.gameOver) return;
    const dmg =
      ENEMY_DMG_MIN +
      Math.floor(Math.random() * (ENEMY_DMG_MAX - ENEMY_DMG_MIN + 1));
    this.playerHP = Math.max(0, this.playerHP - dmg);
    this.drawHUD();
    this._setMsg(`Dust Bandit menyerang! -${dmg} HP!`);
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

    if (this.playerHP <= 0) this._endGame(false);
  }

  _endGame(won) {
    this.gameOver = true;
    this.enemyTimer.remove();

    const overlay = this.add.graphics().setDepth(20);
    overlay.fillStyle(0x000000, 0.72);
    overlay.fillRect(0, 0, GAME_W, GAME_H);

    this.add
      .text(
        GAME_W / 2,
        GAME_H / 2 - 50,
        won ? "Kamu Menang! 🎉" : "Game Over 💀",
        {
          fontSize: "30px",
          fontStyle: "bold",
          color: won ? "#4ade80" : "#f87171",
          stroke: "#000000",
          strokeThickness: 4,
        },
      )
      .setOrigin(0.5)
      .setDepth(21);

    this.add
      .text(
        GAME_W / 2,
        GAME_H / 2,
        won ? "Musuh dikalahkan!" : "Kamu gugur...",
        { fontSize: "15px", color: "#cccccc" },
      )
      .setOrigin(0.5)
      .setDepth(21);

    const btnGfx = this.add.graphics().setDepth(21);
    btnGfx.fillStyle(0x6366f1);
    btnGfx.fillRoundedRect(GAME_W / 2 - 75, GAME_H / 2 + 50, 150, 46, 10);

    this.add
      .text(GAME_W / 2, GAME_H / 2 + 73, "Main Lagi", {
        fontSize: "16px",
        fontStyle: "bold",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setDepth(22)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.scene.restart());
  }

  _setMsg(t) {
    if (this.msgText) this.msgText.setText(t);
  }
}
