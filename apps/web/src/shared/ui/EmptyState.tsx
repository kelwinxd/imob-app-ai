import type { ReactNode } from "react";

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-300 bg-white/60 px-6 py-12 text-center">
      {icon && <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">{icon}</div>}
      <h2 className="text-base font-semibold text-stone-900">{title}</h2>
      {description && <p className="max-w-sm text-sm text-stone-600">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
