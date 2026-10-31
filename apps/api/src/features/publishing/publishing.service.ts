import { randomBytes } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import QRCode from "qrcode";
import { buildDossier, renderFinal, sha256, shortUrlOf, type DossierPhoto } from "@imob/core";
import { ROOM_LABELS, STANDARD_INFO, STYLE_INFO, type PropertyDetailDTO } from "@imob/shared";
import { db } from "../../db/client";
import { generations, photos, properties, variations, type PhotoFinal } from "../../db/schema";
import { conflict, errorMessage } from "../../shared/http";
import { enqueue, QUEUES } from "../../shared/queue";
import { keys, storage } from "../../shared/storage";
import { appendEvent, verifyPropertyChain } from "../audit/audit.service";
import { derivePropertyStatus, publicUrlOf } from "../properties/properties.mapper";
import { getOwnedProperty, getPropertyDetail } from "../properties/properties.service";

const SLUG_ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";
const randomSlug = () => [...randomBytes(10)].map((b) => SLUG_ALPHABET[b % SLUG_ALPHABET.length]).join("");

export async function requestPublish(userId: string, propertyId: string): Promise<PropertyDetailDTO> {
  const property = await getOwnedProperty(userId, propertyId);
  const rows = await db.select().from(photos).where(eq(photos.propertyId, propertyId));
  const status = derivePropertyStatus(property, rows);
  if (status === "publishing") throw conflict("O imóvel já está sendo publicado.");
  if (!["choosing", "published", "publish_failed"].includes(status)) {
    throw conflict("Decore todas as fotos marcadas antes de publicar.", "NOT_READY");
  }
  const included = rows.filter((p) => p.include);
  if (included.some((p) => !p.chosenVariationId)) throw conflict("Escolha uma variação para cada foto antes de publicar.", "MISSING_CHOICE");

  await db.update(properties).set({ publishState: "publishing", publishError: null }).where(eq(properties.id, propertyId));
  await enqueue(QUEUES.publishProperty, { propertyId });
  return getPropertyDetail(userId, propertyId);
}

export async function publishPropertyJob(propertyId: string): Promise<void> {
  const [property] = await db.select().from(properties).where(eq(properties.id, propertyId));
  if (!property || property.publishState !== "publishing") return;

  try {
    const slug = property.slug ?? randomSlug();
    const publicUrl = publicUrlOf(slug);
    const rows = (await db.select().from(photos).where(eq(photos.propertyId, propertyId))).sort((a, b) => a.position - b.position);
    const selected = rows.filter((p) => p.include && p.chosenVariationId && p.currentGenerationId);
    const genIds = selected.map((p) => p.currentGenerationId!);
    const [genRows, varRows] = await Promise.all([
      db.select().from(generations).where(inArray(generations.id, genIds)),
      db.select().from(variations).where(inArray(variations.generationId, genIds)),
    ]);

    const dossierPhotos: DossierPhoto[] = [];
    for (const [i, p] of selected.entries()) {
      const gen = genRows.find((g) => g.id === p.currentGenerationId)!;
      const chosen = varRows.find((v) => v.id === p.chosenVariationId)!;
      if (chosen.verdict === "reprovado") throw new Error(`A variação escolhida da foto ${i + 1} foi reprovada.`);
      const items = chosen.check.vision.itens_adicionados;
      const rendered = await renderFinal(await storage.read(chosen.key), items, shortUrlOf(publicUrl));

      const finalKey = keys.final(propertyId, p.id);
      await storage.put(finalKey, rendered.final);
      const exports: Record<string, string> = {};
      for (const [portal, buf] of Object.entries(rendered.exports)) {
        exports[portal] = keys.portal(propertyId, p.id, portal);
        await storage.put(exports[portal], buf);
      }
      const final: PhotoFinal = {
        key: finalKey, sha256: rendered.finalSha256, sealText: rendered.sealText, items,
        variationId: chosen.id, variationIndex: chosen.index, operatorConfirmedReview: p.reviewConfirmed,
        exports, publishedAt: new Date().toISOString(),
      };
      await db.update(photos).set({ final }).where(eq(photos.id, p.id));
      await appendEvent(propertyId, "publicar_foto", {
        foto: p.id, variacao: chosen.index, sha256_selo: rendered.finalSha256, selo: rendered.sealText, revisao_confirmada: p.reviewConfirmed,
      });

      dossierPhotos.push({
        label: String(i + 1).padStart(2, "0"),
        roomLabel: ROOM_LABELS[gen.room],
        roomSuggestedLabel: p.classification ? ROOM_LABELS[p.classification.comodo] : null,
        sourceName: p.sourceName,
        receivedAt: p.createdAt.toISOString(),
        originalWidth: p.originalWidth,
        originalHeight: p.originalHeight,
        exifPresent: p.exifPresent,
        sha256: p.sha256,
        original: await storage.read(p.viewKey),
        final: rendered.final,
        finalSha256: rendered.finalSha256,
        sealText: rendered.sealText,
        operatorConfirmedReview: p.reviewConfirmed,
        generation: { createdAt: gen.createdAt.toISOString(), model: gen.model, quality: gen.quality, size: gen.size, templateVersion: gen.templateVersion, prompt: gen.prompt },
        chosen: { index: chosen.index, sha256: chosen.sha256, check: chosen.check },
        others: varRows.filter((v) => v.generationId === gen.id && v.id !== chosen.id).map((v) => ({ index: v.index, verdict: v.verdict })),
      });
    }

    const excluded = rows.filter((p) => !selected.includes(p) && p.final).map((p) => p.id);
    if (excluded.length) await db.update(photos).set({ final: null }).where(inArray(photos.id, excluded));

    const qrPng = await QRCode.toBuffer(publicUrl, { type: "png", width: 600, margin: 2, errorCorrectionLevel: "M" });
    const qrKey = keys.qrcode(propertyId);
    await storage.put(qrKey, qrPng);
    await appendEvent(propertyId, "pagina_publica", { url: publicUrl, fotos: selected.map((p) => p.id) });

    const chain = await verifyPropertyChain(propertyId);
    if (!chain.ok) throw new Error(`Registro de eventos corrompido no evento ${chain.brokenAt}.`);
    const pdf = await buildDossier({
      title: property.title,
      style: property.style ? STYLE_INFO[property.style].label : "-",
      standard: property.standard ? STANDARD_INFO[property.standard].label : "-",
      publicUrl, qrPng, auditHead: chain.head, photos: dossierPhotos,
    });
    const dossierKey = keys.dossier(propertyId);
    await storage.put(dossierKey, pdf);
    const pdfHash = sha256(pdf);
    await appendEvent(propertyId, "dossie", { sha256: pdfHash, registro_no_dossie: chain.head });

    await db
      .update(properties)
      .set({ slug, publishState: "published", publishError: null, publishedAt: new Date(), qrKey, dossierKey, dossierSha256: pdfHash, auditHead: chain.head })
      .where(and(eq(properties.id, propertyId), eq(properties.publishState, "publishing")));
  } catch (err) {
    console.error(`[publicar ${propertyId}]`, err);
    await db.update(properties).set({ publishState: "failed", publishError: `A publicação falhou: ${errorMessage(err)}` }).where(eq(properties.id, propertyId));
  }
}
