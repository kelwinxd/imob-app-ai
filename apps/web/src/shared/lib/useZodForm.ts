import { useCallback, useState } from "react";
import type { z } from "zod";

type FieldErrors<T> = Partial<Record<keyof T, string>>;

export function useZodForm<TValues extends Record<string, string>, TOutput>(schema: z.ZodType<TOutput, TValues>, initial: TValues) {
  const [values, setValues] = useState<TValues>(initial);
  const [errors, setErrors] = useState<FieldErrors<TValues>>({});

  const setField = useCallback((field: keyof TValues, value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }, []);

  const validate = useCallback((): TOutput | null => {
    const result = schema.safeParse(values);
    if (result.success) {
      setErrors({});
      return result.data;
    }
    const next: FieldErrors<TValues> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0] as keyof TValues;
      next[key] ??= issue.message;
    }
    setErrors(next);
    return null;
  }, [schema, values]);

  const applyServerErrors = useCallback((fields: Record<string, string>) => {
    setErrors((e) => ({ ...e, ...(fields as FieldErrors<TValues>) }));
  }, []);

  return { values, errors, setField, validate, applyServerErrors };
}
