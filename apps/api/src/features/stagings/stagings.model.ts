import { and, eq, inArray } from "drizzle-orm";
import {
  PORTALS, shouldIncludeByDefault,
  type StagingDetailDTO, type StagingPhotoDTO, type StagingPhotoStatus, type StagingStatus, type StagingSummaryDTO,
} from "@imob/shared";
import { db } from "../../db/client";
import {
  generations, photos, properties, stagingPhotos, stagingReferences, stagings, variations,
  type GenerationRow, type PhotoRow, type PropertyRow, type StagingPhotoRow, type StagingReferenceRow, type StagingRow, type VariationRow,
} from "../../db/schema";
import { env } from "../../env";
import { notFound } from "../../shared/http";
import { thumbUrlOf } from "../properties/properties.mapper";

export const publicUrlOf = (slug: string) => `${env.PUBLIC_BASE_URL}/i/${slug}`;
export const finalUrlOf = (stagingId: string, photoId: string, sha: string) => `/api/stagings/${stagingId}/photos/${photoId}/final?v=${sha.slice(0, 12)}`;

export interface EffectivePhoto {
  photo: PhotoRow;
  row: StagingPhotoRow | null;
  eligible: boolean;
  include: boolean;
  status: StagingPhotoStatus;
}

export const defaultInclude = (photo: PhotoRow) => (photo.classification ? shouldIncludeByDefault(photo.classification) : true);

// Fotos novas no imóvel ainda não têm linha na decoração: valem os padrões até a primeira alteração.
export function effectivePhotos(photoRows: PhotoRow[], rows: StagingPhotoRow[]): EffectivePhoto[] {
  const byPhoto = new Map(rows.map((r) => [r.photoId, r]));
  return [...photoRows]
    .sort((a, b) => a.position - b.position)
    .map((photo) => {
      const row = byPhoto.get(photo.id) ?? null;
      const eligible = photo.status === "ready" && Boolean(photo.roomConfirmed);
      return { photo, row, eligible, include: eligible && (row?.include ?? defaultInclude(photo)), status: row?.status ?? "pending" };
    });
}

export function deriveStagingStatus(s: StagingRow, eff: EffectivePhoto[]): StagingStatus {
  if (s.publishState === "publishing") return "publishing";
  const included = eff.filter((p) => p.include);
  if (included.some((p) => p.status === "generating")) return "generating";
  if (included.length > 0 && included.every((p) => p.status === "generated")) {
    if (s.publishState === "published") return "published";
    if (s.publishState === "failed") return "publish_failed";
    return "choosing";
  }
  return s.style && s.standard ? "ready" : "draft";
}

function coverOf(s: StagingRow, eff: EffectivePhoto[]): string | null {
  const first = eff.find((p) => p.include) ?? eff[0];
  if (!first) return null;
  if (first.row?.final) return finalUrlOf(s.id, first.photo.id, first.row.final.sha256);
  if (first.row?.chosenVariationId) return `/api/variations/${first.row.chosenVariationId}/preview`;
  return thumbUrlOf(first.photo.id);
}

export function toStagingSummary(s: StagingRow, eff: EffectivePhoto[]): StagingSummaryDTO {
  return {
    id: s.id,
    name: s.name,
    status: deriveStagingStatus(s, eff),
    style: s.style,
    standard: s.standard,
    coverUrl: coverOf(s, eff),
    publicUrl: s.slug && s.publishedAt ? publicUrlOf(s.slug) : null,
    createdAt: s.createdAt.toISOString(),
    publishedAt: s.publishedAt?.toISOString() ?? null,
  };
}

export async function stagingSummariesFor(propertyIds: string[], photoRows: PhotoRow[]): Promise<Map<string, StagingSummaryDTO[]>> {
  const out = new Map<string, StagingSummaryDTO[]>();
  if (propertyIds.length === 0) return out;
  const sRows = await db.select().from(stagings).where(inArray(stagings.propertyId, propertyIds));
  const spRows = sRows.length ? await db.select().from(stagingPhotos).where(inArray(stagingPhotos.stagingId, sRows.map((s) => s.id))) : [];
  for (const s of sRows.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())) {
    const eff = effectivePhotos(photoRows.filter((p) => p.propertyId === s.propertyId), spRows.filter((r) => r.stagingId === s.id));
    const list = out.get(s.propertyId) ?? [];
    list.push(toStagingSummary(s, eff));
    out.set(s.propertyId, list);
  }
  return out;
}

export interface StagingBundle {
  staging: StagingRow;
  property: PropertyRow;
  photos: EffectivePhoto[];
  generations: Map<string, GenerationRow>;
  variations: VariationRow[];
  references: StagingReferenceRow[];
}

export async function getOwnedStaging(userId: string, stagingId: string): Promise<{ staging: StagingRow; property: PropertyRow }> {
  const [row] = await db
    .select({ staging: stagings, property: properties })
    .from(stagings)
    .innerJoin(properties, eq(properties.id, stagings.propertyId))
    .where(and(eq(stagings.id, stagingId), eq(properties.userId, userId)));
  if (!row) throw notFound("Decoração não encontrada.");
  return row;
}

export async function loadBundle(staging: StagingRow, property: PropertyRow): Promise<StagingBundle> {
  const [photoRows, spRows, refs] = await Promise.all([
    db.select().from(photos).where(eq(photos.propertyId, property.id)),
    db.select().from(stagingPhotos).where(eq(stagingPhotos.stagingId, staging.id)),
    db.select().from(stagingReferences).where(eq(stagingReferences.stagingId, staging.id)),
  ]);
  const genIds = spRows.map((r) => r.currentGenerationId).filter((id): id is string => Boolean(id));
  const [genRows, varRows] = genIds.length
    ? await Promise.all([
        db.select().from(generations).where(inArray(generations.id, genIds)),
        db.select().from(variations).where(inArray(variations.generationId, genIds)),
      ])
    : [[], []];
  return {
    staging,
    property,
    photos: effectivePhotos(photoRows, spRows),
    generations: new Map(genRows.map((g) => [g.id, g])),
    variations: varRows,
    references: refs.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
  };
}

const sameSet = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((x) => b.includes(x));

export function needsGeneration(b: StagingBundle, p: EffectivePhoto): boolean {
  if (!p.include || p.status === "generating") return false;
  const gen = p.row?.currentGenerationId ? b.generations.get(p.row.currentGenerationId) : undefined;
  if (!gen || p.status === "failed") return true;
  return (
    gen.style !== b.staging.style ||
    gen.standard !== b.staging.standard ||
    gen.room !== p.photo.roomConfirmed ||
    !sameSet(gen.options.furnitureColors, b.staging.furnitureColors) ||
    (gen.options.customInstructions ?? "") !== b.staging.customInstructions ||
    !sameSet(gen.options.referenceSha256, b.references.map((r) => r.sha256))
  );
}

export function toStagingDetail(b: StagingBundle): StagingDetailDTO {
  const s = b.staging;
  const photoDTOs: StagingPhotoDTO[] = b.photos.map((p) => {
    const gen = p.row?.currentGenerationId ? b.generations.get(p.row.currentGenerationId) : undefined;
    return {
      photoId: p.photo.id,
      position: p.photo.position,
      sourceName: p.photo.sourceName,
      thumbUrl: thumbUrlOf(p.photo.id),
      originalUrl: `/api/photos/${p.photo.id}/view`,
      roomConfirmed: p.photo.roomConfirmed,
      photoStatus: p.photo.status,
      eligible: p.eligible,
      include: p.include,
      needsGeneration: needsGeneration(b, p),
      status: p.status,
      error: p.row?.error ?? null,
      generation: gen ? { createdAt: gen.createdAt.toISOString(), model: gen.model, size: gen.size, templateVersion: gen.templateVersion } : null,
      variations: b.variations
        .filter((v) => gen && v.generationId === gen.id)
        .sort((a, c) => a.index - c.index)
        .map((v) => ({ id: v.id, index: v.index, verdict: v.verdict, check: v.check, previewUrl: `/api/variations/${v.id}/preview`, imageUrl: `/api/variations/${v.id}/image` })),
      chosenVariationId: p.row?.chosenVariationId ?? null,
      finalUrl: p.row?.final ? finalUrlOf(s.id, p.photo.id, p.row.final.sha256) : null,
    };
  });
  return {
    ...toStagingSummary(s, b.photos),
    propertyId: b.property.id,
    propertyTitle: b.property.title,
    furnitureColors: s.furnitureColors,
    customInstructions: s.customInstructions,
    pageTheme: s.pageTheme,
    references: b.references.map((r) => ({ id: r.id, url: `/api/stagings/${s.id}/references/${r.id}` })),
    publishError: s.publishError,
    photos: photoDTOs,
    published:
      s.slug && s.publishedAt && s.dossierSha256
        ? {
            publicUrl: publicUrlOf(s.slug),
            qrcodeUrl: `/api/stagings/${s.id}/downloads/qrcode.png`,
            dossierUrl: `/api/stagings/${s.id}/downloads/dossier.pdf`,
            dossierSha256: s.dossierSha256,
            portals: PORTALS.map((f) => ({ id: f.id, label: f.label, url: `/api/stagings/${s.id}/downloads/portals/${f.id}.zip` })),
          }
        : null,
  };
}

export async function getStagingDetail(userId: string, stagingId: string): Promise<StagingDetailDTO> {
  const { staging, property } = await getOwnedStaging(userId, stagingId);
  return toStagingDetail(await loadBundle(staging, property));
}
