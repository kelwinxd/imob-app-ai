import { useState } from "react";
import { Link } from "react-router";
import { STANDARD_INFO, STYLE_INFO, type StagingSummaryDTO } from "@imob/shared";
import { formatDate } from "../../../shared/lib/format";
import { Badge } from "../../../shared/ui/Badge";
import { Button } from "../../../shared/ui/Button";
import { ExternalIcon, SparklesIcon } from "../../../shared/ui/icons";
import { Spinner } from "../../../shared/ui/Spinner";
import { SPINNING_STATUS, STAGING_STATUS } from "../lib/status";

interface StagingCardProps {
  staging: StagingSummaryDTO;
  to: string;
  deleting: boolean;
  onDelete: () => void;
}

export function StagingCard({ staging, to, deleting, onDelete }: StagingCardProps) {
  // Confirmação inline da exclusão: estado só de exibição.
  const [confirming, setConfirming] = useState(false);
  const status = STAGING_STATUS[staging.status];
  const busy = staging.status === "generating" || staging.status === "publishing";

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
      <Link to={to} className="group block aspect-[4/3] overflow-hidden bg-stone-100">
        {staging.coverUrl ? (
          <img src={staging.coverUrl} alt="" className="h-full w-full object-cover transition group-hover:scale-[1.02]" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-stone-400"><SparklesIcon size={28} /></div>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <Link to={to} className="font-semibold text-stone-900 hover:underline">{staging.name}</Link>
          <Badge tone={status.tone} icon={SPINNING_STATUS.has(staging.status) ? <Spinner size={12} /> : undefined}>{status.label}</Badge>
        </div>
        <p className="text-xs text-stone-600">
          {staging.style ? `${STYLE_INFO[staging.style].label} · padrão ${staging.standard ? STANDARD_INFO[staging.standard].label.toLowerCase() : "-"}` : "Estilo ainda não escolhido"}
        </p>
        <p className="text-xs text-stone-500">{staging.publishedAt ? `Publicada em ${formatDate(staging.publishedAt)}` : `Criada em ${formatDate(staging.createdAt)}`}</p>

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
          <Link to={to} className="inline-flex h-9 items-center rounded-xl bg-brand-600 px-3 text-sm font-medium text-white hover:bg-brand-700">Abrir</Link>
          {staging.publicUrl && (
            <a href={staging.publicUrl} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-stone-700 ring-1 ring-stone-300 ring-inset hover:bg-stone-50">
              <ExternalIcon size={15} /> Página
            </a>
          )}
          {confirming ? (
            <span className="ml-auto flex items-center gap-1">
              <Button size="sm" variant="danger" loading={deleting} onClick={onDelete}>Excluir</Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>Cancelar</Button>
            </span>
          ) : (
            <Button size="sm" variant="ghost" className="ml-auto text-stone-500" disabled={busy} onClick={() => setConfirming(true)}>Excluir</Button>
          )}
        </div>
        {confirming && staging.publicUrl && <p className="text-xs text-red-700">A página pública desta decoração deixa de funcionar.</p>}
      </div>
    </article>
  );
}
