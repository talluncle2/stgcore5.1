import { authedApiRequest } from "./api";
import { assertAdmin } from "./adminGuard";
import { AuthUser, ModerationConfig } from "../types/api";

export async function getModerationConfig(): Promise<ModerationConfig | null> {
  try {
    return await authedApiRequest<ModerationConfig>("/admin/moderation/config");
  } catch {
    return null;
  }
}

export async function updateModerationConfig(
  payload: ModerationConfig,
  currentUser: AuthUser | null
): Promise<ModerationConfig> {
  assertAdmin(currentUser);
  return authedApiRequest<ModerationConfig>("/admin/moderation/config", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
