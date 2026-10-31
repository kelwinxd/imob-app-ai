import { Router } from "express";
import { and, eq, isNotNull } from "drizzle-orm";
import { renderPublicPage } from "@imob/core";
import { ROOM_LABELS } from "@imob/shared";
import { db } from "../../db/client";
import { photos, properties } from "../../db/schema";
import { notFound, parseId } from "../../shared/http";
import { storage } from "../../shared/storage";

export const publicPageRouter = Router();

const SLUG = /^[a-z0-9]{6,32}$/;

async function publishedProperty(slug: string) {
  if (!SLUG.test(slug)) throw notFound("Página não encontrada.");
  const [property] = await db.select().from(properties).where(and(eq(properties.slug, slug), isNotNull(properties.publishedAt)));
  if (!property) throw notFound("Página não encontrada.");
  return property;
}

publicPageRouter.get("/:slug", async (req, res) => {
  const property = await publishedProperty(req.params.slug);
  const rows = (await db.select().from(photos).where(and(eq(photos.propertyId, property.id), isNotNull(photos.final)))).sort((a, b) => a.position - b.position);
  const base = `/i/${property.slug}/img`;
  const html = renderPublicPage({
    title: property.title,
    publishedAt: property.publishedAt!,
    registry: property.auditHead ?? "",
    photos: rows.map((p) => ({
      roomLabel: p.roomConfirmed ? ROOM_LABELS[p.roomConfirmed] : "Foto",
      originalSrc: `${base}/${p.id}/original.jpg`,
      decoratedSrc: `${base}/${p.id}/decorada.jpg?v=${p.final!.sha256.slice(0, 12)}`,
      items: p.final!.items,
    })),
  });
  res.setHeader("X-Robots-Tag", "noindex");
  res.setHeader("Cache-Control", "public, max-age=60");
  res.type("html").send(html);
});

publicPageRouter.get("/:slug/img/:photoId/:kind", async (req, res) => {
  const property = await publishedProperty(req.params.slug);
  const [photo] = await db.select().from(photos).where(and(eq(photos.id, parseId(req.params.photoId)), eq(photos.propertyId, property.id)));
  if (!photo?.final) throw notFound();
  const key = req.params.kind === "original.jpg" ? photo.viewKey : req.params.kind === "decorada.jpg" ? photo.final.key : null;
  if (!key) throw notFound();
  res.setHeader("Cache-Control", "public, max-age=300");
  res.type("image/jpeg").send(await storage.read(key));
});
