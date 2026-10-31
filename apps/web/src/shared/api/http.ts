import axios, { AxiosError } from "axios";
import type { ApiErrorBody } from "@imob/shared";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly fields: Record<string, string> = {},
  ) {
    super(message);
  }
}

export const isApiError = (e: unknown): e is ApiError => e instanceof ApiError;

export const http = axios.create({
  baseURL: "/api",
  withCredentials: true,
  timeout: 120_000,
});

http.interceptors.response.use(
  (res) => res,
  (err: AxiosError<ApiErrorBody>) => {
    const body = err.response?.data?.error;
    if (body) {
      const fields = (body.details as { fields?: Record<string, string> } | undefined)?.fields ?? {};
      return Promise.reject(new ApiError(body.message, err.response!.status, body.code, fields));
    }
    const message = err.code === "ECONNABORTED" ? "O servidor demorou para responder." : "Não foi possível falar com o servidor. Verifique sua conexão.";
    return Promise.reject(new ApiError(message, err.response?.status ?? 0, "NETWORK"));
  },
);

export const errorText = (e: unknown) => (isApiError(e) || e instanceof Error ? e.message : "Algo deu errado.");
