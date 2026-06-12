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
      .text(this.x + 50, this.y + 45, this.icon, {
        fontSize: '40px',
      })
      .setOrigin(0.5)
      .setDepth((options.depth ?? 5) + 1);

    this.nameText = createText(scene, this.x + 110, this.y + 16, options.title ?? '', {
      fontSize: '24px',
      color: COLORS.textMuted,
      origin: { x: 0, y: 0 },
      depth: options.depth ?? 5,
    });

    this.hpText = createText(scene, this.x + 110, this.y + 46, '0 HP', {
      fontSize: '28px',
      color: COLORS.textPrimary,
      fontStyle: 'bold',
      origin: { x: 0, y: 0 },
      depth: options.depth ?? 5,
    });

    this.damageText = createText(scene, this.x + 110, this.y + 76, '', {
      fontSize: '20px',
      color: COLORS.error,
      origin: { x: 0, y: 0 },
      depth: options.depth ?? 5,
    });
  }

  render(currentHP, maxHP) {
    this.graphics.clear();
    this.graphics.fillStyle(this.cardColor);
    this.graphics.fillRoundedRect(this.x, this.y, this.width, this.height, 16);
    this.graphics.lineStyle(3, this.borderColor);
    this.graphics.strokeRoundedRect(this.x, this.y, this.width, this.height, 16);

    this.graphics.fillStyle(this.iconBgColor, 0.15);
    this.graphics.fillCircle(this.x + 50, this.y + 45, 32);

    drawHealthBar(
      this.graphics,
      this.x + 20,
      this.y + 92,
      this.width - 40,
      12,
      currentHP,
      maxHP,
    );

    this.hpText.setText(`${Math.round(currentHP)} / ${maxHP} HP`);
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
