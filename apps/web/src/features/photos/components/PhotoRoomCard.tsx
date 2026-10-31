import type { PhotoDTO, Room } from "@imob/shared";
import { Button } from "../../../shared/ui/Button";
import { AlertIcon, RefreshIcon } from "../../../shared/ui/icons";
import { Spinner } from "../../../shared/ui/Spinner";
import { RoomSelect } from "./RoomSelect";

interface PhotoRoomCardProps {
  photo: PhotoDTO;
  busy: boolean;
  onRoomChange: (room: Room) => void;
  onRetry: () => void;
}

export function PhotoRoomCard({ photo, busy, onRoomChange, onRetry }: PhotoRoomCardProps) {
  const classifying = photo.status === "classifying";
  const classifyFailed = photo.status === "failed";
  const disabled = busy || classifying;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white">
      <div className="relative aspect-[4/3] bg-stone-100">
        <img src={photo.thumbUrl} alt={photo.sourceName} className="h-full w-full object-cover" loading="lazy" />
        {classifying && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-stone-900/40 text-sm font-medium text-white backdrop-blur-[1px]">
            <Spinner size={16} /> Identificando cômodo…
          </div>
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
      </div>
    </article>
  );
}
