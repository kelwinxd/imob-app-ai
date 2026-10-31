import type { PropertyDetailDTO } from "@imob/shared";
import { http } from "../../../shared/api/http";

export const publishingApi = {
  publish: (propertyId: string) => http.post<PropertyDetailDTO>(`/properties/${propertyId}/publish`).then((r) => r.data),
};
