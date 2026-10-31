import { QueryCache, QueryClient } from "@tanstack/react-query";
import { isApiError } from "../shared/api/http";
import { sessionKey } from "../features/auth/hooks/useSession";

// Sessão expirada em qualquer consulta: zera a sessão e o ProtectedLayout manda para o login.
export const queryClient: QueryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (err, query) => {
      if (isApiError(err) && err.status === 401 && query.queryKey[0] !== sessionKey[0]) {
        queryClient.setQueryData(sessionKey, null);
      }
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      refetchOnWindowFocus: false,
      retry: (count, err) => !(isApiError(err) && err.status >= 400 && err.status < 500) && count < 2,
    },
  },
});
