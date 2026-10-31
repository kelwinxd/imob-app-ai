import type { CookieOptions, RequestHandler } from "express";
import { env } from "../../env";
import { unauthorized } from "../../shared/http";
import { SESSION_TTL_MS, userFromSession } from "./auth.service";
import type { UserRow } from "../../db/schema";

export const SESSION_COOKIE = "imob_sid";

export const sessionCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: env.isProduction,
  path: "/",
  maxAge: SESSION_TTL_MS,
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: UserRow;
    }
  }
}

export const requireAuth: RequestHandler = async (req, _res, next) => {
  const user = await userFromSession(req.cookies?.[SESSION_COOKIE]);
  if (!user) throw unauthorized();
  req.user = user;
  next();
};

export function currentUser(req: Express.Request): UserRow {
  if (!req.user) throw unauthorized();
  return req.user;
}
