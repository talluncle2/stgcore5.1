import { PublicProfile, PublicProfilePayload } from "../types/api";
import { assertSafePublicUrl, sanitizeOptionalUrl } from "../utils/safeUrl";
import { authedApiRequest } from "./api";

function validateProfilePayload(data: PublicProfilePayload): PublicProfilePayload {
  assertSafePublicUrl(data.public_avatar_url, "Avatar publico");
  assertSafePublicUrl(data.public_banner_url, "Banner publico");

  return {
    ...data,
    public_avatar_url: sanitizeOptionalUrl(data.public_avatar_url),
    public_banner_url: sanitizeOptionalUrl(data.public_banner_url),
    sexual_orientation: data.sexual_orientation?.trim() || undefined,
    sexual_orientation_visibility: data.sexual_orientation_visibility || "private",
    profile_visibility: data.profile_visibility || "public",
  };
}

export async function getMyPublicProfile(): Promise<PublicProfile | null> {
  try {
    return await authedApiRequest<PublicProfile | { profile?: PublicProfile }>("/profile/me").then((data) => {
      if (data && typeof data === "object" && "profile" in data) return data.profile ?? null;
      return data as PublicProfile;
    });
  } catch {
    return null;
  }
}

export function updateMyPublicProfile(data: PublicProfilePayload): Promise<PublicProfile> {
  return authedApiRequest("/profile/me", {
    method: "PUT",
    body: JSON.stringify(validateProfilePayload(data)),
  });
}
