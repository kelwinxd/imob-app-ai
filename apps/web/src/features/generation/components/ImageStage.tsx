import type { ReactNode } from "react";
import { Spinner } from "../../../shared/ui/Spinner";

interface ImageStageProps {
  src: string | null;
  label: string;
  overlay?: { title: string; subtitle?: string; spinning?: boolean } | null;
  footer?: ReactNode;
}

export function ImageStage({ src, label, overlay, footer }: ImageStageProps) {
  return (
    <figure className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-900/95 shadow-sm">
      <div className="relative flex aspect-[4/3] items-center justify-center">
        {src ? <img src={src} alt={label} className="h-full w-full object-contain" /> : <span className="text-sm text-stone-400">Nenhuma foto selecionada</span>}
        <span className="absolute top-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">{label}</span>
        {overlay && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-stone-900/55 px-6 text-center text-white backdrop-blur-[2px]">
            {overlay.spinning && <Spinner size={28} />}
            <p className="text-sm font-semibold">{overlay.title}</p>
            {overlay.subtitle && <p className="text-xs text-white/80">{overlay.subtitle}</p>}
          </div>
        )}
      </div>
      {footer && <figcaption className="bg-white px-4 py-2.5 text-xs text-stone-600">{footer}</figcaption>}
    </figure>
  );
}
