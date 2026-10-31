import type { PropertyDetailDTO } from "@imob/shared";
import { useCopy } from "../../../shared/lib/useCopy";
import { Alert } from "../../../shared/ui/Alert";
import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import { ShieldIcon } from "../../../shared/ui/icons";
import { Spinner } from "../../../shared/ui/Spinner";
import { StickyActions } from "../../../shared/ui/StickyActions";
import { PublishedResult } from "../components/PublishedResult";
import { PublishPreview } from "../components/PublishPreview";
import { usePublish } from "../hooks/usePublish";

export function PublishStep({ property }: { property: PropertyDetailDTO }) {
  const publish = usePublish(property.id);
  const { copied, copy } = useCopy();
  const photos = property.photos.filter((p) => p.include && p.chosenVariationId);
  const publishing = property.status === "publishing";
  const published = property.status === "published";
  const outdated = property.published && !published && !publishing;
  const canPublish = ["choosing", "published", "publish_failed"].includes(property.status);

  return (
    <section className="flex flex-col gap-5" aria-labelledby="publicar-titulo">
      <div>
        <h2 id="publicar-titulo" className="text-lg font-semibold">{published ? "Imóvel publicado" : "Publicar"}</h2>
        <p className="mt-1 text-sm text-stone-600">
          {published ? "Baixe as fotos de cada portal e coloque o link da página no anúncio." : "Confira as variações escolhidas. A publicação aplica o selo e registra tudo no dossiê."}
        </p>
      </div>

      {publishing && (
        <Card className="flex items-center gap-3 p-4 text-sm">
          <Spinner /> Aplicando selo, gerando os formatos de portal, a página e o dossiê…
        </Card>
      )}
      {property.status === "publish_failed" && <Alert tone="danger" title="A publicação falhou">{property.publishError}</Alert>}
      {outdated && <Alert tone="warning">Você mudou fotos ou escolhas depois da última publicação. Publique de novo para atualizar a página e o dossiê.</Alert>}
      {publish.error && <Alert tone="danger">{publish.error}</Alert>}

      {published && property.published && <PublishedResult published={property.published} copied={copied} onCopy={() => copy(property.published!.publicUrl)} />}

      <PublishPreview photos={photos} />

      {!published && (
        <StickyActions hint="A foto original fica sempre guardada e disponível na página pública.">
          <Button size="lg" onClick={publish.publish} loading={publish.requesting || publishing} disabled={!canPublish} icon={<ShieldIcon size={18} />}>
            {property.published ? "Publicar de novo" : "Publicar com comprovação"}
          </Button>
        </StickyActions>
      )}
    </section>
  );
}
