import { useState } from "react";
import { Link } from "react-router";
import type { PropertySummaryDTO } from "@imob/shared";
import { errorText } from "../../../shared/api/http";
import { Alert } from "../../../shared/ui/Alert";
import { buttonClasses } from "../../../shared/ui/Button";
import { EmptyState } from "../../../shared/ui/EmptyState";
import { HomeIcon, PlusIcon } from "../../../shared/ui/icons";
import { PageHeader } from "../../../shared/ui/PageHeader";
import { FullPageSpinner } from "../../../shared/ui/Spinner";
import { DeletePropertyDialog } from "../components/DeletePropertyDialog";
import { PropertyCard } from "../components/PropertyCard";
import { useDeleteProperty, useProperties } from "../hooks/useProperties";

export function PropertiesPage() {
  const properties = useProperties();
  const remove = useDeleteProperty();
  const [toDelete, setToDelete] = useState<PropertySummaryDTO | null>(null);
  const newButton = (
    <Link to="/imoveis/novo" className={buttonClasses({})}>
      <PlusIcon size={18} />
      Novo imóvel
    </Link>
  );

  return (
    <>
      <PageHeader title="Seus imóveis" subtitle="Cada imóvel sai com fotos decoradas, página própria e dossiê." actions={properties.data?.length ? newButton : undefined} />
      {properties.isPending ? (
        <FullPageSpinner />
      ) : properties.isError ? (
        <Alert tone="danger" title="Não foi possível carregar os imóveis">{errorText(properties.error)}</Alert>
      ) : properties.data.length === 0 ? (
        <EmptyState
          icon={<HomeIcon />}
          title="Nenhum imóvel ainda"
          description="Crie um imóvel, envie as fotos dos cômodos vazios e escolha o estilo. O resto o sistema faz."
          action={newButton}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.data.map((p) => (
            <PropertyCard
              key={p.id}
              property={p}
              onDelete={() => {
                remove.reset();
                setToDelete(p);
              }}
            />
          ))}
        </div>
      )}
      <DeletePropertyDialog
        property={toDelete}
        deleting={remove.isPending}
        error={remove.error ? errorText(remove.error) : null}
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })}
      />
    </>
  );
}
