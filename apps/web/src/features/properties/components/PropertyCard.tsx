import { Link } from "react-router";
import type { PropertySummaryDTO } from "@imob/shared";
import { formatDate, plural } from "../../../shared/lib/format";
import { HomeIcon, TrashIcon } from "../../../shared/ui/icons";
import { PropertyStatusBadge } from "./PropertyStatusBadge";

export function PropertyCard({ property, onDelete }: { property: PropertySummaryDTO; onDelete: () => void }) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_1px_2px_rgba(28,25,23,0.04)] transition hover:border-stone-300 hover:shadow-md">
      <Link to={`/imoveis/${property.id}`} className="flex flex-1 flex-col">
        <div className="aspect-[4/3] bg-stone-100">
          {property.coverUrl ? (
            <img src={property.coverUrl} alt="" className="h-full w-full object-cover transition group-hover:scale-[1.02]" loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center text-stone-400">
              <HomeIcon size={32} />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2 p-4">
          <h3 className="line-clamp-2 pr-8 font-semibold text-stone-900">{property.title}</h3>
          <div>
            <PropertyStatusBadge status={property.status} />
          </div>
          <p className="text-xs text-stone-500">
            {plural(property.photoCount, "foto", "fotos")} · {plural(property.stagingCount, "decoração", "decorações")}
            {property.publishedCount > 0 && ` · ${plural(property.publishedCount, "publicada", "publicadas")}`}
          </p>
          <p className="text-xs text-stone-400">Criado em {formatDate(property.createdAt)}</p>
        </div>
      </Link>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Excluir ${property.title}`}
        title="Excluir imóvel"
        className="absolute top-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-stone-500 shadow ring-1 ring-stone-200 transition hover:bg-red-50 hover:text-red-600"
      >
        <TrashIcon size={17} />
      </button>
    </article>
  );
}
