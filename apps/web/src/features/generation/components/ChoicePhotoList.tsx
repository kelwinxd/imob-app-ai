import { ROOM_LABELS, type StagingPhotoDTO } from "@imob/shared";
import { cn } from "../../../shared/lib/cn";
import { Spinner } from "../../../shared/ui/Spinner";

function statusText(p: StagingPhotoDTO): { text: string; className: string } {
  if (p.status === "generating") return { text: "Gerando…", className: "text-sky-700" };
  if (p.status === "failed") return { text: "Erro na geração", className: "text-red-700" };
  if (p.status === "pending" || p.variations.length === 0) return { text: "Ainda não gerada", className: "text-stone-500" };
  if (p.needsGeneration) return { text: "Estilo mudou: gere de novo", className: "text-amber-700" };
  const chosen = p.variations.find((v) => v.id === p.chosenVariationId);
  return chosen ? { text: `Escolhida: V${chosen.index}`, className: "text-emerald-700" } : { text: "Escolha uma variação", className: "text-amber-700" };
}

interface ChoicePhotoListProps {
  photos: StagingPhotoDTO[];
  selectedId: string | null;
  onSelect: (photoId: string) => void;
}

export function ChoicePhotoList({ photos, selectedId, onSelect }: ChoicePhotoListProps) {
  return (
    <ul className="flex flex-col gap-1.5" aria-label="Fotos">
      {photos.map((p, i) => {
        const s = statusText(p);
        const chosen = p.variations.find((v) => v.id === p.chosenVariationId);
        return (
          <li key={p.photoId}>
            <button
              type="button"
              onClick={() => onSelect(p.photoId)}
              aria-current={selectedId === p.photoId ? "true" : undefined}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-xl p-1.5 text-left transition",
                selectedId === p.photoId ? "bg-brand-50 ring-1 ring-brand-300" : "hover:bg-stone-100",
              )}
            >
              <span className="relative shrink-0">
                <img src={chosen?.previewUrl ?? p.thumbUrl} alt="" className="h-11 w-14 rounded-md object-cover" loading="lazy" />
                {p.status === "generating" && (
                  <span className="absolute inset-0 flex items-center justify-center rounded-md bg-white/60">
                    <Spinner size={14} />
                  </span>
                )}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-stone-900">
                  {i + 1}. {p.roomConfirmed ? ROOM_LABELS[p.roomConfirmed] : "Foto"}
                </span>
                <span className={cn("block truncate text-xs", s.className)}>{s.text}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
