import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { GearIcon } from "./icons";

interface BaseItem {
  label: string;
  disabled?: boolean;
  /** Explica por que o item está desativado. */
  hint?: string;
}

export interface SettingsActionItem extends BaseItem {
  kind?: "action";
  icon?: ReactNode;
  tone?: "neutral" | "danger";
  onSelect: () => void;
}

export interface SettingsToggleItem extends BaseItem {
  kind: "toggle";
  checked: boolean;
  /** Texto curto embaixo do rótulo, sempre visível. */
  description?: string;
  onChange: (checked: boolean) => void;
}

export type SettingsMenuItem = SettingsActionItem | SettingsToggleItem;

interface SettingsMenuProps {
  label: string;
  items: SettingsMenuItem[];
}

function Switch({ checked }: { checked: boolean }) {
  return (
    <span aria-hidden className={cn("relative inline-flex h-5 w-9 shrink-0 rounded-full transition", checked ? "bg-brand-600" : "bg-stone-300")}>
      <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all", checked ? "left-[18px]" : "left-0.5")} />
    </span>
  );
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
        className={cn("inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-stone-700 ring-1 ring-inset ring-stone-300 transition-colors hover:bg-stone-50 hover:text-stone-900 active:bg-stone-100", open && "bg-stone-100 text-stone-900")}
      >
        <GearIcon size={20} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-30 mt-1 w-72 max-w-[calc(100vw-2rem)] rounded-xl bg-white p-1 shadow-lg ring-1 ring-stone-200">
          {items.map((item) =>
            item.kind === "toggle" ? (
              // O switch não fecha o menu: dá para ver o estado mudar.
              <button
                key={item.label}
                type="button"
                role="menuitemcheckbox"
                aria-checked={item.checked}
                disabled={item.disabled}
                title={item.disabled ? item.hint : undefined}
                onClick={() => item.onChange(!item.checked)}
                className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left text-sm text-stone-700 transition hover:bg-stone-100 disabled:pointer-events-none disabled:opacity-50"
              >
                <span className="flex flex-1 flex-col">
                  <span className="font-medium text-stone-900">{item.label}</span>
                  {(item.disabled ? item.hint : item.description) && (
                    <span className="text-xs text-stone-500">{item.disabled ? item.hint : item.description}</span>
                  )}
                </span>
                <span className="pt-0.5"><Switch checked={item.checked} /></span>
              </button>
            ) : (
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
            ),
          )}
        </div>
      )}
    </div>
  );
}
