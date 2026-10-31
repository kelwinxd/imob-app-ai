import type { ReactNode } from "react";

// Barra de ação fixa no rodapé no celular; no desktop vira um bloco normal no fim da seção.
export function StickyActions({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-10 border-t border-stone-200 bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        {hint && <p className="text-center text-xs text-stone-500 sm:mr-auto sm:text-left sm:text-sm">{hint}</p>}
        {children}
      </div>
    </div>
  );
}
