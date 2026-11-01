import { useState } from "react";
import { Link } from "react-router";
import type { StagingDetailDTO } from "@imob/shared";
import { useCopy } from "../../../shared/lib/useCopy";
import { Alert } from "../../../shared/ui/Alert";
import { Card } from "../../../shared/ui/Card";
import { Spinner } from "../../../shared/ui/Spinner";
import { useProfile } from "../../profile/hooks/useProfile";
import { useUpdateStaging } from "../../stagings/hooks/useStagings";
import { PageOptions } from "../components/PageOptions";
import { PagePreview, type PreviewDevice } from "../components/PagePreview";
import { PublishedResult } from "../components/PublishedResult";
import { PublishPreview } from "../components/PublishPreview";

// Muda sempre que o conteúdo da página muda, para o iframe da prévia recarregar.
// O tema fica de fora: a prévia troca o tema sozinha, sem buscar a página de novo.
function previewKey(staging: StagingDetailDTO, profileVersion: string): string {
  const parts = [staging.status, profileVersion, ...staging.photos.map((p) => `${p.photoId}:${p.include}:${p.chosenVariationId}:${p.finalUrl}`)];
  let hash = 0;
  for (const ch of parts.join("|")) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return (hash >>> 0).toString(36);
}

interface PublishStepProps {
  staging: StagingDetailDTO;
  publishError: string | null;
}

// O botão de publicar fica no topo da etapa (no lugar do "Próximo").
export function PublishStep({ staging, publishError }: PublishStepProps) {
  const pageOptions = useUpdateStaging(staging.id);
  const profile = useProfile();
  const { copied, copy } = useCopy();
  const [device, setDevice] = useState<PreviewDevice>("celular");
  const photos = staging.photos.filter((p) => p.include && p.chosenVariationId);
  const publishing = staging.status === "publishing";
  const published = staging.status === "published";
  const outdated = staging.published && !published && !publishing;
  const theme = pageOptions.pending?.pageTheme ?? staging.pageTheme;
  const profileVersion = profile.data ? JSON.stringify(profile.data) : "";

  return (
    <section className="grid gap-6 lg:grid-cols-5" aria-labelledby="publicar-titulo">
      <div className="flex min-w-0 flex-col gap-5 lg:col-span-2">
        <div>
          <h2 id="publicar-titulo" className="text-lg font-semibold">{published ? "Decoração publicada" : "Publicar"}</h2>
          <p className="mt-1 text-sm text-stone-600">
            {published
              ? "Baixe as fotos de cada portal e coloque o link da página no anúncio."
              : "Confira a página ao lado e publique pelo botão no topo. A publicação aplica o selo, monta a página e registra tudo no dossiê."}
          </p>
        </div>

        {profile.data && !profile.data.complete && (
          <Alert tone="info" title="Deixe a página com a sua marca">
            Cadastre logo, nome e WhatsApp em <Link to="/perfil" className="font-medium underline">Minha marca</Link>. A página usa esses dados sempre que é aberta, mesmo depois de publicada.
          </Alert>
        )}
        {publishing && (
          <Card className="flex items-center gap-3 p-4 text-sm">
            <Spinner /> Aplicando selo, gerando os formatos de portal, a página e o dossiê…
          </Card>
        )}
        {staging.status === "publish_failed" && <Alert tone="danger" title="A publicação falhou">{staging.publishError}</Alert>}
        {outdated && <Alert tone="warning">Você mudou fotos ou escolhas depois da última publicação. Publique de novo para atualizar a página e o dossiê.</Alert>}
        {publishError && <Alert tone="danger">{publishError}</Alert>}

        {published && staging.published && <PublishedResult published={staging.published} copied={copied} onCopy={() => copy(staging.published!.publicUrl)} />}

        <PageOptions theme={theme} saving={pageOptions.updating} onThemeChange={(pageTheme) => pageOptions.update({ pageTheme })} />
        {pageOptions.error && <Alert tone="danger">{pageOptions.error}</Alert>}

        <PublishPreview photos={photos} />
      </div>

      <div className="min-w-0 lg:sticky lg:top-4 lg:col-span-3 lg:self-start">
        <PagePreview
          src={`/api/stagings/${staging.id}/preview?r=${previewKey(staging, profileVersion)}`}
          theme={theme}
          device={device}
          onDeviceChange={setDevice}
          openUrl={staging.published?.publicUrl ?? `/api/stagings/${staging.id}/preview`}
        />
      </div>
    </section>
  );
}
