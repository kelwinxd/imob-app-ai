import type { PropertyDetailDTO } from "@imob/shared";
import { plural } from "../../../shared/lib/format";
import { Alert } from "../../../shared/ui/Alert";
import { Button } from "../../../shared/ui/Button";
import { ArrowRightIcon } from "../../../shared/ui/icons";
import { StickyActions } from "../../../shared/ui/StickyActions";
import { PhotoDropzone } from "../components/PhotoDropzone";
import { PhotoRoomCard } from "../components/PhotoRoomCard";
import { usePhotoUpload, useRetryClassification, useUpdatePhoto } from "../hooks/usePhotos";

export function PhotosStep({ property, onContinue }: { property: PropertyDetailDTO; onContinue: () => void }) {
  const upload = usePhotoUpload(property);
  const update = useUpdatePhoto();
  const retry = useRetryClassification();

  const locked = property.status === "publishing";
  const classifying = property.photos.filter((p) => p.status === "classifying").length;
  const included = property.photos.filter((p) => p.include);
  const missingRoom = included.some((p) => !p.roomConfirmed);
  const canContinue = included.length > 0 && classifying === 0 && !missingRoom && !upload.uploading;
  const hasPhotos = property.photos.length > 0;

  return (
    <section className="flex flex-col gap-5" aria-labelledby="fotos-titulo">
      <div>
        <h2 id="fotos-titulo" className="text-lg font-semibold">Fotos e cômodos</h2>
        <p className="mt-1 text-sm text-stone-600">
          A IA sugere o cômodo de cada foto. Confira, corrija se precisar e desmarque as que não devem ser decoradas.
        </p>
      </div>

      <PhotoDropzone onFiles={upload.upload} uploading={upload.uploading} progress={upload.progress} remaining={upload.remaining} compact={hasPhotos} />

      {upload.error && <Alert tone="danger">{upload.error}</Alert>}
      {upload.rejected.length > 0 && (
        <Alert tone="warning" title="Algumas fotos não foram enviadas">
          <ul className="list-disc pl-4">
            {upload.rejected.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </Alert>
      )}
      {update.error && <Alert tone="danger">{update.error}</Alert>}
      {classifying > 0 && <Alert tone="info">Identificando {plural(classifying, "cômodo", "cômodos")}… isso leva alguns segundos.</Alert>}

      {hasPhotos && (
        <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3">
          {property.photos.map((photo) => (
            <PhotoRoomCard
              key={photo.id}
              photo={photo}
              locked={locked}
              busy={update.pendingPhotoId === photo.id || retry.pendingPhotoId === photo.id}
              onRoomChange={(room) => update.update(photo.id, { roomConfirmed: room })}
              onIncludeChange={(include) => update.update(photo.id, { include })}
              onRetry={() => retry.retry(photo.id)}
            />
          ))}
        </div>
      )}

      {hasPhotos && (
        <StickyActions hint={`${plural(included.length, "foto será decorada", "fotos serão decoradas")} · 3 variações cada`}>
          <Button size="lg" onClick={onContinue} disabled={!canContinue} icon={<ArrowRightIcon size={18} />}>
            Escolher estilo
          </Button>
        </StickyActions>
      )}
    </section>
  );
}
