import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { defaultChoice, runGeneration, toJpeg } from "@imob/core";
import { GenerateInputSchema, type ChooseVariationInput, type GenerateInput, type StagingDetailDTO } from "@imob/shared";
import { db } from "../../db/client";
import { generations, photos, stagingPhotos, stagingReferences, stagings, variations } from "../../db/schema";
import { env } from "../../env";
import { getAi, getTemplates } from "../../shared/ai";
import { badRequest, conflict, errorMessage, notFound, unprocessable } from "../../shared/http";
import { enqueue, QUEUES } from "../../shared/queue";
import { keys, storage } from "../../shared/storage";
import { appendEvent } from "../audit/audit.service";
import { deriveStagingStatus, getOwnedStaging, getStagingDetail, loadBundle, needsGeneration } from "../stagings/stagings.model";

export async function startGeneration(userId: string, stagingId: string, rawInput: GenerateInput): Promise<StagingDetailDTO> {
  const input = GenerateInputSchema.parse(rawInput);
  const { staging, property } = await getOwnedStaging(userId, stagingId);
  if (!staging.style || !staging.standard) throw badRequest("Escolha o estilo e o padrão antes de gerar.");
  const bundle = await loadBundle(staging, property);
  if (deriveStagingStatus(staging, bundle.photos) === "publishing") throw conflict("A decoração está sendo publicada. Aguarde terminar.");
  if (bundle.photos.some((p) => p.photo.status === "classifying")) throw conflict("Aguarde terminar a identificação dos cômodos.");

  const targets = input.photoIds
    ? bundle.photos.filter((p) => input.photoIds!.includes(p.photo.id))
    : bundle.photos.filter((p) => needsGeneration(bundle, p));
  if (input.photoIds && targets.length !== input.photoIds.length) throw notFound("Foto não encontrada.");
  if (targets.some((p) => !p.include)) throw badRequest("Marque a foto para decorar antes de gerar.");
  if (targets.some((p) => p.status === "generating")) throw conflict("Esta foto já está sendo gerada.");
  if (targets.length === 0) throw conflict("Todas as fotos marcadas já foram decoradas com essas escolhas.", "NOTHING_TO_GENERATE");

  for (const p of targets) {
    await db
      .insert(stagingPhotos)
      .values({ stagingId, photoId: p.photo.id, include: true, status: "generating", error: null })
      .onConflictDoUpdate({ target: [stagingPhotos.stagingId, stagingPhotos.photoId], set: { status: "generating", error: null } });
  }
  if (staging.publishState !== "none") await db.update(stagings).set({ publishState: "none", publishError: null }).where(eq(stagings.id, stagingId));
  for (const p of targets) await enqueue(QUEUES.generatePhoto, { stagingId, photoId: p.photo.id, variations: input.variations });
  return getStagingDetail(userId, stagingId);
}

export async function chooseVariation(userId: string, stagingId: string, photoId: string, input: ChooseVariationInput): Promise<StagingDetailDTO> {
  const { staging } = await getOwnedStaging(userId, stagingId);
  if (staging.publishState === "publishing") throw conflict("A decoração está sendo publicada. Aguarde terminar.");
  const [row] = await db.select().from(stagingPhotos).where(and(eq(stagingPhotos.stagingId, stagingId), eq(stagingPhotos.photoId, photoId)));
  const [variation] = await db.select().from(variations).where(and(eq(variations.id, input.variationId), eq(variations.photoId, photoId)));
  if (!row || !variation || variation.generationId !== row.currentGenerationId) throw notFound("Variação não encontrada.");
  if (variation.verdict === "reprovado") throw unprocessable("Essa variação foi reprovada na trava de estrutura e não pode ser publicada.", "VARIATION_REJECTED");
  if (variation.verdict === "revisar" && !input.confirmReview) {
    throw unprocessable("Essa variação precisa de revisão. Confira a foto e confirme para usá-la.", "REVIEW_CONFIRMATION_REQUIRED");
  }

  await db
    .update(stagingPhotos)
    .set({ chosenVariationId: variation.id, reviewConfirmed: variation.verdict === "revisar" })
    .where(and(eq(stagingPhotos.stagingId, stagingId), eq(stagingPhotos.photoId, photoId)));
  if (staging.publishState !== "none") await db.update(stagings).set({ publishState: "none" }).where(eq(stagings.id, stagingId));
  await appendEvent(staging.propertyId, "escolher_variacao", { decoracao: stagingId, foto: photoId, variacao: variation.index, veredito: variation.verdict });
  return getStagingDetail(userId, stagingId);
}

export async function generatePhotoJob({ stagingId, photoId, variations: count }: { stagingId: string; photoId: string; variations: number }): Promise<void> {
  const [row] = await db.select().from(stagingPhotos).where(and(eq(stagingPhotos.stagingId, stagingId), eq(stagingPhotos.photoId, photoId)));
  if (!row || row.status !== "generating") return;
  const fail = (message: string) =>
    db.update(stagingPhotos).set({ status: "failed", error: message }).where(and(eq(stagingPhotos.stagingId, stagingId), eq(stagingPhotos.photoId, photoId)));

  try {
    const [[staging], [photo], refs] = await Promise.all([
      db.select().from(stagings).where(eq(stagings.id, stagingId)),
      db.select().from(photos).where(eq(photos.id, photoId)),
      db.select().from(stagingReferences).where(eq(stagingReferences.stagingId, stagingId)),
    ]);
    if (!staging?.style || !staging.standard || !photo?.roomConfirmed) throw new Error("Estilo, padrão ou cômodo não definido.");
    const sortedRefs = refs.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    const outcome = await runGeneration({
      ai: getAi(),
      templates: await getTemplates(),
      working: await storage.read(photo.workingKey),
      room: photo.roomConfirmed,
      style: staging.style,
      standard: staging.standard,
      quality: env.IMAGE_QUALITY,
      variations: count,
      furnitureColors: staging.furnitureColors,
      references: await Promise.all(sortedRefs.map((r) => storage.read(r.key))),
    });

    const generationId = randomUUID();
    const inputKey = keys.generationInput(staging.propertyId, photo.id, generationId);
    await storage.put(inputKey, outcome.input);
    const varRows: (typeof variations.$inferInsert)[] = [];
    for (const v of outcome.variations) {
      const key = keys.variation(staging.propertyId, photo.id, generationId, v.index);
      const previewKey = keys.variationPreview(staging.propertyId, photo.id, generationId, v.index);
      await storage.put(key, v.image);
      await storage.put(previewKey, await toJpeg(v.image, 1600, 85));
      varRows.push({
        id: randomUUID(), generationId, photoId: photo.id, index: v.index, key, previewKey,
        sha256: v.sha256, verdict: v.check.verdict, check: v.check, edgeScore: v.check.edgeScore,
      });
    }
    const chosen = varRows.find((v) => v.index === defaultChoice(outcome.variations));
    const options = { furnitureColors: staging.furnitureColors, referenceSha256: sortedRefs.map((r) => r.sha256) };

    await db.transaction(async (tx) => {
      await tx.insert(generations).values({
        id: generationId, stagingId, photoId: photo.id, model: outcome.model, quality: outcome.quality, size: outcome.size,
        templateVersion: outcome.templateVersion, room: photo.roomConfirmed!, style: staging.style!, standard: staging.standard!, options,
        prompt: outcome.prompt, inputKey, inputSha256: outcome.inputSha256, usage: outcome.usage, createdAt: new Date(outcome.createdAt),
      });
      await tx.insert(variations).values(varRows);
      await tx
        .update(stagingPhotos)
        .set({ status: "generated", error: null, currentGenerationId: generationId, chosenVariationId: chosen?.id ?? null, reviewConfirmed: false })
        .where(and(eq(stagingPhotos.stagingId, stagingId), eq(stagingPhotos.photoId, photoId)));
    });
    await appendEvent(staging.propertyId, "gerar", {
      decoracao: stagingId, foto: photo.id, modelo: outcome.model, tamanho: outcome.size, instrucoes: outcome.templateVersion,
      estilo: staging.style, padrao: staging.standard, comodo: photo.roomConfirmed, cores: staging.furnitureColors,
      referencias: options.referenceSha256, entrada_sha256: outcome.inputSha256,
      variacoes: varRows.map((v) => ({ n: v.index, sha256: v.sha256, veredito: v.verdict, bordas: Number(v.edgeScore!.toFixed(3)) })),
    });
  } catch (err) {
    console.error(`[gerar ${stagingId}/${photoId}]`, err);
    await fail(`A geração falhou: ${errorMessage(err)}`);
  }
}
