import { Link } from "react-router";
import type { StagingDetailDTO } from "@imob/shared";
import { useCopy } from "../../../shared/lib/useCopy";
import { Alert } from "../../../shared/ui/Alert";
import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import { ShieldIcon } from "../../../shared/ui/icons";
import { Spinner } from "../../../shared/ui/Spinner";
import { useProfile } from "../../profile/hooks/useProfile";
import { CAN_PUBLISH } from "../../stagings/lib/status";
import { PublishedResult } from "../components/PublishedResult";
import { PublishPreview } from "../components/PublishPreview";
import { usePublish } from "../hooks/usePublish";

export function PublishStep({ staging }: { staging: StagingDetailDTO }) {
  const publish = usePublish(staging.id);
  const profile = useProfile();
  const { copied, copy } = useCopy();
  const photos = staging.photos.filter((p) => p.include && p.chosenVariationId);
  const publishing = staging.status === "publishing";
  const published = staging.status === "published";
  const outdated = staging.published && !published && !publishing;

  return (
    <section className="flex flex-col gap-5" aria-labelledby="publicar-titulo">
      <div>
        <h2 id="publicar-titulo" className="text-lg font-semibold">{published ? "Decoração publicada" : "Publicar"}</h2>
        <p className="mt-1 text-sm text-stone-600">
          {published
            ? "Baixe as fotos de cada portal e coloque o link da página no anúncio."
            : "Confira as variações escolhidas. A publicação aplica o selo, monta a página e registra tudo no dossiê."}
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
      {publish.error && <Alert tone="danger">{publish.error}</Alert>}

      {published && staging.published && <PublishedResult published={staging.published} copied={copied} onCopy={() => copy(staging.published!.publicUrl)} />}

      <PublishPreview photos={photos} />

      {!published && (
        <div className="flex justify-end">
          <Button size="lg" onClick={publish.publish} loading={publish.requesting || publishing} disabled={!CAN_PUBLISH.has(staging.status)} icon={<ShieldIcon size={18} />}>
            {staging.published ? "Publicar de novo" : "Publicar com comprovação"}
          </Button>
        </div>
      )}
    </section>
  );
}
