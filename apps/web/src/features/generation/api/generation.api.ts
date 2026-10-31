import type { ChooseVariationInput, GenerateInput, PropertyDetailDTO } from "@imob/shared";
import { http } from "../../../shared/api/http";

export const generationApi = {
  start: (propertyId: string, input: GenerateInput) => http.post<PropertyDetailDTO>(`/properties/${propertyId}/generate`, input).then((r) => r.data),
  regenerate: (photoId: string) => http.post<PropertyDetailDTO>(`/photos/${photoId}/regenerate`).then((r) => r.data),
  choose: (photoId: string, input: ChooseVariationInput) => http.post<PropertyDetailDTO>(`/photos/${photoId}/choose`, input).then((r) => r.data),
};
