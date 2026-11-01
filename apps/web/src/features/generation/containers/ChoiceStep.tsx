import type { StagingDetailDTO } from "@imob/shared";
import { plural } from "../../../shared/lib/format";
import { Alert } from "../../../shared/ui/Alert";
import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import { DownloadIcon, SparklesIcon } from "../../../shared/ui/icons";
import { Lightbox } from "../../../shared/ui/Lightbox";
import { ChoicePhotoList } from "../components/ChoicePhotoList";
import { GenerationProgress } from "../components/GenerationProgress";
import { ImageStage } from "../components/ImageStage";
import { StyleSummary } from "../components/StyleSummary";
import { VariationCountPicker } from "../components/VariationCountPicker";
import { VariationPanel } from "../components/VariationPanel";
import { useChoiceState } from "../hooks/useChoiceState";
import { useGenerate, useVariationChoice } from "../hooks/useGeneration";
import { useGenerationProgress } from "../hooks/useGenerationProgress";

export function ChoiceStep({ staging, onEditStyle }: { staging: StagingDetailDTO; onEditStyle: () => void }) {
  const state = useChoiceState(staging);
  const generate = useGenerate(staging.id);
  const choice = useVariationChoice(staging.id);
  const progress = useGenerationProgress(staging.photos);
  const locked = staging.status === "publishing";
  const selected = state.selected;
  const stage = state.stage;
  const full = stage.full;

  if (state.photos.length === 0) {
    return <Alert tone="warning" title="Nenhuma foto marcada">Volte à etapa Estilo e marque as fotos que esta decoração deve usar.</Alert>;
  }

  return (
    <section className="grid gap-5 lg:grid-cols-10" aria-label="Escolha das variações">
      <div className="order-1 lg:order-2 lg:col-span-7">
        <div className="flex flex-col gap-3 lg:sticky lg:top-20">
          <ImageStage
            src={stage.src}
            label={stage.label}
            overlay={stage.overlay}
            compare={stage.canCompare ? { active: state.comparing, onChange: state.setComparing } : null}
            onExpand={full ? () => state.setExpanded(true) : undefined}
            download={full?.download ?? null}
          />
          {progress.active && <GenerationProgress pct={progress.pct} done={progress.done} total={progress.total} remainingSec={progress.remainingSec} />}
        </div>
      </div>

      {state.expanded && full && (
        <Lightbox
          src={full.src}
          alt={stage.label}
          onClose={() => state.setExpanded(false)}
          actions={
            <a href={full.download.url} download={full.download.fileName} className="flex h-10 items-center gap-1.5 rounded-full bg-white/10 px-4 text-sm font-semibold text-white hover:bg-white/20">
              <DownloadIcon size={16} /> Baixar
            </a>
          }
        />
      )}

      <aside className="order-2 flex flex-col gap-4 lg:order-1 lg:col-span-3">
        <StyleSummary
          style={staging.style}
          standard={staging.standard}
          colors={staging.furnitureColors}
          referenceCount={staging.references.length}
          instructions={staging.customInstructions}
          onEdit={onEditStyle}
        />

        <Card className="flex flex-col gap-3 p-3">
          <VariationCountPicker value={state.variationCount} onChange={state.setVariationCount} disabled={generate.starting || locked} />
          <Button
            fullWidth
            icon={<SparklesIcon size={18} />}
            loading={generate.starting && !generate.startingPhotoId}
            disabled={state.toGenerate === 0 || locked}
            onClick={() => generate.generateAll(state.variationCount)}
          >
            {state.toGenerate > 0 ? `Gerar ${plural(state.toGenerate, "foto", "fotos")}` : state.generating > 0 ? "Gerando…" : "Tudo gerado"}
          </Button>
          <p className="text-[11px] leading-snug text-stone-500">
            {state.toGenerate > 0
              ? `${state.toGenerate * state.variationCount} imagens no total. Cada variação passa pela trava de estrutura.`
              : "Para mais opções de uma foto, use “Gerar novas variações” abaixo dela."}
          </p>
          {generate.error && <Alert tone="danger">{generate.error}</Alert>}
        </Card>

        <ChoicePhotoList photos={state.photos} selectedId={selected?.photoId ?? null} onSelect={state.select} />

        {selected && (
          <Card className="p-3">
            <VariationPanel
              photo={selected}
              focus={state.focus}
              onFocus={state.setFocus}
              pendingReviewVariationId={choice.pendingReview?.photoId === selected.photoId ? choice.pendingReview.variationId : null}
              busy={choice.choosing || generate.startingPhotoId === selected.photoId}
              locked={locked}
              variationCount={state.variationCount}
              onChoose={(v) => choice.choose(selected, v)}
              onConfirmReview={choice.confirmReview}
              onCancelReview={choice.cancelReview}
              onRegenerate={() => generate.generatePhoto(selected.photoId, state.variationCount)}
            />
            {choice.error && <Alert tone="danger" className="mt-3">{choice.error}</Alert>}
          </Card>
        )}
      </aside>
    </section>
  );
}
