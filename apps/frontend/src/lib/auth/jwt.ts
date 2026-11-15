import { AccessTokenPayloadSchema } from "@repo/common";

export interface DecodedAccessToken {
  userId: string;
  email: string;
  exp?: number;
}

function base64UrlToJson(value: string): unknown {
  if (typeof atob === "undefined") return null;

  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));

  return JSON.parse(new TextDecoder().decode(bytes));
}

/**
 * Reads the JWT payload without verifying the signature. The backend is still
 * the source of truth; this is only used to avoid sending an already-expired
 * token and to schedule the client-side session expiry.
 */
export function decodeAccessToken(token: string): DecodedAccessToken | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const raw = base64UrlToJson(parts[1]);

    if (!raw || typeof raw !== "object") return null;

    const parsed = AccessTokenPayloadSchema.safeParse(raw);
    if (!parsed.success) return null;

    const expValue = (raw as Record<string, unknown>).exp;
    const exp = typeof expValue === "number" ? expValue : undefined;

    return { ...parsed.data, exp };
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string, skewSeconds = 5): boolean {
  const payload = decodeAccessToken(token);
  if (!payload) return true;
  if (payload.exp === undefined) return false;

  return payload.exp * 1000 <= Date.now() + skewSeconds * 1000;
}
