import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PropertyDetailDTO } from "@imob/shared";
import { propertiesApi } from "../api/properties.api";
import { isBusy } from "../lib/status";

export const propertyKeys = {
  all: ["properties"] as const,
  list: () => [...propertyKeys.all, "list"] as const,
  detail: (id: string) => [...propertyKeys.all, "detail", id] as const,
};

export function useProperties() {
  return useQuery({ queryKey: propertyKeys.list(), queryFn: propertiesApi.list });
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: propertyKeys.detail(id),
    queryFn: () => propertiesApi.get(id),
    refetchInterval: (q) => (q.state.data && isBusy(q.state.data) ? 2000 : false),
  });
}

// Toda mutação de imóvel devolve o detalhe atualizado; grava direto no cache em vez de refazer a busca.
export function useApplyPropertyDetail() {
  const qc = useQueryClient();
  return (detail: PropertyDetailDTO) => {
    qc.setQueryData(propertyKeys.detail(detail.id), detail);
    void qc.invalidateQueries({ queryKey: propertyKeys.list() });
  };
}

export function useDeleteProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: propertiesApi.remove,
    onSuccess: (_data, id) => {
      qc.removeQueries({ queryKey: propertyKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: propertyKeys.list() });
    },
  });
}

export function useCreateProperty() {
  const apply = useApplyPropertyDetail();
  return useMutation({ mutationFn: propertiesApi.create, onSuccess: apply });
}
