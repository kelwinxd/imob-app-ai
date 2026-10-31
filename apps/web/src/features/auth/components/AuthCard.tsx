import type { ReactNode } from "react";
import { ShieldIcon } from "../../../shared/ui/icons";

export function AuthCard({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-sm">
            <ShieldIcon size={24} />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-1 text-sm text-stone-600">{subtitle}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">{children}</div>
        <p className="mt-6 text-center text-sm text-stone-600">{footer}</p>
      </div>
    </div>
  );
}
