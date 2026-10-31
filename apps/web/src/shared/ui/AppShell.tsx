import type { ReactNode } from "react";
import { Link } from "react-router";
import { Button } from "./Button";
import { HomeIcon } from "./icons";

interface AppShellProps {
  userName: string;
  onLogout: () => void;
  loggingOut?: boolean;
  children: ReactNode;
}

export function AppShell({ userName, onLogout, loggingOut, children }: AppShellProps) {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-canvas/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold text-stone-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
              <HomeIcon size={18} />
            </span>
            <span className="hidden sm:inline">Staging com recibo</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="max-w-[40vw] truncate text-sm text-stone-600">{userName}</span>
            <Button variant="ghost" size="sm" onClick={onLogout} loading={loggingOut}>
              Sair
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 pb-28 sm:py-8">{children}</main>
    </div>
  );
}
