import { Router } from "express";
import { ZipArchive } from "archiver";
import { eq } from "drizzle-orm";
import { PORTALS, ROOM_LABELS } from "@imob/shared";
import { db } from "../../db/client";
import { photos } from "../../db/schema";
import { notFound, parseId, sendStored } from "../../shared/http";
import { storage } from "../../shared/storage";
import { currentUser } from "../auth/auth.middleware";
import { getOwnedProperty } from "../properties/properties.service";
import { requestPublish } from "./publishing.service";

export const publishingRouter = Router();

const safeName = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "imovel";

publishingRouter.post("/properties/:id/publish", async (req, res) => {
  res.json(await requestPublish(currentUser(req).id, parseId(req.params.id)));
});

publishingRouter.get("/properties/:id/downloads/dossier.pdf", async (req, res) => {
  const property = await getOwnedProperty(currentUser(req).id, parseId(req.params.id));
  if (!property.dossierKey) throw notFound("O imóvel ainda não foi publicado.");
  res.attachment(`dossie-${safeName(property.title)}.pdf`);
  await sendStored(res, storage, property.dossierKey, "application/pdf", "revalidate");
});

publishingRouter.get("/properties/:id/downloads/qrcode.png", async (req, res) => {
  const property = await getOwnedProperty(currentUser(req).id, parseId(req.params.id));
  if (!property.qrKey) throw notFound("O imóvel ainda não foi publicado.");
  await sendStored(res, storage, property.qrKey, "image/png", "revalidate");
});

publishingRouter.get("/properties/:id/downloads/portals/:portal.zip", async (req, res) => {
  const property = await getOwnedProperty(currentUser(req).id, parseId(req.params.id));
  const portal = PORTALS.find((p) => p.id === req.params.portal);
  if (!portal) throw notFound("Portal desconhecido.");
  const rows = (await db.select().from(photos).where(eq(photos.propertyId, property.id)))
    .filter((p) => p.final?.exports[portal.id])
    .sort((a, b) => a.position - b.position);
  if (rows.length === 0) throw notFound("O imóvel ainda não foi publicado.");

  res.attachment(`${safeName(property.title)}-${portal.id}.zip`);
  const zip = new ZipArchive({ zlib: { level: 0 } });
  zip.on("error", (err: Error) => res.destroy(err));
  zip.pipe(res);
  for (const [i, p] of rows.entries()) {
    const room = p.roomConfirmed ? ROOM_LABELS[p.roomConfirmed] : "foto";
    zip.append(await storage.read(p.final!.exports[portal.id]), { name: `${String(i + 1).padStart(2, "0")}-${safeName(room)}.jpg` });
  }
  await zip.finalize();
});
