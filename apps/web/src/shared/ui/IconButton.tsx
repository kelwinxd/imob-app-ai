import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon: ReactNode;
  tone?: "neutral" | "danger";
}

export function IconButton({ label, icon, tone = "neutral", className, type = "button", ...props }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset transition disabled:pointer-events-none disabled:opacity-40",
        tone === "danger" ? "bg-white text-stone-500 ring-stone-300 hover:bg-red-50 hover:text-red-600 hover:ring-red-200" : "bg-white text-stone-600 ring-stone-300 hover:bg-stone-50",
        className,
      )}
      {...props}
    >
      {icon}
    </button>
  );
}
