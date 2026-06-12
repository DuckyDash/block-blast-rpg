// ─── Responsive scene helper ──────────────────────────────────────────────────

/**
 * Wires Phaser Scale.RESIZE to a scene relayout callback.
 * @param {Phaser.Scene} scene
 * @param {() => void} onRelayout
 */
export function bindResponsiveLayout(scene, onRelayout) {
  const apply = () => {
    const { width, height } = scene.scale;
    if (width < 1 || height < 1) return;
    onRelayout(width, height);
  };

  apply();
  scene.scale.on('resize', apply);
  scene.events.once('shutdown', () => scene.scale.off('resize', apply));
}
