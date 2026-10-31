import type { FormEvent } from "react";
import { Alert } from "../../../shared/ui/Alert";
import { Button } from "../../../shared/ui/Button";
import { TextField } from "../../../shared/ui/TextField";

export interface LoginValues {
  email: string;
  password: string;
}

interface LoginFormProps {
  values: LoginValues;
  errors: Partial<Record<keyof LoginValues, string>>;
  onChange: (field: keyof LoginValues, value: string) => void;
  onSubmit: (e: FormEvent) => void;
  submitting: boolean;
  formError: string | null;
}

export function LoginForm({ values, errors, onChange, onSubmit, submitting, formError }: LoginFormProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {formError && <Alert tone="danger">{formError}</Alert>}
      <TextField label="E-mail" type="email" autoComplete="email" inputMode="email" value={values.email} error={errors.email} onValueChange={(v) => onChange("email", v)} />
      <TextField label="Senha" type="password" autoComplete="current-password" value={values.password} error={errors.password} onValueChange={(v) => onChange("password", v)} />
      <Button type="submit" size="lg" fullWidth loading={submitting}>
        Entrar
      </Button>
    </form>
  );
}
