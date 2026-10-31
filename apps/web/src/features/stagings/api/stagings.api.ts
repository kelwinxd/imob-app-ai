import type {
  ChooseVariationInput, CreateStagingInput, GenerateInput, StagingDetailDTO, UpdateStagingInput, UpdateStagingPhotoInput,
} from "@imob/shared";
import { http } from "../../../shared/api/http";

const data = <T,>(p: Promise<{ data: T }>) => p.then((r) => r.data);

export const stagingsApi = {
  create: (propertyId: string, input: CreateStagingInput = {}) => data(http.post<StagingDetailDTO>(`/properties/${propertyId}/stagings`, input)),
  get: (id: string) => data(http.get<StagingDetailDTO>(`/stagings/${id}`)),
  update: (id: string, input: UpdateStagingInput) => data(http.patch<StagingDetailDTO>(`/stagings/${id}`, input)),
  remove: (id: string) => http.delete(`/stagings/${id}`).then(() => undefined),
  updatePhoto: (id: string, photoId: string, input: UpdateStagingPhotoInput) => data(http.patch<StagingDetailDTO>(`/stagings/${id}/photos/${photoId}`, input)),
  addReferences: (id: string, files: File[]) => {
    const form = new FormData();
    for (const f of files) form.append("images", f, f.name);
    return data(http.post<StagingDetailDTO>(`/stagings/${id}/references`, form, { timeout: 5 * 60_000 }));
  },
  removeReference: (id: string, refId: string) => data(http.delete<StagingDetailDTO>(`/stagings/${id}/references/${refId}`)),
  generate: (id: string, input: GenerateInput) => data(http.post<StagingDetailDTO>(`/stagings/${id}/generate`, input)),
  choose: (id: string, photoId: string, input: ChooseVariationInput) => data(http.post<StagingDetailDTO>(`/stagings/${id}/photos/${photoId}/choose`, input)),
  publish: (id: string) => data(http.post<StagingDetailDTO>(`/stagings/${id}/publish`)),
};
