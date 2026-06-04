import { PLAYER_STATS, ENEMIES } from "../../config/entities.js";
import { randShape, randPieceColor, calcDamage, findFullLines, clearLines } from "../../engine/helpers.js";
import { TRAY_Y } from "./constants.js";

export function initState(scene) {
  scene.grid = Array.from({ length: ENEMIES ? 0 : 0 });
  scene.grid = Array.from({ length: 10 }, () => Array(10).fill(null));
}

export function createEnemy(scene, key) {
  return {
    ...ENEMIES[key],
    currentHP: ENEMIES[key].maxHP,
  };
}

export function initEnemyTimer(scene) {
  if (scene.enemyTimer) scene.enemyTimer.remove();
  scene.enemyTimer = scene.time.addEvent({
    delay: scene.enemy.attackInterval,
    callback: () => scene._enemyAttack(),
    loop: true,
  });
}

export function spawnTray(scene) {
  scene.trayPieces = [0, 1, 2].map((slotIndex) => {
    if (scene.debugMode && scene.debugSelectedIndex !== null && slotIndex === 0) {
      return {
        shape: scene.PIECES[scene.debugSelectedIndex],
        color: scene._getDebugPieceColor(),
        used: false,
      };
    }
    return {
      shape: randShape(),
      color: randPieceColor(),
      used: false,
    };
  });
}

export function placePiece(scene, p, gr, gc) {
  p.shape.forEach((row, dr) => {
    row.forEach((cell, dc) => {
      if (cell) scene.grid[gr + dr][gc + dc] = p.color;
    });
  });

  p.used = true;
  scene.drawGrid();
  scene.drawTray();
  scene._checkLines();

  if (scene.trayPieces.every((t) => t.used)) {
    scene.time.delayedCall(440, () => {
      spawnTray(scene);
      scene.drawTray();
      scene._setMsg("Blok baru! Seret ke grid.");
      scene._checkLoseCondition();
    });
  }
}

export function checkLines(scene) {
  const { fullRows, fullCols } = findFullLines(scene.grid, scene.ROWS, scene.COLS);
  const total = fullRows.length + fullCols.length;
  if (!total) {
    if (!scene.trayPieces.every((t) => t.used)) {
      scene._checkLoseCondition();
    }
    return;
  }
  scene.isClearing = true;
  scene._flashLines(fullRows, fullCols, () => {
    clearLines(scene.grid, fullRows, fullCols);
    scene._playSatisfyingEffect(fullRows, fullCols);
    scene.drawGrid();
    const dmg = calcDamage(total);
    scene.enemy.currentHP = Math.max(0, scene.enemy.currentHP - dmg);
    scene.drawHUD();
    scene.showDamage("enemy", dmg);
    scene._recordCombo(total);
    scene._showCombo(total, dmg);
    scene.isClearing = false;
    if (scene.enemy.currentHP <= 0) scene._onEnemyDefeated();
    else if (!scene.trayPieces.every((t) => t.used)) {
      scene._checkLoseCondition();
    }
  });
}

export function recordCombo(scene, total) {
  if (scene.comboCount > 0) {
    scene.comboCount += 1;
  } else {
    scene.comboCount = 1;
  }
  if (scene.comboTimer) scene.comboTimer.remove();
  scene.comboCooldownStarted = scene.time.now;
  scene.comboTimer = scene.time.delayedCall(scene.comboCooldown, () => resetCombo(scene));
  scene.hudTexts.comboCount.setText(`Combo ${scene.comboCount}`);
}

export function resetCombo(scene) {
  scene.comboCount = 0;
  scene.comboTimer = null;
  scene.comboCooldownStarted = 0;
  scene.hudTexts.comboCount.setText("");
}
