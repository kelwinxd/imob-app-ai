import { PORTALS } from "@imob/shared";
import { sha256, toJpeg } from "./imaging";
import { renderPortal, sealText, stamp } from "./seal";

export interface RenderedFinal {
  sealText: string;
  final: Buffer;
  finalSha256: string;
  exports: Record<string, Buffer>;
}

export async function renderFinal(decorated: Buffer, items: string[], shortUrl: string): Promise<RenderedFinal> {
  const seal = sealText(items, shortUrl);
  const final = await toJpeg(await stamp(decorated, seal), undefined, 90);
  const exports: Record<string, Buffer> = {};
  for (const fmt of PORTALS) exports[fmt.id] = await renderPortal(decorated, fmt, seal);
  return { sealText: seal, final, finalSha256: sha256(final), exports };
}

export const shortUrlOf = (url: string) => url.replace(/^https?:\/\//, "").replace(/\/+$/, "");
