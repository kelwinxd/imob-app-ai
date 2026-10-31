import { cn } from "../lib/cn";
import { CheckIcon } from "./icons";

export interface Step<T extends string> {
  id: T;
  label: string;
}

interface StepperProps<T extends string> {
  steps: Step<T>[];
  activeId: T;
  completed: ReadonlySet<T>;
  reachable: ReadonlySet<T>;
  onSelect: (id: T) => void;
}

export function Stepper<T extends string>({ steps, activeId, completed, reachable, onSelect }: StepperProps<T>) {
  return (
    <nav aria-label="Etapas">
      <ol className="grid grid-cols-4 gap-1.5">
        {steps.map((step, i) => {
          const active = step.id === activeId;
          const done = completed.has(step.id) && !active;
          const enabled = reachable.has(step.id);
          return (
            <li key={step.id}>
              <button
                type="button"
                disabled={!enabled}
                onClick={() => onSelect(step.id)}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "group flex w-full flex-col items-start gap-1.5 rounded-lg pt-1 text-left disabled:cursor-not-allowed",
                )}
              >
                <span className={cn("h-1 w-full rounded-full transition-colors", active ? "bg-brand-600" : done ? "bg-brand-300" : "bg-stone-200")} />
                <span className={cn("flex items-center gap-1 text-xs font-medium sm:text-sm", active ? "text-stone-900" : enabled ? "text-stone-600 group-hover:text-stone-900" : "text-stone-400")}>
                  {done ? <CheckIcon size={14} className="text-brand-600" /> : <span className="tabular-nums">{i + 1}.</span>}
                  {step.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
