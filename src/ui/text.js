import { COLORS, FONT_SIZES } from './colors.js';

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
