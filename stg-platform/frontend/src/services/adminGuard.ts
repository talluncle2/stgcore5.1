import { AuthUser } from "../types/api";
import { canManageContent } from "../utils/permissions";

export function assertAdmin(user: AuthUser | null | undefined): void {
  if (!canManageContent(user)) {
    throw new Error("Apenas administradores, moderadores ou staff autorizado podem executar esta acao.");
  }
}
