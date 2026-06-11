import { COLORS } from './colors.js';

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
