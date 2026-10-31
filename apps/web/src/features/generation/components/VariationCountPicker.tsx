import { MAX_VARIATIONS } from "@imob/shared";
import { cn } from "../../../shared/lib/cn";

export function VariationCountPicker({ value, onChange, disabled }: { value: number; onChange: (n: number) => void; disabled?: boolean }) {
  const options = Array.from({ length: MAX_VARIATIONS }, (_, i) => i + 1);
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-stone-700">Variações por foto</p>
      <div role="radiogroup" aria-label="Variações por foto" className="grid grid-cols-3 gap-1 rounded-xl bg-stone-100 p-1">
        {options.map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            disabled={disabled}
            onClick={() => onChange(n)}
            className={cn("h-9 rounded-lg text-sm font-medium transition disabled:opacity-50", value === n ? "bg-white shadow-sm ring-1 ring-stone-200" : "text-stone-600 hover:text-stone-900")}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
