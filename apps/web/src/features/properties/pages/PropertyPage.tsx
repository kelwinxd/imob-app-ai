import { useParams } from "react-router";
import type { PropertyDetailDTO } from "@imob/shared";
import { errorText, isApiError } from "../../../shared/api/http";
import { plural } from "../../../shared/lib/format";
import { Alert } from "../../../shared/ui/Alert";
import { PageHeader } from "../../../shared/ui/PageHeader";
import { FullPageSpinner } from "../../../shared/ui/Spinner";
import { Stepper } from "../../../shared/ui/Stepper";
import { ChoiceStep } from "../../generation/containers/ChoiceStep";
import { StyleStep } from "../../generation/containers/StyleStep";
import { PhotosStep } from "../../photos/containers/PhotosStep";
import { PublishStep } from "../../publishing/containers/PublishStep";
import { PropertyStatusBadge } from "../components/PropertyStatusBadge";
import { useProperty } from "../hooks/useProperties";
import { usePropertyFlow } from "../hooks/usePropertyFlow";

export function PropertyPage() {
  const { id = "" } = useParams();
  const property = useProperty(id);

  if (property.isPending) return <FullPageSpinner />;
  if (property.isError) {
    const missing = isApiError(property.error) && property.error.status === 404;
    return (
      <>
        <PageHeader title={missing ? "Imóvel não encontrado" : "Erro ao carregar"} back={{ to: "/", label: "Imóveis" }} />
        <Alert tone="danger">{missing ? "Ele pode ter sido removido ou pertencer a outra conta." : errorText(property.error)}</Alert>
      </>
    );
  }
  return <PropertyFlow property={property.data} />;
}

function PropertyFlow({ property }: { property: PropertyDetailDTO }) {
  const flow = usePropertyFlow(property);

  return (
    <>
      <PageHeader
        title={property.title}
        back={{ to: "/", label: "Imóveis" }}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <PropertyStatusBadge status={property.status} />
            <span>{plural(property.photos.length, "foto", "fotos")}</span>
          </span>
        }
      />
      <Stepper steps={flow.steps} activeId={flow.active} completed={flow.completed} reachable={flow.reachable} onSelect={flow.goTo} />

      {flow.active === "fotos" && <PhotosStep property={property} onContinue={() => flow.goTo("estilo")} />}
      {flow.active === "estilo" && <StyleStep property={property} onGenerated={() => flow.goTo("escolha")} />}
      {flow.active === "escolha" && <ChoiceStep property={property} onContinue={() => flow.goTo("publicar")} onChangeStyle={() => flow.goTo("estilo")} />}
      {flow.active === "publicar" && <PublishStep property={property} />}
    </>
  );
}
