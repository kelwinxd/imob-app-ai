import { z } from "zod";

export const PURPOSES = ["venda", "aluguel"] as const;
export type Purpose = (typeof PURPOSES)[number];
export const PURPOSE_LABELS: Record<Purpose, string> = { venda: "Venda", aluguel: "Aluguel" };

export const DEFAULT_BRAND_COLOR = "#8a5a2b";
export const BRAND_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;
export const MAX_LOGO_BYTES = 2 * 1024 * 1024;

const onlyDigits = (v: string) => v.replace(/\D/g, "");
const phoneField = (label: string) =>
  z
    .string()
    .trim()
    .max(25)
    .transform(onlyDigits)
    .refine((v) => v === "" || (v.length >= 10 && v.length <= 13), `${label} inválido. Use DDD + número.`);

export const UpdateProfileInputSchema = z.object({
  companyName: z.string().trim().min(2, "Informe o nome da empresa").max(80),
  brandColor: z.string().regex(BRAND_COLOR_PATTERN, "Cor inválida"),
  whatsapp: phoneField("WhatsApp"),
  phone: phoneField("Telefone"),
  creci: z.string().trim().max(30),
});
export type UpdateProfileInput = z.infer<typeof UpdateProfileInputSchema>;

export interface ProfileDTO {
  companyName: string;
  brandColor: string;
  whatsapp: string;
  phone: string;
  creci: string;
  logoUrl: string | null;
  complete: boolean;
}

const count = (max: number) => z.number().int().min(0).max(max).nullable();

export const PropertyDetailsSchema = z.object({
  description: z.string().trim().max(2000),
  purpose: z.enum(PURPOSES).nullable(),
  price: z.number().int().min(0).max(10_000_000_000).nullable(),
  bedrooms: count(50),
  bathrooms: count(50),
  parkingSpots: count(50),
  areaM2: z.number().min(0).max(100_000).nullable(),
  neighborhood: z.string().trim().max(80),
  city: z.string().trim().max(80),
});
export type PropertyDetails = z.infer<typeof PropertyDetailsSchema>;

export const UpdatePropertyInputSchema = PropertyDetailsSchema.partial().extend({
  title: z.string().trim().min(2, "Dê um nome ao imóvel").max(120).optional(),
});
export type UpdatePropertyInput = z.infer<typeof UpdatePropertyInputSchema>;

export const formatPhoneBR = (digits: string) => {
  const d = digits.startsWith("55") && digits.length > 11 ? digits.slice(2) : digits;
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return digits;
};

export const formatPriceBRL = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
