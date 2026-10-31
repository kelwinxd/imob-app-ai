import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { LoginInputSchema, RegisterInputSchema } from "@imob/shared";
import { parseInput } from "../../shared/http";
import { currentUser, requireAuth, SESSION_COOKIE, sessionCookieOptions } from "./auth.middleware";
import { login, logout, register, toUserDTO } from "./auth.service";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMITED", message: "Muitas tentativas. Aguarde alguns minutos." } },
});

export const authRouter = Router();

authRouter.post("/register", authLimiter, async (req, res) => {
  const { user, token } = await register(parseInput(RegisterInputSchema, req.body));
  res.cookie(SESSION_COOKIE, token, sessionCookieOptions).status(201).json(user);
});

authRouter.post("/login", authLimiter, async (req, res) => {
  const { user, token } = await login(parseInput(LoginInputSchema, req.body));
  res.cookie(SESSION_COOKIE, token, sessionCookieOptions).json(user);
});

authRouter.post("/logout", async (req, res) => {
  await logout(req.cookies?.[SESSION_COOKIE]);
  res.clearCookie(SESSION_COOKIE, { ...sessionCookieOptions, maxAge: undefined }).status(204).end();
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json(toUserDTO(currentUser(req)));
});
