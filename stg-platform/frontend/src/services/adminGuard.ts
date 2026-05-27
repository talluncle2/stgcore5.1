import { AuthUser } from "../types/api";
import { hasAdminAccess } from "../utils/permissions";

export function assertAdmin(user: AuthUser | null | undefined): void {
  if (!hasAdminAccess(user)) {
    throw new Error("Apenas administradores podem executar esta acao.");
  }
}
