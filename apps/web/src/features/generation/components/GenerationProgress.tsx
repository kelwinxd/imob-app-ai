import { Spinner } from "../../../shared/ui/Spinner";

interface GenerationProgressProps {
  pct: number;
  done: number;
  total: number;
  remainingSec: number;
}

export function GenerationProgress({ pct, done, total, remainingSec }: GenerationProgressProps) {
  const time = remainingSec > 5 ? `cerca de ${remainingSec < 60 ? `${remainingSec} s` : `${Math.ceil(remainingSec / 60)} min`}` : "finalizando…";
  return (
    <div className="rounded-xl border border-stone-200 bg-white px-4 py-3" role="status" aria-live="polite">
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="flex items-center gap-2 font-medium text-stone-800">
          <Spinner size={14} className="text-brand-600" />
          {total > 1 ? `Gerando · ${done} de ${total} fotos prontas` : "Gerando a foto"}
        </span>
        <span className="text-xs text-stone-500 tabular-nums">{time}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-stone-200" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progresso da geração">
        <div className="h-full rounded-full bg-brand-600 transition-[width] duration-500 ease-out" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1.5 text-[11px] text-stone-500">Cada variação também passa pela trava de estrutura antes de aparecer.</p>
    </div>
  );
}
