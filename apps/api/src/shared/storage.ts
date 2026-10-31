import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { env } from "../env";

export interface Storage {
  put(key: string, data: Buffer): Promise<void>;
  read(key: string): Promise<Buffer>;
  exists(key: string): boolean;
}

// Implementação em disco para desenvolvimento; a interface é a mesma que um storage S3/R2 vai implementar.
class LocalStorage implements Storage {
  constructor(private readonly root: string) {}

  private pathOf(key: string): string {
    const full = resolve(this.root, key);
    const rel = relative(this.root, full);
    if (!rel || rel.startsWith("..") || isAbsolute(rel)) throw new Error(`Chave de storage inválida: ${key}`);
    return full;
  }

  async put(key: string, data: Buffer) {
    const file = this.pathOf(key);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, data);
  }

  read(key: string) {
    return readFile(this.pathOf(key));
  }

  exists(key: string) {
    return existsSync(this.pathOf(key));
  }
}

export const storage: Storage = new LocalStorage(env.STORAGE_DIR);

export const keys = {
  photoDir: (propertyId: string, photoId: string) => `properties/${propertyId}/photos/${photoId}`,
  original: (propertyId: string, photoId: string, ext: string) => `${keys.photoDir(propertyId, photoId)}/original${ext}`,
  working: (propertyId: string, photoId: string) => `${keys.photoDir(propertyId, photoId)}/working.png`,
  view: (propertyId: string, photoId: string) => `${keys.photoDir(propertyId, photoId)}/view.jpg`,
  thumb: (propertyId: string, photoId: string) => `${keys.photoDir(propertyId, photoId)}/thumb.jpg`,
  generationInput: (propertyId: string, photoId: string, generationId: string) =>
    `${keys.photoDir(propertyId, photoId)}/generations/${generationId}/input.png`,
  variation: (propertyId: string, photoId: string, generationId: string, index: number) =>
    `${keys.photoDir(propertyId, photoId)}/generations/${generationId}/v${index}.png`,
  variationPreview: (propertyId: string, photoId: string, generationId: string, index: number) =>
    `${keys.photoDir(propertyId, photoId)}/generations/${generationId}/v${index}-preview.jpg`,
  final: (propertyId: string, photoId: string) => `${keys.photoDir(propertyId, photoId)}/final.jpg`,
  portal: (propertyId: string, photoId: string, portal: string) => `${keys.photoDir(propertyId, photoId)}/portals/${portal}.jpg`,
  qrcode: (propertyId: string) => `properties/${propertyId}/qrcode.png`,
  dossier: (propertyId: string) => `properties/${propertyId}/dossier.pdf`,
};
