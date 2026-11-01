import { useId } from "react";
import { INSTRUCTION_EXAMPLES, MAX_INSTRUCTION_LENGTH } from "@imob/shared";
import { cn } from "../../../shared/lib/cn";
import { PlusIcon } from "../../../shared/ui/icons";

interface InstructionFieldProps {
  value: string;
  error: string | null;
  disabled?: boolean;
  onChange: (value: string) => void;
}

export function InstructionField({ value, error, disabled, onChange }: InstructionFieldProps) {
  const id = useId();
  const append = (example: string) => onChange(value.trim() ? `${value.trim().replace(/[.;]$/, "")}; ${example.toLowerCase()}` : example);
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-stone-900">Pedido específico</label>
      <p className="text-xs text-stone-600">
        Opcional. Só vale para móveis, objetos e a disposição deles. Pedidos para mudar paredes, janelas, piso, luz ou incluir pessoas e textos são recusados.
      </p>
      <textarea
        id={id}
        rows={3}
        value={value}
        maxLength={MAX_INSTRUCTION_LENGTH}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ex.: adicione um quadro grande acima do sofá e uma poltrona perto da janela"
        aria-invalid={Boolean(error)}
        className={cn(
          "rounded-xl border bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-4 disabled:opacity-60",
          error ? "border-red-400 focus:ring-red-100" : "border-stone-300 focus:border-brand-500 focus:ring-brand-100",
        )}
      />
      <div className="flex items-start justify-between gap-3">
        {error ? <p className="text-xs text-red-600">{error}</p> : <span />}
        <span className="shrink-0 text-xs text-stone-500 tabular-nums">{value.length}/{MAX_INSTRUCTION_LENGTH}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {INSTRUCTION_EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            disabled={disabled || value.length + ex.length + 2 > MAX_INSTRUCTION_LENGTH}
            onClick={() => append(ex)}
            className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-2.5 py-1 text-xs text-stone-700 hover:border-stone-300 disabled:opacity-40"
          >
            <PlusIcon size={12} /> {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
