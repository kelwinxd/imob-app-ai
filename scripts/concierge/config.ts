import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Quality } from "@imob/shared";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
loadEnv({ path: resolve(ROOT, ".env"), quiet: true });

export const env = {
  apiKey: process.env.OPENAI_API_KEY ?? "",
  imageModel: process.env.IMAGE_MODEL || "gpt-image-2",
  visionModel: process.env.VISION_MODEL || "gpt-5.4-mini",
  imageQuality: (process.env.IMAGE_QUALITY || "medium") as Quality,
};
