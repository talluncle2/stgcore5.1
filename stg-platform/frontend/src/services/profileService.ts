import { PublicProfile, PublicProfilePayload } from "../types/api";
import { assertSafePublicUrl, sanitizeOptionalUrl } from "../utils/safeUrl";
import { authedApiRequest } from "./api";

function assertSafeProfileImage(value: string | null | undefined, label: string): void {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return;
  if (trimmed.toLowerCase().startsWith("data:")) {
    throw new Error(`${label} precisa ser enviado pela API de upload antes de salvar o perfil.`);
  }
  assertSafePublicUrl(trimmed, label);
}

function validateProfilePayload(data: PublicProfilePayload): PublicProfilePayload {
  assertSafeProfileImage(data.public_avatar_url, "Avatar publico");
  assertSafeProfileImage(data.public_banner_url, "Banner publico");

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

export function uploadProfileImage(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  return authedApiRequest("/uploads/profile-image", {
    method: "POST",
    body: formData,
    headers: {},
  });
}

export function uploadBannerImage(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  return authedApiRequest("/uploads/banner-image", {
    method: "POST",
    body: formData,
    headers: {},
  });
}
