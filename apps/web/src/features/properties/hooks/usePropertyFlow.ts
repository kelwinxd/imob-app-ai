import { useEffect, useMemo, useState } from "react";
import type { PropertyDetailDTO } from "@imob/shared";
import type { Step } from "../../../shared/ui/Stepper";

export type FlowStep = "fotos" | "estilo" | "escolha" | "publicar";

export const FLOW_STEPS: Step<FlowStep>[] = [
  { id: "fotos", label: "Fotos" },
  { id: "estilo", label: "Estilo" },
  { id: "escolha", label: "Escolha" },
  { id: "publicar", label: "Publicar" },
];

const ORDER: FlowStep[] = FLOW_STEPS.map((s) => s.id);

// Etapa em que o imóvel "deveria" estar, deduzida só do estado vindo da API.
function naturalStep(p: PropertyDetailDTO): FlowStep {
  switch (p.status) {
    case "draft":
    case "processing":
      return "fotos";
    case "ready":
      return p.photos.some((ph) => ph.include && ph.generation) ? "escolha" : "fotos";
    case "generating":
    case "choosing":
      return "escolha";
    case "publishing":
    case "published":
    case "publish_failed":
      return "publicar";
  }
}

export function usePropertyFlow(property: PropertyDetailDTO) {
  const natural = naturalStep(property);
  const [active, setActive] = useState<FlowStep>(natural);

  // Avança sozinho quando o estado do imóvel muda (ex.: geração terminou), sem puxar o usuário para trás.
  useEffect(() => {
    setActive((current) => (ORDER.indexOf(natural) > ORDER.indexOf(current) ? natural : current));
  }, [natural]);

  const { reachable, completed } = useMemo(() => {
    const included = property.photos.filter((p) => p.include);
    const photosDone = included.length > 0 && !property.photos.some((p) => p.status === "classifying");
    const anyGenerated = included.some((p) => p.generation || p.status === "generating");
    const canPublish = ["choosing", "publishing", "published", "publish_failed"].includes(property.status);

    const reach = new Set<FlowStep>(["fotos"]);
    if (photosDone) reach.add("estilo");
    if (anyGenerated) reach.add("escolha");
    if (canPublish) reach.add("publicar");

    const done = new Set<FlowStep>();
    if (photosDone) done.add("fotos");
    if (property.style && anyGenerated) done.add("estilo");
    if (canPublish) done.add("escolha");
    if (property.status === "published") done.add("publicar");
    return { reachable: reach, completed: done };
  }, [property]);

  return {
    steps: FLOW_STEPS,
    active,
    reachable,
    completed,
    goTo: (step: FlowStep) => {
      if (reachable.has(step) || step === "estilo") setActive(step);
    },
  };
}
