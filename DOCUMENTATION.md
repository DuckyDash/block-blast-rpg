# Dokumentasi Proyek Block Blast RPG

Dokumentasi lengkap struktur proyek `block-blast-rpg`, arsitektur modular, dan penjelasan setiap komponen.

---

## 📋 Daftar Isi
1. [Arsitektur Keseluruhan](#arsitektur-keseluruhan)
2. [Konfigurasi & Setup](#konfigurasi--setup)
3. [Game Engine (src/engine/)](#game-engine-srcengine)
4. [UI Components (src/ui/)](#ui-components-srcui)
5. [Game Scene (src/scenes/)](#game-scene-srcscenes)
6. [Config Files (src/config/)](#config-files-srcconfig)
7. [Constants & Grid](#constants--grid)
8. [Build & Deployment](#build--deployment)

---

## Arsitektur Keseluruhan

Proyek menggunakan **modular architecture** dengan pemisahan concern:

```
src/
├── main.js                 # Entry point
├── config/                 # Game configuration
│   ├── constants.js       # All static values
│   ├── entities.js        # Enemy definitions
│   └── gameConfig.js      # Phaser game config
├── engine/                # Game logic (non-UI)
│   └── helpers.js         # Core game functions
├── ui/                    # UI components
│   ├── index.js          # Exports aggregator
│   ├── colors.js         # Color & font constants
│   ├── healthBar.js      # Health bar drawing
│   ├── buttons.js        # Button creation
│   ├── panel.js          # Panel components
│   ├── text.js           # Text utilities
│   ├── badge.js          # Badge display
│   └── progressRing.js   # Ring animations
└── scenes/               # Phaser scenes
    ├── GameScene.js      # Main scene (orchestrator)
    ├── MenuScene.js      # Menu scene
    ├── OptionsScene.js   # Options scene
    └── gameScene/        # GameScene submodules
        ├── constants.js  # Scene-specific constants
        ├── draw.js       # Rendering functions
        └── input.js      # Input/drag handling
```

**Prinsip:**
- **src/engine/**: Pure game logic, testable, no graphics
- **src/ui/**: Visual components only, reusable
- **src/scenes/**: Game flow & orchestration
- **src/config/**: Static data, single source of truth

---

## Konfigurasi & Setup

### `package.json`
```json
{
  "name": "block-blast-rpg",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "android": "npm run build && npx cap sync && npx cap open android"
  }
}
```

**Scripts:**
- `npm run dev` → dev server di port 3000
- `npm run build` → bundle untuk production ke `dist/`
- `npm run android` → build + deploy ke Android Studio

### `vite.config.js`
- Output: `dist/`
- Base path: `./` (for Capacitor)
- Dev port: 3000

### `index.html`
- Container: `<div id="game-container"></div>`
- Entry: `<script type="module" src="/src/main.js"></script>`

---

## Game Engine (src/engine/)

### `src/engine/helpers.js` (~180 lines)
Fungsi utilitas game logic pure (tanpa graphics).

**Export:**
- `randShape()` → random shape dari PIECES array
- `randPieceColor()` → random color dari BLOCK_COLORS
- `canPlace(grid, shape, row, col, ROWS, COLS)` → boolean, bisa ditempatkan?
- `findFullLines(grid, ROWS, COLS)` → {fullRows, fullCols}
- `clearLines(grid, fullRows, fullCols)` → mutate grid, hapus lines
- `calcDamage(total)` → damage based on cleared line count

**Digunakan oleh:** GameScene.js

---

## UI Components (src/ui/)

### `src/ui/index.js`
Aggregator export dari semua UI modules.

```javascript
export { COLORS, FONT_SIZES } from './colors.js';
export { drawHealthBar } from './healthBar.js';
export { createButton } from './buttons.js';
// ... etc
```

### `src/ui/colors.js`
```javascript
export const COLORS = {
  primary: 0x0ea5e9,      // cyan
  secondary: 0x10b981,    // green
  textPrimary: 0xf0f0f0,
  textAccent: 0x0ea5e9,
  error: 0xef4444,
  bg: 0x0f0f1a,
  surface: 0x1a1a2e,
  // ...
};

export const FONT_SIZES = {
  xs: '10px',
  sm: '11px',
  md: '13px',
  lg: '18px',
};
```

### `src/ui/healthBar.js`
```javascript
export function drawHealthBar(graphics, x, y, w, h, currentHP, maxHP) {
  const percent = currentHP / maxHP;
  const barColor = percent > 0.5 ? GREEN : percent > 0.25 ? YELLOW : RED;
  // Draw background & bar
}
```

### Modules Lainnya
- `buttons.js` → button creation
- `panel.js` → panel/card components
- `text.js` → text utilities
- `badge.js` → small badges display
- `progressRing.js` → circular progress

**Karakteristik:**
- Semua file < 100 lines
- Pure rendering functions
- No game state logic

---

## Game Scene (src/scenes/)

### `src/scenes/GameScene.js` (~400 lines)
**Orchestrator utama** game state & flow.

**State Management:**
```javascript
this.grid = [[0,0,...], ...]  // 9×9 game grid
this.player = { name, currentHP, maxHP }
this.enemy = { name, currentHP, maxHP, points }
this.points = 0              // Points scored this battle
this.tray = [piece, piece, piece]  // 3 pieces available
```

**Key Methods:**
- `create()` → setup scene
- `update()` → per-frame updates
- `_initState()` → initialize game state
- `_initGraphics()` → create graphics objects
- `_initTexts()` → create HUD texts
- `_initInput()` → setup drag-drop
- `spawnTray()` → create 3 random pieces
- `_onPointerDown/Move/Up()` → drag handling
- `_placePiece()` → place on grid, check lines
- `_onEnemyDefeated()` → add points, spawn new enemy
- `_enemyAttack()` → enemy attacks periodically

### `src/scenes/gameScene/constants.js`
Scene-specific constants (card dimensions, tray layout):

```javascript
const GRID_WIDTH = COLS * (CELL + GAP) + 10;
export const HUD_BAR_W = GRID_WIDTH;    // Health bar matches grid
export const HUD_BAR_H = 14;
export const CARD_W = HUD_BAR_W;
export const CARD_H = 82;
export const DRAG_CELL = 28;
export const DRAG_GAP = 2;
```

### `src/scenes/gameScene/draw.js` (~220 lines)
**Rendering functions:**

- `drawBackground()` → canvas background + tray panel
- `drawGrid()` → grid cells + placed blocks
- `drawTray()` → 3 piece slots
- `drawHUD()` → health bars & cards
- `drawDragGhost()` → drag preview with RGB highlight
- `initTexts()` → create HUD text objects

**RGB Highlight System:**
```javascript
const ROW_HIGHLIGHT_COLORS = [0xff3b30, 0x32d74b, 0x0a84ff];  // red, green, blue
const COL_HIGHLIGHT_COLORS = [0x64d2ff, 0xff375f, 0xff9f0a];  // cyan, magenta, orange

// Pulsing alpha animation
function getPulseAlpha(scene, offset) {
  return PULSE_BASE + PULSE_AMPLITUDE * Math.sin((scene.time.now + offset) * PULSE_SPEED);
}
```

Menunjukkan baris/kolom yang akan cleared dengan warna RGB yang berdenyut.

### `src/scenes/gameScene/input.js` (~180 lines)
**Input & drag handling:**

- `_onPointerDown()` → pick piece from tray
- `_onPointerMove()` → update drag ghost, show preview
- `_onPointerUp()` → drop piece or cancel
- `_updateDragGhost()` → render ghost with RGB clearance highlight
- Ghost shows RGB colors untuk full rows/cols yang akan cleared

---

## Config Files (src/config/)

### `src/config/constants.js`
**Central configuration** - semua "magic numbers" di sini.

**Canvas:**
```javascript
export const GAME_W = 360
export const GAME_H = 640
```

**Grid (9×9):**
```javascript
export const COLS = 9
export const ROWS = 9
export const CELL = 30          // Cell size in pixels
export const GAP = 2            // Gap between cells
export const GRID_X = 40        // Grid left position
export const GRID_Y = 210       // Grid top position
```

**UI Positions:**
```javascript
export const TRAY_Y = 580
export const HUD_CARD_Y = 60
```

**Battle:**
```javascript
export const MAX_HP = 100
export const ENEMY_ATTACK_MS = 3000
export const ENEMY_DMG_MIN = 5
export const ENEMY_DMG_MAX = 12
```

**Combo Damage (damage per cleared line):**
```javascript
export const COMBO_DAMAGE = [0, 8, 12, 18, 24]
// 1 line → 8 dmg
// 2 lines → 12 dmg
// 3 lines → 18 dmg
// 4 lines → 24 dmg
// 5+ lines → lines * 20
```

**Block System (Prototype):**
```javascript
export const BLOCK_COLORS = [
  0x0ea5e9,  // Blue
  0x10b981,  // Green
  0xf59e0b,  // Yellow
  0xef4444,  // Red
]

export const PIECES = [
  [[1]],                    // Single
  [[1,1]],                  // Pair
  [[1],[1]],                // Line-V
  [[1,1],[1,1]],            // Square
  [[1,1,1]],                // Trio
  [[1],[1],[1]],            // Line-V long
]
```

### `src/config/entities.js`
**Enemy definitions:**

```javascript
export const ENEMIES = [
  {
    id: 'goblin',
    name: 'Goblin',
    hp: 25,
    dmgMin: 5,
    dmgMax: 10,
    points: 8,
    weakness: 'Any ×3+ combo',
    // ...
  },
  // ... 16 more enemies
]
```

**Enemy Stats:**
- `points`: XP/points awarded on defeat (8-40 range)
- `hp`: Health points
- `dmgMin/Max`: Attack damage range
- `weakness`: Simplified description for UI

### `src/config/gameConfig.js`
Phaser game configuration:
```javascript
export const gameConfig = {
  type: Phaser.AUTO,
  width: GAME_W,
  height: GAME_H,
  backgroundColor: '#0f0f1a',
  parent: 'game-container',
  scene: [GameScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  }
}
```

---

## Constants & Grid

### Grid Dimensions Reference
```
Canvas: 360 × 640
Grid: 9×9 cells @ CELL=30px, GAP=2px
Grid Width = 9 × (30 + 2) + 10 = 278px
Grid Height = 9 × (30 + 2) + 10 = 278px
Position: (40, 210) top-left
```

### UI Proportions
```
Health Bar Width = Grid Width (278px)
Bubble Size = CELL (30px)
Card Height = 82px
HUD Position Y = 60px
```

### Points System
Setiap enemy memberikan points saat dikalahkan:
```javascript
_onEnemyDefeated() {
  const earned = this._getEnemyPoints(enemy);
  this.points += earned;
  this.hudTexts.score.setText(`POINTS: ${this.points}`);
}
```

---

## Build & Deployment

### Development
```bash
npm run dev
# Runs Vite dev server on http://localhost:3000
# Hot module reload enabled
```

### Production
```bash
npm run build
# Output: dist/index.html + dist/assets/
# Chunks minified, optimized
```

### Android
```bash
npm run android
# 1. Runs npm run build
# 2. Syncs to Capacitor
# 3. Opens Android Studio
# Deploy ke APK dari Android Studio
```

### File Size Targets
- Setiap modul ≤ 200 lines untuk maintainability
- Current: draw.js ~220, input.js ~180, GameScene.js ~400 (orchestrator)

---

## Flow Diagram

```
main.js
  └─ Phaser.Game
      └─ GameScene
          ├─ create() → _initState, _initGraphics, _initTexts, _initInput
          ├─ update() → called per frame
          │
          ├─ Input Handling (input.js)
          │   ├─ _onPointerDown → pick piece
          │   ├─ _onPointerMove → drag preview + RGB highlight
          │   └─ _onPointerUp → place or cancel
          │
          ├─ Game Logic (engine/helpers.js)
          │   ├─ canPlace() → validation
          │   ├─ findFullLines() → detect cleared lines
          │   └─ clearLines() → update grid
          │
          ├─ Rendering (draw.js)
          │   ├─ drawBackground()
          │   ├─ drawGrid()
          │   ├─ drawTray()
          │   ├─ drawHUD()
          │   └─ drawDragGhost()
          │
          ├─ Enemy System
          │   ├─ spawnTray() → 3 random pieces
          │   ├─ _enemyAttack() → periodic damage
          │   └─ _onEnemyDefeated() → points + spawn new
          │
          └─ UI (ui/*.js)
              ├─ drawHealthBar()
              ├─ createButton()
              └─ text utilities
```

---

## Development Tips

### Adding New Enemy
Edit `src/config/entities.js`:
```javascript
{
  id: 'newEnemy',
  name: 'New Enemy',
  hp: 30,
  dmgMin: 5,
  dmgMax: 10,
  points: 15,  // Points awarded to player
  weakness: 'Description',
}
```

### Changing Grid Size
Edit `src/config/constants.js`:
```javascript
export const COLS = 9
export const ROWS = 9
export const CELL = 30  // Change this
export const GAP = 2
```

### Adjusting Points
Edit `src/config/entities.js` → each enemy's `points` property.

### Tweaking Colors
Edit `src/ui/colors.js` → COLORS object.

---

## Build Checklist

✅ `npm run build` → No errors, 13 modules transformed
✅ All imports use relative paths
✅ No circular dependencies
✅ Grid dimensions consistent (CELL, GAP)
✅ Health bar width matches grid width
✅ Bubble size matches CELL
✅ Points system working
