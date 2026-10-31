import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  ACCEPTED_IMAGE_TYPES, MAX_PHOTO_BYTES, MAX_PHOTOS_PER_PROPERTY,
  type PropertyDetailDTO, type UpdatePhotoInput,
} from "@imob/shared";
import { errorText } from "../../../shared/api/http";
import { useApplyPropertyDetail } from "../../properties/hooks/useProperties";
import { photosApi } from "../api/photos.api";

const ACCEPTED = new Set<string>(ACCEPTED_IMAGE_TYPES);

export const uploadMutationKey = (propertyId: string) => ["upload-photos", propertyId] as const;
const MAX_MB = Math.round(MAX_PHOTO_BYTES / 1024 / 1024);

export function usePhotoUpload(property: PropertyDetailDTO) {
  const apply = useApplyPropertyDetail();
  const [progress, setProgress] = useState(0);
  const [rejected, setRejected] = useState<string[]>([]);
  const remaining = Math.max(0, MAX_PHOTOS_PER_PROPERTY - property.photos.length);

  const mutation = useMutation({
    mutationKey: uploadMutationKey(property.id),
    mutationFn: (files: File[]) => photosApi.upload(property.id, files, setProgress),
    onSuccess: apply,
    onSettled: () => setProgress(0),
  });

  const upload = (files: File[]) => {
    const problems: string[] = [];
    const accepted: File[] = [];
    for (const f of files) {
      if (!ACCEPTED.has(f.type)) problems.push(`${f.name}: formato não suportado. Use JPG, PNG ou WEBP (HEIC do iPhone precisa ser convertido).`);
      else if (f.size > MAX_PHOTO_BYTES) problems.push(`${f.name}: maior que ${MAX_MB} MB.`);
      else accepted.push(f);
    }
    if (accepted.length > remaining) {
      problems.push(`Este imóvel aceita mais ${remaining} ${remaining === 1 ? "foto" : "fotos"}; as excedentes não foram enviadas.`);
      accepted.splice(remaining);
    }
    setRejected(problems);
    if (accepted.length) mutation.mutate(accepted);
  };

  return {
    upload,
    uploading: mutation.isPending,
    progress,
    rejected,
    error: mutation.error ? errorText(mutation.error) : null,
    remaining,
  };
}

export function useUpdatePhoto() {
  const apply = useApplyPropertyDetail();
  const mutation = useMutation({
    mutationFn: ({ photoId, input }: { photoId: string; input: UpdatePhotoInput }) => photosApi.update(photoId, input),
    onSuccess: apply,
  });
  return {
    update: (photoId: string, input: UpdatePhotoInput) => mutation.mutate({ photoId, input }),
    pendingPhotoId: mutation.isPending ? mutation.variables?.photoId : undefined,
    error: mutation.error ? errorText(mutation.error) : null,
  };
}

export function useRetryClassification() {
  const apply = useApplyPropertyDetail();
  const mutation = useMutation({ mutationFn: photosApi.retryClassification, onSuccess: apply });
  return {
    retry: (photoId: string) => mutation.mutate(photoId),
    pendingPhotoId: mutation.isPending ? mutation.variables : undefined,
  };
}
