import type { PhotoDTO, Room } from "@imob/shared";
import { cn } from "../../../shared/lib/cn";
import { Button } from "../../../shared/ui/Button";
import { AlertIcon, RefreshIcon } from "../../../shared/ui/icons";
import { Spinner } from "../../../shared/ui/Spinner";
import { Toggle } from "../../../shared/ui/Toggle";
import { RoomSelect } from "./RoomSelect";

interface PhotoRoomCardProps {
  photo: PhotoDTO;
  busy: boolean;
  locked: boolean;
  onRoomChange: (room: Room) => void;
  onIncludeChange: (include: boolean) => void;
  onRetry: () => void;
}

export function PhotoRoomCard({ photo, busy, locked, onRoomChange, onIncludeChange, onRetry }: PhotoRoomCardProps) {
  const classifying = photo.status === "classifying";
  const classifyFailed = photo.status === "failed" && !photo.roomSuggested && !photo.generation;
  const disabled = busy || locked || classifying;

  return (
    <article className={cn("flex flex-col overflow-hidden rounded-2xl border bg-white transition", photo.include ? "border-stone-200" : "border-stone-200 opacity-70")}>
      <div className="relative aspect-[4/3] bg-stone-100">
        <img src={photo.thumbUrl} alt={photo.sourceName} className="h-full w-full object-cover" loading="lazy" />
        {classifying && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-stone-900/40 text-sm font-medium text-white backdrop-blur-[1px]">
            <Spinner size={16} /> Identificando cômodo…
          </div>
        )}
        {!photo.include && !classifying && (
          <span className="absolute top-2 left-2 rounded-full bg-stone-900/70 px-2 py-0.5 text-xs font-medium text-white">Não será decorada</span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-3">
        <p className="truncate text-xs text-stone-500" title={photo.sourceName}>
          {photo.sourceName}
        </p>
        <RoomSelect value={photo.roomConfirmed} suggested={photo.roomSuggested} onChange={onRoomChange} disabled={disabled} />
        {photo.alerts.length > 0 && (
          <ul className="flex flex-col gap-1">
            {photo.alerts.map((a) => (
              <li key={a} className="flex items-start gap-1.5 text-xs text-amber-800">
                <AlertIcon size={14} className="mt-px shrink-0" /> {a}
              </li>
            ))}
          </ul>
        )}
        {classifyFailed && (
          <div className="flex flex-col gap-2 rounded-lg bg-red-50 p-2.5 text-xs text-red-800">
            <span>{photo.error ?? "Não foi possível identificar o cômodo."} Escolha o cômodo acima ou tente de novo.</span>
            <Button size="sm" variant="secondary" icon={<RefreshIcon size={14} />} onClick={onRetry} disabled={busy}>
              Tentar de novo
            </Button>
          </div>
        )}
        <div className="mt-auto pt-1">
          <Toggle checked={photo.include} onChange={onIncludeChange} label="Decorar esta foto" disabled={disabled} />
        </div>
      </div>
    </article>
  );
}
