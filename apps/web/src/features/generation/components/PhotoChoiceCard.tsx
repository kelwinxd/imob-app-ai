import { useState } from "react";
import { ROOM_LABELS, type PhotoDTO, type VariationDTO } from "@imob/shared";
import { cn } from "../../../shared/lib/cn";
import { Alert } from "../../../shared/ui/Alert";
import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import { CheckIcon, RefreshIcon } from "../../../shared/ui/icons";
import { Spinner } from "../../../shared/ui/Spinner";
import { VERDICT_INFO } from "../lib/verdict";
import { CheckDetails } from "./CheckDetails";
import { VerdictBadge } from "./VerdictBadge";

interface PhotoChoiceCardProps {
  photo: PhotoDTO;
  index: number;
  busy: boolean;
  locked: boolean;
  pendingReviewVariationId: string | null;
  onChoose: (variation: VariationDTO) => void;
  onConfirmReview: () => void;
  onCancelReview: () => void;
  onRegenerate: () => void;
}

export function PhotoChoiceCard({ photo, index, busy, locked, pendingReviewVariationId, onChoose, onConfirmReview, onCancelReview, onRegenerate }: PhotoChoiceCardProps) {
  // Estado só de exibição: qual imagem está em destaque (a original ou uma variação).
  const [previewId, setPreviewId] = useState<string | "original" | null>(null);
  const title = `${index}. ${photo.roomConfirmed ? ROOM_LABELS[photo.roomConfirmed] : "Foto"}`;

  if (photo.status === "generating") {
    return (
      <Card className="overflow-hidden">
        <div className="relative aspect-[4/3] bg-stone-100">
          <img src={photo.thumbUrl} alt="" className="h-full w-full object-cover opacity-40 blur-[2px]" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-stone-800">
            <Spinner size={28} />
            <span className="text-sm font-medium">Decorando e conferindo a estrutura…</span>
            <span className="text-xs text-stone-600">Costuma levar menos de um minuto</span>
          </div>
        </div>
        <div className="p-4 text-sm font-semibold">{title}</div>
      </Card>
    );
  }

  if (photo.status === "failed" || photo.variations.length === 0) {
    return (
      <Card className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-3">
          <img src={photo.thumbUrl} alt="" className="h-16 w-20 rounded-lg object-cover" />
          <p className="text-sm font-semibold">{title}</p>
        </div>
        <Alert tone="danger" action={<Button size="sm" variant="secondary" icon={<RefreshIcon size={14} />} onClick={onRegenerate} loading={busy} disabled={locked}>Tentar de novo</Button>}>
          {photo.error ?? "Esta foto ainda não foi decorada."}
        </Alert>
      </Card>
    );
  }

  const chosen = photo.variations.find((v) => v.id === photo.chosenVariationId) ?? null;
  const focused = previewId === "original" ? null : photo.variations.find((v) => v.id === previewId) ?? chosen ?? photo.variations[0];
  const showingOriginal = previewId === "original";
  const pendingReview = photo.variations.find((v) => v.id === pendingReviewVariationId) ?? null;

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-[4/3] bg-stone-100">
        <img src={showingOriginal ? photo.originalUrl : focused?.previewUrl} alt={showingOriginal ? "Foto original" : `Variação ${focused?.index}`} className="h-full w-full object-cover" />
        <span className="absolute top-3 left-3 rounded-full bg-stone-900/70 px-2.5 py-1 text-xs font-medium text-white">
          {showingOriginal ? "Original" : `Variação ${focused?.index}`}
        </span>
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50">
            <Spinner size={24} />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">{title}</h3>
          {chosen && <span className="text-xs text-stone-600">Escolhida: variação {chosen.index}</span>}
        </div>

        <div className="grid grid-cols-4 gap-2">
          <button
            type="button"
            aria-label="Ver foto original"
            aria-pressed={showingOriginal}
            onClick={() => setPreviewId("original")}
            className={cn("flex flex-col gap-1 rounded-lg p-1 text-left ring-1 transition", showingOriginal ? "ring-2 ring-stone-800" : "ring-stone-200 hover:ring-stone-400")}
          >
            <img src={photo.thumbUrl} alt="" className="aspect-[4/3] w-full rounded-md object-cover" />
            <span className="truncate px-0.5 text-[11px] text-stone-600">Original</span>
          </button>
          {photo.variations.map((v) => {
            const isChosen = v.id === photo.chosenVariationId;
            const isFocused = !showingOriginal && focused?.id === v.id;
            return (
              <button
                key={v.id}
                type="button"
                aria-label={`Variação ${v.index}: ${VERDICT_INFO[v.verdict].label}${isChosen ? " (escolhida)" : ""}`}
                aria-pressed={isFocused}
                onClick={() => setPreviewId(v.id)}
                className={cn(
                  "relative flex flex-col gap-1 rounded-lg p-1 text-left ring-1 transition",
                  isFocused ? "ring-2 ring-brand-600" : "ring-stone-200 hover:ring-stone-400",
                  v.verdict === "reprovado" && "opacity-60",
                )}
              >
                <img src={v.previewUrl} alt="" className="aspect-[4/3] w-full rounded-md object-cover" />
                <span className="flex items-center gap-1 px-0.5 text-[11px] text-stone-700">
                  V{v.index}
                  <span className={cn("h-1.5 w-1.5 rounded-full", v.verdict === "aprovado" ? "bg-emerald-500" : v.verdict === "revisar" ? "bg-amber-500" : "bg-red-500")} />
                </span>
                {isChosen && (
                  <span className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white shadow">
                    <CheckIcon size={12} />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {focused && !showingOriginal && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <VerdictBadge verdict={focused.verdict} />
              <span className="text-xs text-stone-600">{VERDICT_INFO[focused.verdict].description}</span>
            </div>
            {pendingReview && pendingReview.id === focused.id ? (
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
                <CheckIcon size={16} /> Esta é a variação escolhida
              </p>
            ) : (
              <Button variant="secondary" onClick={() => onChoose(focused)} disabled={focused.verdict === "reprovado" || busy || locked} className="sm:self-start">
                {focused.verdict === "reprovado" ? "Não pode ser usada" : "Usar esta variação"}
              </Button>
            )}
            <CheckDetails check={focused.check} />
          </div>
        )}

        <Button variant="ghost" size="sm" icon={<RefreshIcon size={14} />} onClick={onRegenerate} disabled={busy || locked} className="self-start">
          Gerar 3 novas variações
        </Button>
      </div>
    </Card>
  );
}
