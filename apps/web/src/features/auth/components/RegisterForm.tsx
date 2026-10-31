import type { FormEvent } from "react";
import { Alert } from "../../../shared/ui/Alert";
import { Button } from "../../../shared/ui/Button";
import { TextField } from "../../../shared/ui/TextField";

export interface RegisterValues {
  name: string;
  email: string;
  password: string;
}

interface RegisterFormProps {
  values: RegisterValues;
  errors: Partial<Record<keyof RegisterValues, string>>;
  onChange: (field: keyof RegisterValues, value: string) => void;
  onSubmit: (e: FormEvent) => void;
  submitting: boolean;
  formError: string | null;
}

export function RegisterForm({ values, errors, onChange, onSubmit, submitting, formError }: RegisterFormProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {formError && <Alert tone="danger">{formError}</Alert>}
      <TextField label="Nome" autoComplete="name" value={values.name} error={errors.name} onValueChange={(v) => onChange("name", v)} />
      <TextField label="E-mail" type="email" autoComplete="email" inputMode="email" value={values.email} error={errors.email} onValueChange={(v) => onChange("email", v)} />
      <TextField
        label="Senha"
        type="password"
        autoComplete="new-password"
        value={values.password}
        error={errors.password}
        hint="Pelo menos 8 caracteres"
        onValueChange={(v) => onChange("password", v)}
      />
      <Button type="submit" size="lg" fullWidth loading={submitting}>
        Criar conta
      </Button>
    </form>
  );
}
