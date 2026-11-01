import { PAGE_THEME_LABELS, PAGE_THEMES, type PageTheme } from "@imob/shared";
import { cn } from "../../../shared/lib/cn";
import { Card } from "../../../shared/ui/Card";
import { Spinner } from "../../../shared/ui/Spinner";

interface PageOptionsProps {
  theme: PageTheme;
  saving: boolean;
  onThemeChange: (theme: PageTheme) => void;
}

export function PageOptions({ theme, saving, onThemeChange }: PageOptionsProps) {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">Aparência da página</p>
        {saving && <Spinner size={14} className="text-stone-500" />}
      </div>
      <div>
        <p className="mb-1.5 text-xs font-medium text-stone-700">Tema</p>
        <div role="radiogroup" aria-label="Tema" className="flex gap-1 rounded-xl bg-stone-100 p-1">
          {PAGE_THEMES.map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={theme === t}
              onClick={() => onThemeChange(t)}
              className={cn("min-h-9 flex-1 rounded-lg px-3 text-sm font-medium transition", theme === t ? "bg-white shadow-sm ring-1 ring-stone-200" : "text-stone-600 hover:text-stone-900")}
            >
              {PAGE_THEME_LABELS[t]}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-stone-500">“Automático” segue o tema do celular de quem abre. Vale na hora, inclusive para páginas já publicadas.</p>
    </Card>
  );
}
