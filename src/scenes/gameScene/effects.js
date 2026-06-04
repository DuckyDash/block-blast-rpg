import { COLORS, FONT_SIZES, createText, createButton } from "../../ui/index.js";
import { GAME_W, GAME_H, COLS, ROWS, CELL, GAP, GRID_X, GRID_Y } from "./constants.js";

export function setMsg(scene, text) {
  if (scene.msgText) scene.msgText.setText(text);
}

export function showDamage(scene, target, dmg) {
  const text = target === "player" ? scene.hudTexts.playerDamage : scene.hudTexts.enemyDamage;
  text.setText(`-${dmg} HP`).setAlpha(1);
  scene.tweens.add({
    targets: text,
    alpha: 0,
    duration: 1200,
    ease: "Power2",
  });
}

export function enemyAttack(scene) {
  if (scene.gameOver) return;
  let dmg =
    scene.enemy.damageMin +
    Math.floor(Math.random() * (scene.enemy.damageMax - scene.enemy.damageMin + 1));

  scene.player.currentHP = Math.max(0, scene.player.currentHP - dmg);
  scene.drawHUD();
  showDamage(scene, "player", dmg);
  scene.cameras.main.shake(130, 0.008);

  const flash = scene.add.graphics().setDepth(8);
  flash.fillStyle(0xff0000, 0.28);
  flash.fillRoundedRect(8, 60, 150, 82, 8);
  scene.tweens.add({
    targets: flash,
    alpha: 0,
    duration: 400,
    onComplete: () => flash.destroy(),
  });

  if (scene.player.currentHP <= 0) scene._endGame(false, "HP habis!");
}

export function endGame(scene, won, reason = "") {
  scene.gameOver = true;
  if (scene.enemyTimer) scene.enemyTimer.remove();

  const overlay = scene.add.graphics().setDepth(20);
  overlay.fillStyle(COLORS.overlay, 0.72);
  overlay.fillRect(0, 0, GAME_W, GAME_H);

  scene.add
    .text(
      GAME_W / 2,
      GAME_H / 2 - 60,
      won ? "Kamu Menang! 🎉" : "Game Over 💀",
      {
        fontSize: "30px",
        fontStyle: "bold",
        color: won ? `#${COLORS.success.toString(16).padStart(6, "0")}` : `#${COLORS.error.toString(16).padStart(6, "0")}`,
        stroke: "#000000",
        strokeThickness: 4,
      },
    )
    .setOrigin(0.5)
    .setDepth(21);

  scene.add
    .text(
      GAME_W / 2,
      GAME_H / 2 - 20,
      won ? "Musuh dikalahkan!" : "Kamu gugur...",
      {
        fontSize: "15px",
        color: `#${COLORS.textSecondary.toString(16).padStart(6, "0")}`,
      },
    )
    .setOrigin(0.5)
    .setDepth(21);

  if (reason) {
    scene.add
      .text(
        GAME_W / 2,
        GAME_H / 2 + 15,
        reason,
        {
          fontSize: "12px",
          color: `#${COLORS.textMuted.toString(16).padStart(6, "0")}`,
          fontStyle: "italic",
        },
      )
      .setOrigin(0.5)
      .setDepth(21);
  }

  createButton(
    scene,
    GAME_W / 2,
    GAME_H / 2 + 83,
    150,
    46,
    "🔄 Lagi",
    COLORS.primary,
    () => scene.scene.restart(),
    { depth: 22, fontSize: FONT_SIZES.body },
  );
}

export function showCombo(scene, total, dmg) {
  const label = total > 1 ? `${total}x COMBO!\n-${dmg} DMG` : `-${dmg} DMG`;
  scene.comboText
    .setText(label)
    .setAlpha(1)
    .setScale(total > 1 ? 1.2 : 0.9);
  scene.comboText.setY(GRID_Y + (ROWS * (CELL + GAP)) / 2);
  scene.tweens.add({
    targets: scene.comboText,
    alpha: 0,
    y: scene.comboText.y - 40,
    duration: 950,
    ease: "Power2",
  });
  scene._setMsg(
    total > 1
      ? `${total} baris sekaligus! Combo damage ${dmg}!`
      : `Baris dihancurkan! Damage ${dmg} ke musuh.`,
  );
  scene.hudTexts.comboCount.setText(scene.comboCount ? `Combo ${scene.comboCount}` : "");
}

export function flashLines(scene, fullRows, fullCols, onDone) {
  const flashGfx = scene.add.graphics().setDepth(5);
  let tick = 0;
  const ev = scene.time.addEvent({
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
  scene.time.delayedCall(520, () => {
    ev.remove();
    flashGfx.destroy();
    onDone();
  });
}

export function playSatisfyingEffect(scene, fullRows, fullCols) {
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

  uniq.forEach((pos) => {
    const pieces = 6;
    for (let i = 0; i < pieces; i++) {
      const g = scene.add.graphics().setDepth(18);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(0, 0, 3);
      g.x = pos.x;
      g.y = pos.y;

      const angle = (Math.PI * 2 * i) / pieces + (Math.random() - 0.5) * 0.6;
      const dist = 14 + Math.random() * 22;
      const tx = pos.x + Math.cos(angle) * dist;
      const ty = pos.y + Math.sin(angle) * dist;

      scene.tweens.add({
        targets: g,
        x: tx,
        y: ty,
        alpha: 0,
        scale: 0.5,
        duration: 400 + Math.random() * 260,
        ease: "Cubic.easeOut",
        onComplete: () => g.destroy(),
      });
    }
  });

  const flash = scene.add.graphics().setDepth(19);
  flash.fillStyle(0xffffff, 0.08);
  flash.fillRect(0, 0, GAME_W, GAME_H);
  scene.tweens.add({ targets: flash, alpha: 0, duration: 260, ease: "Linear", onComplete: () => flash.destroy() });
  const intensity = Math.min(0.02, 0.006 * uniq.length);
  scene.cameras.main.shake(260, intensity);
}
