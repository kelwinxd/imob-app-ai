import { useMemo } from "react";
import type { PropertyDetailDTO } from "@imob/shared";
import { useStepFlow } from "../../../shared/lib/useStepFlow";
import type { Step } from "../../../shared/ui/Stepper";
import type { ListingForm } from "../../listing/hooks/useListingForm";

export type PropertyStep = "fotos" | "anuncio" | "decoracoes";

const STEPS: Step<PropertyStep>[] = [
  { id: "fotos", label: "Fotos" },
  { id: "anuncio", label: "Anúncio" },
  { id: "decoracoes", label: "Decorações" },
];

const ALL = new Set<PropertyStep>(["fotos", "anuncio", "decoracoes"]);

export function usePropertyFlow(property: PropertyDetailDTO, listing: ListingForm) {
  const completed = useMemo(() => {
    const done = new Set<PropertyStep>();
    if (property.photos.some((p) => p.status === "ready" && p.roomConfirmed) && property.status === "ready") done.add("fotos");
    const d = property.details;
    if (d.description || d.price || d.areaM2 || d.bedrooms) done.add("anuncio");
    if (property.publishedCount > 0) done.add("decoracoes");
    return done;
  }, [property]);
  const flow = useStepFlow(STEPS, ALL, completed);

  const readyPhotos = property.photos.filter((p) => p.status === "ready" && p.roomConfirmed).length;
  let canNext = false;
  let onNext = () => {};

  switch (flow.active) {
    case "fotos":
      canNext = readyPhotos > 0 && property.status !== "processing";
      onNext = () => flow.go("anuncio");
      break;
    case "anuncio":
      canNext = true;
      onNext = () => listing.submit(() => flow.go("decoracoes"));
      break;
  }

  return { ...flow, nav: { canPrev: flow.previous !== null, onPrev: () => flow.previous && flow.go(flow.previous), canNext, onNext, nextLoading: listing.saving, hideNext: flow.isLast } };
}
