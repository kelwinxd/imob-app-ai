import { ROOM_LABELS, type StagingPhotoDTO } from "@imob/shared";
import { Card } from "../../../shared/ui/Card";
import { ShieldIcon } from "../../../shared/ui/icons";
import { VerdictBadge } from "../../generation/components/VerdictBadge";

const STEPS = [
  "Selo descritivo em cada foto, com o link da página",
  "Versões no tamanho de Zap, Viva Real, OLX e Instagram",
  "Landing do imóvel com a sua marca, antes/depois e QR code",
  "Dossiê em PDF com hashes e o resultado da trava",
];

export function PublishPreview({ photos }: { photos: StagingPhotoDTO[] }) {
  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold"><ShieldIcon size={18} className="text-brand-600" /> O que a publicação gera</p>
        <ul className="grid gap-1.5 text-sm text-stone-700 sm:grid-cols-2">
          {STEPS.map((s) => (
            <li key={s} className="flex gap-2"><span className="text-brand-600">•</span>{s}</li>
          ))}
        </ul>
      </Card>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((p) => {
          const v = p.variations.find((x) => x.id === p.chosenVariationId);
          return (
            <figure key={p.photoId} className="overflow-hidden rounded-xl border border-stone-200 bg-white">
              <img src={p.finalUrl ?? v?.previewUrl ?? p.thumbUrl} alt="" className="aspect-[4/3] w-full object-cover" loading="lazy" />
              <figcaption className="flex flex-col gap-1 p-2">
                <span className="truncate text-xs font-medium">{p.roomConfirmed ? ROOM_LABELS[p.roomConfirmed] : "Foto"}</span>
                {v && <VerdictBadge verdict={v.verdict} />}
              </figcaption>
            </figure>
          );
        })}
      </div>
    </div>
  );
}
