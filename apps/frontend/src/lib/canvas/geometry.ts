import type { Point } from "@repo/common";
import type { Camera, CanvasShape, LineData, RectData, Stroke, TextData } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readNumber(
  value: Record<string, unknown>,
  key: string,
): number | null {
  const candidate = value[key];
  if (typeof candidate !== "number" || !Number.isFinite(candidate)) {
    return null;
  }
  return candidate;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/** Shortest distance from `point` to the segment `a`–`b`. */
export function distanceToSegment(point: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) return distance(point, a);

  const t = clamp(
    ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared,
    0,
    1,
  );

  return distance(point, { x: a.x + t * dx, y: a.y + t * dy });
}

/**
 * Object-eraser hit testing. `tolerance` is in world units and expands the
 * effective stroke so erasing still feels accurate when zoomed out.
 */
export function strokeHitByPoint(
  stroke: Stroke,
  point: Point,
  tolerance: number,
): boolean {
  const radius = stroke.width / 2 + tolerance;
  const points = stroke.points;
  const ox = stroke.offsetX;
  const oy = stroke.offsetY;

  if (points.length === 0) return false;
  if (points.length === 1)
    return distance({ x: points[0].x + ox, y: points[0].y + oy }, point) <= radius;

  for (let index = 1; index < points.length; index += 1) {
    const a = { x: points[index - 1].x + ox, y: points[index - 1].y + oy };
    const b = { x: points[index].x + ox, y: points[index].y + oy };
    if (distanceToSegment(point, a, b) <= radius) {
      return true;
    }
  }

  return false;
}

export function shapeHitByPoint(
  shape: CanvasShape,
  point: Point,
  tolerance: number,
): boolean {
  const radius = shape.strokeWidth / 2 + tolerance;

  if (shape.type === "LINE") {
    return (
      distanceToSegment(
        point,
        { x: shape.data.x1, y: shape.data.y1 },
        { x: shape.data.x2, y: shape.data.y2 },
      ) <= radius
    );
  }

  if (shape.type === "TEXT") {
    const { x, y, width = 200, height = shape.data.fontSize * 1.4 } = shape.data;
    return (
      point.x >= x - tolerance &&
      point.x <= x + width + tolerance &&
      point.y >= y - tolerance &&
      point.y <= y + height + tolerance
    );
  }

  const { x, y, width, height } = shape.data;

  if (shape.type === "RECTANGLE") {
    const corners = [
      { x, y },
      { x: x + width, y },
      { x: x + width, y: y + height },
      { x, y: y + height },
    ];

    for (let index = 0; index < corners.length; index += 1) {
      const next = corners[(index + 1) % corners.length];
      if (distanceToSegment(point, corners[index], next) <= radius) {
        return true;
      }
    }

    return false;
  }

  // Ellipse: compare the normalised radius against the stroke band.
  const rx = width / 2;
  const ry = height / 2;
  if (rx <= 0 || ry <= 0) return false;

  const nx = (point.x - (x + rx)) / rx;
  const ny = (point.y - (y + ry)) / ry;
  const normalised = Math.hypot(nx, ny);

  if (normalised === 0) return false;

  const distanceFromEdge = Math.abs(normalised - 1) * Math.min(rx, ry);
  return distanceFromEdge <= radius;
}

/** Normalises a drag so rectangles grow in any direction. */
export function rectFromPoints(start: Point, end: Point): RectData {
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  };
}

export function lineFromPoints(start: Point, end: Point): LineData {
  return { x1: start.x, y1: start.y, x2: end.x, y2: end.y };
}

export function parseRectData(value: unknown): RectData | null {
  if (!isRecord(value)) return null;

  const x = readNumber(value, "x");
  const y = readNumber(value, "y");
  const width = readNumber(value, "width");
  const height = readNumber(value, "height");

  if (x === null || y === null || width === null || height === null) {
    return null;
  }

  return { x, y, width, height };
}

export function parseLineData(value: unknown): LineData | null {
  if (!isRecord(value)) return null;

  const x1 = readNumber(value, "x1");
  const y1 = readNumber(value, "y1");
  const x2 = readNumber(value, "x2");
  const y2 = readNumber(value, "y2");

  if (x1 === null || y1 === null || x2 === null || y2 === null) {
    return null;
  }

  return { x1, y1, x2, y2 };
}

export function parsePoints(value: unknown): Point[] | null {
  if (!Array.isArray(value)) return null;

  const points: Point[] = [];

  for (const entry of value) {
    if (!isRecord(entry)) return null;

    const x = readNumber(entry, "x");
    const y = readNumber(entry, "y");

    if (x === null || y === null) return null;

    points.push({ x, y });
  }

  return points;
}

export function parseTextData(value: unknown): TextData | null {
  if (!isRecord(value)) return null;

  const x = readNumber(value, "x");
  const y = readNumber(value, "y");
  const fontSize = readNumber(value, "fontSize");

  if (x === null || y === null || fontSize === null) return null;

  const text = typeof value["text"] === "string" ? value["text"] : "";
  const width =
    typeof value["width"] === "number" ? value["width"] : undefined;
  const height =
    typeof value["height"] === "number" ? value["height"] : undefined;

  return { x, y, text, fontSize, width, height };
}

/** Returns the axis-aligned bounding box of a stroke in world coordinates (accounting for offset). */
export function strokeBoundingBox(stroke: Stroke): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const ox = stroke.offsetX;
  const oy = stroke.offsetY;
  if (stroke.points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  for (const p of stroke.points) {
    if (p.x + ox < minX) minX = p.x + ox;
    if (p.y + oy < minY) minY = p.y + oy;
    if (p.x + ox > maxX) maxX = p.x + ox;
    if (p.y + oy > maxY) maxY = p.y + oy;
  }

  const pad = stroke.width / 2;
  return {
    x: minX - pad,
    y: minY - pad,
    width: maxX - minX + stroke.width,
    height: maxY - minY + stroke.width,
  };
}

/** Returns the axis-aligned bounding box of a shape in world coordinates. */
export function shapeBoundingBox(shape: CanvasShape): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  if (shape.type === "LINE") {
    const minX = Math.min(shape.data.x1, shape.data.x2);
    const minY = Math.min(shape.data.y1, shape.data.y2);
    const maxX = Math.max(shape.data.x1, shape.data.x2);
    const maxY = Math.max(shape.data.y1, shape.data.y2);
    const pad = shape.strokeWidth / 2;
    return {
      x: minX - pad,
      y: minY - pad,
      width: maxX - minX + shape.strokeWidth,
      height: maxY - minY + shape.strokeWidth,
    };
  }
  if (shape.type === "TEXT") {
    const { x, y, width = 200, height = shape.data.fontSize * 1.4 } = shape.data;
    return { x, y, width, height };
  }
  return {
    x: shape.data.x,
    y: shape.data.y,
    width: shape.data.width,
    height: shape.data.height,
  };
}

/**
 * Server stroke rows use their own UUID, while live broadcasts use the
 * client-generated stroke id. Content signatures let a reconnect merge the
 * persisted snapshot without duplicating strokes created during the session.
 */
export function strokeSignature(stroke: Stroke): string {
  const first = stroke.points[0];
  const last = stroke.points[stroke.points.length - 1];

  return [
    stroke.createdById,
    stroke.color,
    stroke.width,
    stroke.points.length,
    first ? `${first.x},${first.y}` : "",
    last ? `${last.x},${last.y}` : "",
  ].join("|");
}

/**
 * Server-assigned shape ids differ from the optimistic local ids, so the
 * persisted echo is matched by content instead.
 */
export function shapeSignature(shape: CanvasShape): string {
  const geometry =
    shape.type === "LINE"
      ? [shape.data.x1, shape.data.y1, shape.data.x2, shape.data.y2]
      : [shape.data.x, shape.data.y, shape.data.width, shape.data.height];

  return [
    shape.type,
    shape.createdById,
    shape.color,
    shape.strokeWidth,
    ...geometry,
  ].join("|");
}

export function screenToWorld(
  screenX: number,
  screenY: number,
  camera: Camera,
): Point {
  return {
    x: (screenX - camera.x) / camera.scale,
    y: (screenY - camera.y) / camera.scale,
  };
}

/**
 * Zooms around a fixed screen-space anchor so the point under the cursor stays
 * put. Returns the updated camera.
 */
export function zoomCameraAt(
  camera: Camera,
  nextScale: number,
  anchorX: number,
  anchorY: number,
): Camera {
  const worldX = (anchorX - camera.x) / camera.scale;
  const worldY = (anchorY - camera.y) / camera.scale;

  return {
    scale: nextScale,
    x: anchorX - worldX * nextScale,
    y: anchorY - worldY * nextScale,
  };
}
