"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Circle,
  Eraser,
  Hand,
  Minus,
  MousePointer2,
  Pencil,
  Square,
  Type,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  DRAWING_COLORS,
  STROKE_WIDTHS,
  TEXT_FONT_SIZES,
  type CanvasTool,
} from "@/lib/canvas/types";

const TOOLS: Array<{
  id: CanvasTool;
  label: string;
  shortcut: string;
  icon: typeof Pencil;
}> = [
  { id: "select", label: "Select", shortcut: "V", icon: MousePointer2 },
  { id: "hand", label: "Pan", shortcut: "H", icon: Hand },
  { id: "pencil", label: "Pencil", shortcut: "P", icon: Pencil },
  { id: "rectangle", label: "Rectangle", shortcut: "R", icon: Square },
  { id: "ellipse", label: "Ellipse", shortcut: "O", icon: Circle },
  { id: "line", label: "Line", shortcut: "L", icon: Minus },
  { id: "text", label: "Text", shortcut: "T", icon: Type },
  { id: "eraser", label: "Eraser", shortcut: "E", icon: Eraser },
];

const COLOR_NAMES = [
  "Indigo",
  "Violet",
  "Pink",
  "Red",
  "Orange",
  "Teal",
  "Blue",
  "Charcoal",
];

/** Tools that support stroke width */
const STROKE_WIDTH_TOOLS: CanvasTool[] = ["pencil", "rectangle", "ellipse", "line", "eraser"];
/** Tools that support font size */
const FONT_SIZE_TOOLS: CanvasTool[] = ["text"];

interface CanvasToolbarProps {
  tool: CanvasTool;
  onToolChange: (tool: CanvasTool) => void;
  color: string;
  onColorChange: (color: string) => void;
  strokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
}

export function CanvasToolbar({
  tool,
  onToolChange,
  color,
  onColorChange,
  strokeWidth,
  onStrokeWidthChange,
  fontSize,
  onFontSizeChange,
}: CanvasToolbarProps) {
  const [panel, setPanel] = useState<"color" | "width" | "fontsize" | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const showColor = !["select", "hand", "eraser"].includes(tool);
  const showStrokeWidth = STROKE_WIDTH_TOOLS.includes(tool);
  const showFontSize = FONT_SIZE_TOOLS.includes(tool);

  useEffect(() => {
    if (!panel) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setPanel(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPanel(null);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [panel]);

  return (
    <div
      ref={rootRef}
      className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 sm:bottom-6"
    >
      <div className="flex items-center gap-1 rounded-2xl border border-gray-200/90 bg-white/95 p-1.5 shadow-xl shadow-gray-900/10 backdrop-blur">
        {TOOLS.map((entry) => {
          const Icon = entry.icon;
          const active = tool === entry.id;

          return (
            <button
              key={entry.id}
              type="button"
              aria-label={`${entry.label} tool`}
              aria-pressed={active}
              title={`${entry.label} (${entry.shortcut})`}
              onClick={() => {
                setPanel(null);
                onToolChange(entry.id);
              }}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
                active
                  ? "bg-violet-600 text-white shadow-sm shadow-violet-200"
                  : "text-gray-500 hover:bg-violet-50 hover:text-violet-700",
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={2} />
            </button>
          );
        })}

        {showColor && (
          <>
            <span className="mx-1 h-6 w-px bg-gray-200" aria-hidden="true" />

            <div className="relative">
              <button
                type="button"
                aria-label="Stroke colour"
                aria-expanded={panel === "color"}
                aria-haspopup="true"
                title="Colour"
                onClick={() =>
                  setPanel((current) => (current === "color" ? null : "color"))
                }
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
                  panel === "color" && "bg-gray-100",
                )}
              >
                <span
                  className="h-5 w-5 rounded-full ring-2 ring-white ring-offset-1 ring-offset-gray-200"
                  style={{ backgroundColor: color }}
                />
                <ChevronDown className="ml-0.5 h-3 w-3 text-gray-400" />
              </button>

              {panel === "color" ? (
                <div className="absolute bottom-full left-1/2 mb-3 w-60 -translate-x-1/2 rounded-2xl border border-gray-200 bg-white p-3 shadow-xl shadow-gray-900/10">
                  <div className="flex items-center justify-between px-0.5 pb-2">
                    <span className="text-xs font-semibold text-gray-600">
                      Ink colour
                    </span>
                    <span className="font-mono text-[11px] uppercase tracking-wide text-gray-400">
                      {color}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {DRAWING_COLORS.map((swatch, index) => {
                      const selected = color.toLowerCase() === swatch.toLowerCase();

                      return (
                        <button
                          key={swatch}
                          type="button"
                          aria-label={`${COLOR_NAMES[index] ?? "Colour"} ink`}
                          aria-pressed={selected}
                          title={COLOR_NAMES[index]}
                          onClick={() => {
                            onColorChange(swatch);
                            setPanel(null);
                          }}
                          className={cn(
                            "flex h-9 w-full items-center justify-center rounded-xl transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2",
                            selected
                              ? "ring-2 ring-gray-900 ring-offset-2"
                              : "ring-1 ring-black/5",
                          )}
                          style={{ backgroundColor: swatch }}
                        >
                          {selected ? (
                            <Check
                              className="h-4 w-4 text-white drop-shadow-sm"
                              strokeWidth={3}
                            />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>

                  <label className="mt-3 flex cursor-pointer items-center gap-2.5 rounded-xl border border-gray-200 px-2.5 py-2 transition hover:border-violet-200 hover:bg-violet-50/50 focus-within:ring-2 focus-within:ring-violet-500 focus-within:ring-offset-2">
                    <span
                      className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg ring-1 ring-black/10"
                      style={{ backgroundColor: color }}
                    >
                      <input
                        type="color"
                        value={color}
                        aria-label="Custom ink colour"
                        onChange={(event) => onColorChange(event.target.value)}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold text-gray-700">
                        Custom colour
                      </span>
                      <span className="block font-mono text-[10px] uppercase tracking-wide text-gray-400">
                        {color}
                      </span>
                    </span>
                  </label>
                </div>
              ) : null}
            </div>
          </>
        )}

        {showStrokeWidth && (
          <div className="relative">
            <button
              type="button"
              aria-label="Stroke width"
              aria-expanded={panel === "width"}
              aria-haspopup="true"
              title="Stroke width"
              onClick={() =>
                setPanel((current) => (current === "width" ? null : "width"))
              }
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
                panel === "width" && "bg-gray-100",
              )}
            >
              <span
                className="rounded-full"
                style={{
                  backgroundColor: color,
                  width: `${Math.min(strokeWidth * 2, 18)}px`,
                  height: `${Math.min(strokeWidth * 2, 18)}px`,
                }}
              />
              <ChevronDown className="ml-0.5 h-3 w-3 text-gray-400" />
            </button>

            {panel === "width" ? (
              <div className="absolute bottom-full left-1/2 mb-3 flex -translate-x-1/2 items-center gap-1 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl shadow-gray-900/10">
                {STROKE_WIDTHS.map((width) => (
                  <button
                    key={width}
                    type="button"
                    aria-label={`${width} pixel stroke`}
                    aria-pressed={strokeWidth === width}
                    onClick={() => {
                      onStrokeWidthChange(width);
                      setPanel(null);
                    }}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
                      strokeWidth === width
                        ? "bg-violet-50 ring-1 ring-violet-200"
                        : "hover:bg-gray-100",
                    )}
                  >
                    <span
                      className="rounded-full"
                      style={{
                        backgroundColor:
                          strokeWidth === width ? "#7c3aed" : "#9ca3af",
                        width: `${Math.min(width * 2, 18)}px`,
                        height: `${Math.min(width * 2, 18)}px`,
                      }}
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        )}

        {showFontSize && (
          <div className="relative">
            <button
              type="button"
              aria-label="Font size"
              aria-expanded={panel === "fontsize"}
              aria-haspopup="true"
              title="Font size"
              onClick={() =>
                setPanel((current) => (current === "fontsize" ? null : "fontsize"))
              }
              className={cn(
                "flex h-9 items-center gap-1 rounded-xl px-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
                panel === "fontsize" && "bg-gray-100",
              )}
            >
              {fontSize}px
              <ChevronDown className="h-3 w-3 text-gray-400" />
            </button>

            {panel === "fontsize" ? (
              <div className="absolute bottom-full left-1/2 mb-3 flex -translate-x-1/2 flex-col gap-1 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl shadow-gray-900/10">
                {TEXT_FONT_SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    aria-label={`${size}px font size`}
                    aria-pressed={fontSize === size}
                    onClick={() => {
                      onFontSizeChange(size);
                      setPanel(null);
                    }}
                    className={cn(
                      "flex h-8 w-16 items-center justify-center rounded-xl text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
                      fontSize === size
                        ? "bg-violet-50 text-violet-700 ring-1 ring-violet-200"
                        : "text-gray-600 hover:bg-gray-100",
                    )}
                  >
                    {size}px
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
