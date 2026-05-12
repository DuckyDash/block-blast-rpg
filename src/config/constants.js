// ─── Constants ────────────────────────────────────────────────────────────────
// Semua angka dan data statis ada di sini.
// Jangan hardcode nilai di scene — selalu import dari file ini.

// Canvas
export const GAME_W = 360
export const GAME_H = 640

// Grid
export const COLS   = 9
export const ROWS   = 9
export const CELL   = 32
export const GAP    = 2
export const GRID_X = 12
export const GRID_Y = 185

// UI positions
export const TRAY_Y     = 535
export const HUD_CARD_Y = 8

// Battle
export const MAX_HP          = 100
export const ENEMY_ATTACK_MS = 4000
export const ENEMY_DMG_MIN   = 8
export const ENEMY_DMG_MAX   = 14

// Combo damage: index = jumlah baris yang dihancurkan sekaligus
// 4+ = lines * 20
export const COMBO_DAMAGE = [0, 10, 25, 45]

// Warna blok — tiap cell dapat warna random dari list ini
export const BLOCK_COLORS = [
  0x6366f1, // indigo
  0x0ea5e9, // sky
  0x10b981, // emerald
  0xf59e0b, // amber
  0xec4899, // pink
  0x8b5cf6, // violet
  0xef4444, // red
  0x14b8a6, // teal
]

// Shape pieces — 1 = filled, 0 = kosong
export const PIECES = [
  [[1,1],[1,1]],
  [[1,1,1]],
  [[1],[1],[1]],
  [[1,1,1],[0,1,0]],
  [[1,0],[1,0],[1,1]],
  [[0,1],[0,1],[1,1]],
  [[1,1,0],[0,1,1]],
  [[1,1,1,1]],
  [[1]],
  [[1,1],[1,0]],
  [[1,1,1],[1,0,0]],
  [[1,0,0],[1,1,1]],
]
