import { createElement, useMemo, type ReactNode } from "react";
import type { StagingDetailDTO } from "@imob/shared";
import { useStepFlow } from "../../../shared/lib/useStepFlow";
import type { Step } from "../../../shared/ui/Stepper";
import type { StyleSettings } from "../../generation/hooks/useStyleSettings";
import { ShieldIcon } from "../../../shared/ui/icons";
import { usePublish } from "../../publishing/hooks/usePublish";
import { CAN_PUBLISH } from "../lib/status";
import { useUpdateStaging } from "./useStagings";

export type StagingStep = "estilo" | "escolha" | "publicar";

const STEPS: Step<StagingStep>[] = [
  { id: "estilo", label: "Estilo" },
  { id: "escolha", label: "Escolha" },
  { id: "publicar", label: "Publicar" },
];

export function useStagingFlow(staging: StagingDetailDTO, settings: StyleSettings) {
  const save = useUpdateStaging(staging.id);
  const publish = usePublish(staging.id);
  const included = staging.photos.filter((p) => p.include).length;
  const hasSaved = Boolean(staging.style && staging.standard);

  const { reachable, completed } = useMemo(() => {
    const reach = new Set<StagingStep>(["estilo"]);
    const done = new Set<StagingStep>();
    if (hasSaved && included > 0) {
      reach.add("escolha");
      done.add("estilo");
    }
    if (CAN_PUBLISH.has(staging.status) || staging.status === "publishing") {
      reach.add("publicar");
      done.add("escolha");
    }
    if (staging.status === "published") done.add("publicar");
    return { reachable: reach, completed: done };
  }, [staging, hasSaved, included]);

  const flow = useStepFlow(STEPS, reachable, completed);
  const generating = staging.status === "generating";

  let canNext = false;
  let onNext = () => {};
  let nextLabel: string | undefined;
  let nextIcon: ReactNode;
  let nextLoading = save.updating;

  switch (flow.active) {
    case "estilo": {
      const { style, standard, dirty, instructionError } = settings;
      canNext = Boolean(style && standard) && included > 0 && !(dirty && generating) && !instructionError;
      onNext = () => {
        if (!style || !standard) return;
        if (!dirty) return flow.go("escolha");
        save.update(settings.toInput(), { onSuccess: () => flow.go("escolha") });
      };
      break;
    }
    case "escolha":
      canNext = CAN_PUBLISH.has(staging.status);
      onNext = () => flow.go("publicar");
      break;
    // Na última etapa o botão do topo publica.
    case "publicar": {
      const publishing = staging.status === "publishing";
      const upToDate = staging.status === "published";
      canNext = CAN_PUBLISH.has(staging.status) && !upToDate;
      nextLabel = upToDate ? "Publicada" : staging.published ? "Atualizar publicação" : "Publicar";
      nextIcon = createElement(ShieldIcon, { size: 18 });
      nextLoading = publish.requesting || publishing;
      onNext = publish.publish;
      break;
    }
  }

  return {
    ...flow,
    saveError: save.error,
    publish,
    nav: { canPrev: flow.previous !== null, onPrev: () => flow.previous && flow.go(flow.previous), canNext, onNext, nextLoading, nextLabel, nextIcon },
  };
}
