import { FURNITURE_COLORS, MAX_FURNITURE_COLORS, type FurnitureColorId } from "@imob/shared";
import { cn } from "../../../shared/lib/cn";
import { CheckIcon } from "../../../shared/ui/icons";

interface FurnitureColorPickerProps {
  value: FurnitureColorId[];
  onToggle: (id: FurnitureColorId) => void;
}

export function FurnitureColorPicker({ value, onToggle }: FurnitureColorPickerProps) {
  const full = value.length >= MAX_FURNITURE_COLORS;
  return (
    <fieldset>
      <legend className="mb-1 text-sm font-semibold text-stone-900">Cores dos móveis</legend>
      <p className="mb-3 text-xs text-stone-600">Opcional. Escolha até {MAX_FURNITURE_COLORS}; sem escolha, a IA segue as cores do estilo.</p>
      <div className="flex flex-wrap gap-2">
        {FURNITURE_COLORS.map((c) => {
          const selected = value.includes(c.id);
          const disabled = !selected && full;
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={selected}
              disabled={disabled}
              onClick={() => onToggle(c.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-sm transition disabled:opacity-40",
                selected ? "border-brand-500 bg-brand-50 text-stone-900" : "border-stone-200 bg-white text-stone-700 hover:border-stone-300",
              )}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full ring-1 ring-black/10" style={{ background: c.hex }}>
                {selected && <CheckIcon size={13} className={c.id === "branco" || c.id === "bege" || c.id === "cinza" ? "text-stone-800" : "text-white"} />}
              </span>
              {c.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
