import type { PropertyDetailDTO, PropertyStatus } from "@imob/shared";
import type { BadgeTone } from "../../../shared/ui/Badge";

export const PROPERTY_STATUS: Record<PropertyStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: "Sem fotos", tone: "neutral" },
  processing: { label: "Analisando fotos", tone: "info" },
  ready: { label: "Fotos prontas", tone: "brand" },
};

export const isBusy = (p: PropertyDetailDTO) =>
  p.status === "processing" || p.stagings.some((s) => s.status === "generating" || s.status === "publishing");
