import { privacyAlerts, type PhotoDTO, type PropertyDetailDTO, type PropertyStatus, type PropertySummaryDTO, type StagingSummaryDTO } from "@imob/shared";
import type { PhotoRow, PropertyRow } from "../../db/schema";

export function derivePropertyStatus(photos: Pick<PhotoRow, "status">[]): PropertyStatus {
  if (photos.length === 0) return "draft";
  if (photos.some((p) => p.status === "classifying")) return "processing";
  return "ready";
}

export const thumbUrlOf = (photoId: string) => `/api/photos/${photoId}/thumb`;

export function toPhotoDTO(photo: PhotoRow): PhotoDTO {
  const c = photo.classification;
  return {
    id: photo.id,
    position: photo.position,
    sourceName: photo.sourceName,
    status: photo.status,
    error: photo.error,
    sha256: photo.sha256,
    thumbUrl: thumbUrlOf(photo.id),
    originalUrl: `/api/photos/${photo.id}/view`,
    roomSuggested: c?.comodo ?? null,
    roomConfidence: c?.confianca ?? null,
    roomConfirmed: photo.roomConfirmed,
    alerts: c ? privacyAlerts(c) : [],
  };
}

export function toPropertySummaryDTO(p: PropertyRow, photos: PhotoRow[], stagings: StagingSummaryDTO[]): PropertySummaryDTO {
  const sorted = [...photos].sort((a, b) => a.position - b.position);
  const published = stagings.find((s) => s.status === "published");
  return {
    id: p.id,
    title: p.title,
    status: derivePropertyStatus(sorted),
    coverUrl: published?.coverUrl ?? stagings[0]?.coverUrl ?? (sorted[0] ? thumbUrlOf(sorted[0].id) : null),
    photoCount: photos.length,
    stagingCount: stagings.length,
    publishedCount: stagings.filter((s) => s.publishedAt).length,
    createdAt: p.createdAt.toISOString(),
  };
}

export function toPropertyDetailDTO(p: PropertyRow, photos: PhotoRow[], stagings: StagingSummaryDTO[]): PropertyDetailDTO {
  return {
    ...toPropertySummaryDTO(p, photos, stagings),
    details: {
      description: p.description,
      purpose: p.purpose,
      price: p.price,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      parkingSpots: p.parkingSpots,
      areaM2: p.areaM2,
      neighborhood: p.neighborhood,
      city: p.city,
    },
    photos: [...photos].sort((a, b) => a.position - b.position).map(toPhotoDTO),
    stagings,
  };
}
