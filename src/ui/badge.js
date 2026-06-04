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
