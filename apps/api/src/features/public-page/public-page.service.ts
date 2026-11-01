import { eq } from "drizzle-orm";
import { renderPublicPage, type PublicPagePhoto } from "@imob/core";
import { ROOM_LABELS } from "@imob/shared";
import { db } from "../../db/client";
import { photos, stagingPhotos, type PhotoRow, type PropertyRow, type StagingPhotoRow, type StagingRow } from "../../db/schema";
import { resolveProfile } from "../profile/profile.service";

interface PageOptions {
  staging: StagingRow;
  property: PropertyRow;
  preview: boolean;
  /** Endereço da imagem decorada de cada foto, ou null para não exibir a foto. */
  photoSrc: (photo: PhotoRow, row: StagingPhotoRow) => string | null;
  logoSrc: (logoKey: string) => string;
}

// Mesma página para a rota pública e para a prévia autenticada; só mudam as fontes das imagens.
export async function renderStagingPage({ staging, property, preview, photoSrc, logoSrc }: PageOptions): Promise<string> {
  const [rows, profile] = await Promise.all([
    db.select({ photo: photos, row: stagingPhotos }).from(stagingPhotos).innerJoin(photos, eq(photos.id, stagingPhotos.photoId)).where(eq(stagingPhotos.stagingId, staging.id)),
    resolveProfile(property.userId),
  ]);
  const pagePhotos: PublicPagePhoto[] = rows
    .sort((a, b) => a.photo.position - b.photo.position)
    .flatMap(({ photo, row }) => {
      const src = photoSrc(photo, row);
      return src ? [{ roomLabel: photo.roomConfirmed ? ROOM_LABELS[photo.roomConfirmed] : "Foto", decoratedSrc: src }] : [];
    });

  return renderPublicPage({
    title: property.title,
    publishedAt: staging.publishedAt ?? new Date(),
    registry: staging.auditHead ?? "",
    theme: staging.pageTheme,
    preview,
    brand: {
      name: profile.companyName,
      color: profile.brandColor,
      logoSrc: profile.logoKey ? logoSrc(profile.logoKey) : null,
      whatsapp: profile.whatsapp,
      phone: profile.phone,
      creci: profile.creci,
    },
    details: {
      description: property.description,
      purpose: property.purpose,
      price: property.price,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      parkingSpots: property.parkingSpots,
      areaM2: property.areaM2,
      neighborhood: property.neighborhood,
      city: property.city,
    },
    photos: pagePhotos,
  });
}
