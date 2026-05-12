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
} from "../config/constants.js";
import {
  ENEMY_TEMPLATES,
  DEFAULT_WAVE_IDS,
  createRandomWaves,
} from "../config/enemies.js";
import {
  POWERUP_TEMPLATES,
  randPowerupId,
  POWERUP_SPAWN_DELAY_MS,
} from "../config/powerups.js";
import {
  randShape,
  randPieceColor,
  calcDamage,
  canPlace,
  findFullLines,
  clearLines,
  randFrom,
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
    this._spawnNextEnemy();
    this.drawBackground();
    this.drawHUD();
    this.drawGrid();
    this.spawnTray();
    this.drawTray();
    this._schedulePowerupSpawn();
    this._updatePowerupUI();
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
    this.waveIndex = 0;
    this.useRandomWaves = window.location.search.includes("random");
    this.waves = this.useRandomWaves ? createRandomWaves() : DEFAULT_WAVE_IDS;
    this.activeEnemy = null;
    this.powerupInventory = {};
    this.activePowerups = {
      ward: false,
      ironWill: false,
      freeze: false,
      clarity: false,
    };
    this.bonusEffects = {
      comboSurge: 0,
      soulBurst: false,
      bloodPact: false,
    };
    this.clarityHint = null;

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
    this.powerupLabelGroup = this.add.group();
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
        fontStyle: "bold",a
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
    this.enemyTimer = null;
  }

  _startEnemyTimer(delay) {
    if (this.enemyTimer) this.enemyTimer.remove();
    this.enemyTimer = this.time.addEvent({
      delay,
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

    const ePct = this.activeEnemy ? Math.max(0, this.enemyHP / this.activeEnemy.hp) : 0;
    g.fillStyle(0xf87171);
    if (ePct > 0) g.fillRoundedRect(bx2, barY, barW * ePct, barH, 4);

    this.hudTexts.playerHP.setText(`${Math.round(this.playerHP)} HP`);
    this.hudTexts.enemyHP.setText(`${Math.round(this.enemyHP)} HP`);
  }

  // ── Draw: Grid ─────────────────────────────────────────────────────────────

  drawGrid() {
    this.powerupLabelGroup.clear(true, true);
    const g = this.gridGfx;
    g.clear();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = GRID_X + c * (CELL + GAP);
        const y = GRID_Y + r * (CELL + GAP);
        const cell = this.grid[r][c];
        const col = cell?.color ?? cell;
        if (col !== null) {
          g.fillStyle(col);
          g.fillRoundedRect(x, y, CELL, CELL, 4);
          if (cell?.corrupted) {
            g.lineStyle(2, 0xef4444);
            g.strokeRoundedRect(x + 2, y + 2, CELL - 4, CELL - 4, 4);
          } else {
            g.fillStyle(0xffffff, 0.18);
            g.fillRoundedRect(x + 3, y + 3, CELL - 6, 5, 2);
          }
        } else {
          g.fillStyle(0x252540);
          g.fillRoundedRect(x, y, CELL, CELL, 4);
          g.lineStyle(1, 0x2a2a4a);
          g.strokeRoundedRect(x, y, CELL, CELL, 4);
        }

        if (cell?.powerup) {
          const icon = POWERUP_TEMPLATES[cell.powerup]?.icon || "*";
          this.powerupLabelGroup.add(
            this.add
              .text(x + CELL / 2, y + CELL / 2, icon, {
                fontSize: "16px",
                color: "#ffffff",
              })
              .setOrigin(0.5)
              .setDepth(10),
          );
        }
      }
    }

    if (this.clarityHint) {
      const x = GRID_X + this.clarityHint.c * (CELL + GAP);
      const y = GRID_Y + this.clarityHint.r * (CELL + GAP);
      g.lineStyle(2, 0x60a5fa, 0.9);
      g.strokeRoundedRect(x + 2, y + 2, CELL - 4, CELL - 4, 4);
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

    const linePowerups = this._collectPowerupsFromLines(fullRows, fullCols);
    this.isClearing = true;
    this._flashLines(fullRows, fullCols, () => {
      this._resolveLinePowerups(linePowerups);
      clearLines(this.grid, fullRows, fullCols);
      this.drawGrid();

      let damageCombo = total + this.bonusEffects.comboSurge;
      const baseDmg = calcDamage(damageCombo);
      let dmg = baseDmg;

      if (this.bonusEffects.soulBurst) {
        dmg *= 2;
        this._setMsg("Soul Burst! Combo hits all enemies.");
        this.bonusEffects.soulBurst = false;
      }

      if (this.bonusEffects.bloodPact) {
        dmg *= 2;
        this.playerHP = Math.max(0, this.playerHP - 5);
        this._setMsg("Blood Pact aktif! Damage ganda, -5 HP.");
        this.bonusEffects.bloodPact = false;
      }

      this.bonusEffects.comboSurge = 0;
      this.enemyHP = Math.max(0, this.enemyHP - dmg);
      this.drawHUD();
      this._showCombo(total, dmg);
      this.isClearing = false;
      if (this.enemyHP <= 0) this._onEnemyDefeated();
    });
  }

  _collectPowerupsFromLines(fullRows, fullCols) {
    const ids = new Set();
    for (const r of fullRows) {
      for (let c = 0; c < COLS; c++) {
        const cell = this.grid[r][c];
        if (cell?.powerup) ids.add(cell.powerup);
      }
    }
    for (const c of fullCols) {
      for (let r = 0; r < ROWS; r++) {
        const cell = this.grid[r][c];
        if (cell?.powerup) ids.add(cell.powerup);
      }
    }
    return Array.from(ids);
  }

  _resolveLinePowerups(ids) {
    ids.forEach((id) => {
      const template = POWERUP_TEMPLATES[id];
      if (!template) return;

      if (template.trigger === "nextCombo") {
        if (id === "comboSurge") this.bonusEffects.comboSurge += 1;
        if (id === "soulBurst") this.bonusEffects.soulBurst = true;
      } else if (template.trigger === "onPickup") {
        this._activatePowerup(id);
      } else if (template.trigger === "onMatch") {
        this._activatePowerup(id);
      } else if (template.trigger === "onEnemyAttack" || template.trigger === "manual" || template.trigger === "onLowHP") {
        this._storePowerup(id);
      }
    });
  }

  _activatePowerup(id) {
    const template = POWERUP_TEMPLATES[id];
    if (!template) return;

    switch (id) {
      case "healShard":
        this.playerHP = Math.min(MAX_HP, this.playerHP + template.amount);
        this.drawHUD();
        this._setMsg(`Heal Shard aktif! +${template.amount} HP.`);
        break;
      case "freeze":
        if (this.enemyTimer && !this.activePowerups.freeze) {
          this.enemyTimer.paused = true;
          this.activePowerups.freeze = true;
          this._setMsg("Freeze! Serangan musuh berhenti selama 8 detik.");
          this.time.delayedCall(template.duration, () => {
            if (this.enemyTimer) this.enemyTimer.paused = false;
            this.activePowerups.freeze = false;
            this._setMsg("Enemy attack resumes.");
          });
        }
        break;
      case "clarity":
        this.clarityHint = this._findClarityHint();
        this.activePowerups.clarity = true;
        this._setMsg("Clarity siap — petunjuk ditempatkan pada grid.");
        break;
      case "darkVeil":
        this._clearCorruptedBlocks();
        this._setMsg("Dark Veil aktif — semua korupsi dibersihkan.");
        break;
      case "plagueToken":
        this._applyPlagueToken();
        break;
      case "comboSurge":
        this.bonusEffects.comboSurge += 1;
        this._setMsg("Combo Surge aktif pada kombo ini.");
        break;
      case "soulBurst":
        this.bonusEffects.soulBurst = true;
        this._setMsg("Soul Burst siap pada kombo ini.");
        break;
      case "ironWill":
      case "ward":
      case "ignite":
      case "bloodPact":
        this._storePowerup(id);
        break;
      default:
        break;
    }
  }

  _storePowerup(id) {
    this.powerupInventory[id] = (this.powerupInventory[id] || 0) + 1;
    this._setMsg(`${POWERUP_TEMPLATES[id].name} ditambahkan ke koleksi.`);
    this._updatePowerupUI();
  }

  _useStoredPowerup(id) {
    if (!this.powerupInventory[id]) return;
    this.powerupInventory[id] -= 1;
    this._updatePowerupUI();

    switch (id) {
      case "ignite":
        this._useIgnite();
        break;
      case "bloodPact":
        this.bonusEffects.bloodPact = true;
        this._setMsg("Blood Pact aktif: kombo berikutnya damage ganda.");
        break;
      case "ward":
        this.activePowerups.ward = true;
        this._setMsg("Ward siap: serangan musuh berikutnya akan diblokir.");
        break;
      case "ironWill":
        if (this.playerHP / MAX_HP <= 0.25) {
          this.activePowerups.ironWill = true;
          this._setMsg("Iron Will aktif: incoming damage berkurang 50%.");
        } else {
          this._setMsg("Iron Will akan aktif saat HP di bawah 25%.");
        }
        break;
      default:
        this._setMsg(`${POWERUP_TEMPLATES[id].name} digunakan.`);
        break;
    }
  }

  _useIgnite() {
    const counts = new Map();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = this.grid[r][c];
        if (cell === null) continue;
        const color = cell?.color ?? cell;
        counts.set(color, (counts.get(color) || 0) + 1);
      }
    }
    if (!counts.size) {
      this._setMsg("Ignite gagal: tidak ada blok untuk dibersihkan.");
      return;
    }

    let bestColor = null;
    let bestCount = 0;
    counts.forEach((count, color) => {
      if (count > bestCount) {
        bestCount = count;
        bestColor = color;
      }
    });

    let cleared = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = this.grid[r][c];
        const color = cell?.color ?? cell;
        if (color === bestColor) {
          this.grid[r][c] = null;
          cleared += 1;
        }
      }
    }
    this.drawGrid();
    this._setMsg(`Ignite membersihkan ${cleared} blok warna terbanyak.`);
  }

  _schedulePowerupSpawn() {
    if (this.powerupTextObjects.length) {
      this.powerupTextObjects.forEach((text) => text.destroy());
      this.powerupTextObjects = [];
    }

    const inventoryIds = Object.keys(this.powerupInventory).filter(
      (id) => this.powerupInventory[id] > 0,
    );

    if (inventoryIds.length === 0) {
      this.powerupInfo.setText("Powerups: none");
      return;
    }

    this.powerupInfo.setText("Powerups: tap untuk gunakan");

    let x = 10;
    inventoryIds.forEach((id) => {
      const count = this.powerupInventory[id];
      const text = this.add
        .text(x, GAME_H - 24, `${POWERUP_TEMPLATES[id].icon} ${count}`, {
          fontSize: "12px",
          color: "#ffffff",
          backgroundColor: "#1f2937",
          padding: { x: 6, y: 4 },
        })
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", () => this._useStoredPowerup(id));
      this.powerupTextObjects.push(text);
      x += text.width + 8;
    });
  }

  _schedulePowerupSpawn() {
    const delay = Phaser.Math.Between(
      POWERUP_SPAWN_DELAY_MS.min,
      POWERUP_SPAWN_DELAY_MS.max,
    );
    this.time.delayedCall(delay, () => {
      this._spawnRandomPowerupBlock();
      this._schedulePowerupSpawn();
    });
  }

  _updatePowerupUI() {
    // UI displayed on grid blocks only
  }

  _spawnRandomPowerupBlock() {
    const emptyCells = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this.grid[r][c] === null) emptyCells.push({ r, c });
      }
    }
    if (!emptyCells.length) return;

    const position = randFrom(emptyCells);
    const powerupId = randPowerupId();
    this.grid[position.r][position.c] = {
      color: randPieceColor(),
      powerup: powerupId,
    };
    this.drawGrid();
    this._setMsg(`${POWERUP_TEMPLATES[powerupId].name} block muncul di papan!`);
  }

  _findClarityHint() {
    let best = null;
    let bestScore = -1;

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this.grid[r][c] !== null) continue;
        let score = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
              if (this.grid[nr][nc] !== null) score += 1;
            }
          }
        }
        if (score > bestScore) {
          bestScore = score;
          best = { r, c };
        }
      }
    }
    return best;
  }

  _applyPlagueToken() {
    this.playerHP = Math.max(0, this.playerHP - POWERUP_TEMPLATES.plagueToken.amount);
    this.drawHUD();
    const corrupted = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = this.grid[r][c];
        if (cell !== null && !cell?.corrupted) corrupted.push({ r, c });
      }
    }
    if (corrupted.length) {
      for (let i = 0; i < 3 && corrupted.length; i++) {
        const idx = Math.floor(Math.random() * corrupted.length);
        const pos = corrupted.splice(idx, 1)[0];
        const cell = this.grid[pos.r][pos.c];
        if (typeof cell === "object") {
          cell.corrupted = true;
        } else {
          this.grid[pos.r][pos.c] = { color: cell, corrupted: true };
        }
      }
      this.drawGrid();
    }
    this._setMsg("Plague Token: 3 blok terkorupsi, -5 HP.");
  }

  _clearCorruptedBlocks() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = this.grid[r][c];
        if (cell?.corrupted) {
          this.grid[r][c] = { color: cell.color, powerup: cell.powerup };
        }
      }
    }
    this.drawGrid();
  }

  _spawnNextEnemy() {
    if (this.waveIndex >= this.waves.length) {
      this._endGame(true);
      return;
    }

    const nextId = this.waves[this.waveIndex];
    const template = ENEMY_TEMPLATES[nextId] || ENEMY_TEMPLATES.goblin;
    this.activeEnemy = { ...template };
    this.enemyHP = template.hp;
    this.hudTexts.enemyName.setText(
      `${template.name} (Wave ${this.waveIndex + 1}/${this.waves.length})`,
    );
    this.hudTexts.enemyAv.setText(template.icon);
    this.drawHUD();
    this._setMsg(
      `Wave ${this.waveIndex + 1}: ${template.name} muncul! ${template.boardEffect}`,
    );
    this._startEnemyTimer(template.attackInterval);
  }

  _onEnemyDefeated() {
    if (this.gameOver || !this.activeEnemy) return;

    const defeated = this.activeEnemy;
    if (this.enemyTimer) this.enemyTimer.remove();
    this._setMsg(`${defeated.name} dikalahkan! ${defeated.onDefeat}`);
    this.activeEnemy = null;
    this.waveIndex += 1;

    this.time.delayedCall(900, () => {
      if (this.waveIndex >= this.waves.length) {
        this._endGame(true);
      } else {
        this._spawnNextEnemy();
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
    if (this.gameOver || !this.activeEnemy) return;

    if (this.activePowerups.ward) {
      this.activePowerups.ward = false;
      this._setMsg(`${this.activeEnemy.name}'s attack diblokir oleh Ward!`);
      this._updatePowerupUI();
      return;
    }

    let dmg = this.activeEnemy.dmg;

    if (
      this.powerupInventory.ward > 0 &&
      !this.activePowerups.ward
    ) {
      this.powerupInventory.ward -= 1;
      this.activePowerups.ward = true;
      this._updatePowerupUI();
      this._setMsg("Ward siap pada serangan berikutnya.");
      return;
    }

    if (
      this.powerupInventory.ironWill > 0 &&
      this.playerHP / MAX_HP <= 0.25 &&
      !this.activePowerups.ironWill
    ) {
      this.powerupInventory.ironWill -= 1;
      this.activePowerups.ironWill = true;
      this._updatePowerupUI();
      this._setMsg("Iron Will aktif: incoming damage berkurang 50%.");
    }

    if (this.activePowerups.ironWill) {
      dmg = Math.ceil(dmg * 0.5);
    }

    this.playerHP = Math.max(0, this.playerHP - dmg);
    this.drawHUD();
    this._setMsg(`${this.activeEnemy.name} menyerang! -${dmg} HP!`);
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
