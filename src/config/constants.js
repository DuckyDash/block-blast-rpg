// ─── Constants ────────────────────────────────────────────────────────────────
// Semua angka dan data statis ada di sini.
// Jangan hardcode nilai di scene — selalu import dari file ini.

// Canvas
export const GAME_W = 360
export const GAME_H = 640

// Grid
export const COLS   = 9
export const ROWS   = 9
export const CELL   = 30
export const GAP    = 2
export const GRID_X = 40
export const GRID_Y = 210

// UI positions
export const TRAY_Y     = 580
export const HUD_CARD_Y = 60
export const CARD_W = 160;
export const CARD_H = 68;

// Battle
export const MAX_HP          = 20000
export const ENEMY_ATTACK_MS = 4000
export const ENEMY_DMG_MIN   = 8
export const ENEMY_DMG_MAX   = 14

// Combo damage: index = jumlah baris yang dihancurkan sekaligus
// 4+ = lines * 20
export const COMBO_DAMAGE = [0, 10, 25, 45]

// Simplified prototype block colors
export const BLOCK_COLORS = [
  0x0ea5e9, // biru
  0x10b981, // hijau
  0xf59e0b, // kuning
  0xef4444, // merah
]

// Simple prototype pieces — lebih sedikit bentuk untuk proof of concept
export const PIECES = [
  [[1]],
  [[1, 1]],
  [[1], [1]],
  [[1, 1], [1, 1]],
  [[1, 1, 1]],
  [[1], [1], [1]],
]
