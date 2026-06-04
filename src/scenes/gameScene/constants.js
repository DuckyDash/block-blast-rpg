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
} from "../../config/constants.js";

export const TRAY_PANEL_X = GRID_X - 7;
export const TRAY_PANEL_W = GAME_W - TRAY_PANEL_X * 2;
export const SLOT_W = TRAY_PANEL_W / 3;
export const SMALL = 13;
export const SGAP = 2;
export const CARD_W = (GAME_W - 30) / 2;
export const CARD_H = 82;
export const DRAG_CELL = 28;
export const DRAG_GAP = 2;

export {
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
};
