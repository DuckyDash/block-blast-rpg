import { COLORS } from './colors.js';
import { createText } from './text.js';
import { drawHealthBar } from './healthBar.js';

export class HUDCard {
  constructor(scene, x, y, width, height, options = {}) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.cardColor = options.cardColor ?? COLORS.surface;
    this.borderColor = options.borderColor ?? COLORS.surfaceBorder;
    this.iconBgColor = options.iconBgColor ?? COLORS.secondary;
    this.icon = options.icon ?? '';

    this.graphics = scene.add.graphics().setDepth(options.depth ?? 5);
    this.avatar = scene.add
      .text(this.x + 18, this.y + 20, this.icon, {
        fontSize: '15px',
      })
      .setOrigin(0.5);

    this.nameText = createText(scene, this.x + 36, this.y + 8, options.title ?? '', {
      fontSize: '11px',
      color: COLORS.textMuted,
      origin: { x: 0, y: 0 },
      depth: options.depth ?? 5,
    });

    this.hpText = createText(scene, this.x + 36, this.y + 22, '0 HP', {
      fontSize: '13px',
      color: COLORS.textPrimary,
      fontStyle: 'bold',
      origin: { x: 0, y: 0 },
      depth: options.depth ?? 5,
    });

    this.damageText = createText(scene, this.x + 36, this.y + 36, '', {
      fontSize: '10px',
      color: COLORS.error,
      origin: { x: 0, y: 0 },
      depth: options.depth ?? 5,
    });
  }

  render(currentHP, maxHP) {
    this.graphics.clear();
    this.graphics.fillStyle(this.cardColor);
    this.graphics.fillRoundedRect(this.x, this.y, this.width, this.height, 12);
    this.graphics.lineStyle(2, this.borderColor);
    this.graphics.strokeRoundedRect(this.x, this.y, this.width, this.height, 12);

    this.graphics.fillStyle(this.iconBgColor, 0.1);
    this.graphics.fillCircle(this.x + 18, this.y + 20, 14);

    drawHealthBar(
      this.graphics,
      this.x + 14,
      this.y + 42,
      this.width - 54,
      8,
      currentHP,
      maxHP,
    );

    this.hpText.setText(`${Math.round(currentHP)} HP`);
  }

  setName(value) {
    this.nameText.setText(value);
  }

  setIcon(value) {
    this.avatar.setText(value);
  }

  setDamage(value) {
    this.damageText.setText(value);
  }
}
