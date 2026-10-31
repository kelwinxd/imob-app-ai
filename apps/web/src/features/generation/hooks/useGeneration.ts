import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type { StagingPhotoDTO, VariationDTO } from "@imob/shared";
import { errorText } from "../../../shared/api/http";
import { stagingsApi } from "../../stagings/api/stagings.api";
import { useApplyStagingDetail } from "../../stagings/hooks/useStagings";

export function useGenerate(stagingId: string) {
  const apply = useApplyStagingDetail();
  const mutation = useMutation({
    mutationFn: (input: { variations: number; photoIds?: string[] }) => stagingsApi.generate(stagingId, input),
    onSuccess: apply,
  });
  return {
    generateAll: (variations: number) => mutation.mutate({ variations }),
    generatePhoto: (photoId: string, variations: number) => mutation.mutate({ variations, photoIds: [photoId] }),
    starting: mutation.isPending,
    startingPhotoId: mutation.isPending ? mutation.variables?.photoIds?.[0] : undefined,
    error: mutation.error ? errorText(mutation.error) : null,
  };
}

// Variações "revisar" só são aceitas depois de uma confirmação explícita, que fica registrada no dossiê.
export function useVariationChoice(stagingId: string) {
  const apply = useApplyStagingDetail();
  const [pendingReview, setPendingReview] = useState<{ photoId: string; variationId: string } | null>(null);
  const mutation = useMutation({
    mutationFn: ({ photoId, variationId, confirmReview }: { photoId: string; variationId: string; confirmReview: boolean }) =>
      stagingsApi.choose(stagingId, photoId, { variationId, confirmReview }),
    onSuccess: (detail) => {
      setPendingReview(null);
      apply(detail);
    },
  });

  const choose = (photo: StagingPhotoDTO, variation: VariationDTO) => {
    if (variation.verdict === "reprovado" || variation.id === photo.chosenVariationId) return;
    if (variation.verdict === "revisar") {
      setPendingReview({ photoId: photo.photoId, variationId: variation.id });
      return;
    }
    setPendingReview(null);
    mutation.mutate({ photoId: photo.photoId, variationId: variation.id, confirmReview: false });
  };

  return {
    choose,
    pendingReview,
    confirmReview: () => pendingReview && mutation.mutate({ ...pendingReview, confirmReview: true }),
    cancelReview: () => setPendingReview(null),
    choosing: mutation.isPending,
    error: mutation.error ? errorText(mutation.error) : null,
  };
}
