// ─── CampaignScene ─────────────────────────────────────────────────────────────
import Phaser from "phaser";
import { CAMPAIGN_LEVELS } from "../config/campaign.js";
import { GAME_W, GAME_H } from "../config/constants.js";
import { COLORS, createButton, createPanel, createText } from "../ui/UIComponents.js";
import { ENEMIES } from "../config/entities.js";

export class CampaignScene extends Phaser.Scene {
  constructor() {
    super("CampaignScene");
  }

  create() {
    this._drawBackground();
    this._drawTitle();
    this._drawLevelList();
    this._drawBackButton();
  }

  _drawBackground() {
    const bg = this.add.graphics().setDepth(0);
    bg.fillStyle(COLORS.bg);
    bg.fillRect(0, 0, GAME_W, GAME_H);

    // Decorative shapes (emerald green for campaign theme)
    bg.fillStyle(0x10b981, 0.05);
    bg.fillCircle(GAME_W * 0.15, GAME_H * 0.2, 90);
    bg.fillCircle(GAME_W * 0.85, GAME_H * 0.85, 120);
  }

  _drawTitle() {
    createText(this, GAME_W / 2, 120, "🗺️ CAMPAIGN MAP", {
      fontSize: "60px",
      color: COLORS.textAccent,
      fontStyle: "bold",
      depth: 5,
    });

    createText(this, GAME_W / 2, 190, "Kalahkan monster untuk membuka wilayah baru", {
      fontSize: "24px",
      color: COLORS.textMuted,
      depth: 5,
    });
  }

  _drawLevelList() {
    const savedProgress = localStorage.getItem("knightblock_campaign_progress");
    const unlockedLevel = savedProgress ? parseInt(savedProgress) : 1;

    const startY = 320;
    const cardW = 920;
    const cardH = 190;
    const cardGap = 230;

    CAMPAIGN_LEVELS.forEach((lvl, index) => {
      const y = startY + index * cardGap;
      const isUnlocked = lvl.level <= unlockedLevel;
      const isCompleted = lvl.level < unlockedLevel;
      const isActive = lvl.level === unlockedLevel;

      // Card panel styling
      let borderColor = COLORS.surfaceBorder;
      let borderWidth = 2;

      if (isActive) {
        borderColor = COLORS.success; // Highlight active level
        borderWidth = 4;
      } else if (isCompleted) {
        borderColor = COLORS.primary; // Completed levels have primary blue borders
      }

      createPanel(this, GAME_W / 2, y, cardW, cardH, {
        color: COLORS.surface,
        borderColor: borderColor,
        borderWidth: borderWidth,
        radius: 16,
        depth: 5,
      });

      // Left column text: Level number & Title
      const lvlTextVal = `LEVEL ${lvl.level}`;
      const lvlTextObj = createText(this, 120, y - 40, lvlTextVal, {
        fontSize: "26px",
        color: isActive ? COLORS.textAccent : (isCompleted ? COLORS.textSecondary : COLORS.textMuted),
        fontStyle: "bold",
        depth: 6,
        origin: 0,
      });

      const titleTextObj = createText(this, 120, y + 10, lvl.title, {
        fontSize: "36px",
        color: isUnlocked ? COLORS.textPrimary : COLORS.textMuted,
        fontStyle: "bold",
        depth: 6,
        origin: 0,
      });

      // Right column text: Enemy name & Avatar
      const enemyData = ENEMIES[lvl.enemy];
      const enemyName = enemyData ? enemyData.name : lvl.enemy;

      // Enemy Avatar mapping
      const enemyIcons = {
        Goblin: "👹",
        GoblinBoss: "👑",
        Undead: "💀",
        Werewolf: "🐺",
        DuskSkeleton: "☠️",
      };
      const avatar = enemyIcons[lvl.enemy] || "👾";

      const enemyText = isUnlocked ? `${avatar} ${enemyName}` : "🔒 Terkunci";
      const enemyTextObj = createText(this, GAME_W - 120, y, enemyText, {
        fontSize: "32px",
        color: isUnlocked ? COLORS.textPrimary : COLORS.textMuted,
        fontStyle: "bold",
        depth: 6,
        origin: 1,
      });

      // Status badges
      let badgeText = "";
      let badgeColor = COLORS.textSecondary;

      if (isCompleted) {
        badgeText = "✅ SELESAI";
        badgeColor = COLORS.primary;
      } else if (isActive) {
        badgeText = "🔥 AKTIF";
        badgeColor = COLORS.success;
      }

      let badgeTextObj = null;
      if (badgeText) {
        badgeTextObj = createText(this, 120, y + 55, badgeText, {
          fontSize: "18px",
          color: badgeColor,
          fontStyle: "bold",
          depth: 6,
          origin: 0,
        });
      }

      // Interaction for unlocked levels
      if (isUnlocked) {
        const clickZone = this.add.zone(GAME_W / 2, y, cardW, cardH)
          .setInteractive({ useHandCursor: true })
          .setDepth(10);

        clickZone.on("pointerdown", () => {
          this.scene.start("GameScene", {
            mode: "campaign",
            level: lvl.level - 1, // 0-indexed in code
            levelData: lvl,
          });
        });

        // Simple hover animation
        clickZone.on("pointerover", () => {
          lvlTextObj.setScale(1.05);
          titleTextObj.setScale(1.05);
          enemyTextObj.setScale(1.05);
          if (badgeTextObj) badgeTextObj.setScale(1.05);
        });

        clickZone.on("pointerout", () => {
          lvlTextObj.setScale(1);
          titleTextObj.setScale(1);
          enemyTextObj.setScale(1);
          if (badgeTextObj) badgeTextObj.setScale(1);
        });
      }
    });
  }

  _drawBackButton() {
    createButton(
      this,
      GAME_W / 2,
      GAME_H - 150,
      360,
      80,
      "← Kembali",
      COLORS.primary,
      () => this.scene.start("MenuScene"),
      {
        depth: 5,
        fontSize: "32px",
      }
    );
  }
}