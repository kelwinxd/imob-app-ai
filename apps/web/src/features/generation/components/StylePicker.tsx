import { STANDARD_INFO, STANDARDS, STYLE_INFO, STYLES, type Standard, type Style } from "@imob/shared";
import { cn } from "../../../shared/lib/cn";
import { CheckIcon } from "../../../shared/ui/icons";

export function StylePicker({ value, onChange }: { value: Style | null; onChange: (style: Style) => void }) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-semibold text-stone-900">Estilo da decoração</legend>
      <div role="radiogroup" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {STYLES.map((s) => {
          const selected = value === s;
          return (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(s)}
              className={cn(
                "relative flex min-h-24 flex-col items-start gap-1 rounded-xl border p-3 text-left transition",
                selected ? "border-brand-500 bg-brand-50 ring-2 ring-brand-200" : "border-stone-200 bg-white hover:border-stone-300",
              )}
            >
              {selected && (
                <span className="absolute top-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white">
                  <CheckIcon size={13} />
                </span>
              )}
              <span className="font-medium text-stone-900">{STYLE_INFO[s].label}</span>
              <span className="text-xs leading-snug text-stone-600">{STYLE_INFO[s].description}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function StandardPicker({ value, onChange }: { value: Standard | null; onChange: (standard: Standard) => void }) {
  return (
    <fieldset>
      <legend className="mb-1 text-sm font-semibold text-stone-900">Padrão do imóvel</legend>
      <p className="mb-3 text-xs text-stone-600">Limita o tipo de móvel, para não criar expectativa falsa no comprador.</p>
      <div role="radiogroup" className="grid grid-cols-3 gap-1 rounded-xl bg-stone-100 p-1">
        {STANDARDS.map((s) => {
          const selected = value === s;
          return (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(s)}
              className={cn(
                "flex flex-col items-center rounded-lg px-2 py-2 text-center transition",
                selected ? "bg-white shadow-sm ring-1 ring-stone-200" : "text-stone-600 hover:text-stone-900",
              )}
            >
              <span className="text-sm font-medium">{STANDARD_INFO[s].label}</span>
              <span className="hidden text-[11px] text-stone-500 sm:block">{STANDARD_INFO[s].description}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
