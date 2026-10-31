import { useId, type FormEvent } from "react";
import { PURPOSE_LABELS, PURPOSES } from "@imob/shared";
import { cn } from "../../../shared/lib/cn";
import { Alert } from "../../../shared/ui/Alert";
import { Button } from "../../../shared/ui/Button";
import { TextField } from "../../../shared/ui/TextField";
import type { ListingValues } from "../hooks/useListingForm";

interface ListingFormProps {
  values: ListingValues;
  errors: Partial<Record<keyof ListingValues, string>>;
  onChange: (field: keyof ListingValues, value: string) => void;
  onSubmit: (e: FormEvent) => void;
  saving: boolean;
  saved: boolean;
  dirty: boolean;
  error: string | null;
}

export function ListingForm({ values, errors, onChange, onSubmit, saving, saved, dirty, error }: ListingFormProps) {
  const descId = useId();
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      {error && <Alert tone="danger">{error}</Alert>}

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-stone-800">Finalidade</legend>
        <div className="flex gap-2">
          {(["", ...PURPOSES] as const).map((p) => (
            <button
              key={p || "nenhuma"}
              type="button"
              aria-pressed={values.purpose === p}
              onClick={() => onChange("purpose", p)}
              className={cn(
                "h-10 rounded-xl px-4 text-sm font-medium ring-1 transition",
                values.purpose === p ? "bg-brand-600 text-white ring-brand-600" : "bg-white text-stone-700 ring-stone-300 hover:bg-stone-50",
              )}
            >
              {p ? PURPOSE_LABELS[p] : "Não informar"}
            </button>
          ))}
        </div>
      </fieldset>

      <TextField
        label={values.purpose === "aluguel" ? "Aluguel mensal (R$)" : "Preço (R$)"}
        inputMode="numeric"
        placeholder="Ex.: 650.000"
        value={values.price}
        error={errors.price}
        hint="Deixe em branco para não mostrar."
        onValueChange={(v) => onChange("price", v)}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <TextField label="Área (m²)" inputMode="decimal" value={values.areaM2} error={errors.areaM2} onValueChange={(v) => onChange("areaM2", v)} />
        <TextField label="Quartos" inputMode="numeric" value={values.bedrooms} error={errors.bedrooms} onValueChange={(v) => onChange("bedrooms", v)} />
        <TextField label="Banheiros" inputMode="numeric" value={values.bathrooms} error={errors.bathrooms} onValueChange={(v) => onChange("bathrooms", v)} />
        <TextField label="Vagas" inputMode="numeric" value={values.parkingSpots} error={errors.parkingSpots} onValueChange={(v) => onChange("parkingSpots", v)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Bairro" value={values.neighborhood} error={errors.neighborhood} onValueChange={(v) => onChange("neighborhood", v)} />
        <TextField label="Cidade" value={values.city} error={errors.city} onValueChange={(v) => onChange("city", v)} />
      </div>
      <p className="-mt-2 text-xs text-stone-500">Não coloque rua nem número: a página é pública.</p>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={descId} className="text-sm font-medium text-stone-800">Descrição</label>
        <textarea
          id={descId}
          rows={6}
          value={values.description}
          maxLength={2000}
          onChange={(e) => onChange("description", e.target.value)}
          placeholder="Ex.: Apartamento iluminado, com varanda e vista livre. Próximo ao metrô…"
          className="rounded-xl border border-stone-300 bg-white px-3.5 py-3 text-base text-stone-900 placeholder:text-stone-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100"
        />
        <p className="text-right text-xs text-stone-500">{values.description.length}/2000</p>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" loading={saving} disabled={!dirty}>Salvar</Button>
        {saved && <span className="text-sm text-emerald-700">Salvo. As páginas publicadas já mostram os novos dados.</span>}
      </div>
    </form>
  );
}
