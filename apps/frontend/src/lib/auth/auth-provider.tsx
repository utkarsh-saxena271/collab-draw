"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { LoginInput, RegisterInput } from "@repo/common";
import { loginRequest, meRequest, signupRequest } from "@/lib/api/auth";
import { ApiError, AUTH_UNAUTHORIZED_EVENT } from "@/lib/api/client";
import type { AuthUser } from "@/types/api";
import { decodeAccessToken, isTokenExpired } from "./jwt";
import { clearStoredSession, getStoredSession, storeSession } from "./storage";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  token: string | null;
  signIn: (input: LoginInput) => Promise<void>;
  signUp: (input: RegisterInput) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function isProtectedPath(pathname: string): boolean {
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/canvas") ||
    pathname.startsWith("/invite")
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const clearAuth = useCallback(() => {
    clearStoredSession();
    setToken(null);
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const redirectToSignIn = useCallback(() => {
    if (typeof window === "undefined") return;

    const current = `${window.location.pathname}${window.location.search}`;

    if (current.startsWith("/signin") || current.startsWith("/signup")) {
      return;
    }

    if (isProtectedPath(window.location.pathname)) {
      router.replace(`/signin?next=${encodeURIComponent(current)}`);
    }
  }, [router]);

  // Restore and validate the session on every full page load. We do not trust
  // localStorage alone — the backend must confirm the token and user.
  useEffect(() => {
    let cancelled = false;
    const session = getStoredSession();

    if (!session || isTokenExpired(session.token)) {
      clearStoredSession();

      const timer = window.setTimeout(() => {
        if (!cancelled) setStatus("unauthenticated");
      }, 0);

      return () => window.clearTimeout(timer);
    }

    const restoreTimer = window.setTimeout(() => {
      if (cancelled) return;

      setToken(session.token);
      setUser(session.user);
    }, 0);

    void (async () => {
      try {
        const result = await meRequest(session.token);
        if (cancelled) return;

        window.clearTimeout(restoreTimer);
        storeSession({ token: session.token, user: result.user });
        setToken(session.token);
        setUser(result.user);
        setStatus("authenticated");
      } catch (error) {
        if (cancelled) return;

        if (
          error instanceof ApiError &&
          (error.status === 401 || error.status === 404)
        ) {
          window.clearTimeout(restoreTimer);
          clearAuth();
          return;
        }

        // Network / server outage: keep the cached session for offline
        // resilience. The next API call will invalidate it if it is truly bad.
        setStatus("authenticated");
      }
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(restoreTimer);
    };
  }, [clearAuth]);

  // The backend issues 15-minute access tokens with no refresh endpoint, so we
  // proactively end the client session when the token expires.
  useEffect(() => {
    if (!token) return;

    const payload = decodeAccessToken(token);
    if (!payload?.exp) return;

    const remainingMs = payload.exp * 1000 - Date.now();

    if (remainingMs <= 0) {
      const timer = window.setTimeout(() => {
        clearAuth();
        redirectToSignIn();
      }, 0);

      return () => window.clearTimeout(timer);
    }

    const timer = window.setTimeout(
      () => {
        clearAuth();
        redirectToSignIn();
      },
      Math.min(remainingMs, 2_147_483_000),
    );

    return () => window.clearTimeout(timer);
  }, [token, clearAuth, redirectToSignIn]);

  useEffect(() => {
    const handleUnauthorized = () => {
      clearAuth();
      redirectToSignIn();
    };

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    return () =>
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
  }, [clearAuth, redirectToSignIn]);

  const signIn = useCallback(async (input: LoginInput) => {
    const session = await loginRequest(input);
    storeSession(session);
    setToken(session.token);
    setUser(session.user);
    setStatus("authenticated");
  }, []);

  const signUp = useCallback(async (input: RegisterInput) => {
    const session = await signupRequest(input);
    storeSession(session);
    setToken(session.token);
    setUser(session.user);
    setStatus("authenticated");
  }, []);

  const signOut = useCallback(() => {
    clearAuth();
    router.replace("/signin");
  }, [clearAuth, router]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, token, signIn, signUp, signOut }),
    [status, user, token, signIn, signUp, signOut],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }

  return context;
}
