import { Router } from "express";
import multer from "multer";
import { MAX_LOGO_BYTES, UpdateProfileInputSchema } from "@imob/shared";
import { notFound, parseInput, sendStored } from "../../shared/http";
import { storage } from "../../shared/storage";
import { currentUser } from "../auth/auth.middleware";
import { getProfile, removeLogo, resolveProfile, saveLogo, saveProfile } from "./profile.service";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_LOGO_BYTES, files: 1 } });

export const profileRouter = Router();

profileRouter.get("/", async (req, res) => {
  res.json(await getProfile(currentUser(req).id));
});

profileRouter.put("/", async (req, res) => {
  res.json(await saveProfile(currentUser(req).id, parseInput(UpdateProfileInputSchema, req.body)));
});

profileRouter.post("/logo", upload.single("logo"), async (req, res) => {
  res.json(await saveLogo(currentUser(req).id, req.file));
});

profileRouter.delete("/logo", async (req, res) => {
  res.json(await removeLogo(currentUser(req).id));
});

profileRouter.get("/logo", async (req, res) => {
  const profile = await resolveProfile(currentUser(req).id);
  if (!profile.logoKey) throw notFound("Nenhum logo enviado.");
  await sendStored(res, storage, profile.logoKey, "image/png", "immutable");
});
