import { z } from "zod";
import { ROOMS, VERDICTS, type Verdict } from "./domain";

export const ClassificationSchema = z.object({
  comodo: z.enum(ROOMS),
  confianca: z.number(),
  ocupado: z.boolean(),
  pessoas: z.boolean(),
  documentos_ou_telas: z.boolean(),
  objetos_pessoais: z.boolean(),
  observacao: z.string(),
});
export type Classification = z.infer<typeof ClassificationSchema>;

const ElementSchema = z.object({ mudou: z.boolean(), detalhe: z.string() });

export const VisionCheckSchema = z.object({
  paredes: ElementSchema,
  janelas: ElementSchema,
  portas: ElementSchema,
  piso: ElementSchema,
  teto: ElementSchema,
  perspectiva: ElementSchema,
  luz_natural: ElementSchema,
  itens_adicionados: z.array(z.string()),
  veredito: z.enum(VERDICTS),
});
export type VisionCheck = z.infer<typeof VisionCheckSchema>;

export interface VariationCheck {
  checkerVersion: string;
  visionModel: string;
  vision: VisionCheck;
  edgeScore: number;
  edgeThreshold: number;
  edgeVerdict: Verdict;
  verdict: Verdict;
  checkedAt: string;
}

export function privacyAlerts(c: Classification): string[] {
  return [
    c.confianca < 0.6 && "Confirme o cômodo",
    c.ocupado && "Cômodo já mobiliado (remoção de móveis ainda não é suportada)",
    c.pessoas && "Há pessoas na foto",
    c.documentos_ou_telas && "Há documentos ou telas legíveis",
    c.objetos_pessoais && "Há objetos pessoais identificáveis",
  ].filter((a): a is string => Boolean(a));
}

export const shouldIncludeByDefault = (c: Classification) => !c.ocupado && !c.pessoas && !c.documentos_ou_telas;
