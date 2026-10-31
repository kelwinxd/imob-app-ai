import { Link } from "react-router";
import type { PropertySummaryDTO } from "@imob/shared";
import { formatDate, plural } from "../../../shared/lib/format";
import { HomeIcon } from "../../../shared/ui/icons";
import { PropertyStatusBadge } from "./PropertyStatusBadge";

export function PropertyCard({ property }: { property: PropertySummaryDTO }) {
  return (
    <Link
      to={`/imoveis/${property.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_1px_2px_rgba(28,25,23,0.04)] transition hover:border-stone-300 hover:shadow-md"
    >
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
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 font-semibold text-stone-900">{property.title}</h3>
        </div>
        <div>
          <PropertyStatusBadge status={property.status} />
        </div>
        <p className="text-xs text-stone-500">
          {plural(property.photoCount, "foto", "fotos")} · criado em {formatDate(property.createdAt)}
        </p>
      </div>
    </Link>
  );
}
