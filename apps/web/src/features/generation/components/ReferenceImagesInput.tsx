import { ACCEPTED_IMAGE_TYPES, MAX_REFERENCE_IMAGES, type ReferenceImageDTO } from "@imob/shared";
import { PlusIcon, XIcon } from "../../../shared/ui/icons";
import { Spinner } from "../../../shared/ui/Spinner";

interface ReferenceImagesInputProps {
  images: ReferenceImageDTO[];
  uploading: boolean;
  removingId?: string;
  disabled?: boolean;
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
}

export function ReferenceImagesInput({ images, uploading, removingId, disabled, onAdd, onRemove }: ReferenceImagesInputProps) {
  const remaining = MAX_REFERENCE_IMAGES - images.length;
  return (
    <fieldset>
      <legend className="mb-1 text-sm font-semibold text-stone-900">Móveis de referência</legend>
      <p className="mb-3 text-xs text-stone-600">
        Opcional. Envie até {MAX_REFERENCE_IMAGES} fotos de móveis (de lojas, catálogos, etc.); a IA tenta usar peças parecidas.
      </p>
      <div className="grid grid-cols-4 gap-2 sm:max-w-md">
        {images.map((img) => (
          <div key={img.id} className="relative aspect-square overflow-hidden rounded-lg border border-stone-200 bg-stone-100">
            <img src={img.url} alt="Móvel de referência" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onRemove(img.id)}
              disabled={disabled || removingId === img.id}
              aria-label="Remover imagem"
              className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-stone-900/70 text-white hover:bg-stone-900 disabled:opacity-50"
            >
              {removingId === img.id ? <Spinner size={12} /> : <XIcon size={14} />}
            </button>
          </div>
        ))}
        {remaining > 0 && (
          <label className="relative flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-stone-300 bg-white text-xs text-stone-600 hover:border-brand-400 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
            {uploading ? <Spinner size={18} /> : <PlusIcon size={18} />}
            {uploading ? "Enviando" : "Adicionar"}
            <input
              type="file"
              multiple
              accept={ACCEPTED_IMAGE_TYPES.join(",")}
              disabled={disabled || uploading}
              className="absolute inset-0 opacity-0"
              aria-label="Adicionar fotos de móveis"
              onChange={(e) => {
                onAdd([...(e.target.files ?? [])].slice(0, remaining));
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>
    </fieldset>
  );
}
