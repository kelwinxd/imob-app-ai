import { Router } from "express";
import { and, eq } from "drizzle-orm";
import { ChooseVariationInputSchema, GenerateInputSchema } from "@imob/shared";
import { db } from "../../db/client";
import { photos, properties, variations } from "../../db/schema";
import { notFound, parseId, parseInput, sendStored } from "../../shared/http";
import { storage } from "../../shared/storage";
import { currentUser } from "../auth/auth.middleware";
import { chooseVariation, regeneratePhoto, startGeneration } from "./generation.service";

export const generationRouter = Router();

generationRouter.post("/properties/:id/generate", async (req, res) => {
  res.json(await startGeneration(currentUser(req).id, parseId(req.params.id), parseInput(GenerateInputSchema, req.body)));
});

generationRouter.post("/photos/:id/regenerate", async (req, res) => {
  res.json(await regeneratePhoto(currentUser(req).id, parseId(req.params.id)));
});

generationRouter.post("/photos/:id/choose", async (req, res) => {
  res.json(await chooseVariation(currentUser(req).id, parseId(req.params.id), parseInput(ChooseVariationInputSchema, req.body)));
});

async function ownedVariation(userId: string, variationId: string) {
  const [row] = await db
    .select({ variation: variations })
    .from(variations)
    .innerJoin(photos, eq(photos.id, variations.photoId))
    .innerJoin(properties, eq(properties.id, photos.propertyId))
    .where(and(eq(variations.id, variationId), eq(properties.userId, userId)));
  if (!row) throw notFound("Variação não encontrada.");
  return row.variation;
}

generationRouter.get("/variations/:id/preview", async (req, res) => {
  const v = await ownedVariation(currentUser(req).id, parseId(req.params.id));
  await sendStored(res, storage, v.previewKey, "image/jpeg", "immutable");
});

generationRouter.get("/variations/:id/image", async (req, res) => {
  const v = await ownedVariation(currentUser(req).id, parseId(req.params.id));
  await sendStored(res, storage, v.key, "image/png", "immutable");
});
