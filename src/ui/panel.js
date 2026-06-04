import { COLORS } from './colors.js';

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
