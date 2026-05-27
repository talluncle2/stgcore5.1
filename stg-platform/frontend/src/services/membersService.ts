import { authedApiRequest } from "./api";
import { assertAdmin } from "./adminGuard";
import { AdminMember, AdminMemberPayload, AuthUser } from "../types/api";

function extractMembers(data: unknown): AdminMember[] {
  if (Array.isArray(data)) return data as AdminMember[];
  if (data && typeof data === "object" && Array.isArray((data as Record<string, unknown>).members)) {
    return (data as Record<string, unknown>).members as AdminMember[];
  }
  return [];
}

export async function getMembers(): Promise<AdminMember[]> {
  try {
    const data = await authedApiRequest<unknown>("/admin/members");
    return extractMembers(data);
  } catch {
    return [];
  }
}

export async function createMember(payload: AdminMemberPayload, currentUser: AuthUser | null): Promise<AdminMember> {
  assertAdmin(currentUser);
  return authedApiRequest<AdminMember>("/admin/members", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateMember(
  memberId: string | number,
  payload: AdminMemberPayload,
  currentUser: AuthUser | null
): Promise<AdminMember> {
  assertAdmin(currentUser);
  return authedApiRequest<AdminMember>(`/admin/members/${memberId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteMember(memberId: string | number, currentUser: AuthUser | null): Promise<void> {
  assertAdmin(currentUser);
  await authedApiRequest<void>(`/admin/members/${memberId}`, {
    method: "DELETE",
  });
}
