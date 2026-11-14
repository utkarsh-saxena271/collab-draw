"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { FullPageLoader } from "@/components/ui/spinner";

/**
 * Client-side route guard. Authentication state is backed by the validated
 * session in AuthProvider, not just the presence of a localStorage token.
 */
export function RequireAuth({
  children,
  message,
}: {
  children: ReactNode;
  message?: string;
}) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status !== "unauthenticated") return;

    const target = `${window.location.pathname}${window.location.search}`;
    router.replace(`/signin?next=${encodeURIComponent(target)}`);
  }, [status, router]);

  if (status === "authenticated") {
    return <>{children}</>;
  }

  return (
    <FullPageLoader
      message={
        status === "loading"
          ? (message ?? "Checking your session…")
          : "Taking you to sign in…"
      }
    />
  );
}
