import { canPlace, findFullLines } from "../../engine/helpers.js";
import {
  GRID_X,
  GRID_Y,
  COLS,
  ROWS,
  CELL,
  GAP,
  TRAY_Y,
  TRAY_PANEL_X,
  SLOT_W,
  SMALL,
  SGAP,
  DRAG_CELL,
  DRAG_GAP,
} from "./constants.js";


export function initInput(scene) {
  scene.input.on("pointerdown", (ptr) => onPointerDown(scene, ptr));
  scene.input.on("pointermove", (ptr) => onPointerMove(scene, ptr));
  scene.input.on("pointerup", (ptr) => onPointerUp(scene, ptr));
  scene.input.on("pointerupoutside", (ptr) => onPointerUp(scene, ptr));
}

export function updateDragGhost(scene) {
  const g = scene.ghostGfx;
  const ptr = scene.input.activePointer;
  const p = scene.trayPieces[scene.dragPieceIdx];
  if (!p) return;

  g.clear();
  const px = ptr.x - scene.dragOffsetX;
  const py = ptr.y - scene.dragOffsetY;
  const snapC = Math.round((px - GRID_X) / (CELL + GAP));
  const snapR = Math.round((py - GRID_Y) / (CELL + GAP));
  const onGrid = snapC >= 0 && snapC < COLS && snapR >= 0 && snapR < ROWS;
  const ok = onGrid && canPlace(scene.grid, p.shape, snapR, snapC, ROWS, COLS);

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
          g.lineStyle(2, 0x4ade80, 0.8);
          g.strokeRoundedRect(gx, gy, CELL, CELL, 4);
        }
      });
    });

    const tempGrid = scene.grid.map((row) => [...row]);
    p.shape.forEach((row, dr) => {
      row.forEach((cell, dc) => {
        if (!cell) return;
        const r = snapR + dr;
        const c = snapC + dc;
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
          tempGrid[r][c] = p.color;
        }
      });
    });

    const { fullRows, fullCols } = findFullLines(tempGrid, ROWS, COLS);
    fullRows.forEach((r) => {
      for (let c = 0; c < COLS; c++) {
        const gx = GRID_X + c * (CELL + GAP);
        const gy = GRID_Y + r * (CELL + GAP);
        g.fillStyle(p.color, 0.22);
        g.fillRoundedRect(gx, gy, CELL, CELL, 4);
        g.lineStyle(1, p.color, 0.35);
        g.strokeRoundedRect(gx, gy, CELL, CELL, 4);
      }
    });
    fullCols.forEach((c) => {
      for (let r = 0; r < ROWS; r++) {
        const gx = GRID_X + c * (CELL + GAP);
        const gy = GRID_Y + r * (CELL + GAP);
        g.fillStyle(p.color, 0.18);
        g.fillRoundedRect(gx, gy, CELL, CELL, 4);
        g.lineStyle(1, p.color, 0.35);
        g.strokeRoundedRect(gx, gy, CELL, CELL, 4);
      }
    });
  }

  scene.dragSnapR = onGrid ? snapR : null;
  scene.dragSnapC = onGrid ? snapC : null;
  scene.dragCanPlace = ok;
}

export function onPointerDown(scene, ptr) {
  if (scene.gameOver || scene.isClearing || scene.dragging || scene.isPaused) return;
  const { x, y } = ptr;

  for (let i = 0; i < 3; i++) {
    const p = scene.trayPieces[i];
    if (!p || p.used) continue;

    const slotCX = TRAY_PANEL_X + SLOT_W * i + SLOT_W / 2;
    const maxC = Math.max(...p.shape.map((row) => row.length));
    const maxR = p.shape.length;
    const totalW = maxC * (SMALL + SGAP) - SGAP;
    const totalH = maxR * (SMALL + SGAP) - SGAP;
    const sx = slotCX - totalW / 2;
    const sy = TRAY_Y - totalH / 2;

    if (x >= sx - 8 && x <= sx + totalW + 8 && y >= sy - 8 && y <= sy + totalH + 8) {
      scene.dragging = true;
      scene.dragPieceIdx = i;
      const dragW = maxC * (DRAG_CELL + DRAG_GAP) - DRAG_GAP;
      const dragH = maxR * (DRAG_CELL + DRAG_GAP) - DRAG_GAP;
      scene.dragOffsetX = dragW / 2;
      scene.dragOffsetY = dragH + 20;
      scene.ghostGfx.setAlpha(1);
      scene.drawTray();
      scene._setMsg("Seret ke grid lalu lepas untuk menaruh.");
      return;
    }
  }
}

export function onPointerMove(scene) {
  if (scene.dragging) updateDragGhost(scene);
}

export function onPointerUp(scene) {
  if (!scene.dragging) return;
  const p = scene.trayPieces[scene.dragPieceIdx];
  if (scene.dragCanPlace && scene.dragSnapR !== null && scene.dragSnapC !== null) {
    scene._placePiece(p, scene.dragSnapR, scene.dragSnapC);
  } else {
    scene._setMsg("Taruh di area yang kosong di grid!");
  }

  scene.dragging = false;
  scene.dragPieceIdx = null;
  scene.dragSnapR = null;
  scene.dragSnapC = null;
  scene.dragCanPlace = false;
  scene.ghostGfx.clear();
  scene.drawTray();
}
