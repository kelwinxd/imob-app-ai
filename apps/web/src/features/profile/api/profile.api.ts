import type { ProfileDTO, UpdateProfileInput } from "@imob/shared";
import { http } from "../../../shared/api/http";

export const profileApi = {
  get: () => http.get<ProfileDTO>("/profile").then((r) => r.data),
  save: (input: UpdateProfileInput) => http.put<ProfileDTO>("/profile", input).then((r) => r.data),
  uploadLogo: (file: File) => {
    const form = new FormData();
    form.append("logo", file, file.name);
    return http.post<ProfileDTO>("/profile/logo", form).then((r) => r.data);
  },
  removeLogo: () => http.delete<ProfileDTO>("/profile/logo").then((r) => r.data),
};
