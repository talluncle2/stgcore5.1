import { authedApiRequest } from "./api";
import { assertAdmin } from "./adminGuard";
import { AdminSettings, AuthUser } from "../types/api";

export async function getAdminSettings(): Promise<AdminSettings | null> {
  try {
    return await authedApiRequest<AdminSettings>("/admin/settings");
  } catch {
    return null;
  }
}

export async function updateAdminSettings(payload: AdminSettings, currentUser: AuthUser | null): Promise<AdminSettings> {
  assertAdmin(currentUser);
  return authedApiRequest<AdminSettings>("/admin/settings", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
