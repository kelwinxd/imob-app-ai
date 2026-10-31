import type { StagingPhotoDTO, VariationDTO } from "@imob/shared";
import { cn } from "../../../shared/lib/cn";
import { Alert } from "../../../shared/ui/Alert";
import { Button } from "../../../shared/ui/Button";
import { CheckIcon, RefreshIcon } from "../../../shared/ui/icons";
import { VERDICT_INFO } from "../lib/verdict";
import { CheckDetails } from "./CheckDetails";
import { VerdictBadge } from "./VerdictBadge";

/** Id da variação em destaque. */
export type Focus = string;

interface VariationPanelProps {
  photo: StagingPhotoDTO;
  focus: Focus;
  onFocus: (focus: Focus) => void;
  pendingReviewVariationId: string | null;
  busy: boolean;
  locked: boolean;
  variationCount: number;
  onChoose: (variation: VariationDTO) => void;
  onConfirmReview: () => void;
  onCancelReview: () => void;
  onRegenerate: () => void;
}

const dot = (v: VariationDTO) => (v.verdict === "aprovado" ? "bg-emerald-500" : v.verdict === "revisar" ? "bg-amber-500" : "bg-red-500");

export function VariationPanel(props: VariationPanelProps) {
  const { photo, focus, onFocus, pendingReviewVariationId, busy, locked, variationCount, onChoose, onConfirmReview, onCancelReview, onRegenerate } = props;
  const focused = photo.variations.find((v) => v.id === focus) ?? null;
  const generating = photo.status === "generating";

  return (
    <div className="flex flex-col gap-3">
      {photo.variations.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5">
          {photo.variations.map((v) => (
            <button
              key={v.id}
              type="button"
              aria-label={`Variação ${v.index}: ${VERDICT_INFO[v.verdict].label}${v.id === photo.chosenVariationId ? " (escolhida)" : ""}`}
              aria-pressed={focus === v.id}
              onClick={() => onFocus(v.id)}
              className={cn(
                "relative flex flex-col gap-1 rounded-lg p-1 ring-1 transition",
                focus === v.id ? "ring-2 ring-brand-600" : "ring-stone-200 hover:ring-stone-400",
                v.verdict === "reprovado" && "opacity-60",
              )}
            >
              <img src={v.previewUrl} alt="" className="aspect-[4/3] w-full rounded object-cover" />
              <span className="flex items-center gap-1 text-[11px] text-stone-700">
                V{v.index} <span className={cn("h-1.5 w-1.5 rounded-full", dot(v))} />
              </span>
              {v.id === photo.chosenVariationId && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-white">
                  <CheckIcon size={10} />
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {photo.status === "failed" && <Alert tone="danger">{photo.error ?? "A geração falhou."}</Alert>}

      {focused && (
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <VerdictBadge verdict={focused.verdict} />
            <span className="text-xs text-stone-600">{VERDICT_INFO[focused.verdict].description}</span>
          </div>
          {pendingReviewVariationId === focused.id ? (
            <Alert
              tone="warning"
              title="Confirme que a estrutura está igual"
              action={
                <div className="flex gap-2">
                  <Button size="sm" onClick={onConfirmReview} loading={busy}>Conferi, usar esta</Button>
                  <Button size="sm" variant="ghost" onClick={onCancelReview}>Cancelar</Button>
                </div>
              }
            >
              Compare com a original. A confirmação fica registrada no dossiê.
            </Alert>
          ) : focused.id === photo.chosenVariationId ? (
            <p className="flex items-center gap-1.5 text-sm font-medium text-brand-700">
              <CheckIcon size={16} /> Variação escolhida para publicar
            </p>
          ) : (
            <Button variant="secondary" fullWidth onClick={() => onChoose(focused)} disabled={focused.verdict === "reprovado" || busy || locked}>
              {focused.verdict === "reprovado" ? "Não pode ser usada" : "Usar esta variação"}
            </Button>
          )}
          <CheckDetails check={focused.check} />
        </div>
      )}

      {photo.variations.length > 0 && (
        <Button variant="ghost" size="sm" icon={<RefreshIcon size={14} />} onClick={onRegenerate} disabled={busy || locked || generating} className="self-start">
          Gerar {variationCount === 1 ? "1 nova variação" : `${variationCount} novas variações`} desta foto
        </Button>
      )}
    </div>
  );
}
