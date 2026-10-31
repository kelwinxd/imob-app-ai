import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import { requireAuth } from "./features/auth/auth.middleware";
import { authRouter } from "./features/auth/auth.routes";
import { generationRouter } from "./features/generation/generation.routes";
import { photosRouter } from "./features/photos/photos.routes";
import { profileRouter } from "./features/profile/profile.routes";
import { propertiesRouter } from "./features/properties/properties.routes";
import { publicPageRouter } from "./features/public-page/public-page.routes";
import { publishingRouter } from "./features/publishing/publishing.routes";
import { stagingsRouter } from "./features/stagings/stagings.routes";
import { errorHandler, notFound } from "./shared/http";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: "same-origin" } }));
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });
  app.use("/api/auth", authRouter);
  app.use("/api/profile", requireAuth, profileRouter);
  app.use("/api/properties", requireAuth, propertiesRouter);
  app.use("/api", requireAuth, photosRouter, stagingsRouter, generationRouter, publishingRouter);
  app.use("/i", publicPageRouter);

  app.use((_req, _res) => {
    throw notFound("Rota não encontrada.");
  });
  app.use(errorHandler);
  return app;
}
