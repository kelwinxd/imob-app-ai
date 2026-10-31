import { useId, type InputHTMLAttributes } from "react";
import { cn } from "../lib/cn";

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label: string;
  error?: string;
  hint?: string;
  onValueChange: (value: string) => void;
}

export function TextField({ label, error, hint, onValueChange, className, id, ...props }: TextFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={inputId} className="text-sm font-medium text-stone-800">
        {label}
      </label>
      <input
        id={inputId}
        className={cn(
          "h-11 rounded-xl border bg-white px-3.5 text-base text-stone-900 placeholder:text-stone-400 transition-colors",
          "focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100",
          error ? "border-red-400" : "border-stone-300",
        )}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        onChange={(e) => onValueChange(e.target.value)}
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} className="text-sm text-red-600">{error}</p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-sm text-stone-500">{hint}</p>
      ) : null}
    </div>
  );
}
