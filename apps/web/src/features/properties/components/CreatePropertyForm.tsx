import type { FormEvent } from "react";
import { Alert } from "../../../shared/ui/Alert";
import { Button } from "../../../shared/ui/Button";
import { TextField } from "../../../shared/ui/TextField";

interface CreatePropertyFormProps {
  title: string;
  error?: string;
  formError: string | null;
  submitting: boolean;
  onTitleChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
}

export function CreatePropertyForm({ title, error, formError, submitting, onTitleChange, onSubmit }: CreatePropertyFormProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {formError && <Alert tone="danger">{formError}</Alert>}
      <TextField
        label="Nome do imóvel"
        placeholder="Ex.: Apto 42 — Moema"
        value={title}
        error={error}
        hint="Aparece na página pública e no dossiê. Não coloque o endereço exato."
        autoFocus
        onValueChange={onTitleChange}
      />
      <Button type="submit" size="lg" loading={submitting} className="sm:self-start">
        Criar e enviar fotos
      </Button>
    </form>
  );
}
