import { useId } from "react";
import { ROOM_LABELS, ROOMS, type Room } from "@imob/shared";

interface RoomSelectProps {
  value: Room | null;
  suggested: Room | null;
  onChange: (room: Room) => void;
  disabled?: boolean;
}

export function RoomSelect({ value, suggested, onChange, disabled }: RoomSelectProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-stone-600">
        Cômodo
      </label>
      <select
        id={id}
        value={value ?? ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as Room)}
        className="h-10 w-full rounded-lg border border-stone-300 bg-white px-2.5 text-sm text-stone-900 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100 disabled:opacity-60"
      >
        {!value && <option value="">Selecione…</option>}
        {ROOMS.map((r) => (
          <option key={r} value={r}>
            {ROOM_LABELS[r]}
            {r === suggested ? " (sugerido)" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
