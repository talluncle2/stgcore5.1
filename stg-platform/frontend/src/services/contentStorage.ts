const PREFIX = "stg_content_";

export function readContent<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(`${PREFIX}${key}`);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function writeContent<T>(key: string, items: T[]): T[] {
  localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(items));
  return items;
}

export function upsertContent<T extends { id: string; createdAt?: string; updatedAt?: string }>(
  key: string,
  fallback: T[],
  payload: Partial<T> & { id?: string }
): T {
  const now = new Date().toISOString();
  const items = readContent<T>(key, fallback);
  const id = payload.id || `${key}-${Date.now()}`;
  const existing = items.find((item) => item.id === id);
  const next = {
    ...(existing || {}),
    ...payload,
    id,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  } as T;

  writeContent(
    key,
    existing ? items.map((item) => (item.id === id ? next : item)) : [next, ...items]
  );

  return next;
}

export function deleteContent<T extends { id: string }>(key: string, fallback: T[], id: string): void {
  writeContent(
    key,
    readContent<T>(key, fallback).filter((item) => item.id !== id)
  );
}
