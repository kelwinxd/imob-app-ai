import { randomUUID } from "node:crypto";
import { and, count, eq } from "drizzle-orm";
import { sha256, toJpeg } from "@imob/core";
import {
  ACCEPTED_IMAGE_TYPES, MAX_REFERENCE_IMAGES,
  type CreateStagingInput, type StagingDetailDTO, type UpdateStagingInput, type UpdateStagingPhotoInput,
} from "@imob/shared";
import { db } from "../../db/client";
import { generations, stagingPhotos, stagingReferences, stagings } from "../../db/schema";
import { getAi } from "../../shared/ai";
import { badRequest, conflict, notFound, unprocessable } from "../../shared/http";
import { keys, storage } from "../../shared/storage";
import { appendEvent } from "../audit/audit.service";
import { getOwnedProperty } from "../properties/properties.service";
import { deriveStagingStatus, getOwnedStaging, getStagingDetail, loadBundle, toStagingDetail } from "./stagings.model";

const BUSY_MESSAGE = "Esta decoração está sendo gerada ou publicada. Aguarde terminar.";

// Segunda barreira do pedido livre (a primeira são as regras fixas no schema): a IA confere se é só sobre decoração.
async function assertInstructionInScope(text: string) {
  let review;
  try {
    review = await getAi().reviewInstruction(text);
  } catch (err) {
    console.error("[revisar pedido]", err);
    throw unprocessable("Não foi possível revisar o pedido agora. Tente de novo em instantes.", "INSTRUCTION_REVIEW_FAILED");
  }
  if (!review.permitido) {
    const reason = review.motivo.trim();
    const message = reason ? `Pedido recusado: ${reason.charAt(0).toLowerCase()}${reason.slice(1).replace(/\.?$/, ".")}` : "O pedido precisa ser só sobre móveis, decoração e disposição dos móveis.";
    throw unprocessable(message, "INSTRUCTION_OUT_OF_SCOPE");
  }
}

async function assertNotBusy(userId: string, stagingId: string) {
  const { staging, property } = await getOwnedStaging(userId, stagingId);
  const bundle = await loadBundle(staging, property);
  const status = deriveStagingStatus(staging, bundle.photos);
  if (status === "publishing") throw conflict(BUSY_MESSAGE);
  return { staging, property, bundle, status };
}

export async function createStaging(userId: string, propertyId: string, input: CreateStagingInput): Promise<StagingDetailDTO> {
  const property = await getOwnedProperty(userId, propertyId);
  const [{ total }] = await db.select({ total: count() }).from(stagings).where(eq(stagings.propertyId, propertyId));
  const [staging] = await db
    .insert(stagings)
    .values({ propertyId, name: input.name ?? `Decoração ${total + 1}` })
    .returning();
  await appendEvent(propertyId, "criar_decoracao", { decoracao: staging.id, nome: staging.name });
  return toStagingDetail(await loadBundle(staging, property));
}

export async function updateStaging(userId: string, stagingId: string, input: UpdateStagingInput): Promise<StagingDetailDTO> {
  const { status, staging } = await assertNotBusy(userId, stagingId);
  const changesLook =
    input.style !== undefined || input.standard !== undefined || input.furnitureColors !== undefined || input.customInstructions !== undefined;
  if (changesLook && status === "generating") throw conflict(BUSY_MESSAGE);
  if (input.customInstructions && input.customInstructions !== staging.customInstructions) {
    await assertInstructionInScope(input.customInstructions);
  }
  const patch = Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined));
  if (Object.keys(patch).length) await db.update(stagings).set(patch).where(eq(stagings.id, stagingId));
  if (input.publicEnabled !== undefined && input.publicEnabled !== staging.publicEnabled) {
    await appendEvent(staging.propertyId, input.publicEnabled ? "ativar_pagina" : "desativar_pagina", { decoracao: stagingId, pagina: staging.slug });
  }
  return getStagingDetail(userId, stagingId);
}

export async function deleteStaging(userId: string, stagingId: string): Promise<void> {
  const { staging, status } = await assertNotBusy(userId, stagingId);
  if (status === "generating") throw conflict(BUSY_MESSAGE);
  const gens = await db.select({ id: generations.id, photoId: generations.photoId }).from(generations).where(eq(generations.stagingId, stagingId));
  await db.delete(stagings).where(eq(stagings.id, stagingId));
  await storage.removePrefix(keys.stagingDir(staging.propertyId, stagingId));
  for (const g of gens) await storage.removePrefix(keys.generationDir(staging.propertyId, g.photoId, g.id));
  await appendEvent(staging.propertyId, "excluir_decoracao", { decoracao: stagingId, nome: staging.name, pagina: staging.slug });
}

export async function updateStagingPhoto(userId: string, stagingId: string, photoId: string, input: UpdateStagingPhotoInput): Promise<StagingDetailDTO> {
  const { bundle } = await assertNotBusy(userId, stagingId);
  const p = bundle.photos.find((x) => x.photo.id === photoId);
  if (!p) throw notFound("Foto não encontrada.");
  if (p.status === "generating") throw conflict("Esta foto está sendo gerada. Aguarde terminar.");
  if (input.include && !p.eligible) throw badRequest("Confirme o cômodo desta foto antes de decorá-la.");
  await db
    .insert(stagingPhotos)
    .values({ stagingId, photoId, include: input.include })
    .onConflictDoUpdate({ target: [stagingPhotos.stagingId, stagingPhotos.photoId], set: { include: input.include } });
  if (bundle.staging.publishState !== "none" && bundle.staging.publishState !== "publishing") {
    await db.update(stagings).set({ publishState: "none" }).where(eq(stagings.id, stagingId));
  }
  return getStagingDetail(userId, stagingId);
}

export async function addReferences(userId: string, stagingId: string, files: { originalname: string; mimetype: string; buffer: Buffer }[]): Promise<StagingDetailDTO> {
  const { bundle, status } = await assertNotBusy(userId, stagingId);
  if (status === "generating") throw conflict(BUSY_MESSAGE);
  if (files.length === 0) throw badRequest("Selecione pelo menos uma imagem.");
  if (bundle.references.length + files.length > MAX_REFERENCE_IMAGES) {
    throw badRequest(`Cada decoração aceita até ${MAX_REFERENCE_IMAGES} imagens de móveis.`);
  }
  for (const f of files) {
    if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(f.mimetype)) throw badRequest(`"${f.originalname}" não é JPG, PNG ou WEBP.`);
  }
  for (const f of files) {
    let jpg: Buffer;
    try {
      jpg = await toJpeg(f.buffer, 1280, 85);
    } catch {
      throw badRequest(`Não foi possível ler "${f.originalname}" como imagem.`);
    }
    const id = randomUUID();
    const key = keys.reference(bundle.property.id, stagingId, id);
    await storage.put(key, jpg);
    await db.insert(stagingReferences).values({ id, stagingId, key, sha256: sha256(jpg) });
  }
  return getStagingDetail(userId, stagingId);
}

export async function removeReference(userId: string, stagingId: string, referenceId: string): Promise<StagingDetailDTO> {
  const { status } = await assertNotBusy(userId, stagingId);
  if (status === "generating") throw conflict(BUSY_MESSAGE);
  await db.delete(stagingReferences).where(and(eq(stagingReferences.id, referenceId), eq(stagingReferences.stagingId, stagingId)));
  return getStagingDetail(userId, stagingId);
}

export async function getReference(userId: string, stagingId: string, referenceId: string) {
  await getOwnedStaging(userId, stagingId);
  const [ref] = await db.select().from(stagingReferences).where(and(eq(stagingReferences.id, referenceId), eq(stagingReferences.stagingId, stagingId)));
  if (!ref) throw notFound("Imagem não encontrada.");
  return ref;
}

export async function getStagingPhotoFinal(userId: string, stagingId: string, photoId: string) {
  await getOwnedStaging(userId, stagingId);
  const [row] = await db.select().from(stagingPhotos).where(and(eq(stagingPhotos.stagingId, stagingId), eq(stagingPhotos.photoId, photoId)));
  if (!row?.final) throw notFound("Esta foto ainda não foi publicada.");
  return row.final;
}
