// ─── Dynamic Layout ───────────────────────────────────────────────────────────
// Computes proportional positions from the 1080×1920 design while keeping the
// same stacked layout: HUD → grid → tray.

import { COLS, ROWS, DESIGN_W, DESIGN_H } from './constants.js';

const R = (value, axis) => value / (axis === 'x' ? DESIGN_W : DESIGN_H);

function solveCell(maxW, maxH) {
  const gapRatio = 4 / 100;
  const widthFactor = COLS * (1 + gapRatio) - gapRatio;
  const heightFactor = ROWS * (1 + gapRatio) - gapRatio;
  const cellFromW = maxW / widthFactor;
  const cellFromH = maxH / heightFactor;
  return Math.floor(Math.min(cellFromW, cellFromH));
}

/**
 * @param {number} w  Viewport width in game pixels
 * @param {number} h  Viewport height in game pixels
 */
export function computeLayout(w, h) {
  const scale = Math.min(w / DESIGN_W, h / DESIGN_H);
  const fontScale = scale;

  const hudCardY = h * R(200, 'y');
  const cardH = h * R(120, 'y');
  const cardW = (w - w * R(30, 'x')) / 2;
  const trayY = h * R(1700, 'y');
  const trayPanelTop = h * R(1500, 'y');
  const trayPanelH = h * R(300, 'y');

  const paddingX = w * R(20, 'x');
  const gridAreaTop = hudCardY + cardH + h * R(60, 'y');
  const gridAreaBottom = trayPanelTop - h * R(20, 'y');
  const gridAreaHeight = Math.max(gridAreaBottom - gridAreaTop, 80);

  const cellRaw = solveCell(w - paddingX * 2, gridAreaHeight);
  const minCell = Math.max(18, Math.round(24 * scale));
  const maxCell = Math.round(100 * Math.max(scale, 0.55));
  const cell = Math.max(minCell, Math.min(cellRaw, maxCell));
  const gap = Math.max(2, Math.round(cell * 0.04));

  const gridW = COLS * (cell + gap) - gap;
  const gridH = ROWS * (cell + gap) - gap;
  const gridX = Math.round((w - gridW) / 2);
  const gridY = Math.round(gridAreaTop + (gridAreaHeight - gridH) / 2);

  const trayPanelX = gridX - Math.max(4, Math.round(7 * scale));
  const trayPanelW = w - trayPanelX * 2;

  const font = (size) => `${Math.max(8, Math.round(size * fontScale))}px`;

  return {
    w,
    h,
    scale,
    fontScale,
    font,
    cell,
    gap,
    gridX,
    gridY,
    hudCardY,
    cardW,
    cardH,
    trayY,
    trayPanelX,
    trayPanelW,
    trayPanelTop,
    trayPanelH,
    slotW: trayPanelW / 3,
    small: Math.max(14, Math.round(cell * 0.4)),
    sGap: Math.max(2, Math.round(gap)),
    dragCell: cell,
    dragGap: Math.max(1, Math.round(gap * 0.5)),
    comboY: trayY - h * R(340, 'y'),
    trayLabelY: trayY - h * R(180, 'y'),
    comboCooldownY: trayY - h * R(300, 'y'),
    settingsX: w - w * R(20, 'x'),
    settingsY: h * R(35, 'y'),
    settingsSize: Math.max(24, Math.round(30 * scale)),
  };
}

/** Menu / options scene layout derived from the same scale ratios. */
export function computeMenuLayout(w, h) {
  const base = computeLayout(w, h);
  return {
    ...base,
    titleY: h * R(140, 'y'),
    subtitleY: h * R(210, 'y'),
    btnStartY: h * R(600, 'y'),
    btnW: w * R(600, 'x'),
    btnH: h * R(170, 'y'),
    btnGap: h * R(230, 'y'),
    footerY: h - h * R(25, 'y'),
    decorR1: 80 * base.scale,
    decorR2: 100 * base.scale,
  };
}

/** Options scene panel layout. */
export function computeOptionsLayout(w, h) {
  const base = computeMenuLayout(w, h);
  return {
    ...base,
    panelW: w * R(280, 'x'),
    panelH: h * R(180, 'y'),
    panelY: h / 2 - h * R(40, 'y'),
    titleY: h * R(50, 'y'),
    subtitleY: h * R(85, 'y'),
    backBtnY: h - h * R(70, 'y'),
    backBtnW: w * R(180, 'x'),
    backBtnH: h * R(50, 'y'),
    decorR1: 90 * base.scale,
    decorR2: 110 * base.scale,
  };
}
