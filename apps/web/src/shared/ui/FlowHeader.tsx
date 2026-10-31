import type { ReactNode } from "react";
import { PageHeader } from "./PageHeader";
import { StepNav } from "./StepNav";
import { Stepper, type Step } from "./Stepper";

export interface FlowNav {
  canPrev: boolean;
  onPrev: () => void;
  canNext: boolean;
  onNext: () => void;
  nextLoading?: boolean;
  hideNext?: boolean;
  hint?: string;
}

interface FlowHeaderProps<T extends string> {
  title: string;
  back: { to: string; label: string };
  meta: ReactNode;
  nav: FlowNav;
  steps: Step<T>[];
  active: T;
  completed: ReadonlySet<T>;
  reachable: ReadonlySet<T>;
  onSelect: (step: T) => void;
}

export function FlowHeader<T extends string>({ title, back, meta, nav, steps, active, completed, reachable, onSelect }: FlowHeaderProps<T>) {
  return (
    <>
      <PageHeader
        title={title}
        back={back}
        subtitle={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {meta}
            {nav.hint && (
              <span className="text-stone-500">
                <span className="hidden sm:inline">· </span>
                {nav.hint}
              </span>
            )}
          </span>
        }
        actions={
          <StepNav onPrev={nav.onPrev} onNext={nav.onNext} prevDisabled={!nav.canPrev} nextDisabled={!nav.canNext} nextLoading={nav.nextLoading} hideNext={nav.hideNext} />
        }
      />
      <Stepper steps={steps} activeId={active} completed={completed} reachable={reachable} onSelect={onSelect} />
    </>
  );
}
