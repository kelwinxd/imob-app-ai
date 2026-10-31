import type { StagingDetailDTO } from "@imob/shared";
import { Alert } from "../../../shared/ui/Alert";
import { Card } from "../../../shared/ui/Card";
import { useReferenceImages, useStagingPhotoInclude } from "../../stagings/hooks/useStagings";
import { FurnitureColorPicker } from "../components/FurnitureColorPicker";
import { PhotoIncludeGrid } from "../components/PhotoIncludeGrid";
import { ReferenceImagesInput } from "../components/ReferenceImagesInput";
import { StandardPicker, StylePicker } from "../components/StylePicker";
import type { StyleSettings } from "../hooks/useStyleSettings";

export function StyleStep({ staging, settings, saveError }: { staging: StagingDetailDTO; settings: StyleSettings; saveError: string | null }) {
  const include = useStagingPhotoInclude(staging.id);
  const references = useReferenceImages(staging.id);
  const busy = staging.status === "generating" || staging.status === "publishing";

  return (
    <section className="flex flex-col gap-5" aria-labelledby="estilo-titulo">
      <div>
        <h2 id="estilo-titulo" className="text-lg font-semibold">Estilo e padrão</h2>
        <p className="mt-1 text-sm text-stone-600">Escolha o estilo e o padrão. A geração só acontece na próxima etapa, quando você pedir.</p>
      </div>

      {busy && <Alert tone="info">Esta decoração está gerando ou publicando. Mudanças de estilo ficam liberadas quando terminar.</Alert>}

      <Card className="flex flex-col gap-6 p-4 sm:p-6">
        <StylePicker value={settings.style} onChange={settings.setStyle} />
        <StandardPicker value={settings.standard} onChange={settings.setStandard} />
      </Card>

      <Card className="flex flex-col gap-6 p-4 sm:p-6">
        <div>
          <h3 className="text-sm font-semibold text-stone-900">Personalizar (opcional)</h3>
          <p className="mt-0.5 text-xs text-stone-600">Deixe em branco para a IA decorar só pelo estilo, ou ajude com cores e móveis de referência.</p>
        </div>
        <FurnitureColorPicker value={settings.colors} onToggle={settings.toggleColor} />
        <ReferenceImagesInput
          images={staging.references}
          uploading={references.uploading}
          removingId={references.removingId}
          disabled={busy}
          onAdd={references.add}
          onRemove={references.remove}
        />
        {references.error && <Alert tone="danger">{references.error}</Alert>}
      </Card>

      <Card className="p-4 sm:p-6">
        <PhotoIncludeGrid photos={staging.photos} pendingPhotoId={include.pendingPhotoId} disabled={busy} onToggle={include.setInclude} />
        {include.error && <Alert tone="danger" className="mt-3">{include.error}</Alert>}
      </Card>

      {saveError && <Alert tone="danger">{saveError}</Alert>}
    </section>
  );
}
