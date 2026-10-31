import sharp from "sharp";
import type { PortalFormat } from "@imob/shared";

export const escapeXml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export function joinPt(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} e ${items.at(-1)}`;
}

export function sealText(items: string[], shortUrl: string): string {
  const uniq = [...new Set(items.map((s) => s.trim().toLowerCase()).filter(Boolean))];
  const list = uniq.length > 4 ? `${uniq.slice(0, 4).join(", ")} e outros` : joinPt(uniq);
  const what = uniq.length ? `Móveis ilustrativos (IA): ${list}` : "Decoração ilustrativa (IA)";
  return `${what} · Foto original: ${shortUrl}`;
}

const CHAR_WIDTH = 0.53;

export async function stamp(img: Buffer, text: string): Promise<Buffer> {
  const meta = await sharp(img).metadata();
  const width = meta.width ?? 1024;
  const height = meta.height ?? 1024;
  const pad = Math.round(width * 0.02);
  const maxText = width - pad * 2;
  let font = Math.max(12, Math.round(width * 0.018));
  let lines = [text];
  const fits = () => Math.max(...lines.map((l) => l.length)) * font * CHAR_WIDTH <= maxText;
  if (!fits() && text.includes(" · ")) lines = text.split(" · ");
  while (!fits() && font > 10) font--;
  const lineHeight = Math.round(font * 1.35);
  const band = lineHeight * lines.length + Math.round(font * 0.9);
  const top = height - band;
  const tspans = lines
    .map((l, i) => `<text x="${pad}" y="${top + Math.round(font * 0.45) + lineHeight * (i + 1) - Math.round(font * 0.3)}">${escapeXml(l)}</text>`)
    .join("");
  const svg = Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">` +
      `<rect x="0" y="${top}" width="${width}" height="${band}" fill="#000" fill-opacity="0.62"/>` +
      `<g font-family="Arial, Helvetica, sans-serif" font-size="${font}" fill="#fff">${tspans}</g></svg>`,
  );
  return sharp(img).composite([{ input: svg }]).toBuffer();
}

export async function renderPortal(img: Buffer, fmt: PortalFormat, seal: string): Promise<Buffer> {
  let base: Buffer;
  if (fmt.fit === "inside") {
    base = await sharp(img).resize({ width: fmt.width, height: fmt.height, fit: "inside", withoutEnlargement: true }).png().toBuffer();
  } else {
    const bg = await sharp(img).resize(fmt.width, fmt.height, { fit: "cover" }).blur(40).modulate({ brightness: 0.7 }).png().toBuffer();
    const fg = await sharp(img).resize({ width: fmt.width, height: fmt.height, fit: "inside" }).png().toBuffer();
    base = await sharp(bg).composite([{ input: fg, gravity: "centre" }]).png().toBuffer();
  }
  return sharp(await stamp(base, seal)).jpeg({ quality: 86, mozjpeg: true }).toBuffer();
}
