import type { FormEvent } from "react";
import { LoginInputSchema, RegisterInputSchema } from "@imob/shared";
import { errorText, isApiError } from "../../../shared/api/http";
import { useZodForm } from "../../../shared/lib/useZodForm";
import { useLogin, useRegister } from "./useSession";

export function useLoginForm(onSuccess: () => void) {
  const form = useZodForm(LoginInputSchema, { email: "", password: "" });
  const login = useLogin();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const data = form.validate();
    if (data) login.mutate(data, { onSuccess });
  };

  return {
    values: form.values,
    errors: form.errors,
    setField: form.setField,
    submit,
    submitting: login.isPending,
    formError: login.error ? errorText(login.error) : null,
  };
}

export function useRegisterForm(onSuccess: () => void) {
  const form = useZodForm(RegisterInputSchema, { name: "", email: "", password: "" });
  const register = useRegister();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const data = form.validate();
    if (!data) return;
    register.mutate(data, {
      onSuccess,
      onError: (err) => {
        if (isApiError(err)) form.applyServerErrors(err.code === "EMAIL_TAKEN" ? { email: err.message } : err.fields);
      },
    });
  };

  const error = register.error;
  return {
    values: form.values,
    errors: form.errors,
    setField: form.setField,
    submit,
    submitting: register.isPending,
    formError: error && !(isApiError(error) && (error.code === "EMAIL_TAKEN" || Object.keys(error.fields).length)) ? errorText(error) : null,
  };
}
