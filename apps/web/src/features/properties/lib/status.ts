import type { PropertyDetailDTO, PropertyStatus } from "@imob/shared";
import type { BadgeTone } from "../../../shared/ui/Badge";

export const PROPERTY_STATUS: Record<PropertyStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: "Sem fotos", tone: "neutral" },
  processing: { label: "Analisando fotos", tone: "info" },
  ready: { label: "Pronto para decorar", tone: "brand" },
  generating: { label: "Decorando", tone: "info" },
  choosing: { label: "Escolha as variações", tone: "warning" },
  publishing: { label: "Publicando", tone: "info" },
  published: { label: "Publicado", tone: "success" },
  publish_failed: { label: "Falha ao publicar", tone: "danger" },
};

const BUSY: ReadonlySet<PropertyStatus> = new Set(["processing", "generating", "publishing"]);

export const isBusy = (p: PropertyDetailDTO) =>
  BUSY.has(p.status) || p.photos.some((ph) => ph.status === "classifying" || ph.status === "generating");
