/** Decode the documented XYZ/RGB display format without changing RGB values. */
export function decodePointCloud(metadata, buffer) {
  const count = metadata?.pointCount;
  if (
    metadata?.version !== 1 ||
    metadata.encoding !== "xyz-float32-le-rgb-uint8" ||
    !Number.isInteger(count) ||
    count < 1 ||
    count > 2000000 ||
    metadata.positionsBytes !== count * 12 ||
    metadata.coloursBytes !== count * 3 ||
    !(buffer instanceof ArrayBuffer) ||
    buffer.byteLength !== count * 15
  ) {
    throw new Error("Invalid point-cloud data.");
  }
  let positions = new Float32Array(buffer, 0, count * 3);
  if (new Uint8Array(new Uint16Array([1]).buffer)[0] !== 1) {
    const view = new DataView(buffer);
    positions = Float32Array.from({ length: count * 3 }, (_, i) => view.getFloat32(i * 4, true));
  }
  for (const value of positions) {
    if (!Number.isFinite(value) || Math.abs(value) > 2)
      throw new Error("Invalid display coordinate.");
  }
  const rgb = new Uint8Array(buffer, count * 12, count * 3);
  const linearRGB = new Float32Array(rgb.length);
  for (let i = 0; i < rgb.length; i++) {
    const c = rgb[i] / 255;
    linearRGB[i] = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }
  return { count, positions, rgb, linearRGB };
}
