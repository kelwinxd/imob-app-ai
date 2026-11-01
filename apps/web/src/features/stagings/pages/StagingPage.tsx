import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import type { StagingDetailDTO } from "@imob/shared";
import { errorText, isApiError } from "../../../shared/api/http";
import { Alert } from "../../../shared/ui/Alert";
import { ConfirmDialog } from "../../../shared/ui/ConfirmDialog";
import { FlowHeader } from "../../../shared/ui/FlowHeader";
import { TrashIcon } from "../../../shared/ui/icons";
import { PageHeader } from "../../../shared/ui/PageHeader";
import { SettingsMenu } from "../../../shared/ui/SettingsMenu";
import { FullPageSpinner } from "../../../shared/ui/Spinner";
import { ChoiceStep } from "../../generation/containers/ChoiceStep";
import { StyleStep } from "../../generation/containers/StyleStep";
import { useStyleSettings } from "../../generation/hooks/useStyleSettings";
import { PublishStep } from "../../publishing/containers/PublishStep";
import { DeleteStagingDialog } from "../components/DeleteStagingDialog";
import { useRepublishPrompt } from "../hooks/useRepublishPrompt";
import { useStagingFlow } from "../hooks/useStagingFlow";
import { useDeleteStaging, useStaging } from "../hooks/useStagings";

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
  const republish = useRepublishPrompt(staging);
  const navigate = useNavigate();
  const remove = useDeleteStaging(staging.propertyId);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const busy = staging.status === "generating" || staging.status === "publishing";

  return (
    <>
      <FlowHeader
        title={staging.name}
        back={{ to: `/imoveis/${staging.propertyId}`, label: staging.propertyTitle }}
        settings={
          <SettingsMenu
            label="Configurações da decoração"
            items={[
              {
                label: "Excluir decoração",
                icon: <TrashIcon size={16} />,
                tone: "danger",
                disabled: busy,
                hint: "Aguarde terminar a geração ou a publicação",
                onSelect: () => {
                  remove.reset();
                  setConfirmDelete(true);
                },
              },
            ]}
          />
        }
        nav={flow.nav}
        steps={flow.steps}
        active={flow.active}
        completed={flow.completed}
        reachable={flow.reachable}
        onSelect={flow.goTo}
      />
      {flow.active === "estilo" && <StyleStep staging={staging} settings={settings} saveError={flow.saveError} />}
      {flow.active === "escolha" && <ChoiceStep staging={staging} onEditStyle={() => flow.go("estilo")} />}
      {flow.active === "publicar" && <PublishStep staging={staging} publishError={flow.publish.error} />}

      <ConfirmDialog
        open={republish.open}
        title="Atualizar publicação com nova decoração?"
        confirmLabel="Atualizar agora"
        cancelLabel="Agora não"
        loading={flow.publish.requesting}
        error={flow.publish.error}
        onConfirm={flow.publish.publish}
        onCancel={republish.close}
      >
        A nova geração terminou, mas a página pública ainda mostra a versão anterior. Atualizar agora aplica as variações escolhidas, refaz o selo das fotos e o dossiê.
      </ConfirmDialog>
      <DeleteStagingDialog
        staging={confirmDelete ? staging : null}
        deleting={remove.removing}
        error={remove.error}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => remove.remove(staging.id, () => navigate(`/imoveis/${staging.propertyId}`, { replace: true }))}
      />
    </>
  );
}
