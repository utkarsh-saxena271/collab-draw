"use client";

import { useSyncExternalStore } from "react";
import { getPostAuthPath } from "@/lib/auth/redirect";

// The value never changes during a session; we only need React to read the
// browser URL after hydration without an effect-driven state update.
const subscribe = () => () => {};
const getServerSnapshot = () => "/dashboard";

export function usePostAuthPath(): string {
  return useSyncExternalStore(
    subscribe,
    getPostAuthPath,
    getServerSnapshot
  );
}
