import { randomUUID } from "node:crypto";
import { extname } from "node:path";
import { and, eq } from "drizzle-orm";
import { makeWorkingCopy, sha256, toJpeg } from "@imob/core";
import {
  ACCEPTED_IMAGE_TYPES, MAX_PHOTOS_PER_PROPERTY,
  type PropertyDetailDTO, type UpdatePhotoInput,
} from "@imob/shared";
import { db } from "../../db/client";
import { photos, properties, type PhotoRow, type PropertyRow } from "../../db/schema";
import { getAi } from "../../shared/ai";
import { badRequest, conflict, errorMessage, notFound } from "../../shared/http";
import { enqueue, QUEUES } from "../../shared/queue";
import { keys, storage } from "../../shared/storage";
import { appendEvent } from "../audit/audit.service";
import { getOwnedProperty, getPropertyDetail, loadPropertyDetail } from "../properties/properties.service";

export interface UploadedFile {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
}

const EXT_BY_TYPE: Record<string, string> = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" };

export async function getOwnedPhoto(userId: string, photoId: string): Promise<{ photo: PhotoRow; property: PropertyRow }> {
  const [row] = await db
    .select({ photo: photos, property: properties })
    .from(photos)
    .innerJoin(properties, eq(properties.id, photos.propertyId))
    .where(and(eq(photos.id, photoId), eq(properties.userId, userId)));
  if (!row) throw notFound("Foto não encontrada.");
  return row;
}

export async function uploadPhotos(userId: string, propertyId: string, files: UploadedFile[]): Promise<PropertyDetailDTO> {
  const property = await getOwnedProperty(userId, propertyId);
  if (files.length === 0) throw badRequest("Selecione pelo menos uma foto.");

  const existing = await db.select({ position: photos.position }).from(photos).where(eq(photos.propertyId, propertyId));
  if (existing.length + files.length > MAX_PHOTOS_PER_PROPERTY) {
    throw badRequest(`Cada imóvel aceita até ${MAX_PHOTOS_PER_PROPERTY} fotos. Já há ${existing.length}.`);
  }
  for (const f of files) {
    if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(f.mimetype)) {
      throw badRequest(`"${f.originalname}" não é JPG, PNG ou WEBP. Fotos HEIC do iPhone precisam ser convertidas para JPG.`);
    }
  }

  let position = existing.reduce((max, p) => Math.max(max, p.position), 0);
  for (const file of files) {
    let work: Awaited<ReturnType<typeof makeWorkingCopy>>;
    try {
      work = await makeWorkingCopy(file.buffer);
    } catch {
      throw badRequest(`Não foi possível ler "${file.originalname}" como imagem.`);
    }
    const id = randomUUID();
    const ext = EXT_BY_TYPE[file.mimetype] ?? extname(file.originalname).toLowerCase();
    const hash = sha256(file.buffer);
    const k = {
      original: keys.original(propertyId, id, ext),
      working: keys.working(propertyId, id),
      view: keys.view(propertyId, id),
      thumb: keys.thumb(propertyId, id),
    };
    await storage.put(k.original, file.buffer);
    if (sha256(await storage.read(k.original)) !== hash) throw new Error(`Cópia de ${file.originalname} não confere com o original.`);
    await storage.put(k.working, work.buffer);
    await storage.put(k.view, await toJpeg(work.buffer, 1600, 85));
    await storage.put(k.thumb, await toJpeg(work.buffer, 640, 80));

    position += 1;
    await db.insert(photos).values({
      id, propertyId, position, sourceName: file.originalname.slice(0, 200),
      originalKey: k.original, workingKey: k.working, viewKey: k.view, thumbKey: k.thumb,
      sha256: hash, originalWidth: work.originalWidth, originalHeight: work.originalHeight, exifPresent: work.exifPresent,
      status: "classifying",
    });
    await appendEvent(propertyId, "receber_foto", { foto: id, arquivo: file.originalname, sha256: hash });
    await enqueue(QUEUES.classifyPhoto, { photoId: id });
  }
  return loadPropertyDetail(property);
}

export async function updatePhoto(userId: string, photoId: string, input: UpdatePhotoInput): Promise<PropertyDetailDTO> {
  const { photo, property } = await getOwnedPhoto(userId, photoId);
  if (photo.status === "classifying") throw conflict("Aguarde terminar a identificação do cômodo.");
  // Se a classificação falhou, o corretor pode informar o cômodo e seguir.
  const patch: Partial<PhotoRow> = photo.status === "failed" ? { roomConfirmed: input.roomConfirmed, status: "ready", error: null } : { roomConfirmed: input.roomConfirmed };
  await db.update(photos).set(patch).where(eq(photos.id, photoId));
  return getPropertyDetail(userId, property.id);
}

export async function classifyPhotoJob(photoId: string): Promise<void> {
  const [photo] = await db.select().from(photos).where(eq(photos.id, photoId));
  if (!photo || photo.status !== "classifying") return;
  try {
    const ai = getAi();
    const c = await ai.classify(await storage.read(photo.workingKey));
    await db
      .update(photos)
      .set({
        classification: { ...c, model: ai.visionModel, classifiedAt: new Date().toISOString() },
        roomConfirmed: photo.roomConfirmed ?? c.comodo,
        status: "ready",
        error: null,
      })
      .where(eq(photos.id, photoId));
    await appendEvent(photo.propertyId, "classificar", { foto: photoId, ...c });
  } catch (err) {
    console.error(`[classificar ${photoId}]`, err);
    await db.update(photos).set({ status: "failed", error: `Não foi possível identificar o cômodo: ${errorMessage(err)}` }).where(eq(photos.id, photoId));
  }
}

export async function retryClassification(userId: string, photoId: string): Promise<PropertyDetailDTO> {
  const { photo, property } = await getOwnedPhoto(userId, photoId);
  if (photo.status !== "failed" || photo.classification) throw conflict("Esta foto não precisa ser classificada de novo.");
  await db.update(photos).set({ status: "classifying", error: null }).where(eq(photos.id, photoId));
  await enqueue(QUEUES.classifyPhoto, { photoId });
  return loadPropertyDetail(property);
}
