import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { AlertIcon, CheckIcon } from "./icons";

type Tone = "danger" | "warning" | "info" | "success";

const TONES: Record<Tone, string> = {
  danger: "bg-red-50 text-red-800 border-red-200",
  warning: "bg-amber-50 text-amber-900 border-amber-200",
  info: "bg-sky-50 text-sky-900 border-sky-200",
  success: "bg-emerald-50 text-emerald-900 border-emerald-200",
};

interface AlertProps {
  tone?: Tone;
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function Alert({ tone = "info", title, children, action, className }: AlertProps) {
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("flex gap-3 rounded-xl border px-4 py-3 text-sm", TONES[tone], className)}>
      <span className="mt-0.5 shrink-0">{tone === "success" ? <CheckIcon size={18} /> : <AlertIcon size={18} />}</span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="leading-relaxed">{children}</div>}
        {action && <div className="mt-1">{action}</div>}
      </div>
    </div>
  );
}
