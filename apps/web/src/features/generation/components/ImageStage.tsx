import { cn } from "../../../shared/lib/cn";
import { DownloadIcon, ExpandIcon } from "../../../shared/ui/icons";
import { Spinner } from "../../../shared/ui/Spinner";

interface ImageStageProps {
  src: string | null;
  label: string;
  overlay?: { title: string; subtitle?: string; spinning?: boolean } | null;
  compare?: { active: boolean; onChange: (active: boolean) => void } | null;
  onExpand?: () => void;
  download?: { url: string; fileName: string } | null;
}

const chip = "flex h-9 items-center gap-1.5 rounded-full bg-black/60 px-3 text-xs font-semibold text-white shadow transition hover:bg-black/75";

export function ImageStage({ src, label, overlay, compare, onExpand, download }: ImageStageProps) {
  return (
    <figure className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-900/95 shadow-sm">
      <div className="relative flex aspect-[4/3] items-center justify-center">
        {src ? (
          <button type="button" onClick={onExpand} disabled={!onExpand || Boolean(overlay)} className="h-full w-full cursor-zoom-in disabled:cursor-default" aria-label="Ver em tela cheia">
            <img src={src} alt={label} className="h-full w-full object-contain" />
          </button>
        ) : (
          <span className="text-sm text-stone-400">Nenhuma foto selecionada</span>
        )}
        <span className="pointer-events-none absolute top-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">{label}</span>
        {!overlay && (onExpand || download) && (
          <div className="absolute top-3 right-3 flex gap-2">
            {onExpand && (
              <button type="button" onClick={onExpand} className={chip} aria-label="Ver em tela cheia">
                <ExpandIcon size={14} /> <span className="hidden sm:inline">Ampliar</span>
              </button>
            )}
            {download && (
              <a href={download.url} download={download.fileName} className={chip} aria-label="Baixar imagem">
                <DownloadIcon size={14} /> <span className="hidden sm:inline">Baixar</span>
              </a>
            )}
          </div>
        )}
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
