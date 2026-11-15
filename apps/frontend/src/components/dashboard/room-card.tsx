import Link from "next/link";
import { ArrowUpRight, Crown, Trash2, Users } from "lucide-react";
import type { RoomSummary } from "@/types/api";
import { formatDate } from "@/lib/utils/format";

function visualVariant(slug: string): number {
  return (
    Array.from(slug).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 3
  );
}

function RoomPreview({ variant }: { variant: number }) {
  return (
    <div
      className="relative h-28 overflow-hidden bg-[#fbfaf7]"
      style={{
        backgroundImage:
          "radial-gradient(circle, rgba(120,113,108,0.18) 1px, transparent 1px)",
        backgroundSize: "16px 16px",
      }}
    >
      <svg
        viewBox="0 0 360 120"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        {variant === 0 ? (
          <>
            <rect
              x="38"
              y="26"
              width="92"
              height="58"
              rx="10"
              fill="#fff7ed"
              stroke="#f59e0b"
              strokeWidth="2.5"
            />
            <path
              d="M168 82 C 196 44, 222 96, 250 60 S 300 52, 326 78"
              fill="none"
              stroke="#7c3aed"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <circle cx="278" cy="32" r="14" fill="#ddd6fe" />
          </>
        ) : null}

        {variant === 1 ? (
          <>
            <ellipse
              cx="104"
              cy="58"
              rx="56"
              ry="34"
              fill="#eff6ff"
              stroke="#3b82f6"
              strokeWidth="2.5"
            />
            <line
              x1="190"
              y1="32"
              x2="314"
              y2="86"
              stroke="#10b981"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle
              cx="190"
              cy="32"
              r="4"
              fill="#fff"
              stroke="#10b981"
              strokeWidth="2"
            />
            <circle
              cx="314"
              cy="86"
              r="4"
              fill="#fff"
              stroke="#10b981"
              strokeWidth="2"
            />
          </>
        ) : null}

        {variant === 2 ? (
          <>
            <path
              d="M40 78 C 74 34, 100 92, 136 50 S 194 32, 224 70"
              fill="none"
              stroke="#7c3aed"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <rect
              x="244"
              y="28"
              width="76"
              height="58"
              rx="14"
              fill="#fdf2f8"
              stroke="#ec4899"
              strokeWidth="2.5"
            />
            <path
              d="M262 46 h40 M262 58 h30 M262 70 h24"
              stroke="#f9a8d4"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </>
        ) : null}
      </svg>
    </div>
  );
}

export function RoomCard({
  room,
  isOwner,
  onDelete,
}: {
  room: RoomSummary;
  isOwner: boolean;
  onDelete?: (room: RoomSummary) => void;
}) {
  const name = room.name?.trim() || "Untitled canvas";

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-violet-300 hover:shadow-xl hover:shadow-violet-100/60">
      <Link
        href={`/canvas/${room.slug}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf9f6]"
      >
        <RoomPreview variant={visualVariant(room.slug)} />

        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-base font-bold text-gray-900">
                {name}
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Created {formatDate(room.createdAt)}
              </p>
            </div>

            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-400 transition group-hover:bg-violet-600 group-hover:text-white">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <span
              className={
                isOwner
                  ? "inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700"
                  : "inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700"
              }
            >
              {isOwner ? (
                <Crown className="h-3 w-3" />
              ) : (
                <Users className="h-3 w-3" />
              )}
              {isOwner ? "Owner" : "Shared with you"}
            </span>

            <span className="truncate text-[11px] font-medium text-gray-400">
              /{room.slug}
            </span>
          </div>
        </div>
      </Link>

      {isOwner && onDelete ? (
        <button
          type="button"
          onClick={() => onDelete(room)}
          aria-label={`Delete ${name}`}
          title="Delete canvas"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200/80 bg-white/90 text-gray-500 shadow-sm backdrop-blur transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
