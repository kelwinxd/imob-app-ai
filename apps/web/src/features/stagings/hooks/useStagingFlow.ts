import { useMemo } from "react";
import type { StagingDetailDTO } from "@imob/shared";
import { STANDARD_INFO, STYLE_INFO } from "@imob/shared";
import { plural } from "../../../shared/lib/format";
import { useStepFlow } from "../../../shared/lib/useStepFlow";
import type { Step } from "../../../shared/ui/Stepper";
import type { StyleSettings } from "../../generation/hooks/useStyleSettings";
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
  let hint: string | undefined;

  switch (flow.active) {
    case "estilo": {
      const { style, standard, dirty, instructionError } = settings;
      canNext = Boolean(style && standard) && included > 0 && !(dirty && generating) && !instructionError;
      hint = style && standard ? `${STYLE_INFO[style].label}, padrão ${STANDARD_INFO[standard].label.toLowerCase()} · ${plural(included, "foto", "fotos")}` : "Escolha um estilo";
      onNext = () => {
        if (!style || !standard) return;
        if (!dirty) return flow.go("escolha");
        save.update(settings.toInput(), { onSuccess: () => flow.go("escolha") });
      };
      break;
    }
    case "escolha":
      canNext = CAN_PUBLISH.has(staging.status);
      hint = generating ? "Aguarde terminar a geração" : canNext ? "Tudo pronto para publicar" : "Gere e escolha as variações";
      onNext = () => flow.go("publicar");
      break;
    case "publicar":
      break;
  }

  return {
    ...flow,
    saveError: save.error,
    nav: { canPrev: flow.previous !== null, onPrev: () => flow.previous && flow.go(flow.previous), canNext, onNext, nextLoading: save.updating, hideNext: flow.isLast, hint },
  };
}
