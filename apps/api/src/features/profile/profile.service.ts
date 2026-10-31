import { eq } from "drizzle-orm";
import { sha256, toLogoPng } from "@imob/core";
import { DEFAULT_BRAND_COLOR, type ProfileDTO, type UpdateProfileInput } from "@imob/shared";
import { db } from "../../db/client";
import { companyProfiles, users } from "../../db/schema";
import { badRequest } from "../../shared/http";
import { keys, storage } from "../../shared/storage";

const LOGO_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export interface ResolvedProfile {
  companyName: string;
  brandColor: string;
  whatsapp: string;
  phone: string;
  creci: string;
  logoKey: string | null;
}

// Sem perfil salvo ainda, usa o nome do usuário e a cor padrão, para a página nunca ficar sem marca.
export async function resolveProfile(userId: string): Promise<ResolvedProfile> {
  const [row] = await db.select().from(companyProfiles).where(eq(companyProfiles.userId, userId));
  if (row) return row;
  const [user] = await db.select({ name: users.name }).from(users).where(eq(users.id, userId));
  return { companyName: user?.name ?? "", brandColor: DEFAULT_BRAND_COLOR, whatsapp: "", phone: "", creci: "", logoKey: null };
}

const toDTO = (p: ResolvedProfile, saved: boolean): ProfileDTO => ({
  companyName: p.companyName,
  brandColor: p.brandColor,
  whatsapp: p.whatsapp,
  phone: p.phone,
  creci: p.creci,
  logoUrl: p.logoKey ? `/api/profile/logo?v=${p.logoKey.slice(-16, -4)}` : null,
  complete: saved && Boolean(p.whatsapp || p.phone),
});

export async function getProfile(userId: string): Promise<ProfileDTO> {
  const [row] = await db.select({ userId: companyProfiles.userId }).from(companyProfiles).where(eq(companyProfiles.userId, userId));
  return toDTO(await resolveProfile(userId), Boolean(row));
}

export async function saveProfile(userId: string, input: UpdateProfileInput): Promise<ProfileDTO> {
  const values = { ...input, brandColor: input.brandColor.toLowerCase(), updatedAt: new Date() };
  await db
    .insert(companyProfiles)
    .values({ userId, ...values })
    .onConflictDoUpdate({ target: companyProfiles.userId, set: values });
  return getProfile(userId);
}

export async function saveLogo(userId: string, file: { mimetype: string; buffer: Buffer } | undefined): Promise<ProfileDTO> {
  if (!file) throw badRequest("Selecione uma imagem para o logo.");
  if (!LOGO_TYPES.has(file.mimetype)) throw badRequest("O logo precisa ser PNG, JPG ou WEBP.");
  let png: Buffer;
  try {
    png = await toLogoPng(file.buffer);
  } catch {
    throw badRequest("Não foi possível ler a imagem do logo.");
  }
  const logoKey = keys.logo(userId, sha256(png));
  await storage.put(logoKey, png);
  const current = await resolveProfile(userId);
  await db
    .insert(companyProfiles)
    .values({ ...current, userId, logoKey, updatedAt: new Date() })
    .onConflictDoUpdate({ target: companyProfiles.userId, set: { logoKey, updatedAt: new Date() } });
  return getProfile(userId);
}

export async function removeLogo(userId: string): Promise<ProfileDTO> {
  await db.update(companyProfiles).set({ logoKey: null, updatedAt: new Date() }).where(eq(companyProfiles.userId, userId));
  return getProfile(userId);
}
