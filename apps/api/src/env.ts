import { config as loadEnv } from "dotenv";
import { isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { QUALITIES } from "@imob/shared";

export const REPO_ROOT = fileURLToPath(new URL("../../../", import.meta.url));
loadEnv({ path: resolve(REPO_ROOT, ".env"), quiet: true });

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  API_PORT: z.coerce.number().int().default(4600),
  DATABASE_URL: z.string().default("postgres://imob:imob@localhost:5440/imob"),
  PUBLIC_BASE_URL: z.url().default("http://localhost:5300"),
  STORAGE_DIR: z.string().default("data/storage"),
  OPENAI_API_KEY: z.string().default(""),
  IMAGE_MODEL: z.string().default("gpt-image-2"),
  VISION_MODEL: z.string().default("gpt-5.4-mini"),
  IMAGE_QUALITY: z.enum(QUALITIES).default("medium"),
  AI_MOCK: z.stringbool().default(false),
  RUN_WORKER: z.stringbool().default(true),
  WORKER_CONCURRENCY: z.coerce.number().int().min(1).max(8).default(2),
});

const parsed = EnvSchema.parse(process.env);

export const env = {
  ...parsed,
  PUBLIC_BASE_URL: parsed.PUBLIC_BASE_URL.replace(/\/+$/, ""),
  STORAGE_DIR: isAbsolute(parsed.STORAGE_DIR) ? parsed.STORAGE_DIR : resolve(REPO_ROOT, parsed.STORAGE_DIR),
  isProduction: parsed.NODE_ENV === "production",
};
