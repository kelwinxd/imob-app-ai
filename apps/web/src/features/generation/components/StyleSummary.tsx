import { FURNITURE_COLORS, STANDARD_INFO, STYLE_INFO, type Standard, type Style } from "@imob/shared";
import { plural } from "../../../shared/lib/format";
import { styleImageOf } from "./StylePicker";

interface StyleSummaryProps {
  style: Style | null;
  standard: Standard | null;
  colors: string[];
  referenceCount: number;
  onEdit: () => void;
}

export function StyleSummary({ style, standard, colors, referenceCount, onEdit }: StyleSummaryProps) {
  const swatches = FURNITURE_COLORS.filter((c) => colors.includes(c.id));
  return (
    <div className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-2.5">
      {style && <img src={styleImageOf(style)} alt="" className="h-14 w-16 shrink-0 rounded-lg object-cover" />}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{style ? STYLE_INFO[style].label : "Sem estilo"}</p>
        <p className="truncate text-xs text-stone-600">Padrão {standard ? STANDARD_INFO[standard].label.toLowerCase() : "-"}</p>
        {(swatches.length > 0 || referenceCount > 0) && (
          <div className="mt-1 flex items-center gap-1.5">
            {swatches.map((c) => (
              <span key={c.id} title={c.label} className="h-3.5 w-3.5 rounded-full ring-1 ring-black/10" style={{ background: c.hex }} />
            ))}
            {referenceCount > 0 && <span className="text-[11px] text-stone-500">{plural(referenceCount, "referência", "referências")}</span>}
          </div>
        )}
      </div>
      <button type="button" onClick={onEdit} className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50">
        Alterar
      </button>
    </div>
  );
}
