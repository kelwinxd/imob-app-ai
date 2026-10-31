import { Button } from "./Button";
import { ArrowLeftIcon, ArrowRightIcon } from "./icons";

interface StepNavProps {
  onPrev: () => void;
  onNext: () => void;
  prevDisabled: boolean;
  nextDisabled: boolean;
  nextLoading?: boolean;
  hideNext?: boolean;
}

export function StepNav({ onPrev, onNext, prevDisabled, nextDisabled, nextLoading, hideNext }: StepNavProps) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="secondary" onClick={onPrev} disabled={prevDisabled} icon={<ArrowLeftIcon size={18} />}>
        Anterior
      </Button>
      {!hideNext && (
        <Button onClick={onNext} disabled={nextDisabled} loading={nextLoading}>
          Próximo
          {!nextLoading && <ArrowRightIcon size={18} />}
        </Button>
      )}
    </div>
  );
}
