import { useQuery } from "@tanstack/react-query";
import { http } from "./http";

export function useServerInfo() {
  return useQuery({
    queryKey: ["server-info"],
    queryFn: () => http.get<{ ok: boolean; aiMock: boolean }>("/health").then((r) => r.data),
    staleTime: 60_000,
  });
}
