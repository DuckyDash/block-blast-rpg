// ─── UI Components Library (moved to src/ui) ────────────────────────────────
import Phaser from 'phaser';

export const COLORS = {
  bg: 0x0a0e27,
  surface: 0x141829,
  surfaceBorder: 0x2d2e4d,
  primary: 0x6366f1,
  primaryHover: 0x818cf8,
  secondary: 0x8b5cf6,
  success: 0x4ade80,
  warning: 0xf59e0b,
  danger: 0xef4444,
  error: 0xf87171,
  textPrimary: 0xffffff,
  textSecondary: 0xcccccc,
  textMuted: 0x8888aa,
  textAccent: 0xfde047,
  healthGood: 0x4ade80,
  healthMedium: 0xf59e0b,
  healthLow: 0xef4444,
  cellEmpty: 0x252540,
  cellBorder: 0x2a2a4a,
  cellHighlight: 0xffffff,
  overlay: 0x000000,
};

export const FONT_SIZES = {
  title: '42px',
  heading: '36px',
  subheading: '24px',
  body: '16px',
  caption: '13px',
  small: '11px',
  tiny: '10px',
};

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

export function createPanel(scene, x, y, w, h, options = {}) {
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

export function drawHealthBar(graphics, x, y, w, h, currentHP, maxHP) {
  graphics.fillStyle(0x333355);
  graphics.fillRoundedRect(x, y, w, h, 4);

  const pct = Math.max(0, currentHP / maxHP);
  let barColor = COLORS.healthGood;
  if (pct <= 0.5) barColor = pct <= 0.25 ? COLORS.healthLow : COLORS.healthMedium;
  
  graphics.fillStyle(barColor);
  if (pct > 0) {
    graphics.fillRoundedRect(x, y, w * pct, h, 4);
  }
}

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

export function drawProgressRing(graphics, x, y, radius, percent, color) {
  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + Math.PI * 2 * percent;

  graphics.fillStyle(0x333333);
  graphics.fillCircle(x, y, radius);

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
