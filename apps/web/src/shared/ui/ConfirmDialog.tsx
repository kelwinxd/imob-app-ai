import { useEffect, useId, type ReactNode } from "react";
import { Button } from "./Button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  children?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  loading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, children, confirmLabel, cancelLabel = "Cancelar", tone = "primary", loading, error, onConfirm, onCancel }: ConfirmDialogProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !loading && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, loading, onCancel]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/50 p-4 sm:items-center" onClick={() => !loading && onCancel()}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="text-lg font-semibold text-stone-900">{title}</h2>
        {children && <div className="mt-2 text-sm leading-relaxed text-stone-600">{children}</div>}
        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onCancel} disabled={loading}>{cancelLabel}</Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm} loading={loading} autoFocus>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
