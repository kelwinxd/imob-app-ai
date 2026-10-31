import { useNavigate } from "react-router";
import type { PropertyDetailDTO } from "@imob/shared";
import { Alert } from "../../../shared/ui/Alert";
import { Button } from "../../../shared/ui/Button";
import { EmptyState } from "../../../shared/ui/EmptyState";
import { PlusIcon, SparklesIcon } from "../../../shared/ui/icons";
import { StagingCard } from "../components/StagingCard";
import { useCreateStaging, useDeleteStaging } from "../hooks/useStagings";

export const stagingPath = (propertyId: string, stagingId: string) => `/imoveis/${propertyId}/decoracoes/${stagingId}`;

export function StagingsSection({ property }: { property: PropertyDetailDTO }) {
  const navigate = useNavigate();
  const create = useCreateStaging(property.id);
  const remove = useDeleteStaging(property.id);
  const ready = property.photos.some((p) => p.status === "ready" && p.roomConfirmed);

  const newButton = (
    <Button
      icon={<PlusIcon size={18} />}
      loading={create.creating}
      disabled={!ready}
      onClick={() => create.create(undefined, { onSuccess: (s) => navigate(stagingPath(property.id, s.id)) })}
    >
      Nova decoração
    </Button>
  );

  return (
    <section className="flex flex-col gap-5" aria-labelledby="decoracoes-titulo">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="decoracoes-titulo" className="text-lg font-semibold">Decorações</h2>
          <p className="mt-1 text-sm text-stone-600">Crie quantas quiser: cada uma tem estilo, variações e página própria.</p>
        </div>
        {property.stagings.length > 0 && newButton}
      </div>

      {!ready && <Alert tone="info">Envie as fotos e confirme os cômodos na etapa Fotos para criar uma decoração.</Alert>}
      {create.error && <Alert tone="danger">{create.error}</Alert>}
      {remove.error && <Alert tone="danger">{remove.error}</Alert>}

      {property.stagings.length === 0 ? (
        <EmptyState
          icon={<SparklesIcon />}
          title="Nenhuma decoração ainda"
          description="Crie a primeira: escolha um estilo, gere as variações e publique a página do imóvel."
          action={newButton}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {property.stagings.map((s) => (
            <StagingCard
              key={s.id}
              staging={s}
              to={stagingPath(property.id, s.id)}
              deleting={remove.removingId === s.id}
              onDelete={() => remove.remove(s.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
