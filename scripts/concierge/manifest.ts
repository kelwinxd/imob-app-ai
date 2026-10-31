import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Classification, Quality, Room, Standard, Style, VariationCheck } from "@imob/shared";

export interface Variation {
  index: number;
  file: string;
  sha256: string;
  check?: VariationCheck;
}

export interface Generation {
  createdAt: string;
  model: string;
  quality: Quality;
  size: string;
  templateVersion: string;
  room: Room;
  style: Style;
  standard: Standard;
  prompt: string;
  inputFile: string;
  inputSha256: string;
  usage: unknown;
  variations: Variation[];
}

export interface PhotoEntry {
  id: string;
  sourceName: string;
  originalFile: string;
  sha256: string;
  originalWidth: number;
  originalHeight: number;
  exifPresent: boolean;
  workingFile: string;
  ingestedAt: string;
  classification?: Classification & { model: string; classifiedAt: string };
  generation?: Generation;
  final?: {
    variation: number;
    operatorConfirmedReview: boolean;
    file: string;
    sha256: string;
    sealText: string;
    exports: Record<string, string>;
    publishedAt: string;
  };
}

export interface Manifest {
  schema: 1;
  property: {
    title: string;
    createdAt: string;
    style?: Style;
    standard?: Standard;
    publicUrl?: string;
  };
  photos: PhotoEntry[];
  dossier?: { file: string; sha256: string; createdAt: string; auditHead: string };
}

export interface RoomsFileEntry {
  arquivo: string;
  sugerido: Room;
  confianca: number;
  alertas: string[];
  confirmado: Room;
  publicar: boolean;
}
export type RoomsFile = Record<string, RoomsFileEntry>;
export type ChoicesFile = Record<string, number | null>;

export const outPaths = (out: string) => ({
  manifest: join(out, "manifest.json"),
  rooms: join(out, "comodos.json"),
  choices: join(out, "escolhas.json"),
  events: join(out, "eventos.jsonl"),
});

export async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(file, "utf8")) as T;
}

export async function writeJson(file: string, data: unknown): Promise<void> {
  await writeFile(file, JSON.stringify(data, null, 2) + "\n", "utf8");
}

export async function loadManifest(out: string): Promise<Manifest> {
  const file = outPaths(out).manifest;
  if (!existsSync(file)) throw new Error(`Nenhum manifest.json em ${out}. Rode "classificar" primeiro.`);
  return readJson<Manifest>(file);
}

export async function saveManifest(out: string, m: Manifest): Promise<void> {
  await mkdir(out, { recursive: true });
  await writeJson(outPaths(out).manifest, m);
}
