import { cn } from "../../../shared/lib/cn";
import { Spinner } from "../../../shared/ui/Spinner";

interface ImageStageProps {
  src: string | null;
  label: string;
  overlay?: { title: string; subtitle?: string; spinning?: boolean } | null;
  compare?: { active: boolean; onChange: (active: boolean) => void } | null;
}

export function ImageStage({ src, label, overlay, compare }: ImageStageProps) {
  return (
    <figure className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-900/95 shadow-sm">
      <div className="relative flex aspect-[4/3] items-center justify-center">
        {src ? <img src={src} alt={label} className="h-full w-full object-contain" /> : <span className="text-sm text-stone-400">Nenhuma foto selecionada</span>}
        <span className="absolute top-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">{label}</span>
        {compare && (
          <button
            type="button"
            aria-pressed={compare.active}
            onClick={() => compare.onChange(!compare.active)}
            className={cn(
              "absolute right-3 bottom-3 rounded-full px-3 py-1.5 text-xs font-semibold shadow transition",
              compare.active ? "bg-white text-stone-900" : "bg-black/60 text-white hover:bg-black/75",
            )}
          >
            {compare.active ? "Ver decorada" : "Comparar com a original"}
          </button>
        )}
        {overlay && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-stone-900/55 px-6 text-center text-white backdrop-blur-[2px]">
            {overlay.spinning && <Spinner size={28} />}
            <p className="text-sm font-semibold">{overlay.title}</p>
            {overlay.subtitle && <p className="text-xs text-white/80">{overlay.subtitle}</p>}
          </div>
        )}
      </div>
    </figure>
  );
}
