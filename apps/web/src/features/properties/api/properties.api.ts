import type { CreatePropertyInput, PropertyDetailDTO, PropertySummaryDTO } from "@imob/shared";
import { http } from "../../../shared/api/http";

export const propertiesApi = {
  list: () => http.get<PropertySummaryDTO[]>("/properties").then((r) => r.data),
  get: (id: string) => http.get<PropertyDetailDTO>(`/properties/${id}`).then((r) => r.data),
  create: (input: CreatePropertyInput) => http.post<PropertyDetailDTO>("/properties", input).then((r) => r.data),
};
