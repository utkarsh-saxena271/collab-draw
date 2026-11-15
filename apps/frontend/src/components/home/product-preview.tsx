import {
  Circle,
  MousePointer2,
  Pencil,
  Slash,
  Square,
  Share2,
  Sparkles,
} from "lucide-react";

const toolbarItems = [
  { icon: MousePointer2, active: false },
  { icon: Pencil, active: true },
  { icon: Square, active: false },
  { icon: Circle, active: false },
  { icon: Slash, active: false },
];

/**
 * Decorative, non-interactive preview of the real editor. It intentionally uses
 * spans instead of buttons so nothing looks clickable when it is not.
 */
export function ProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <div className="absolute -inset-5 rounded-[2rem] bg-gradient-to-tr from-violet-200/70 via-transparent to-amber-100/70 blur-2xl" />

      <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-2xl shadow-violet-200/50">
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex gap-1.5" aria-hidden="true">
              <span className="h-2.5 w-2.5 rounded-full bg-[#fca5a5]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#fcd34d]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#86efac]" />
            </span>
            <span className="ml-1 truncate rounded-md bg-gray-50 px-2 py-1 text-[11px] font-semibold text-gray-600">
              Q3 product jam
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Live
            </span>
            <span className="flex -space-x-1.5" aria-hidden="true">
              <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-fuchsia-200 text-[9px] font-bold text-fuchsia-800">
                MA
              </span>
              <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-violet-200 text-[9px] font-bold text-violet-800">
                LE
              </span>
              <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-amber-200 text-[9px] font-bold text-amber-800">
                +2
              </span>
            </span>
            <span className="hidden items-center gap-1.5 rounded-lg bg-violet-600 px-2.5 py-1.5 text-[11px] font-semibold text-white sm:flex">
              <Share2 className="h-3 w-3" />
              Share
            </span>
          </div>
        </div>

        <div
          className="relative aspect-[16/10] overflow-hidden bg-[#fbfaf7]"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(120,113,108,0.22) 1px, transparent 1px)",
            backgroundSize: "19px 19px",
          }}
        >
          <div className="absolute left-3 top-3 z-10 flex flex-col gap-1 rounded-xl border border-gray-200 bg-white/95 p-1.5 shadow-sm backdrop-blur">
            {toolbarItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <span
                  key={index}
                  aria-hidden="true"
                  className={
                    item.active
                      ? "flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600 text-white"
                      : "flex h-7 w-7 items-center justify-center rounded-lg text-gray-400"
                  }
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                </span>
              );
            })}
          </div>

          <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2 rounded-xl border border-gray-200 bg-white/95 px-2.5 py-1.5 text-[10px] font-semibold text-gray-600 shadow-sm backdrop-blur">
            <span className="h-3 w-3 rounded-full bg-violet-500" />
            <span className="h-3.5 w-3.5 rounded-full bg-amber-400" />
            <span className="h-4 w-4 rounded-full bg-sky-500" />
            <span className="ml-1 h-1.5 w-10 rounded-full bg-gray-200" />
            <span className="h-3 w-3 rounded-full bg-gray-800" />
          </div>

          <svg
            viewBox="0 0 800 500"
            className="absolute inset-0 h-full w-full"
            role="img"
            aria-label="Preview of a shared canvas with sketches, shapes and live collaborators"
          >
            <defs>
              <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow
                  dx="0"
                  dy="3"
                  stdDeviation="3"
                  floodColor="#78716c"
                  floodOpacity="0.12"
                />
              </filter>
            </defs>

            {/* Sticky note */}
            <g filter="url(#soft-shadow)">
              <rect
                x="595"
                y="298"
                width="128"
                height="104"
                rx="8"
                fill="#fef3c7"
                stroke="#fcd34d"
                strokeWidth="1.5"
              />
              <path d="M595 318 h128" stroke="#fbbf24" strokeWidth="1.5" />
              <rect x="612" y="334" width="78" height="5" rx="2.5" fill="#d97706" opacity="0.45" />
              <rect x="612" y="348" width="92" height="5" rx="2.5" fill="#d97706" opacity="0.3" />
              <rect x="612" y="362" width="62" height="5" rx="2.5" fill="#d97706" opacity="0.3" />
              <circle cx="700" cy="382" r="7" fill="#fbbf24" opacity="0.6" />
            </g>

            {/* Rectangle */}
            <rect
              x="118"
              y="104"
              width="176"
              height="116"
              rx="16"
              fill="#fff7ed"
              stroke="#f59e0b"
              strokeWidth="3.5"
            />
            <text x="138" y="152" fill="#b45309" fontSize="18" fontWeight="600">
              Problem
            </text>
            <rect x="138" y="166" width="92" height="6" rx="3" fill="#fcd34d" />
            <rect x="138" y="180" width="68" height="6" rx="3" fill="#fcd34d" opacity="0.65" />

            {/* Ellipse with selection handles */}
            <ellipse
              cx="580"
              cy="152"
              rx="96"
              ry="62"
              fill="#eff6ff"
              stroke="#3b82f6"
              strokeWidth="3.5"
            />
            <text x="536" y="159" fill="#1d4ed8" fontSize="18" fontWeight="600">
              Ideas
            </text>
            <rect
              x="470"
              y="76"
              width="220"
              height="152"
              rx="10"
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="1.5"
              strokeDasharray="7 5"
            />
            {[
              [470, 76],
              [690, 76],
              [470, 228],
              [690, 228],
            ].map(([cx, cy]) => (
              <rect
                key={`${cx}-${cy}`}
                x={cx - 4}
                y={cy - 4}
                width="8"
                height="8"
                rx="2"
                fill="#ffffff"
                stroke="#8b5cf6"
                strokeWidth="1.5"
              />
            ))}

            {/* Freehand strokes */}
            <path
              d="M128 322 C 156 284, 187 352, 216 315 S 272 286, 302 330 S 356 356, 388 310"
              fill="none"
              stroke="#7c3aed"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M142 366 C 176 342, 202 388, 232 360 S 278 342, 304 374"
              fill="none"
              stroke="#ec4899"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.75"
            />

            {/* Line tool result */}
            <line
              x1="420"
              y1="312"
              x2="545"
              y2="386"
              stroke="#10b981"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <circle cx="420" cy="312" r="5" fill="#ffffff" stroke="#10b981" strokeWidth="2.5" />
            <circle cx="545" cy="386" r="5" fill="#ffffff" stroke="#10b981" strokeWidth="2.5" />

            {/* Small labels */}
            <g transform="translate(118 258)">
              <rect width="86" height="26" rx="13" fill="#f5f3ff" stroke="#ddd6fe" />
              <text x="14" y="17" fill="#6d28d9" fontSize="12" fontWeight="600">
                brainstorm
              </text>
            </g>
            <g transform="translate(420 112)">
              <rect width="34" height="26" rx="8" fill="#ecfdf5" stroke="#a7f3d0" />
              <text x="10" y="17" fill="#047857" fontSize="12" fontWeight="700">
                ✓
              </text>
            </g>

            {/* Remote cursor */}
            <g transform="translate(512 244)">
              <path
                d="M0 0 L0 25 L7 18 L13 30 L19 27 L13 15 L23 14 Z"
                fill="#7c3aed"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
              <rect x="18" y="20" width="52" height="22" rx="6" fill="#7c3aed" />
              <text x="26" y="35" fill="#ffffff" fontSize="11" fontWeight="600">
                Maya
              </text>
            </g>

            {/* Second cursor */}
            <g transform="translate(300 418)">
              <path
                d="M0 0 L0 22 L6 16 L11 27 L17 24 L12 13 L20 12 Z"
                fill="#db2777"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
              <rect x="16" y="18" width="40" height="20" rx="6" fill="#db2777" />
              <text x="23" y="32" fill="#ffffff" fontSize="10" fontWeight="600">
                Leo
              </text>
            </g>

            {/* Little sparkle */}
            <g transform="translate(690 92)" fill="#a78bfa">
              <path d="M10 0 L12.4 7.6 L20 10 L12.4 12.4 L10 20 L7.6 12.4 L0 10 L7.6 7.6 Z" />
            </g>
          </svg>

          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full border border-gray-200 bg-white/95 px-3 py-1.5 text-[10px] font-medium text-gray-500 shadow-sm backdrop-blur">
            <Sparkles className="h-3 w-3 text-violet-500" />
            Everyone sees changes instantly
          </div>
        </div>
      </div>

      <div className="absolute -bottom-5 -left-4 hidden items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-lg shadow-gray-900/5 sm:flex">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span>
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            Canvas status
          </span>
          <span className="block text-xs font-semibold text-gray-700">
            All changes saved
          </span>
        </span>
      </div>

      <div className="absolute -right-3 top-20 hidden items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-lg shadow-gray-900/5 md:flex">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-fuchsia-100 text-[10px] font-bold text-fuchsia-700">
          MA
        </span>
        <span>
          <span className="block text-xs font-semibold text-gray-800">
            Maya joined
          </span>
          <span className="block text-[10px] text-gray-400">Drawing now</span>
        </span>
      </div>
    </div>
  );
}
