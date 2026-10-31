import { randomBytes } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import QRCode from "qrcode";
import { buildDossier, renderFinal, sha256, shortUrlOf, type DossierPhoto } from "@imob/core";
import { FURNITURE_COLORS, ROOM_LABELS, STANDARD_INFO, STYLE_INFO, type StagingDetailDTO } from "@imob/shared";
import { db } from "../../db/client";
import { generations, properties, stagingPhotos, stagings, variations, type PhotoFinal } from "../../db/schema";
import { conflict, errorMessage } from "../../shared/http";
import { enqueue, QUEUES } from "../../shared/queue";
import { keys, storage } from "../../shared/storage";
import { appendEvent, verifyPropertyChain } from "../audit/audit.service";
import { deriveStagingStatus, getOwnedStaging, getStagingDetail, loadBundle, publicUrlOf } from "../stagings/stagings.model";

const SLUG_ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";
const randomSlug = () => [...randomBytes(10)].map((b) => SLUG_ALPHABET[b % SLUG_ALPHABET.length]).join("");

export async function requestPublish(userId: string, stagingId: string): Promise<StagingDetailDTO> {
  const { staging, property } = await getOwnedStaging(userId, stagingId);
  const bundle = await loadBundle(staging, property);
  const status = deriveStagingStatus(staging, bundle.photos);
  if (status === "publishing") throw conflict("A decoração já está sendo publicada.");
  if (!["choosing", "published", "publish_failed"].includes(status)) throw conflict("Decore todas as fotos marcadas antes de publicar.", "NOT_READY");
  if (bundle.photos.some((p) => p.include && !p.row?.chosenVariationId)) {
    throw conflict("Escolha uma variação para cada foto antes de publicar.", "MISSING_CHOICE");
  }
  await db.update(stagings).set({ publishState: "publishing", publishError: null }).where(eq(stagings.id, stagingId));
  await enqueue(QUEUES.publishStaging, { stagingId });
  return getStagingDetail(userId, stagingId);
}

export async function publishStagingJob(stagingId: string): Promise<void> {
  const [staging] = await db.select().from(stagings).where(eq(stagings.id, stagingId));
  if (!staging || staging.publishState !== "publishing") return;

  try {
    const [property] = await db.select().from(properties).where(eq(properties.id, staging.propertyId));
    const bundle = await loadBundle(staging, property);
    const slug = staging.slug ?? randomSlug();
    const publicUrl = publicUrlOf(slug);
    const selected = bundle.photos.filter((p) => p.include && p.row?.chosenVariationId && p.row.currentGenerationId);
    const genIds = selected.map((p) => p.row!.currentGenerationId!);
    const [genRows, varRows] = await Promise.all([
      db.select().from(generations).where(inArray(generations.id, genIds)),
      db.select().from(variations).where(inArray(variations.generationId, genIds)),
    ]);

    const dossierPhotos: DossierPhoto[] = [];
    for (const [i, p] of selected.entries()) {
      const row = p.row!;
      const gen = genRows.find((g) => g.id === row.currentGenerationId)!;
      const chosen = varRows.find((v) => v.id === row.chosenVariationId)!;
      if (chosen.verdict === "reprovado") throw new Error(`A variação escolhida da foto ${i + 1} foi reprovada.`);
      const items = chosen.check.vision.itens_adicionados;
      const rendered = await renderFinal(await storage.read(chosen.key), items, shortUrlOf(publicUrl));

      const finalKey = keys.stagingFinal(property.id, stagingId, p.photo.id);
      await storage.put(finalKey, rendered.final);
      const exports: Record<string, string> = {};
      for (const [portal, buf] of Object.entries(rendered.exports)) {
        exports[portal] = keys.stagingPortal(property.id, stagingId, p.photo.id, portal);
        await storage.put(exports[portal], buf);
      }
      const final: PhotoFinal = {
        key: finalKey, sha256: rendered.finalSha256, sealText: rendered.sealText, items,
        variationId: chosen.id, variationIndex: chosen.index, operatorConfirmedReview: row.reviewConfirmed,
        exports, publishedAt: new Date().toISOString(),
      };
      await db.update(stagingPhotos).set({ final }).where(and(eq(stagingPhotos.stagingId, stagingId), eq(stagingPhotos.photoId, p.photo.id)));
      await appendEvent(property.id, "publicar_foto", {
        decoracao: stagingId, foto: p.photo.id, variacao: chosen.index, sha256_selo: rendered.finalSha256, selo: rendered.sealText,
        revisao_confirmada: row.reviewConfirmed,
      });

      const colors = gen.options.furnitureColors.map((id) => FURNITURE_COLORS.find((c) => c.id === id)?.label ?? id);
      dossierPhotos.push({
        label: String(i + 1).padStart(2, "0"),
        roomLabel: ROOM_LABELS[gen.room],
        roomSuggestedLabel: p.photo.classification ? ROOM_LABELS[p.photo.classification.comodo] : null,
        sourceName: p.photo.sourceName,
        receivedAt: p.photo.createdAt.toISOString(),
        originalWidth: p.photo.originalWidth,
        originalHeight: p.photo.originalHeight,
        exifPresent: p.photo.exifPresent,
        sha256: p.photo.sha256,
        original: await storage.read(p.photo.viewKey),
        final: rendered.final,
        finalSha256: rendered.finalSha256,
        sealText: rendered.sealText,
        operatorConfirmedReview: row.reviewConfirmed,
        generation: {
          createdAt: gen.createdAt.toISOString(), model: gen.model, quality: gen.quality, size: gen.size, templateVersion: gen.templateVersion,
          prompt: [gen.prompt, colors.length ? `[Cores escolhidas: ${colors.join(", ")}]` : "", gen.options.referenceSha256.length ? `[Imagens de referência (SHA-256): ${gen.options.referenceSha256.join(", ")}]` : ""].filter(Boolean).join("\n"),
        },
        chosen: { index: chosen.index, sha256: chosen.sha256, check: chosen.check },
        others: varRows.filter((v) => v.generationId === gen.id && v.id !== chosen.id).map((v) => ({ index: v.index, verdict: v.verdict })),
      });
    }

    const excluded = bundle.photos.filter((p) => !selected.includes(p) && p.row?.final).map((p) => p.photo.id);
    if (excluded.length) {
      await db.update(stagingPhotos).set({ final: null }).where(and(eq(stagingPhotos.stagingId, stagingId), inArray(stagingPhotos.photoId, excluded)));
    }

    const qrPng = await QRCode.toBuffer(publicUrl, { type: "png", width: 600, margin: 2, errorCorrectionLevel: "M" });
    const qrKey = keys.stagingQr(property.id, stagingId);
    await storage.put(qrKey, qrPng);
    await appendEvent(property.id, "pagina_publica", { decoracao: stagingId, url: publicUrl, fotos: selected.map((p) => p.photo.id) });

    const chain = await verifyPropertyChain(property.id);
    if (!chain.ok) throw new Error(`Registro de eventos corrompido no evento ${chain.brokenAt}.`);
    const pdf = await buildDossier({
      title: `${property.title} — ${staging.name}`,
      style: staging.style ? STYLE_INFO[staging.style].label : "-",
      standard: staging.standard ? STANDARD_INFO[staging.standard].label : "-",
      publicUrl, qrPng, auditHead: chain.head, photos: dossierPhotos,
    });
    const dossierKey = keys.stagingDossier(property.id, stagingId);
    await storage.put(dossierKey, pdf);
    const pdfHash = sha256(pdf);
    await appendEvent(property.id, "dossie", { decoracao: stagingId, sha256: pdfHash, registro_no_dossie: chain.head });

    await db
      .update(stagings)
      .set({ slug, publishState: "published", publishError: null, publishedAt: new Date(), qrKey, dossierKey, dossierSha256: pdfHash, auditHead: chain.head })
      .where(and(eq(stagings.id, stagingId), eq(stagings.publishState, "publishing")));
  } catch (err) {
    console.error(`[publicar ${stagingId}]`, err);
    await db.update(stagings).set({ publishState: "failed", publishError: `A publicação falhou: ${errorMessage(err)}` }).where(eq(stagings.id, stagingId));
  }
}
