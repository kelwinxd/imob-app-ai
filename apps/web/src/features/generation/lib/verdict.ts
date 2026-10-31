import type { Verdict } from "@imob/shared";
import type { BadgeTone } from "../../../shared/ui/Badge";

export const VERDICT_INFO: Record<Verdict, { label: string; tone: BadgeTone; description: string }> = {
  aprovado: { label: "Estrutura ok", tone: "success", description: "Paredes, janelas, portas e piso preservados." },
  revisar: { label: "Revisar", tone: "warning", description: "Pode ter mudado algo no imóvel. Confira antes de usar." },
  reprovado: { label: "Reprovada", tone: "danger", description: "A IA alterou a estrutura do imóvel. Não pode ser publicada." },
};
