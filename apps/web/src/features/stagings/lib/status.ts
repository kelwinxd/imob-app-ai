import type { StagingDetailDTO, StagingStatus } from "@imob/shared";
import type { BadgeTone } from "../../../shared/ui/Badge";

export const STAGING_STATUS: Record<StagingStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: "Escolha o estilo", tone: "neutral" },
  ready: { label: "Pronta para gerar", tone: "brand" },
  generating: { label: "Gerando", tone: "info" },
  choosing: { label: "Escolha as variações", tone: "warning" },
  publishing: { label: "Publicando", tone: "info" },
  published: { label: "Publicada", tone: "success" },
  publish_failed: { label: "Falha ao publicar", tone: "danger" },
};

export const SPINNING_STATUS: ReadonlySet<StagingStatus> = new Set(["generating", "publishing"]);

export const isStagingBusy = (s: StagingDetailDTO) =>
  s.status === "generating" || s.status === "publishing" || s.photos.some((p) => p.status === "generating");

export const CAN_PUBLISH: ReadonlySet<StagingStatus> = new Set(["choosing", "published", "publish_failed"]);
