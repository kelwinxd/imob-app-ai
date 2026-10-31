import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { StagingDetailDTO, UpdateStagingInput } from "@imob/shared";
import { errorText } from "../../../shared/api/http";
import { propertyKeys } from "../../properties/hooks/useProperties";
import { stagingsApi } from "../api/stagings.api";
import { isStagingBusy } from "../lib/status";

export const stagingKeys = {
  detail: (id: string) => ["stagings", "detail", id] as const,
};

export function useStaging(id: string) {
  return useQuery({
    queryKey: stagingKeys.detail(id),
    queryFn: () => stagingsApi.get(id),
    refetchInterval: (q) => (q.state.data && isStagingBusy(q.state.data) ? 2000 : false),
  });
}

// Toda mutação de decoração devolve o detalhe atualizado; o card no imóvel também precisa refletir a mudança.
export function useApplyStagingDetail() {
  const qc = useQueryClient();
  return (detail: StagingDetailDTO) => {
    qc.setQueryData(stagingKeys.detail(detail.id), detail);
    void qc.invalidateQueries({ queryKey: propertyKeys.detail(detail.propertyId) });
    void qc.invalidateQueries({ queryKey: propertyKeys.list() });
  };
}

export function useCreateStaging(propertyId: string) {
  const apply = useApplyStagingDetail();
  const mutation = useMutation({ mutationFn: () => stagingsApi.create(propertyId), onSuccess: apply });
  return { create: mutation.mutate, creating: mutation.isPending, error: mutation.error ? errorText(mutation.error) : null };
}

export function useUpdateStaging(stagingId: string) {
  const apply = useApplyStagingDetail();
  const mutation = useMutation({ mutationFn: (input: UpdateStagingInput) => stagingsApi.update(stagingId, input), onSuccess: apply });
  return { update: mutation.mutate, updating: mutation.isPending, error: mutation.error ? errorText(mutation.error) : null };
}

export function useDeleteStaging(propertyId: string) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: stagingsApi.remove,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: propertyKeys.detail(propertyId) });
      void qc.invalidateQueries({ queryKey: propertyKeys.list() });
    },
  });
  return {
    remove: (id: string) => mutation.mutate(id),
    removingId: mutation.isPending ? mutation.variables : undefined,
    error: mutation.error ? errorText(mutation.error) : null,
  };
}

export function useStagingPhotoInclude(stagingId: string) {
  const apply = useApplyStagingDetail();
  const mutation = useMutation({
    mutationFn: ({ photoId, include }: { photoId: string; include: boolean }) => stagingsApi.updatePhoto(stagingId, photoId, { include }),
    onSuccess: apply,
  });
  return {
    setInclude: (photoId: string, include: boolean) => mutation.mutate({ photoId, include }),
    pendingPhotoId: mutation.isPending ? mutation.variables?.photoId : undefined,
    error: mutation.error ? errorText(mutation.error) : null,
  };
}

export function useReferenceImages(stagingId: string) {
  const apply = useApplyStagingDetail();
  const add = useMutation({ mutationFn: (files: File[]) => stagingsApi.addReferences(stagingId, files), onSuccess: apply });
  const remove = useMutation({ mutationFn: (refId: string) => stagingsApi.removeReference(stagingId, refId), onSuccess: apply });
  const error = add.error ?? remove.error;
  return {
    add: (files: File[]) => add.mutate(files),
    remove: (refId: string) => remove.mutate(refId),
    uploading: add.isPending,
    removingId: remove.isPending ? remove.variables : undefined,
    error: error ? errorText(error) : null,
  };
}
