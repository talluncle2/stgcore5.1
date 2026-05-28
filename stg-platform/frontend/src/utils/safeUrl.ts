const SAFE_URL_PROTOCOLS = new Set(["http:", "https:"]);

export function isSafePublicUrl(value: string | null | undefined): boolean {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return true;

  try {
    const url = new URL(trimmed);
    return SAFE_URL_PROTOCOLS.has(url.protocol);
  } catch {
    return false;
  }
}

export function assertSafePublicUrl(value: string | null | undefined, label: string): void {
  if (!isSafePublicUrl(value)) {
    throw new Error(`${label} precisa ser uma URL publica iniciada por https:// ou http://.`);
  }
}

export function sanitizeOptionalUrl(value: string | null | undefined): string | undefined {
  const trimmed = String(value ?? "").trim();
  return trimmed || undefined;
}
