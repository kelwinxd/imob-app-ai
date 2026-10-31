import type { ErrorRequestHandler, Response } from "express";
import multer from "multer";
import { z } from "zod";
import type { ApiErrorBody } from "@imob/shared";
import type { Storage } from "./storage";

export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

export const badRequest = (message: string, details?: unknown) => new AppError(400, "BAD_REQUEST", message, details);
export const unauthorized = (message = "Faça login para continuar.") => new AppError(401, "UNAUTHORIZED", message);
export const notFound = (message = "Não encontrado.") => new AppError(404, "NOT_FOUND", message);
export const conflict = (message: string, code = "CONFLICT") => new AppError(409, code, message);
export const unprocessable = (message: string, code = "UNPROCESSABLE") => new AppError(422, code, message);

export function parseInput<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const fields = Object.fromEntries(result.error.issues.map((i) => [i.path.join(".") || "_", i.message]));
    throw new AppError(400, "VALIDATION_ERROR", result.error.issues[0]?.message ?? "Dados inválidos.", { fields });
  }
  return result.data;
}

const IdSchema = z.uuid();
export function parseId(value: unknown): string {
  const r = IdSchema.safeParse(value);
  if (!r.success) throw notFound();
  return r.data;
}

const sendError = (res: Response, status: number, body: ApiErrorBody) => res.status(status).json(body);

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    sendError(res, err.status, { error: { code: err.code, message: err.message, details: err.details } });
    return;
  }
  if (err instanceof multer.MulterError) {
    const message = err.code === "LIMIT_FILE_SIZE" ? "Uma das fotos passa do tamanho máximo." : err.code === "LIMIT_FILE_COUNT" ? "Fotos demais de uma vez." : "Upload inválido.";
    sendError(res, 400, { error: { code: err.code, message } });
    return;
  }
  if (err instanceof SyntaxError && "body" in err) {
    sendError(res, 400, { error: { code: "BAD_JSON", message: "JSON inválido." } });
    return;
  }
  console.error(err);
  sendError(res, 500, { error: { code: "INTERNAL", message: "Erro inesperado. Tente de novo." } });
};

export async function sendStored(res: Response, store: Storage, key: string, type: string, cache: "immutable" | "revalidate") {
  if (!store.exists(key)) throw notFound("Arquivo não encontrado.");
  res.type(type);
  res.setHeader("Cache-Control", cache === "immutable" ? "private, max-age=31536000, immutable" : "private, no-cache");
  res.send(await store.read(key));
}

export const errorMessage = (err: unknown) => (err instanceof Error ? err.message : String(err)).slice(0, 300);
