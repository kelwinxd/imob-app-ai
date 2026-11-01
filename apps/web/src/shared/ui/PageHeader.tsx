import type { ReactNode } from "react";
import { Link } from "react-router";
import { ArrowLeftIcon } from "./icons";

interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  back?: { to: string; label: string };
  /** Fica à esquerda do título, como o menu de configurações. */
  leading?: ReactNode;
}

export function PageHeader({ title, subtitle, actions, back, leading }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-3">
      {back && (
        <Link to={back.to} className="inline-flex w-fit items-center gap-1.5 text-sm text-stone-600 hover:text-stone-900">
          <ArrowLeftIcon size={16} />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            {leading}
            <h1 className="text-2xl font-semibold tracking-tight text-stone-900 text-balance">{title}</h1>
          </div>
          {subtitle && <div className="mt-1 text-sm text-stone-600">{subtitle}</div>}
        </div>
        {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
      </div>
    </header>
  );
}
