import type {
  ShapeDto,
  StrokeDto,
} from "@/types/api";
import type {
  CanvasShape,
  ShapeCreatedEvent,
  ShapeTool,
  Stroke,
  StrokeStartedEvent,
} from "./types";
import {
  lineFromPoints,
  parseLineData,
  parsePoints,
  parseRectData,
  parseTextData,
  rectFromPoints,
} from "./geometry";

export function shapeFromDto(dto: ShapeDto): CanvasShape | null {
  if (dto.type === "LINE") {
    const data = parseLineData(dto.data);
    if (!data) return null;

    return {
      id: dto.id,
      type: "LINE",
      data,
      color: dto.color,
      strokeWidth: dto.strokeWidth,
      createdById: dto.createdById,
    };
  }

  if (dto.type === "TEXT") {
    const data = parseTextData(dto.data);
    if (!data) return null;

    return {
      id: dto.id,
      type: "TEXT",
      data,
      color: dto.color,
      strokeWidth: dto.strokeWidth,
      createdById: dto.createdById,
    };
  }

  const data = parseRectData(dto.data);
  if (!data) return null;

  return {
    id: dto.id,
    type: dto.type as "RECTANGLE" | "ELLIPSE",
    data,
    color: dto.color,
    strokeWidth: dto.strokeWidth,
    createdById: dto.createdById,
  };
}

export function shapeFromEvent(event: ShapeCreatedEvent): CanvasShape | null {
  if (event.shapeType === "LINE") {
    const data = parseLineData(event.data);
    if (!data) return null;

    return {
      id: event.shapeId,
      type: "LINE",
      data,
      color: event.color,
      strokeWidth: event.strokeWidth,
      createdById: event.createdById,
    };
  }

  if (event.shapeType === "TEXT") {
    const data = parseTextData(event.data);
    if (!data) return null;

    return {
      id: event.shapeId,
      type: "TEXT",
      data,
      color: event.color,
      strokeWidth: event.strokeWidth,
      createdById: event.createdById,
    };
  }

  const data = parseRectData(event.data);
  if (!data) return null;

  return {
    id: event.shapeId,
    type: event.shapeType as "RECTANGLE" | "ELLIPSE",
    data,
    color: event.color,
    strokeWidth: event.strokeWidth,
    createdById: event.createdById,
  };
}

export function strokeFromDto(dto: StrokeDto): Stroke | null {
  const points = parsePoints(dto.points);
  if (!points) return null;

  return {
    id: dto.id,
    points,
    color: dto.color,
    width: dto.width,
    offsetX: dto.offsetX ?? 0,
    offsetY: dto.offsetY ?? 0,
    createdById: dto.createdById,
  };
}

export function strokeFromStartEvent(event: StrokeStartedEvent): Stroke {
  return {
    id: event.strokeId,
    points: [event.startPoint],
    color: event.color,
    width: event.width,
    offsetX: 0,
    offsetY: 0,
    createdById: event.createdById,
  };
}

/** Builds the JSON payload persisted for a shape tool. */
export function shapePayload(
  tool: ShapeTool,
  start: { x: number; y: number },
  end: { x: number; y: number }
): Record<string, number> {
  if (tool === "line") {
    const line = lineFromPoints(start, end);
    return { x1: line.x1, y1: line.y1, x2: line.x2, y2: line.y2 };
  }

  const rect = rectFromPoints(start, end);
  return {
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
  };
}
