import { createHash } from "node:crypto";
import sharp from "sharp";

export const sha256 = (data: Buffer | string) => createHash("sha256").update(data).digest("hex");

export async function makeWorkingCopy(original: Buffer) {
  const meta = await sharp(original).metadata();
  const { data, info } = await sharp(original)
    .rotate()
    .resize({ width: 2048, height: 2048, fit: "inside", withoutEnlargement: true })
    .png()
    .toBuffer({ resolveWithObject: true });
  return {
    buffer: data,
    width: info.width,
    height: info.height,
    originalWidth: meta.autoOrient?.width ?? meta.width ?? info.width,
    originalHeight: meta.autoOrient?.height ?? meta.height ?? info.height,
    exifPresent: Boolean(meta.exif),
  };
}

const round16 = (n: number) => Math.max(16, Math.round(n / 16) * 16);

export function matchingSize(width: number, height: number, longEdge: number): { width: number; height: number } {
  const ratio = Math.min(3, Math.max(1 / 3, width / height));
  return ratio >= 1
    ? { width: round16(longEdge), height: round16(longEdge / ratio) }
    : { width: round16(longEdge * ratio), height: round16(longEdge) };
}

export function parseSize(size: string): { width: number; height: number } {
  const m = /^(\d+)x(\d+)$/.exec(size);
  if (!m) throw new Error(`Tamanho inválido: ${size} (use LARGURAxALTURA, ex.: 1536x1024)`);
  return { width: Number(m[1]), height: Number(m[2]) };
}

export async function fitExactly(buf: Buffer, width: number, height: number): Promise<Buffer> {
  return sharp(buf).resize(width, height, { fit: "cover", position: "centre" }).png().toBuffer();
}

export async function toJpeg(buf: Buffer, maxEdge?: number, quality = 88): Promise<Buffer> {
  let img = sharp(buf);
  if (maxEdge) img = img.resize({ width: maxEdge, height: maxEdge, fit: "inside", withoutEnlargement: true });
  return img.jpeg({ quality, mozjpeg: true }).toBuffer();
}

const EDGE_WIDTH = 512;

async function edgeMap(buf: Buffer, width: number, height: number): Promise<Float32Array> {
  const { data } = await sharp(buf).greyscale().resize(width, height, { fit: "fill" }).blur(1).raw().toBuffer({ resolveWithObject: true });
  const mag = new Float32Array(width * height);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const p = (dx: number, dy: number) => data[(y + dy) * width + (x + dx)];
      const gx = -p(-1, -1) - 2 * p(-1, 0) - p(-1, 1) + p(1, -1) + 2 * p(1, 0) + p(1, 1);
      const gy = -p(-1, -1) - 2 * p(0, -1) - p(1, -1) + p(-1, 1) + 2 * p(0, 1) + p(1, 1);
      mag[y * width + x] = Math.hypot(gx, gy);
    }
  }
  return boxBlur(mag, width, height, 3);
}

function boxBlur(src: Float32Array, w: number, h: number, r: number): Float32Array {
  const tmp = new Float32Array(src.length);
  const out = new Float32Array(src.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let s = 0, n = 0;
      for (let k = Math.max(0, x - r); k <= Math.min(w - 1, x + r); k++) { s += src[y * w + k]; n++; }
      tmp[y * w + x] = s / n;
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let s = 0, n = 0;
      for (let k = Math.max(0, y - r); k <= Math.min(h - 1, y + r); k++) { s += tmp[k * w + x]; n++; }
      out[y * w + x] = s / n;
    }
  }
  return out;
}

// Correlação dos mapas de borda só na faixa superior (teto, topo das paredes, janelas),
// onde móveis raramente entram. 1 = idêntico; perto de 0 = estrutura diferente.
export async function structureEdgeScore(before: Buffer, after: Buffer, band = 0.4): Promise<number> {
  const meta = await sharp(before).metadata();
  const width = EDGE_WIDTH;
  const height = Math.round((EDGE_WIDTH * (meta.height ?? 1)) / (meta.width ?? 1));
  const [a, b] = await Promise.all([edgeMap(before, width, height), edgeMap(after, width, height)]);
  const rows = Math.floor(height * band);
  const n = rows * width;
  let ma = 0, mb = 0;
  for (let i = 0; i < n; i++) { ma += a[i]; mb += b[i]; }
  ma /= n; mb /= n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    const x = a[i] - ma, y = b[i] - mb;
    num += x * y; da += x * x; db += y * y;
  }
  if (da === 0 || db === 0) return da === db ? 1 : 0;
  return num / Math.sqrt(da * db);
}
