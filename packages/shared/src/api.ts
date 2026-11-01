import { z } from "zod";
import type { VariationCheck } from "./checks";
import { FURNITURE_COLOR_IDS, MAX_FURNITURE_COLORS, ROOMS, STANDARDS, STYLES, type Room, type Standard, type Style, type Verdict } from "./domain";
import { instructionRuleViolation, MAX_INSTRUCTION_LENGTH } from "./instructions";
import { PAGE_COMPARE_MODES, PAGE_THEMES, type PageCompareMode, type PageTheme, type PropertyDetails } from "./landing";

// ---------- requests ----------

export const RegisterInputSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(80),
  email: z.email("E-mail inválido").trim().toLowerCase(),
  password: z.string().min(8, "A senha precisa de pelo menos 8 caracteres").max(200),
});
export type RegisterInput = z.infer<typeof RegisterInputSchema>;

export const LoginInputSchema = z.object({
  email: z.email("E-mail inválido").trim().toLowerCase(),
  password: z.string().min(1, "Informe a senha"),
});
export type LoginInput = z.infer<typeof LoginInputSchema>;

export const CreatePropertyInputSchema = z.object({
  title: z.string().trim().min(2, "Dê um nome ao imóvel").max(120),
});
export type CreatePropertyInput = z.infer<typeof CreatePropertyInputSchema>;

export const UpdatePhotoInputSchema = z.object({ roomConfirmed: z.enum(ROOMS) });
export type UpdatePhotoInput = z.infer<typeof UpdatePhotoInputSchema>;

export const CreateStagingInputSchema = z.object({ name: z.string().trim().min(1).max(60).optional() });
export type CreateStagingInput = z.infer<typeof CreateStagingInputSchema>;

export const UpdateStagingInputSchema = z.object({
  name: z.string().trim().min(1, "Dê um nome à decoração").max(60).optional(),
  style: z.enum(STYLES).optional(),
  standard: z.enum(STANDARDS).optional(),
  furnitureColors: z.array(z.enum(FURNITURE_COLOR_IDS)).max(MAX_FURNITURE_COLORS, `Escolha até ${MAX_FURNITURE_COLORS} cores`).optional(),
  customInstructions: z
    .string()
    .trim()
    .max(MAX_INSTRUCTION_LENGTH, `Use no máximo ${MAX_INSTRUCTION_LENGTH} caracteres.`)
    .superRefine((v, ctx) => {
      const reason = instructionRuleViolation(v);
      if (reason) ctx.addIssue({ code: "custom", message: reason });
    })
    .optional(),
  pageTheme: z.enum(PAGE_THEMES).optional(),
  pageCompare: z.enum(PAGE_COMPARE_MODES).optional(),
});
export type UpdateStagingInput = z.infer<typeof UpdateStagingInputSchema>;

export const UpdateStagingPhotoInputSchema = z.object({ include: z.boolean() });
export type UpdateStagingPhotoInput = z.infer<typeof UpdateStagingPhotoInputSchema>;

export const MAX_VARIATIONS = 3;

/** Sem photoIds: gera as fotos marcadas que ainda não têm variações com o estilo atual. Com photoIds: gera de novo essas fotos. */
export const GenerateInputSchema = z.object({
  variations: z.number().int().min(1).max(MAX_VARIATIONS).default(MAX_VARIATIONS),
  photoIds: z.array(z.uuid()).max(50).optional(),
});
export type GenerateInput = z.input<typeof GenerateInputSchema>;

export const ChooseVariationInputSchema = z.object({ variationId: z.uuid(), confirmReview: z.boolean().default(false) });
export type ChooseVariationInput = z.input<typeof ChooseVariationInputSchema>;

// ---------- responses ----------

export interface UserDTO {
  id: string;
  name: string;
  email: string;
}

/** Estado da foto no imóvel (análise do cômodo). */
export type PhotoStatus = "classifying" | "ready" | "failed";

/** Estado da foto dentro de uma decoração. */
export type StagingPhotoStatus = "pending" | "generating" | "generated" | "failed";

export type PropertyStatus = "draft" | "processing" | "ready";

export type StagingStatus = "draft" | "ready" | "generating" | "choosing" | "publishing" | "published" | "publish_failed";

export interface VariationDTO {
  id: string;
  index: number;
  verdict: Verdict;
  check: VariationCheck;
  previewUrl: string;
  imageUrl: string;
}

export interface PhotoDTO {
  id: string;
  position: number;
  sourceName: string;
  status: PhotoStatus;
  error: string | null;
  sha256: string;
  thumbUrl: string;
  originalUrl: string;
  roomSuggested: Room | null;
  roomConfidence: number | null;
  roomConfirmed: Room | null;
  alerts: string[];
}

export interface StagingPhotoDTO {
  photoId: string;
  position: number;
  sourceName: string;
  thumbUrl: string;
  originalUrl: string;
  roomConfirmed: Room | null;
  photoStatus: PhotoStatus;
  /** A foto já foi analisada e tem cômodo definido. */
  eligible: boolean;
  include: boolean;
  /** Marcada, sem variações ou com variações feitas com outro estilo, padrão, cores, referências ou cômodo. */
  needsGeneration: boolean;
  status: StagingPhotoStatus;
  error: string | null;
  generation: { createdAt: string; model: string; size: string; templateVersion: string } | null;
  variations: VariationDTO[];
  chosenVariationId: string | null;
  finalUrl: string | null;
}

export interface PortalDownloadDTO {
  id: string;
  label: string;
  url: string;
}

export interface StagingSummaryDTO {
  id: string;
  name: string;
  status: StagingStatus;
  style: Style | null;
  standard: Standard | null;
  coverUrl: string | null;
  publicUrl: string | null;
  createdAt: string;
  publishedAt: string | null;
}

export interface ReferenceImageDTO {
  id: string;
  url: string;
}

export interface StagingDetailDTO extends StagingSummaryDTO {
  propertyId: string;
  propertyTitle: string;
  furnitureColors: string[];
  customInstructions: string;
  pageTheme: PageTheme;
  pageCompare: PageCompareMode;
  references: ReferenceImageDTO[];
  publishError: string | null;
  photos: StagingPhotoDTO[];
  published: {
    publicUrl: string;
    qrcodeUrl: string;
    dossierUrl: string;
    dossierSha256: string;
    portals: PortalDownloadDTO[];
  } | null;
}

export interface PropertySummaryDTO {
  id: string;
  title: string;
  status: PropertyStatus;
  coverUrl: string | null;
  photoCount: number;
  stagingCount: number;
  publishedCount: number;
  createdAt: string;
}

export interface PropertyDetailDTO extends PropertySummaryDTO {
  details: PropertyDetails;
  photos: PhotoDTO[];
  stagings: StagingSummaryDTO[];
}

export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown };
}
