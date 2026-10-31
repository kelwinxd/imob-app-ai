import type { PropertyDetailDTO, UpdatePhotoInput } from "@imob/shared";
import { http } from "../../../shared/api/http";

export const photosApi = {
  upload: (propertyId: string, files: File[], onProgress?: (pct: number) => void) => {
    const form = new FormData();
    for (const f of files) form.append("photos", f, f.name);
    return http
      .post<PropertyDetailDTO>(`/properties/${propertyId}/photos`, form, {
        timeout: 10 * 60_000,
        onUploadProgress: (e) => {
          if (e.total) onProgress?.((e.loaded / e.total) * 100);
        },
      })
      .then((r) => r.data);
  },
  update: (photoId: string, input: UpdatePhotoInput) => http.patch<PropertyDetailDTO>(`/photos/${photoId}`, input).then((r) => r.data),
  retryClassification: (photoId: string) => http.post<PropertyDetailDTO>(`/photos/${photoId}/classify`).then((r) => r.data),
};
