import type { PropertyDetailDTO } from "@imob/shared";
import { Alert } from "../../../shared/ui/Alert";
import { Button } from "../../../shared/ui/Button";
import { ArrowRightIcon } from "../../../shared/ui/icons";
import { ProgressBar } from "../../../shared/ui/ProgressBar";
import { StickyActions } from "../../../shared/ui/StickyActions";
import { PhotoChoiceCard } from "../components/PhotoChoiceCard";
import { useRegeneratePhoto, useVariationChoice } from "../hooks/useGeneration";

export function ChoiceStep({ property, onContinue, onChangeStyle }: { property: PropertyDetailDTO; onContinue: () => void; onChangeStyle: () => void }) {
  const choice = useVariationChoice();
  const regenerate = useRegeneratePhoto();
  const included = property.photos.filter((p) => p.include);
  const done = included.filter((p) => p.status === "generated").length;
  const generating = included.filter((p) => p.status === "generating").length;
  const failed = included.filter((p) => p.status === "failed").length;
  const locked = property.status === "publishing";
  const canContinue = property.status === "choosing" || property.status === "published" || property.status === "publish_failed";

  return (
    <section className="flex flex-col gap-5" aria-labelledby="escolha-titulo">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="escolha-titulo" className="text-lg font-semibold">Escolha uma variação por foto</h2>
          <p className="mt-1 text-sm text-stone-600">
            Cada variação passa pela trava de estrutura. As reprovadas não podem ser publicadas.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onChangeStyle} disabled={locked || generating > 0}>
          Mudar estilo
        </Button>
      </div>

      {generating > 0 && <ProgressBar value={(done / Math.max(1, included.length)) * 100} label={`${done} de ${included.length} fotos prontas`} />}
      {failed > 0 && <Alert tone="danger">{failed === 1 ? "Uma foto falhou." : `${failed} fotos falharam.`} Use "Tentar de novo" no cartão da foto.</Alert>}
      {choice.error && <Alert tone="danger">{choice.error}</Alert>}
      {regenerate.error && <Alert tone="danger">{regenerate.error}</Alert>}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {included.map((photo, i) => (
          <PhotoChoiceCard
            key={photo.id}
            photo={photo}
            index={i + 1}
            locked={locked}
            busy={choice.pendingPhotoId === photo.id || regenerate.pendingPhotoId === photo.id}
            pendingReviewVariationId={choice.pendingReview?.photoId === photo.id ? choice.pendingReview.variationId : null}
            onChoose={(v) => choice.choose(photo, v)}
            onConfirmReview={choice.confirmReview}
            onCancelReview={choice.cancelReview}
            onRegenerate={() => regenerate.regenerate(photo.id)}
          />
        ))}
      </div>

      <StickyActions hint={canContinue ? "Tudo pronto para publicar" : generating > 0 ? "Aguarde terminar a decoração" : "Resolva as fotos com erro para continuar"}>
        <Button size="lg" onClick={onContinue} disabled={!canContinue} icon={<ArrowRightIcon size={18} />}>
          Revisar e publicar
        </Button>
      </StickyActions>
    </section>
  );
}
