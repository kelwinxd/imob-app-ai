import { Router } from "express";
import multer from "multer";
import { MAX_PHOTO_BYTES, MAX_PHOTOS_PER_PROPERTY, UpdatePhotoInputSchema } from "@imob/shared";
import { parseId, parseInput, sendStored } from "../../shared/http";
import { storage } from "../../shared/storage";
import { currentUser } from "../auth/auth.middleware";
import { getOwnedPhoto, retryClassification, updatePhoto, uploadPhotos } from "./photos.service";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PHOTO_BYTES, files: MAX_PHOTOS_PER_PROPERTY },
});

export const photosRouter = Router();

photosRouter.post("/properties/:id/photos", upload.array("photos", MAX_PHOTOS_PER_PROPERTY), async (req, res) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  // O multer entrega o nome em latin1; corrige para os acentos aparecerem certos.
  const decoded = files.map((f) => ({ ...f, originalname: Buffer.from(f.originalname, "latin1").toString("utf8") }));
  res.status(201).json(await uploadPhotos(currentUser(req).id, parseId(req.params.id), decoded));
});

photosRouter.patch("/photos/:id", async (req, res) => {
  res.json(await updatePhoto(currentUser(req).id, parseId(req.params.id), parseInput(UpdatePhotoInputSchema, req.body)));
});

photosRouter.post("/photos/:id/classify", async (req, res) => {
  res.json(await retryClassification(currentUser(req).id, parseId(req.params.id)));
});

photosRouter.get("/photos/:id/thumb", async (req, res) => {
  const { photo } = await getOwnedPhoto(currentUser(req).id, parseId(req.params.id));
  await sendStored(res, storage, photo.thumbKey, "image/jpeg", "immutable");
});

photosRouter.get("/photos/:id/view", async (req, res) => {
  const { photo } = await getOwnedPhoto(currentUser(req).id, parseId(req.params.id));
  await sendStored(res, storage, photo.viewKey, "image/jpeg", "immutable");
});
