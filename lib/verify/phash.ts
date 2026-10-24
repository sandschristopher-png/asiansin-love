// 64-bit average hash computed from capture canvas pixel data.
// Downsamples to 8x8 grayscale, thresholds against the mean, packs bits.
export function computeCanvasHash(canvas: HTMLCanvasElement): string {
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  const g = document.createElement('canvas');
  g.width = 8;
  g.height = 8;
  const gctx = g.getContext('2d');
  if (!gctx) return '';
  gctx.drawImage(canvas, 0, 0, 8, 8);
  const d = gctx.getImageData(0, 0, 8, 8).data;
  const grays: number[] = [];
  for (let i = 0; i < d.length; i += 4) {
    grays.push(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
  }
  const mean = grays.reduce((a, b) => a + b, 0) / grays.length;
  return grays.map((v) => (v >= mean ? '1' : '0')).join('');
}