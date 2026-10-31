import { z } from "zod";
import type { VariationCheck } from "./checks";
import { ROOMS, STANDARDS, STYLES, type Room, type Standard, type Style, type Verdict } from "./domain";

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

export const UpdatePhotoInputSchema = z
  .object({ roomConfirmed: z.enum(ROOMS).optional(), include: z.boolean().optional() })
  .refine((v) => v.roomConfirmed !== undefined || v.include !== undefined, "Nada para atualizar");
export type UpdatePhotoInput = z.infer<typeof UpdatePhotoInputSchema>;

export const GenerateInputSchema = z.object({ style: z.enum(STYLES), standard: z.enum(STANDARDS) });
export type GenerateInput = z.infer<typeof GenerateInputSchema>;

export const ChooseVariationInputSchema = z.object({ variationId: z.uuid(), confirmReview: z.boolean().default(false) });
export type ChooseVariationInput = z.input<typeof ChooseVariationInputSchema>;

// ---------- responses ----------

export interface UserDTO {
  id: string;
  name: string;
  email: string;
}

export type PhotoStatus = "classifying" | "ready" | "generating" | "generated" | "failed";

export type PropertyStatus = "draft" | "processing" | "ready" | "generating" | "choosing" | "publishing" | "published" | "publish_failed";

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
  include: boolean;
  alerts: string[];
  generation: { createdAt: string; model: string; size: string; templateVersion: string } | null;
  variations: VariationDTO[];
  chosenVariationId: string | null;
  finalUrl: string | null;
}

export interface PropertySummaryDTO {
  id: string;
  title: string;
  status: PropertyStatus;
  coverUrl: string | null;
  photoCount: number;
  createdAt: string;
  publishedAt: string | null;
}

export interface PortalDownloadDTO {
  id: string;
  label: string;
  url: string;
}

export interface PropertyDetailDTO extends PropertySummaryDTO {
  style: Style | null;
  standard: Standard | null;
  publishError: string | null;
  photos: PhotoDTO[];
  published: {
    publicUrl: string;
    qrcodeUrl: string;
    dossierUrl: string;
    dossierSha256: string;
    portals: PortalDownloadDTO[];
  } | null;
}

export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown };
}
