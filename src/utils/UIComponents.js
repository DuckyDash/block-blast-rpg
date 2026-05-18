// ─── UI Components Library ─────────────────────────────────────────────────────
// Reusable UI components for consistent design across all scenes.

import Phaser from 'phaser';

// ── Color Palette ──────────────────────────────────────────────────────────────
export const COLORS = {
  // Background & surfaces
  bg: 0x0a0e27,          // Deep navy background
  surface: 0x141829,     // Card/panel surface
  surfaceBorder: 0x2d2e4d,
  
  // UI Elements
  primary: 0x6366f1,     // Indigo (primary button)
  primaryHover: 0x818cf8,
  secondary: 0x8b5cf6,   // Violet
  success: 0x4ade80,     // Green
  warning: 0xf59e0b,     // Amber
  danger: 0xef4444,      // Red
  error: 0xf87171,       // Light red
  
  // Text
  textPrimary: 0xffffff,
  textSecondary: 0xcccccc,
  textMuted: 0x8888aa,
  textAccent: 0xfde047,  // Yellow
  
  // Status
  healthGood: 0x4ade80,
  healthMedium: 0xf59e0b,
  healthLow: 0xef4444,
  
  // Grid cells
  cellEmpty: 0x252540,
  cellBorder: 0x2a2a4a,
  cellHighlight: 0xffffff,
  
  // Gradient support for overlays
  overlay: 0x000000,
};

// ── Typography ────────────────────────────────────────────────────────────────
export const FONT_SIZES = {
  title: '42px',
  heading: '36px',
  subheading: '24px',
  body: '16px',
  caption: '13px',
  small: '11px',
  tiny: '10px',
};

// ── Button Factory ────────────────────────────────────────────────────────────
/**
 * Creates a styled button with graphics and text
 * @param scene - Phaser scene
 * @param x, y - Position
 * @param w, h - Dimensions
 * @param label - Button text
 * @param color - Button color
 * @param callback - Click handler
 * @param options - Additional options: disabled, depth
 * @returns {Object} - { gfx, text }
 */
export function createButton(scene, x, y, w, h, label, color, callback, options = {}) {
  const {
    disabled = false,
    depth = 10,
    fontSize = FONT_SIZES.body,
    fontStyle = 'bold',
  } = options;

  const btnGfx = scene.add.graphics().setDepth(depth);
  const actualColor = disabled ? 0x444444 : color;
  btnGfx.fillStyle(actualColor);
  btnGfx.fillRoundedRect(x - w / 2, y - h / 2, w, h, 10);

  const btnText = scene.add
    .text(x, y, label, {
      fontSize,
      fontStyle,
      color: disabled ? '#888888' : '#ffffff',
    })
    .setOrigin(0.5)
    .setDepth(depth);

  if (!disabled) {
    const hitArea = new Phaser.Geom.Rectangle(x - w / 2, y - h / 2, w, h);
    btnText.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
    btnGfx.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    const hoverHandler = () => {
      btnGfx.clear();
      btnGfx.fillStyle(0xffffff, 0.2);
      btnGfx.fillRoundedRect(x - w / 2, y - h / 2, w, h, 10);
      btnGfx.fillStyle(actualColor);
      btnGfx.fillRoundedRect(x - w / 2, y - h / 2, w, h, 10);
    };

    const outHandler = () => {
      btnGfx.clear();
      btnGfx.fillStyle(actualColor);
      btnGfx.fillRoundedRect(x - w / 2, y - h / 2, w, h, 10);
    };

    btnText.on('pointerover', hoverHandler);
    btnText.on('pointerout', outHandler);
    btnGfx.on('pointerover', hoverHandler);
    btnGfx.on('pointerout', outHandler);

    btnText.on('pointerdown', callback);
    btnGfx.on('pointerdown', callback);
  }

  return { gfx: btnGfx, text: btnText };
}

// ── Panel Factory ──────────────────────────────────────────────────────────────
/**
 * Creates a styled panel/card background
 * @param scene - Phaser scene
 * @param x, y, w, h - Position and dimensions
 * @param options - { color, borderColor, borderWidth, radius, depth }
 * @returns Graphics object
 */
export function createPanel(
  scene,
  x,
  y,
  w,
  h,
  options = {}
) {
  const {
    color = COLORS.surface,
    borderColor = COLORS.surfaceBorder,
    borderWidth = 1,
    radius = 8,
    depth = 0,
  } = options;

  const panel = scene.add.graphics().setDepth(depth);
  panel.fillStyle(color);
  panel.fillRoundedRect(x - w / 2, y - h / 2, w, h, radius);
  
  if (borderWidth > 0) {
    panel.lineStyle(borderWidth, borderColor);
    panel.strokeRoundedRect(x - w / 2, y - h / 2, w, h, radius);
  }

  return panel;
}

// ── Health Bar Factory ─────────────────────────────────────────────────────────
/**
 * Draws a health bar
 * @param graphics - Phaser graphics object
 * @param x, y - Position (top-left)
 * @param w, h - Width and height
 * @param currentHP - Current health points
 * @param maxHP - Maximum health points
 * @returns null
 */
export function drawHealthBar(graphics, x, y, w, h, currentHP, maxHP) {
  // Background (empty bar)
  graphics.fillStyle(0x333355);
  graphics.fillRoundedRect(x, y, w, h, 4);

  // Foreground (filled portion)
  const pct = Math.max(0, currentHP / maxHP);
  let barColor = COLORS.healthGood;
  if (pct <= 0.5) barColor = pct <= 0.25 ? COLORS.healthLow : COLORS.healthMedium;
  
  graphics.fillStyle(barColor);
  if (pct > 0) {
    graphics.fillRoundedRect(x, y, w * pct, h, 4);
  }
}

// ── Text Factory ──────────────────────────────────────────────────────────────
/**
 * Creates styled text with common options
 * @param scene - Phaser scene
 * @param x, y - Position
 * @param text - Text content
 * @param options - { fontSize, color, fontStyle, align, depth }
 * @returns Text object
 */
export function createText(scene, x, y, text, options = {}) {
  const {
    fontSize = FONT_SIZES.body,
    color = COLORS.textPrimary,
    fontStyle = 'normal',
    align = 'center',
    depth = 0,
    origin = 0.5,
    wordWrap = null,
  } = options;

  const config = {
    fontSize,
    color: `#${color.toString(16).padStart(6, '0')}`,
    fontStyle,
    align,
  };

  if (wordWrap) config.wordWrap = wordWrap;

  const t = scene.add.text(x, y, text, config);
  
  if (typeof origin === 'number') {
    t.setOrigin(origin);
  } else {
    t.setOrigin(origin.x, origin.y);
  }

  return t.setDepth(depth);
}

// ── Badge/Indicator Factory ────────────────────────────────────────────────────
/**
 * Creates a small badge/indicator
 * @param scene - Phaser scene
 * @param x, y - Position
 * @param text - Badge text
 * @param color - Background color
 * @param options - { size, depth }
 * @returns Object { gfx, text }
 */
export function createBadge(scene, x, y, text, color, options = {}) {
  const { size = 20, depth = 10 } = options;

  const gfx = scene.add.graphics().setDepth(depth);
  gfx.fillStyle(color);
  gfx.fillCircle(x, y, size);

  const t = scene.add
    .text(x, y, text, {
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#ffffff',
    })
    .setOrigin(0.5)
    .setDepth(depth);

  return { gfx, text: t };
}

// ── Progress Ring Factory ──────────────────────────────────────────────────────
/**
 * Creates a circular progress indicator
 * @param graphics - Phaser graphics object
 * @param x, y - Center position
 * @param radius - Radius of circle
 * @param percent - Progress 0-1
 * @param color - Fill color
 * @returns null
 */
export function drawProgressRing(graphics, x, y, radius, percent, color) {
  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + Math.PI * 2 * percent;

  // Background circle
  graphics.fillStyle(0x333333);
  graphics.fillCircle(x, y, radius);

  // Progress arc (approximated with wedge)
  graphics.fillStyle(color);
  graphics.fillPointTriangles([
    x, y,
    x + Math.cos(startAngle) * radius, y + Math.sin(startAngle) * radius,
    x + Math.cos(endAngle) * radius, y + Math.sin(endAngle) * radius,
  ]);
}

export default {
  COLORS,
  FONT_SIZES,
  createButton,
  createPanel,
  drawHealthBar,
  createText,
  createBadge,
  drawProgressRing,
};
