import { ROOM_LABELS, type StagingPhotoDTO } from "@imob/shared";
import { cn } from "../../../shared/lib/cn";
import { CheckIcon } from "../../../shared/ui/icons";
import { Spinner } from "../../../shared/ui/Spinner";

interface PhotoIncludeGridProps {
  photos: StagingPhotoDTO[];
  pendingPhotoId?: string;
  disabled?: boolean;
  onToggle: (photoId: string, include: boolean) => void;
}

export function PhotoIncludeGrid({ photos, pendingPhotoId, disabled, onToggle }: PhotoIncludeGridProps) {
  return (
    <fieldset>
      <legend className="mb-1 text-sm font-semibold text-stone-900">Fotos desta decoração</legend>
      <p className="mb-3 text-xs text-stone-600">Toque para marcar ou desmarcar. Cada decoração pode usar fotos diferentes.</p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {photos.map((p) => {
          const blocked = !p.eligible || p.status === "generating";
          return (
            <button
              key={p.photoId}
              type="button"
              aria-pressed={p.include}
              disabled={disabled || blocked || pendingPhotoId === p.photoId}
              onClick={() => onToggle(p.photoId, !p.include)}
              title={!p.eligible ? "Confirme o cômodo desta foto na etapa Fotos do imóvel" : undefined}
              className={cn(
                "relative overflow-hidden rounded-lg text-left ring-1 transition disabled:cursor-not-allowed",
                p.include ? "ring-2 ring-brand-500" : "opacity-60 ring-stone-200 hover:opacity-90",
              )}
            >
              <img src={p.thumbUrl} alt="" className="aspect-[4/3] w-full object-cover" loading="lazy" />
              <span
                className={cn(
                  "absolute top-1.5 left-1.5 flex h-5 w-5 items-center justify-center rounded-md border",
                  p.include ? "border-brand-600 bg-brand-600 text-white" : "border-white bg-white/80",
                )}
              >
                {pendingPhotoId === p.photoId ? <Spinner size={11} /> : p.include && <CheckIcon size={12} />}
              </span>
              <span className="block truncate bg-white px-1.5 py-1 text-[11px] text-stone-700">
                {p.roomConfirmed ? ROOM_LABELS[p.roomConfirmed] : "Sem cômodo"}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
