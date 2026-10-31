import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UserDTO } from "@imob/shared";
import { isApiError } from "../../../shared/api/http";
import { authApi } from "../api/auth.api";

export const sessionKey = ["session"] as const;

export function useSession() {
  return useQuery<UserDTO | null>({
    queryKey: sessionKey,
    queryFn: async () => {
      try {
        return await authApi.me();
      } catch (e) {
        if (isApiError(e) && e.status === 401) return null;
        throw e;
      }
    },
    staleTime: Infinity,
    retry: false,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: authApi.login, onSuccess: (user) => qc.setQueryData(sessionKey, user) });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: authApi.register, onSuccess: (user) => qc.setQueryData(sessionKey, user) });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      qc.clear();
      qc.setQueryData(sessionKey, null);
    },
  });
}
