import { useParams } from "react-router";
import type { StagingDetailDTO } from "@imob/shared";
import { errorText, isApiError } from "../../../shared/api/http";
import { Alert } from "../../../shared/ui/Alert";
import { Badge } from "../../../shared/ui/Badge";
import { FlowHeader } from "../../../shared/ui/FlowHeader";
import { PageHeader } from "../../../shared/ui/PageHeader";
import { FullPageSpinner, Spinner } from "../../../shared/ui/Spinner";
import { ChoiceStep } from "../../generation/containers/ChoiceStep";
import { StyleStep } from "../../generation/containers/StyleStep";
import { useStyleSettings } from "../../generation/hooks/useStyleSettings";
import { PublishStep } from "../../publishing/containers/PublishStep";
import { useStagingFlow } from "../hooks/useStagingFlow";
import { useStaging } from "../hooks/useStagings";
import { SPINNING_STATUS, STAGING_STATUS } from "../lib/status";

export function StagingPage() {
  const { id = "", stagingId = "" } = useParams();
  const staging = useStaging(stagingId);
  const back = { to: `/imoveis/${id}`, label: "Imóvel" };

  if (staging.isPending) return <FullPageSpinner />;
  if (staging.isError) {
    const missing = isApiError(staging.error) && staging.error.status === 404;
    return (
      <>
        <PageHeader title={missing ? "Decoração não encontrada" : "Erro ao carregar"} back={back} />
        <Alert tone="danger">{missing ? "Ela pode ter sido excluída." : errorText(staging.error)}</Alert>
      </>
    );
  }
  return <StagingFlowView key={staging.data.id} staging={staging.data} />;
}

function StagingFlowView({ staging }: { staging: StagingDetailDTO }) {
  const settings = useStyleSettings(staging);
  const flow = useStagingFlow(staging, settings);
  const status = STAGING_STATUS[staging.status];

  return (
    <>
      <FlowHeader
        title={staging.name}
        back={{ to: `/imoveis/${staging.propertyId}`, label: staging.propertyTitle }}
        meta={<Badge tone={status.tone} icon={SPINNING_STATUS.has(staging.status) ? <Spinner size={12} /> : undefined}>{status.label}</Badge>}
        nav={flow.nav}
        steps={flow.steps}
        active={flow.active}
        completed={flow.completed}
        reachable={flow.reachable}
        onSelect={flow.goTo}
      />
      {flow.active === "estilo" && <StyleStep staging={staging} settings={settings} saveError={flow.saveError} />}
      {flow.active === "escolha" && <ChoiceStep staging={staging} onEditStyle={() => flow.go("estilo")} />}
      {flow.active === "publicar" && <PublishStep staging={staging} />}
    </>
  );
}
