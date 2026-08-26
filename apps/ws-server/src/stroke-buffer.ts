import { Point } from "@repo/common";

interface ActiveStroke {
  roomId: string;
  createdById: string;
  color: string;
  width: number;
  points: Point[];
}

const activeStrokes = new Map<string, ActiveStroke>();

export function startStroke(
  strokeId: string,
  roomId: string,
  createdById: string,
  color: string,
  width: number,
  startPoint: Point
): void {
  activeStrokes.set(strokeId, {
    roomId,
    createdById,
    color,
    width,
    points: [startPoint],
  });
}

export function appendStrokePoints(strokeId: string, points: Point[]): void {
  const stroke = activeStrokes.get(strokeId);
  if (!stroke) return;
  stroke.points.push(...points);
}

export function endStroke(strokeId: string): ActiveStroke | undefined {
  const stroke = activeStrokes.get(strokeId);
  activeStrokes.delete(strokeId);
  return stroke;
}