/** CPU point projection when WebGL is unavailable. Uses the same real XYZ/RGB data. */
export class CanvasPointRenderer {
  constructor(THREE, data) {
    this.isSoftware = true;
    this.domElement = document.createElement("canvas");
    this.context = this.domElement.getContext("2d", { alpha: true });
    if (!this.context) throw new Error("Canvas unavailable");
    this.data = data;
    this.matrix = new THREE.Matrix4();
    this.pixelRatio = 1;
  }
  setClearColor() {}
  setPixelRatio(ratio) {
    this.pixelRatio = Math.min(1, ratio);
  }
  setSize(width, height) {
    const scale = Math.min(this.pixelRatio, 960 / width, 700 / height);
    this.width = Math.max(1, Math.round(width * scale));
    this.height = Math.max(1, Math.round(height * scale));
    this.domElement.width = this.width;
    this.domElement.height = this.height;
    this.image = this.context.createImageData(this.width, this.height);
    this.depth = new Float32Array(this.width * this.height);
  }
  render(scene, camera) {
    if (!this.image) return;
    camera.updateMatrixWorld();
    this.matrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    const m = this.matrix.elements,
      positions = this.data.positions,
      rgb = this.data.rgb;
    const colour = this.cloudStyle?.colour ?? 1,
      inverse = 1 - colour,
      count = Math.ceil(this.data.count * (this.cloudStyle?.reveal ?? 1)),
      pointSize = this.cloudStyle?.size ?? 0.0065;
    const neutral = this.cloudStyle?.geometryRGB;
    const pixels = this.image.data,
      width = this.width,
      height = this.height,
      depth = this.depth;
    pixels.fill(0);
    depth.fill(Infinity);
    for (let i = 0; i < count; i++) {
      const offset = i * 3,
        x = positions[offset],
        y = positions[offset + 1],
        z = positions[offset + 2];
      const w = m[3] * x + m[7] * y + m[11] * z + m[15];
      if (w <= 0) continue;
      const nx = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
      const ny = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
      const nz = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
      if (nx < -1.02 || nx > 1.02 || ny < -1.02 || ny > 1.02 || nz < -1 || nz > 1) continue;
      const px = (nx * 0.5 + 0.5) * width,
        py = (0.5 - ny * 0.5) * height;
      const radius = Math.max(
        0.7,
        Math.min(2.4, (pointSize * height * (neutral ? 0.65 : 1)) / (2 * w)),
      );
      const minX = Math.max(0, Math.floor(px - radius)),
        maxX = Math.min(width - 1, Math.ceil(px + radius));
      const minY = Math.max(0, Math.floor(py - radius)),
        maxY = Math.min(height - 1, Math.ceil(py + radius));
      for (let row = minY; row <= maxY; row++) {
        for (let col = minX; col <= maxX; col++) {
          const dx = col + 0.5 - px,
            dy = row + 0.5 - py;
          if (dx * dx + dy * dy > radius * radius) continue;
          const index = row * width + col;
          if (nz >= depth[index]) continue;
          depth[index] = nz;
          const pixel = index * 4;
          pixels[pixel] = rgb[offset] * colour + (neutral?.[offset] ?? 166) * inverse;
          pixels[pixel + 1] = rgb[offset + 1] * colour + (neutral?.[offset + 1] ?? 211) * inverse;
          pixels[pixel + 2] = rgb[offset + 2] * colour + (neutral?.[offset + 2] ?? 187) * inverse;
          pixels[pixel + 3] = 255;
        }
      }
    }
    this.context.putImageData(this.image, 0, 0);
  }
  dispose() {
    this.image = null;
    this.depth = null;
    this.data = null;
  }
}
