export function drawProgressRing(graphics, x, y, radius, percent, color) {
  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + Math.PI * 2 * percent;

  graphics.fillStyle(0x333333);
  graphics.fillCircle(x, y, radius);

  graphics.fillStyle(color);
  graphics.fillPointTriangles([
    x,
    y,
    x + Math.cos(startAngle) * radius,
    y + Math.sin(startAngle) * radius,
    x + Math.cos(endAngle) * radius,
    y + Math.sin(endAngle) * radius,
  ]);
}
