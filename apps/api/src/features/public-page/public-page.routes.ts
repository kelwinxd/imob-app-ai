import { Router } from "express";
import { and, eq, isNotNull } from "drizzle-orm";
import { renderPublicPage } from "@imob/core";
import { ROOM_LABELS } from "@imob/shared";
import { db } from "../../db/client";
import { photos, properties, stagingPhotos, stagings } from "../../db/schema";
import { notFound, parseId } from "../../shared/http";
import { storage } from "../../shared/storage";
import { resolveProfile } from "../profile/profile.service";

export const publicPageRouter = Router();

const SLUG = /^[a-z0-9]{6,32}$/;

async function publishedStaging(slug: string) {
  if (!SLUG.test(slug)) throw notFound("Página não encontrada.");
  const [row] = await db
    .select({ staging: stagings, property: properties })
    .from(stagings)
    .innerJoin(properties, eq(properties.id, stagings.propertyId))
    .where(and(eq(stagings.slug, slug), isNotNull(stagings.publishedAt)));
  if (!row) throw notFound("Página não encontrada.");
  return row;
}

// Marca e dados do imóvel são lidos na hora: editar o perfil ou a descrição atualiza a página sem publicar de novo.
publicPageRouter.get("/:slug", async (req, res) => {
  const { staging, property } = await publishedStaging(req.params.slug);
  const [rows, profile] = await Promise.all([
    db
      .select({ photo: photos, row: stagingPhotos })
      .from(stagingPhotos)
      .innerJoin(photos, eq(photos.id, stagingPhotos.photoId))
      .where(and(eq(stagingPhotos.stagingId, staging.id), isNotNull(stagingPhotos.final))),
    resolveProfile(property.userId),
  ]);
  const base = `/i/${staging.slug}`;
  const html = renderPublicPage({
    title: property.title,
    publishedAt: staging.publishedAt!,
    registry: staging.auditHead ?? "",
    theme: staging.pageTheme,
    compare: staging.pageCompare,
    brand: {
      name: profile.companyName,
      color: profile.brandColor,
      logoSrc: profile.logoKey ? `${base}/logo.png?v=${profile.logoKey.slice(-16, -4)}` : null,
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
    photos: rows
      .sort((a, b) => a.photo.position - b.photo.position)
      .map(({ photo, row }) => ({
        roomLabel: photo.roomConfirmed ? ROOM_LABELS[photo.roomConfirmed] : "Foto",
        originalSrc: `${base}/img/${photo.id}/original.jpg`,
        decoratedSrc: `${base}/img/${photo.id}/decorada.jpg?v=${row.final!.sha256.slice(0, 12)}`,
        items: row.final!.items,
      })),
  });
  res.setHeader("X-Robots-Tag", "noindex");
  res.setHeader("Cache-Control", "public, max-age=60");
  res.type("html").send(html);
});

publicPageRouter.get("/:slug/logo.png", async (req, res) => {
  const { property } = await publishedStaging(req.params.slug);
  const profile = await resolveProfile(property.userId);
  if (!profile.logoKey) throw notFound();
  res.setHeader("Cache-Control", "public, max-age=300");
  res.type("image/png").send(await storage.read(profile.logoKey));
});

publicPageRouter.get("/:slug/img/:photoId/:kind", async (req, res) => {
  const { staging } = await publishedStaging(req.params.slug);
  const photoId = parseId(req.params.photoId);
  const [row] = await db
    .select({ photo: photos, row: stagingPhotos })
    .from(stagingPhotos)
    .innerJoin(photos, eq(photos.id, stagingPhotos.photoId))
    .where(and(eq(stagingPhotos.stagingId, staging.id), eq(stagingPhotos.photoId, photoId)));
  if (!row?.row.final) throw notFound();
  const key = req.params.kind === "original.jpg" ? row.photo.viewKey : req.params.kind === "decorada.jpg" ? row.row.final.key : null;
  if (!key) throw notFound();
  res.setHeader("Cache-Control", "public, max-age=300");
  res.type("image/jpeg").send(await storage.read(key));
});
