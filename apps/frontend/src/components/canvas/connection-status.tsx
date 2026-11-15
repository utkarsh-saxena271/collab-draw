"use client";

import { RefreshCw } from "lucide-react";
import type { RoomConnectionStatus } from "@/hooks/use-room-socket";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils/cn";

function statusCopy(status: RoomConnectionStatus): {
  label: string;
  tone: "live" | "pending" | "offline";
} {
  switch (status) {
    case "joined":
      return { label: "Live", tone: "live" };
    case "connecting":
    case "authenticating":
    case "joining":
      return { label: "Connecting", tone: "pending" };
    case "reconnecting":
      return { label: "Reconnecting", tone: "pending" };
    case "error":
      return { label: "Offline", tone: "offline" };
    default:
      return { label: "Offline", tone: "offline" };
  }
}

export function ConnectionStatus({
  status,
  error,
  onRetry,
}: {
  status: RoomConnectionStatus;
  error: string | null;
  onRetry: () => void;
}) {
  const { label, tone } = statusCopy(status);

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold",
        tone === "live" && "border-emerald-200 bg-emerald-50 text-emerald-700",
        tone === "pending" && "border-amber-200 bg-amber-50 text-amber-700",
        tone === "offline" && "border-red-200 bg-red-50 text-red-700"
      )}
      title={error ?? label}
    >
      {tone === "pending" ? (
        <Spinner className="h-3.5 w-3.5" label={label} />
      ) : (
        <span
          aria-hidden="true"
          className={cn(
            "h-2 w-2 rounded-full",
            tone === "live" ? "bg-emerald-500" : "bg-red-500"
          )}
        />
      )}
      <span className="hidden sm:inline">{label}</span>

      {status === "error" ? (
        <button
          type="button"
          onClick={onRetry}
          title="Retry connection"
          aria-label="Retry connection"
          className="rounded-full p-0.5 transition hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}
