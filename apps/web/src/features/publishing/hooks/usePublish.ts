import { useMutation } from "@tanstack/react-query";
import { errorText } from "../../../shared/api/http";
import { useApplyPropertyDetail } from "../../properties/hooks/useProperties";
import { publishingApi } from "../api/publishing.api";

export function usePublish(propertyId: string) {
  const apply = useApplyPropertyDetail();
  const mutation = useMutation({ mutationFn: () => publishingApi.publish(propertyId), onSuccess: apply });
  return { publish: () => mutation.mutate(), requesting: mutation.isPending, error: mutation.error ? errorText(mutation.error) : null };
}
