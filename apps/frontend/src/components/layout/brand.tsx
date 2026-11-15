import Link from "next/link";
import { PenLine } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const sizeClasses = {
  sm: { mark: "h-8 w-8 rounded-xl", icon: 16, text: "text-lg" },
  md: { mark: "h-9 w-9 rounded-xl", icon: 18, text: "text-xl" },
  lg: { mark: "h-11 w-11 rounded-2xl", icon: 22, text: "text-2xl" },
} as const;

export function Brand({
  href = "/",
  size = "md",
  tone = "default",
  className,
}: {
  href?: string;
  size?: keyof typeof sizeClasses;
  tone?: "default" | "light";
  className?: string;
}) {
  const styles = sizeClasses[size];

  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2.5 font-bold tracking-tight transition",
        tone === "light" ? "text-white" : "text-gray-900",
        className
      )}
    >
      <span
        className={cn(
          "flex items-center justify-center shadow-sm transition",
          tone === "light"
            ? "bg-white text-violet-700 shadow-black/10 group-hover:bg-violet-50"
            : "bg-violet-600 text-white shadow-violet-200 group-hover:bg-violet-700",
          styles.mark
        )}
      >
        <PenLine size={styles.icon} strokeWidth={2.4} />
      </span>
      <span className={styles.text}>
        Collab
        <span className={tone === "light" ? "text-violet-200" : "text-violet-600"}>
          Draw
        </span>
      </span>
    </Link>
  );
}
