import Phaser from "phaser";
import { CAMPAIGN_LEVELS } from "../config/campaign.js";

export class CampaignScene extends Phaser.Scene {

  constructor() {
    super("CampaignScene");
  }

  init(data) {
    this.level = data.level || 0;
  }

  create() {

    // Background sementara
    this.cameras.main.setBackgroundColor("#111827");

    // Text loading
    this.add.text(
      this.scale.width / 2,
      this.scale.height / 2,
      "Loading Campaign...",
      {
        fontSize: "28px",
        color: "#ffffff",
        fontStyle: "bold",
      }
    ).setOrigin(0.5);

    const levelData = CAMPAIGN_LEVELS[this.level];

    // Delay sedikit biar smooth
    this.time.delayedCall(500, () => {

      this.scene.start("GameScene", {
        mode: "campaign",
        level: this.level,
        levelData: levelData,
      });

    });

  }
}