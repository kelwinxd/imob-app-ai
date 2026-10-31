import { randomBytes } from "node:crypto";
import { hash, verify } from "@node-rs/argon2";
import { and, eq, gt, lt } from "drizzle-orm";
import { sha256 } from "@imob/core";
import type { LoginInput, RegisterInput, UserDTO } from "@imob/shared";
import { db } from "../../db/client";
import { sessions, users, type UserRow } from "../../db/schema";
import { conflict, unauthorized } from "../../shared/http";

export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

let dummyHash: Promise<string> | undefined;

export const toUserDTO = (u: UserRow): UserDTO => ({ id: u.id, name: u.name, email: u.email });

async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await db.insert(sessions).values({ id: sha256(token), userId, expiresAt: new Date(Date.now() + SESSION_TTL_MS) });
  await db.delete(sessions).where(and(eq(sessions.userId, userId), lt(sessions.expiresAt, new Date())));
  return token;
}

export async function register(input: RegisterInput): Promise<{ user: UserDTO; token: string }> {
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, input.email));
  if (existing) throw conflict("Já existe uma conta com esse e-mail.", "EMAIL_TAKEN");
  const [user] = await db.insert(users).values({ name: input.name, email: input.email, passwordHash: await hash(input.password) }).returning();
  return { user: toUserDTO(user), token: await createSession(user.id) };
}

export async function login(input: LoginInput): Promise<{ user: UserDTO; token: string }> {
  const [user] = await db.select().from(users).where(eq(users.email, input.email));
  if (!user) {
    // Verifica um hash fictício para o tempo de resposta não revelar quais e-mails têm conta.
    await verify(await (dummyHash ??= hash("senha-ficticia")), input.password);
    throw unauthorized("E-mail ou senha incorretos.");
  }
  if (!(await verify(user.passwordHash, input.password))) throw unauthorized("E-mail ou senha incorretos.");
  return { user: toUserDTO(user), token: await createSession(user.id) };
}

export async function logout(token: string | undefined) {
  if (token) await db.delete(sessions).where(eq(sessions.id, sha256(token)));
}

export async function userFromSession(token: string | undefined): Promise<UserRow | null> {
  if (!token) return null;
  const [row] = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, sha256(token)), gt(sessions.expiresAt, new Date())));
  return row?.user ?? null;
}
