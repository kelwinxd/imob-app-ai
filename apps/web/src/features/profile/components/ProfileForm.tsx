import type { FormEvent } from "react";
import { Alert } from "../../../shared/ui/Alert";
import { Button } from "../../../shared/ui/Button";
import { TextField } from "../../../shared/ui/TextField";

export interface ProfileValues {
  companyName: string;
  brandColor: string;
  whatsapp: string;
  phone: string;
  creci: string;
}

interface ProfileFormProps {
  values: ProfileValues;
  errors: Partial<Record<keyof ProfileValues, string>>;
  onChange: (field: keyof ProfileValues, value: string) => void;
  onSubmit: (e: FormEvent) => void;
  saving: boolean;
  saved: boolean;
  error: string | null;
}

export function ProfileForm({ values, errors, onChange, onSubmit, saving, saved, error }: ProfileFormProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {error && <Alert tone="danger">{error}</Alert>}
      <TextField label="Nome da imobiliária ou corretor" value={values.companyName} error={errors.companyName} onValueChange={(v) => onChange("companyName", v)} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="brand-color" className="text-sm font-medium text-stone-800">Cor da marca</label>
        <div className="flex items-center gap-3">
          <input
            id="brand-color"
            type="color"
            value={/^#[0-9a-fA-F]{6}$/.test(values.brandColor) ? values.brandColor : "#8a5a2b"}
            onChange={(e) => onChange("brandColor", e.target.value)}
            className="h-11 w-14 cursor-pointer rounded-lg border border-stone-300 bg-white p-1"
          />
          <input
            aria-label="Código da cor"
            value={values.brandColor}
            onChange={(e) => onChange("brandColor", e.target.value)}
            className="h-11 w-32 rounded-xl border border-stone-300 bg-white px-3 font-mono text-sm uppercase focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100"
          />
        </div>
        {errors.brandColor && <p className="text-sm text-red-600">{errors.brandColor}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="WhatsApp" inputMode="tel" placeholder="(11) 91234-5678" value={values.whatsapp} error={errors.whatsapp} onValueChange={(v) => onChange("whatsapp", v)} />
        <TextField label="Telefone (opcional)" inputMode="tel" value={values.phone} error={errors.phone} onValueChange={(v) => onChange("phone", v)} />
      </div>
      <TextField label="CRECI (opcional)" value={values.creci} error={errors.creci} onValueChange={(v) => onChange("creci", v)} />
      <div className="flex items-center gap-3">
        <Button type="submit" loading={saving}>Salvar</Button>
        {saved && !saving && <span className="text-sm text-emerald-700">Salvo. As páginas publicadas já mostram a nova marca.</span>}
      </div>
    </form>
  );
}
