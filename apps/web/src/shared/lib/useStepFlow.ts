import { useState } from "react";
import type { Step } from "../ui/Stepper";

// Etapas sempre começam na primeira; a navegação é explícita (Anterior/Próximo ou o stepper).
export function useStepFlow<T extends string>(steps: Step<T>[], reachable: ReadonlySet<T>, completed: ReadonlySet<T>) {
  const order = steps.map((s) => s.id);
  const [active, setActive] = useState<T>(order[0]);
  const index = order.indexOf(active);
  return {
    steps,
    active,
    reachable,
    completed,
    previous: index > 0 ? order[index - 1] : null,
    next: index < order.length - 1 ? order[index + 1] : null,
    isLast: index === order.length - 1,
    go: setActive,
    goTo: (step: T) => {
      if (reachable.has(step)) setActive(step);
    },
  };
}

export type StepFlow<T extends string> = ReturnType<typeof useStepFlow<T>>;
