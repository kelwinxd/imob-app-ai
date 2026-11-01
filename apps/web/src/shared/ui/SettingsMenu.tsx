import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { GearIcon } from "./icons";

export interface SettingsMenuItem {
  label: string;
  icon?: ReactNode;
  tone?: "neutral" | "danger";
  disabled?: boolean;
  /** Explica por que o item está desativado. */
  hint?: string;
  onSelect: () => void;
}

interface SettingsMenuProps {
  label: string;
  items: SettingsMenuItem[];
}

export function SettingsMenu({ label, items }: SettingsMenuProps) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn("inline-flex h-9 w-9 items-center justify-center rounded-lg text-stone-500 transition hover:bg-stone-100 hover:text-stone-900", open && "bg-stone-100 text-stone-900")}
      >
        <GearIcon size={20} />
      </button>
      {open && (
        <div role="menu" className="absolute left-0 top-full z-30 mt-1 min-w-56 rounded-xl bg-white p-1 shadow-lg ring-1 ring-stone-200">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              title={item.disabled ? item.hint : undefined}
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition disabled:pointer-events-none disabled:opacity-40",
                item.tone === "danger" ? "text-red-700 hover:bg-red-50" : "text-stone-700 hover:bg-stone-100",
              )}
            >
              {item.icon}
              <span className="flex flex-col">
                {item.label}
                {item.disabled && item.hint && <span className="text-xs text-stone-500">{item.hint}</span>}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
