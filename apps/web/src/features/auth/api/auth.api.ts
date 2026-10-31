import type { LoginInput, RegisterInput, UserDTO } from "@imob/shared";
import { http } from "../../../shared/api/http";

export const authApi = {
  me: () => http.get<UserDTO>("/auth/me").then((r) => r.data),
  login: (input: LoginInput) => http.post<UserDTO>("/auth/login", input).then((r) => r.data),
  register: (input: RegisterInput) => http.post<UserDTO>("/auth/register", input).then((r) => r.data),
  logout: () => http.post<void>("/auth/logout").then(() => undefined),
};
