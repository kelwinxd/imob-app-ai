import { Router } from "express";
import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "../../db/client";
import { properties, stagingPhotos, stagings } from "../../db/schema";
import { notFound, parseId } from "../../shared/http";
import { storage } from "../../shared/storage";
import { resolveProfile } from "../profile/profile.service";
import { renderStagingPage } from "./public-page.service";

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
  const base = `/i/${staging.slug}`;
  const html = await renderStagingPage({
    staging,
    property,
    preview: false,
    photoSrc: (photo, row) => (row.final ? `${base}/img/${photo.id}/decorada.jpg?v=${row.final.sha256.slice(0, 12)}` : null),
    logoSrc: (logoKey) => `${base}/logo.png?v=${logoKey.slice(-16, -4)}`,
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

// Só a versão decorada (com selo) é pública; as originais ficam no dossiê.
publicPageRouter.get("/:slug/img/:photoId/decorada.jpg", async (req, res) => {
  const { staging } = await publishedStaging(req.params.slug);
  const [row] = await db
    .select()
    .from(stagingPhotos)
    .where(and(eq(stagingPhotos.stagingId, staging.id), eq(stagingPhotos.photoId, parseId(req.params.photoId))));
  if (!row?.final) throw notFound();
  res.setHeader("Cache-Control", "public, max-age=300");
  res.type("image/jpeg").send(await storage.read(row.final.key));
});
