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
  /** Troca o "Próximo" por uma ação, como "Publicar" na última etapa. */
  nextLabel?: string;
  nextIcon?: ReactNode;
}

interface FlowHeaderProps<T extends string> {
  title: string;
  back: { to: string; label: string };
  nav: FlowNav;
  settings?: ReactNode;
  steps: Step<T>[];
  active: T;
  completed: ReadonlySet<T>;
  reachable: ReadonlySet<T>;
  onSelect: (step: T) => void;
}

export function FlowHeader<T extends string>({ title, back, nav, settings, steps, active, completed, reachable, onSelect }: FlowHeaderProps<T>) {
  return (
    <>
      <PageHeader
        title={title}
        back={back}
        titleAction={settings}
        actions={
          <StepNav
            onPrev={nav.onPrev}
            onNext={nav.onNext}
            prevDisabled={!nav.canPrev}
            nextDisabled={!nav.canNext}
            nextLoading={nav.nextLoading}
            hideNext={nav.hideNext}
            nextLabel={nav.nextLabel}
            nextIcon={nav.nextIcon}
          />
        }
      />
      <Stepper steps={steps} activeId={active} completed={completed} reachable={reachable} onSelect={onSelect} />
    </>
  );
}
