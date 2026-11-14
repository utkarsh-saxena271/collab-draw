import type { Point, ServerMessage } from "@repo/common";

/**
 * The pencil produces freehand strokes. The remaining tools map directly to the
 * persisted `ShapeType` enum on the server.
 */
export type CanvasTool =
  | "select"
  | "hand"
  | "pencil"
  | "rectangle"
  | "ellipse"
  | "line"
  | "text"
  | "eraser";

export type ShapeTool = "rectangle" | "ellipse" | "line";

export interface Camera {
  /** Screen-space translation applied before scaling. */
  x: number;
  y: number;
  scale: number;
}

export interface RectData {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LineData {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface TextData {
  x: number;
  y: number;
  text: string;
  fontSize: number;
  /** Width of the text box — used for bounding-box hit testing. */
  width?: number;
  height?: number;
}

interface ShapeBase {
  id: string;
  color: string;
  strokeWidth: number;
  createdById: string;
}

export type CanvasShape =
  | (ShapeBase & { type: "RECTANGLE"; data: RectData })
  | (ShapeBase & { type: "ELLIPSE"; data: RectData })
  | (ShapeBase & { type: "LINE"; data: LineData })
  | (ShapeBase & { type: "TEXT"; data: TextData });

export interface Stroke {
  id: string;
  points: Point[];
  color: string;
  width: number;
  createdById: string;
  /** Applied offset from MOVE operations (world coordinates). */
  offsetX: number;
  offsetY: number;
}

export interface ShapeDraft {
  tool: ShapeTool;
  start: Point;
  current: Point;
  color: string;
  strokeWidth: number;
}

export type ShapeCreatedEvent = Extract<
  ServerMessage,
  { type: "SHAPE_CREATED" }
>;
export type StrokeStartedEvent = Extract<
  ServerMessage,
  { type: "STROKE_STARTED" }
>;
export type StrokePointsEvent = Extract<
  ServerMessage,
  { type: "STROKE_POINT_BROADCAST" }
>;
export type StrokeEndedEvent = Extract<ServerMessage, { type: "STROKE_ENDED" }>;
export type ElementsDeletedEvent = Extract<
  ServerMessage,
  { type: "ELEMENTS_DELETED" }
>;
export type ElementsMovedEvent = Extract<
  ServerMessage,
  { type: "ELEMENTS_MOVED" }
>;
export type CanvasClearedEvent = Extract<
  ServerMessage,
  { type: "CANVAS_CLEARED" }
>;

export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 4;

export const DRAWING_COLORS = [
  "#312e81",
  "#7c3aed",
  "#db2777",
  "#dc2626",
  "#ea580c",
  "#0d9488",
  "#0284c7",
  "#1f2937",
] as const;

export const STROKE_WIDTHS = [2, 4, 8] as const;

export const TEXT_FONT_SIZES = [14, 18, 24, 32, 48] as const;
