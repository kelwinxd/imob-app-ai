import { Link } from "react-router";
import { errorText } from "../../../shared/api/http";
import { Alert } from "../../../shared/ui/Alert";
import { buttonClasses } from "../../../shared/ui/Button";
import { EmptyState } from "../../../shared/ui/EmptyState";
import { HomeIcon, PlusIcon } from "../../../shared/ui/icons";
import { PageHeader } from "../../../shared/ui/PageHeader";
import { FullPageSpinner } from "../../../shared/ui/Spinner";
import { PropertyCard } from "../components/PropertyCard";
import { useProperties } from "../hooks/useProperties";

export function PropertiesPage() {
  const properties = useProperties();
  const newButton = (
    <Link to="/imoveis/novo" className={buttonClasses({})}>
      <PlusIcon size={18} />
      Novo imóvel
    </Link>
  );

  return (
    <>
      <PageHeader title="Seus imóveis" subtitle="Cada imóvel sai com fotos decoradas, página antes/depois e dossiê." actions={properties.data?.length ? newButton : undefined} />
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
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      )}
    </>
  );
}
