import { Router } from "express";
import multer from "multer";
import { CreateStagingInputSchema, MAX_PHOTO_BYTES, MAX_REFERENCE_IMAGES, UpdateStagingInputSchema, UpdateStagingPhotoInputSchema } from "@imob/shared";
import { parseId, parseInput, sendStored } from "../../shared/http";
import { storage } from "../../shared/storage";
import { currentUser } from "../auth/auth.middleware";
import { getStagingDetail } from "./stagings.model";
import {
  addReferences, createStaging, deleteStaging, getReference, getStagingPhotoFinal, removeReference, updateStaging, updateStagingPhoto,
} from "./stagings.service";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_PHOTO_BYTES, files: MAX_REFERENCE_IMAGES } });

export const stagingsRouter = Router();

stagingsRouter.post("/properties/:id/stagings", async (req, res) => {
  res.status(201).json(await createStaging(currentUser(req).id, parseId(req.params.id), parseInput(CreateStagingInputSchema, req.body ?? {})));
});

stagingsRouter.get("/stagings/:id", async (req, res) => {
  res.json(await getStagingDetail(currentUser(req).id, parseId(req.params.id)));
});

stagingsRouter.patch("/stagings/:id", async (req, res) => {
  res.json(await updateStaging(currentUser(req).id, parseId(req.params.id), parseInput(UpdateStagingInputSchema, req.body)));
});

stagingsRouter.delete("/stagings/:id", async (req, res) => {
  await deleteStaging(currentUser(req).id, parseId(req.params.id));
  res.status(204).end();
});

stagingsRouter.patch("/stagings/:id/photos/:photoId", async (req, res) => {
  res.json(
    await updateStagingPhoto(currentUser(req).id, parseId(req.params.id), parseId(req.params.photoId), parseInput(UpdateStagingPhotoInputSchema, req.body)),
  );
});

stagingsRouter.get("/stagings/:id/photos/:photoId/final", async (req, res) => {
  const final = await getStagingPhotoFinal(currentUser(req).id, parseId(req.params.id), parseId(req.params.photoId));
  await sendStored(res, storage, final.key, "image/jpeg", "revalidate");
});

stagingsRouter.post("/stagings/:id/references", upload.array("images", MAX_REFERENCE_IMAGES), async (req, res) => {
  const files = ((req.files as Express.Multer.File[] | undefined) ?? []).map((f) => ({
    ...f,
    originalname: Buffer.from(f.originalname, "latin1").toString("utf8"),
  }));
  res.json(await addReferences(currentUser(req).id, parseId(req.params.id), files));
});

stagingsRouter.get("/stagings/:id/references/:refId", async (req, res) => {
  const ref = await getReference(currentUser(req).id, parseId(req.params.id), parseId(req.params.refId));
  await sendStored(res, storage, ref.key, "image/jpeg", "immutable");
});

stagingsRouter.delete("/stagings/:id/references/:refId", async (req, res) => {
  res.json(await removeReference(currentUser(req).id, parseId(req.params.id), parseId(req.params.refId)));
});
