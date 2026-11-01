import {
  PAGE_COMPARE_LABELS, PAGE_COMPARE_MODES, PAGE_THEME_LABELS, PAGE_THEMES,
  type PageCompareMode, type PageTheme,
} from "@imob/shared";
import { cn } from "../../../shared/lib/cn";
import { Card } from "../../../shared/ui/Card";
import { Spinner } from "../../../shared/ui/Spinner";

interface SegmentedProps<T extends string> {
  label: string;
  options: readonly T[];
  labels: Record<T, string>;
  value: T;
  disabled?: boolean;
  onChange: (value: T) => void;
}

function Segmented<T extends string>({ label, options, labels, value, disabled, onChange }: SegmentedProps<T>) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-stone-700">{label}</p>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1 rounded-xl bg-stone-100 p-1">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={value === o}
            disabled={disabled}
            onClick={() => onChange(o)}
            className={cn("min-h-9 flex-1 rounded-lg px-3 text-sm font-medium transition disabled:opacity-50", value === o ? "bg-white shadow-sm ring-1 ring-stone-200" : "text-stone-600 hover:text-stone-900")}
          >
            {labels[o]}
          </button>
        ))}
      </div>
    </div>
  );
}

interface PageOptionsProps {
  theme: PageTheme;
  compare: PageCompareMode;
  saving: boolean;
  onThemeChange: (theme: PageTheme) => void;
  onCompareChange: (mode: PageCompareMode) => void;
}

export function PageOptions({ theme, compare, saving, onThemeChange, onCompareChange }: PageOptionsProps) {
  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">Aparência da página</p>
        {saving && <Spinner size={14} className="text-stone-500" />}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Segmented label="Tema" options={PAGE_THEMES} labels={PAGE_THEME_LABELS} value={theme} disabled={saving} onChange={onThemeChange} />
        <Segmented label="Antes e depois" options={PAGE_COMPARE_MODES} labels={PAGE_COMPARE_LABELS} value={compare} disabled={saving} onChange={onCompareChange} />
      </div>
      <p className="text-xs text-stone-500">
        {compare === "resumido"
          ? "No fim da página aparece só “Imagens decoradas com IA”, com as fotos originais recolhidas. O selo continua em cada foto."
          : "A página mostra cada foto original ao lado da decorada."}{" "}
        Vale na hora, inclusive para páginas já publicadas.
      </p>
    </Card>
  );
}
