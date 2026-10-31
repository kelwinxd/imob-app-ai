import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type { GenerateInput, PhotoDTO, VariationDTO } from "@imob/shared";
import { errorText } from "../../../shared/api/http";
import { useApplyPropertyDetail } from "../../properties/hooks/useProperties";
import { generationApi } from "../api/generation.api";

export function useStartGeneration(propertyId: string) {
  const apply = useApplyPropertyDetail();
  const mutation = useMutation({ mutationFn: (input: GenerateInput) => generationApi.start(propertyId, input), onSuccess: apply });
  return { start: mutation.mutate, starting: mutation.isPending, error: mutation.error ? errorText(mutation.error) : null };
}

export function useRegeneratePhoto() {
  const apply = useApplyPropertyDetail();
  const mutation = useMutation({ mutationFn: generationApi.regenerate, onSuccess: apply });
  return {
    regenerate: (photoId: string) => mutation.mutate(photoId),
    pendingPhotoId: mutation.isPending ? mutation.variables : undefined,
    error: mutation.error ? errorText(mutation.error) : null,
  };
}

// Variações "revisar" só são aceitas depois de uma confirmação explícita, que fica registrada no dossiê.
export function useVariationChoice() {
  const apply = useApplyPropertyDetail();
  const [pendingReview, setPendingReview] = useState<{ photoId: string; variationId: string } | null>(null);
  const mutation = useMutation({
    mutationFn: ({ photoId, variationId, confirmReview }: { photoId: string; variationId: string; confirmReview: boolean }) =>
      generationApi.choose(photoId, { variationId, confirmReview }),
    onSuccess: (detail) => {
      setPendingReview(null);
      apply(detail);
    },
  });

  const choose = (photo: PhotoDTO, variation: VariationDTO) => {
    if (variation.verdict === "reprovado" || variation.id === photo.chosenVariationId) return;
    if (variation.verdict === "revisar") {
      setPendingReview({ photoId: photo.id, variationId: variation.id });
      return;
    }
    setPendingReview(null);
    mutation.mutate({ photoId: photo.id, variationId: variation.id, confirmReview: false });
  };

  return {
    choose,
    pendingReview,
    confirmReview: () => pendingReview && mutation.mutate({ ...pendingReview, confirmReview: true }),
    cancelReview: () => setPendingReview(null),
    pendingPhotoId: mutation.isPending ? mutation.variables?.photoId : undefined,
    error: mutation.error ? errorText(mutation.error) : null,
  };
}
