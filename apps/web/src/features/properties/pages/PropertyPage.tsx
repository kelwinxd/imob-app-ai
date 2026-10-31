import { useParams } from "react-router";
import type { PropertyDetailDTO } from "@imob/shared";
import { errorText, isApiError } from "../../../shared/api/http";
import { plural } from "../../../shared/lib/format";
import { Alert } from "../../../shared/ui/Alert";
import { FlowHeader } from "../../../shared/ui/FlowHeader";
import { PageHeader } from "../../../shared/ui/PageHeader";
import { FullPageSpinner } from "../../../shared/ui/Spinner";
import { ListingStep } from "../../listing/containers/ListingStep";
import { useListingForm } from "../../listing/hooks/useListingForm";
import { PhotosStep } from "../../photos/containers/PhotosStep";
import { StagingsSection } from "../../stagings/containers/StagingsSection";
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
  // A key reinicia o fluxo (etapa Fotos) sempre que outro imóvel é aberto.
  return <PropertyFlowView key={property.data.id} property={property.data} />;
}

function PropertyFlowView({ property }: { property: PropertyDetailDTO }) {
  const listing = useListingForm(property);
  const flow = usePropertyFlow(property, listing);

  return (
    <>
      <FlowHeader
        title={property.title}
        back={{ to: "/", label: "Imóveis" }}
        meta={
          <>
            <PropertyStatusBadge status={property.status} />
            <span>{plural(property.photos.length, "foto", "fotos")}</span>
          </>
        }
        nav={flow.nav}
        steps={flow.steps}
        active={flow.active}
        completed={flow.completed}
        reachable={flow.reachable}
        onSelect={flow.goTo}
      />
      {flow.active === "fotos" && <PhotosStep property={property} />}
      {flow.active === "anuncio" && <ListingStep form={listing} />}
      {flow.active === "decoracoes" && <StagingsSection property={property} />}
    </>
  );
}
