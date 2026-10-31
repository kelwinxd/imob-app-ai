import { randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { defaultChoice, runGeneration, toJpeg } from "@imob/core";
import type { ChooseVariationInput, GenerateInput, PropertyDetailDTO } from "@imob/shared";
import { db } from "../../db/client";
import { generations, photos, properties, variations } from "../../db/schema";
import { env } from "../../env";
import { getAi, getTemplates } from "../../shared/ai";
import { badRequest, conflict, errorMessage, notFound, unprocessable } from "../../shared/http";
import { enqueue, QUEUES } from "../../shared/queue";
import { keys, storage } from "../../shared/storage";
import { appendEvent } from "../audit/audit.service";
import { getOwnedPhoto } from "../photos/photos.service";
import { getOwnedProperty, getPropertyDetail } from "../properties/properties.service";

export async function startGeneration(userId: string, propertyId: string, input: GenerateInput): Promise<PropertyDetailDTO> {
  const property = await getOwnedProperty(userId, propertyId);
  if (property.publishState === "publishing") throw conflict("O imóvel está sendo publicado. Aguarde terminar.");

  const rows = await db.select().from(photos).where(eq(photos.propertyId, propertyId));
  const included = rows.filter((p) => p.include);
  if (included.length === 0) throw badRequest("Marque pelo menos uma foto para decorar.");
  if (rows.some((p) => p.status === "classifying")) throw conflict("Aguarde terminar a identificação dos cômodos.");
  if (included.some((p) => !p.roomConfirmed)) throw badRequest("Confirme o cômodo de todas as fotos marcadas.");

  const genIds = included.map((p) => p.currentGenerationId).filter((id): id is string => Boolean(id));
  const current = genIds.length ? await db.select().from(generations).where(inArray(generations.id, genIds)) : [];
  const genByPhoto = new Map(current.map((g) => [g.photoId, g]));

  // Só gera de novo o que mudou: foto nova, com erro, ou com estilo/padrão/cômodo diferentes do pedido.
  const targets = included.filter((p) => {
    if (p.status === "generating") return false;
    const g = genByPhoto.get(p.id);
    return !g || p.status === "failed" || g.style !== input.style || g.standard !== input.standard || g.room !== p.roomConfirmed;
  });
  if (targets.length === 0 && !included.some((p) => p.status === "generating")) {
    throw conflict("Todas as fotos já foram decoradas com esse estilo e padrão.", "NOTHING_TO_GENERATE");
  }

  await db.update(properties).set({ style: input.style, standard: input.standard, publishState: "none", publishError: null }).where(eq(properties.id, propertyId));
  if (targets.length) {
    await db.update(photos).set({ status: "generating", error: null }).where(inArray(photos.id, targets.map((p) => p.id)));
    for (const p of targets) await enqueue(QUEUES.generatePhoto, { photoId: p.id });
  }
  return getPropertyDetail(userId, propertyId);
}

export async function regeneratePhoto(userId: string, photoId: string): Promise<PropertyDetailDTO> {
  const { photo, property } = await getOwnedPhoto(userId, photoId);
  if (!property.style || !property.standard) throw badRequest("Escolha o estilo e o padrão antes de gerar.");
  if (property.publishState === "publishing") throw conflict("O imóvel está sendo publicado. Aguarde terminar.");
  if (!photo.include) throw badRequest("Marque a foto para decorar antes de gerar.");
  if (!photo.roomConfirmed) throw badRequest("Confirme o cômodo da foto antes de gerar.");
  if (photo.status === "generating" || photo.status === "classifying") throw conflict("Esta foto já está sendo processada.");

  await db.update(photos).set({ status: "generating", error: null }).where(eq(photos.id, photoId));
  await db.update(properties).set({ publishState: "none", publishError: null }).where(eq(properties.id, property.id));
  await enqueue(QUEUES.generatePhoto, { photoId });
  return getPropertyDetail(userId, property.id);
}

export async function chooseVariation(userId: string, photoId: string, input: ChooseVariationInput): Promise<PropertyDetailDTO> {
  const { photo, property } = await getOwnedPhoto(userId, photoId);
  if (property.publishState === "publishing") throw conflict("O imóvel está sendo publicado. Aguarde terminar.");
  const [variation] = await db
    .select()
    .from(variations)
    .where(and(eq(variations.id, input.variationId), eq(variations.photoId, photoId)));
  if (!variation || variation.generationId !== photo.currentGenerationId) throw notFound("Variação não encontrada.");
  if (variation.verdict === "reprovado") throw unprocessable("Essa variação foi reprovada na trava de estrutura e não pode ser publicada.", "VARIATION_REJECTED");
  if (variation.verdict === "revisar" && !input.confirmReview) {
    throw unprocessable("Essa variação precisa de revisão. Confira a foto e confirme para usá-la.", "REVIEW_CONFIRMATION_REQUIRED");
  }

  await db
    .update(photos)
    .set({ chosenVariationId: variation.id, reviewConfirmed: variation.verdict === "revisar" })
    .where(eq(photos.id, photoId));
  if (property.publishState !== "none") await db.update(properties).set({ publishState: "none" }).where(eq(properties.id, property.id));
  await appendEvent(property.id, "escolher_variacao", { foto: photoId, variacao: variation.index, veredito: variation.verdict });
  return getPropertyDetail(userId, property.id);
}

export async function generatePhotoJob(photoId: string): Promise<void> {
  const [row] = await db
    .select({ photo: photos, property: properties })
    .from(photos)
    .innerJoin(properties, eq(properties.id, photos.propertyId))
    .where(eq(photos.id, photoId));
  if (!row || row.photo.status !== "generating") return;
  const { photo, property } = row;

  try {
    if (!property.style || !property.standard || !photo.roomConfirmed) throw new Error("Estilo, padrão ou cômodo não definido.");
    const outcome = await runGeneration({
      ai: getAi(),
      templates: await getTemplates(),
      working: await storage.read(photo.workingKey),
      room: photo.roomConfirmed,
      style: property.style,
      standard: property.standard,
      quality: env.IMAGE_QUALITY,
    });

    const generationId = randomUUID();
    const inputKey = keys.generationInput(property.id, photo.id, generationId);
    await storage.put(inputKey, outcome.input);
    const varRows: (typeof variations.$inferInsert)[] = [];
    for (const v of outcome.variations) {
      const key = keys.variation(property.id, photo.id, generationId, v.index);
      const previewKey = keys.variationPreview(property.id, photo.id, generationId, v.index);
      await storage.put(key, v.image);
      await storage.put(previewKey, await toJpeg(v.image, 1280, 82));
      varRows.push({
        id: randomUUID(), generationId, photoId: photo.id, index: v.index, key, previewKey,
        sha256: v.sha256, verdict: v.check.verdict, check: v.check, edgeScore: v.check.edgeScore,
      });
    }
    const choice = defaultChoice(outcome.variations);
    const chosen = varRows.find((v) => v.index === choice);

    await db.transaction(async (tx) => {
      await tx.insert(generations).values({
        id: generationId, photoId: photo.id, model: outcome.model, quality: outcome.quality, size: outcome.size,
        templateVersion: outcome.templateVersion, room: photo.roomConfirmed!, style: property.style!, standard: property.standard!,
        prompt: outcome.prompt, inputKey, inputSha256: outcome.inputSha256, usage: outcome.usage, createdAt: new Date(outcome.createdAt),
      });
      await tx.insert(variations).values(varRows);
      await tx
        .update(photos)
        .set({ status: "generated", error: null, currentGenerationId: generationId, chosenVariationId: chosen?.id ?? null, reviewConfirmed: false })
        .where(eq(photos.id, photo.id));
    });
    await appendEvent(property.id, "gerar", {
      foto: photo.id, modelo: outcome.model, tamanho: outcome.size, instrucoes: outcome.templateVersion,
      estilo: property.style, padrao: property.standard, comodo: photo.roomConfirmed, entrada_sha256: outcome.inputSha256,
      variacoes: varRows.map((v) => ({ n: v.index, sha256: v.sha256, veredito: v.verdict, bordas: Number(v.edgeScore.toFixed(3)) })),
    });
  } catch (err) {
    console.error(`[gerar ${photoId}]`, err);
    await db.update(photos).set({ status: "failed", error: `A geração falhou: ${errorMessage(err)}` }).where(eq(photos.id, photoId));
  }
}
