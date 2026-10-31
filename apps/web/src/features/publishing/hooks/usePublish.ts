import { useMutation } from "@tanstack/react-query";
import { errorText } from "../../../shared/api/http";
import { stagingsApi } from "../../stagings/api/stagings.api";
import { useApplyStagingDetail } from "../../stagings/hooks/useStagings";

export function usePublish(stagingId: string) {
  const apply = useApplyStagingDetail();
  const mutation = useMutation({ mutationFn: () => stagingsApi.publish(stagingId), onSuccess: apply });
  return { publish: () => mutation.mutate(), requesting: mutation.isPending, error: mutation.error ? errorText(mutation.error) : null };
}
