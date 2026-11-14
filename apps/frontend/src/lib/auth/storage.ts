import type { AuthUser } from "@/types/api";

const TOKEN_KEY = "collabdraw.token";
const USER_KEY = "collabdraw.user";

export interface StoredSession {
  token: string;
  user: AuthUser;
}

function isAuthUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.email === "string" &&
    typeof candidate.name === "string" &&
    (candidate.createdAt === undefined || typeof candidate.createdAt === "string")
  );
}

export function getStoredSession(): StoredSession | null {
  if (typeof window === "undefined") return null;

  try {
    const token = window.localStorage.getItem(TOKEN_KEY);
    const rawUser = window.localStorage.getItem(USER_KEY);

    if (!token || !rawUser) return null;

    const user: unknown = JSON.parse(rawUser);
    if (!isAuthUser(user)) return null;

    return { token, user };
  } catch {
    return null;
  }
}

export function storeSession(session: StoredSession): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(TOKEN_KEY, session.token);
    window.localStorage.setItem(USER_KEY, JSON.stringify(session.user));
  } catch {
    // Storage can be unavailable (private mode, quota). The in-memory auth
    // state still works for the current page session.
  }
}

export function clearStoredSession(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
  } catch {
    // Ignore storage failures.
  }
}
