import { Router } from "express";
import { ZipArchive } from "archiver";
import { PORTALS, ROOM_LABELS } from "@imob/shared";
import { notFound, parseId, sendStored } from "../../shared/http";
import { storage } from "../../shared/storage";
import { currentUser } from "../auth/auth.middleware";
import { getOwnedStaging, loadBundle } from "../stagings/stagings.model";
import { requestPublish } from "./publishing.service";

export const publishingRouter = Router();

const safeName = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "imovel";

publishingRouter.post("/stagings/:id/publish", async (req, res) => {
  res.json(await requestPublish(currentUser(req).id, parseId(req.params.id)));
});

publishingRouter.get("/stagings/:id/downloads/dossier.pdf", async (req, res) => {
  const { staging, property } = await getOwnedStaging(currentUser(req).id, parseId(req.params.id));
  if (!staging.dossierKey) throw notFound("A decoração ainda não foi publicada.");
  res.attachment(`dossie-${safeName(property.title)}-${safeName(staging.name)}.pdf`);
  await sendStored(res, storage, staging.dossierKey, "application/pdf", "revalidate");
});

publishingRouter.get("/stagings/:id/downloads/qrcode.png", async (req, res) => {
  const { staging } = await getOwnedStaging(currentUser(req).id, parseId(req.params.id));
  if (!staging.qrKey) throw notFound("A decoração ainda não foi publicada.");
  await sendStored(res, storage, staging.qrKey, "image/png", "revalidate");
});

publishingRouter.get("/stagings/:id/downloads/portals/:portal.zip", async (req, res) => {
  const { staging, property } = await getOwnedStaging(currentUser(req).id, parseId(req.params.id));
  const portal = PORTALS.find((p) => p.id === req.params.portal);
  if (!portal) throw notFound("Portal desconhecido.");
  const bundle = await loadBundle(staging, property);
  const rows = bundle.photos.filter((p) => p.row?.final?.exports[portal.id]);
  if (rows.length === 0) throw notFound("A decoração ainda não foi publicada.");

  res.attachment(`${safeName(property.title)}-${safeName(staging.name)}-${portal.id}.zip`);
  const zip = new ZipArchive({ zlib: { level: 0 } });
  zip.on("error", (err: Error) => res.destroy(err));
  zip.pipe(res);
  for (const [i, p] of rows.entries()) {
    const room = p.photo.roomConfirmed ? ROOM_LABELS[p.photo.roomConfirmed] : "foto";
    zip.append(await storage.read(p.row!.final!.exports[portal.id]), { name: `${String(i + 1).padStart(2, "0")}-${safeName(room)}.jpg` });
  }
  await zip.finalize();
});
