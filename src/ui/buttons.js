import Phaser from 'phaser';
import { COLORS, FONT_SIZES } from './colors.js';

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
