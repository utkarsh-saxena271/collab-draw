import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function Spinner({
  className,
  label = "Loading",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span role="status" className="inline-flex items-center justify-center">
      <LoaderCircle
        aria-hidden="true"
        className={cn("h-5 w-5 animate-spin", className)}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function PageLoader({
  message = "Loading your workspace…",
}: {
  message?: string;
}) {
  return (
    <div className="flex min-h-[60vh] flex-1 items-center justify-center px-6 py-16">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
          <LoaderCircle className="h-6 w-6 animate-spin" />
        </span>
        <p className="text-sm font-medium text-gray-500">{message}</p>
      </div>
    </div>
  );
}

export function FullPageLoader({
  message = "Loading…",
}: {
  message?: string;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#faf9f6] px-6">
      <PageLoader message={message} />
    </div>
  );
}
