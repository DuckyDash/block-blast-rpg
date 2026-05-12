// ─── Helpers ──────────────────────────────────────────────────────────────────
import { BLOCK_COLORS, PIECES, COMBO_DAMAGE } from "../config/constants.js";

export function randFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randShape() {
  return randFrom(PIECES);
}

/** Satu warna solid per piece */
export function randPieceColor() {
  return randFrom(BLOCK_COLORS);
}

export function calcDamage(lines) {
  if (lines <= 0) return 0;
  return lines < COMBO_DAMAGE.length ? COMBO_DAMAGE[lines] : lines * 20;
}

export function canPlace(grid, shape, row, col, ROWS, COLS) {
  for (let dr = 0; dr < shape.length; dr++) {
    for (let dc = 0; dc < shape[dr].length; dc++) {
      if (!shape[dr][dc]) continue;
      const r = row + dr;
      const c = col + dc;
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return false;
      if (grid[r][c] !== null) return false;
    }
  }
  return true;
}

export function findFullLines(grid, ROWS, COLS) {
  const fullRows = [];
  const fullCols = [];
  for (let r = 0; r < ROWS; r++)
    if (grid[r].every((c) => c !== null)) fullRows.push(r);
  for (let c = 0; c < COLS; c++)
    if (grid.map((r) => r[c]).every((v) => v !== null)) fullCols.push(c);
  return { fullRows, fullCols };
}

export function clearLines(grid, fullRows, fullCols) {
  fullRows.forEach((r) => grid[r].fill(null));
  fullCols.forEach((c) => grid.forEach((row) => (row[c] = null)));
}
