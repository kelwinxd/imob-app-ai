import {
  PORTALS, privacyAlerts,
  type PhotoDTO, type PropertyDetailDTO, type PropertyStatus, type PropertySummaryDTO, type VariationDTO,
} from "@imob/shared";
import { env } from "../../env";
import type { GenerationRow, PhotoRow, PropertyRow, VariationRow } from "../../db/schema";

export function derivePropertyStatus(p: PropertyRow, photos: Pick<PhotoRow, "status" | "include">[]): PropertyStatus {
  if (p.publishState === "publishing") return "publishing";
  if (photos.length === 0) return "draft";
  if (photos.some((ph) => ph.status === "classifying")) return "processing";
  const included = photos.filter((ph) => ph.include);
  if (included.some((ph) => ph.status === "generating")) return "generating";
  if (included.length > 0 && included.every((ph) => ph.status === "generated")) {
    if (p.publishState === "published") return "published";
    if (p.publishState === "failed") return "publish_failed";
    return "choosing";
  }
  return "ready";
}

export const publicUrlOf = (slug: string) => `${env.PUBLIC_BASE_URL}/i/${slug}`;

const toVariationDTO = (v: VariationRow): VariationDTO => ({
  id: v.id,
  index: v.index,
  verdict: v.verdict,
  check: v.check,
  previewUrl: `/api/variations/${v.id}/preview`,
  imageUrl: `/api/variations/${v.id}/image`,
});

export function toPhotoDTO(photo: PhotoRow, generation: GenerationRow | undefined, vars: VariationRow[]): PhotoDTO {
  const c = photo.classification;
  return {
    id: photo.id,
    position: photo.position,
    sourceName: photo.sourceName,
    status: photo.status,
    error: photo.error,
    sha256: photo.sha256,
    thumbUrl: `/api/photos/${photo.id}/thumb`,
    originalUrl: `/api/photos/${photo.id}/view`,
    roomSuggested: c?.comodo ?? null,
    roomConfidence: c?.confianca ?? null,
    roomConfirmed: photo.roomConfirmed,
    include: photo.include,
    alerts: c ? privacyAlerts(c) : [],
    generation: generation
      ? { createdAt: generation.createdAt.toISOString(), model: generation.model, size: generation.size, templateVersion: generation.templateVersion }
      : null,
    variations: vars.sort((a, b) => a.index - b.index).map(toVariationDTO),
    chosenVariationId: photo.chosenVariationId,
    finalUrl: photo.final ? `/api/photos/${photo.id}/final?v=${photo.final.sha256.slice(0, 12)}` : null,
  };
}

export function toPropertySummaryDTO(p: PropertyRow, photos: PhotoRow[]): PropertySummaryDTO {
  const cover = photos.find((ph) => ph.include) ?? photos[0];
  return {
    id: p.id,
    title: p.title,
    status: derivePropertyStatus(p, photos),
    coverUrl: cover ? (cover.final ? `/api/photos/${cover.id}/final?v=${cover.final.sha256.slice(0, 12)}` : `/api/photos/${cover.id}/thumb`) : null,
    photoCount: photos.length,
    createdAt: p.createdAt.toISOString(),
    publishedAt: p.publishedAt?.toISOString() ?? null,
  };
}

export function toPropertyDetailDTO(
  p: PropertyRow,
  photos: PhotoRow[],
  generations: GenerationRow[],
  variations: VariationRow[],
): PropertyDetailDTO {
  const sorted = [...photos].sort((a, b) => a.position - b.position);
  const genById = new Map(generations.map((g) => [g.id, g]));
  return {
    ...toPropertySummaryDTO(p, sorted),
    style: p.style,
    standard: p.standard,
    publishError: p.publishError,
    photos: sorted.map((ph) =>
      toPhotoDTO(
        ph,
        ph.currentGenerationId ? genById.get(ph.currentGenerationId) : undefined,
        variations.filter((v) => v.generationId === ph.currentGenerationId),
      ),
    ),
    published:
      p.slug && p.publishedAt && p.dossierSha256
        ? {
            publicUrl: publicUrlOf(p.slug),
            qrcodeUrl: `/api/properties/${p.id}/downloads/qrcode.png`,
            dossierUrl: `/api/properties/${p.id}/downloads/dossier.pdf`,
            dossierSha256: p.dossierSha256,
            portals: PORTALS.map((f) => ({ id: f.id, label: f.label, url: `/api/properties/${p.id}/downloads/portals/${f.id}.zip` })),
          }
        : null,
  };
}
