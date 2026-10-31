import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface StyleProps {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-sm",
  secondary: "bg-white text-stone-800 ring-1 ring-inset ring-stone-300 hover:bg-stone-50 active:bg-stone-100",
  ghost: "text-stone-700 hover:bg-stone-100 active:bg-stone-200",
  danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3 text-sm gap-1.5",
  md: "h-11 px-4 text-sm gap-2",
  lg: "h-12 px-5 text-base gap-2",
};

export function buttonClasses({ variant = "primary", size = "md", fullWidth }: StyleProps, extra?: string) {
  return cn(
    "inline-flex items-center justify-center rounded-xl font-medium transition-colors select-none",
    "disabled:pointer-events-none disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    fullWidth && "w-full",
    extra,
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, StyleProps {
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({ variant, size, fullWidth, loading, icon, className, children, disabled, type = "button", ...props }: ButtonProps) {
  return (
    <button type={type} className={buttonClasses({ variant, size, fullWidth }, className)} disabled={disabled || loading} {...props}>
      {loading ? <Spinner size={16} /> : icon}
      {children}
    </button>
  );
}

interface LinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement>, StyleProps {
  icon?: ReactNode;
}

export function LinkButton({ variant, size, fullWidth, icon, className, children, ...props }: LinkButtonProps) {
  return (
    <a className={buttonClasses({ variant, size, fullWidth }, className)} {...props}>
      {icon}
      {children}
    </a>
  );
}
