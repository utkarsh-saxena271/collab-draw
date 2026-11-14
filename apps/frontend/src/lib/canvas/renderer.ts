import { lineFromPoints, midpoint, rectFromPoints, shapeBoundingBox, strokeBoundingBox } from "./geometry";
import type { Camera, CanvasShape, ShapeDraft, Stroke } from "./types";

const PAPER_COLOR = "#fbfaf7";
const DOT_COLOR = "#e4e0d8";
const DRAFT_ID = "__draft__";
const SELECTION_COLOR = "rgba(109, 40, 217, 0.6)"; // violet-700/60
const SELECTION_FILL = "rgba(139, 92, 246, 0.07)";

interface RenderSceneInput {
  width: number;
  height: number;
  dpr: number;
  camera: Camera;
  strokes: Stroke[];
  localStroke: Stroke | null;
  shapes: CanvasShape[];
  remoteStrokes: Stroke[];
  draft: ShapeDraft | null;
  selectedShapeId: string | null;
  selectedStrokeId: string | null;
}

function drawPaper(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  camera: Camera,
) {
  ctx.fillStyle = PAPER_COLOR;
  ctx.fillRect(0, 0, width, height);

  const spacing = 26 * camera.scale;
  if (spacing < 11) return;

  const offsetX = ((camera.x % spacing) + spacing) % spacing;
  const offsetY = ((camera.y % spacing) + spacing) % spacing;

  ctx.fillStyle = DOT_COLOR;

  for (let x = offsetX; x < width; x += spacing) {
    for (let y = offsetY; y < height; y += spacing) {
      ctx.fillRect(x, y, 1.2, 1.2);
    }
  }
}

function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  const points = stroke.points;
  if (points.length === 0) return;

  const ox = stroke.offsetX;
  const oy = stroke.offsetY;

  ctx.strokeStyle = stroke.color;
  ctx.fillStyle = stroke.color;
  ctx.lineWidth = stroke.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (points.length === 1) {
    ctx.beginPath();
    ctx.arc(points[0].x + ox, points[0].y + oy, stroke.width / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  ctx.beginPath();
  ctx.moveTo(points[0].x + ox, points[0].y + oy);

  if (points.length === 2) {
    ctx.lineTo(points[1].x + ox, points[1].y + oy);
  } else {
    for (let index = 1; index < points.length - 1; index += 1) {
      const current = points[index];
      const nextPt = points[index + 1];
      const control = midpoint(current, nextPt);
      ctx.quadraticCurveTo(
        current.x + ox,
        current.y + oy,
        control.x + ox,
        control.y + oy,
      );
    }

    const last = points[points.length - 1];
    ctx.lineTo(last.x + ox, last.y + oy);
  }

  ctx.stroke();
}

function drawShape(ctx: CanvasRenderingContext2D, shape: CanvasShape) {
  ctx.strokeStyle = shape.color;
  ctx.fillStyle = shape.color;
  ctx.lineWidth = shape.strokeWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (shape.type === "LINE") {
    ctx.beginPath();
    ctx.moveTo(shape.data.x1, shape.data.y1);
    ctx.lineTo(shape.data.x2, shape.data.y2);
    ctx.stroke();
    return;
  }

  if (shape.type === "TEXT") {
    const { x, y, text, fontSize } = shape.data;
    if (!text) return;

    ctx.font = `${fontSize}px sans-serif`;
    ctx.textBaseline = "top";
    ctx.fillStyle = shape.color;

    const lines = text.split("\n");
    const lineHeight = fontSize * 1.4;
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], x, y + i * lineHeight);
    }
    return;
  }

  if (shape.type === "RECTANGLE") {
    ctx.strokeRect(
      shape.data.x,
      shape.data.y,
      shape.data.width,
      shape.data.height,
    );
    return;
  }

  const { x, y, width, height } = shape.data;
  if (width === 0 && height === 0) return;

  ctx.beginPath();
  ctx.ellipse(
    x + width / 2,
    y + height / 2,
    Math.max(width / 2, 0.01),
    Math.max(height / 2, 0.01),
    0,
    0,
    Math.PI * 2,
  );
  ctx.stroke();
}

function drawSelectionBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const pad = 6;
  ctx.save();
  ctx.strokeStyle = SELECTION_COLOR;
  ctx.fillStyle = SELECTION_FILL;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 3]);
  ctx.beginPath();
  ctx.rect(x - pad, y - pad, width + pad * 2, height + pad * 2);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function draftAsShape(draft: ShapeDraft): CanvasShape {
  const base = {
    id: DRAFT_ID,
    color: draft.color,
    strokeWidth: draft.strokeWidth,
    createdById: "",
  };

  if (draft.tool === "line") {
    return {
      ...base,
      type: "LINE",
      data: lineFromPoints(draft.start, draft.current),
    };
  }

  const rect = rectFromPoints(draft.start, draft.current);

  if (draft.tool === "rectangle") {
    return { ...base, type: "RECTANGLE", data: rect };
  }

  return { ...base, type: "ELLIPSE", data: rect };
}

export function renderScene(
  ctx: CanvasRenderingContext2D,
  input: RenderSceneInput,
) {
  const { width, height, dpr, camera } = input;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawPaper(ctx, width, height, camera);

  ctx.save();
  ctx.translate(camera.x, camera.y);
  ctx.scale(camera.scale, camera.scale);

  for (const stroke of input.strokes) {
    drawStroke(ctx, stroke);
    if (stroke.id === input.selectedStrokeId) {
      const bb = strokeBoundingBox(stroke);
      drawSelectionBox(ctx, bb.x, bb.y, bb.width, bb.height);
    }
  }

  // The in-progress local stroke lives outside the persisted map so the
  // pointer handlers can keep accumulating points into it.
  if (input.localStroke) {
    drawStroke(ctx, input.localStroke);
  }

  for (const stroke of input.remoteStrokes) {
    ctx.save();
    ctx.globalAlpha = 0.9;
    drawStroke(ctx, stroke);
    ctx.restore();
  }

  for (const shape of input.shapes) {
    drawShape(ctx, shape);
    if (shape.id === input.selectedShapeId) {
      const bb = shapeBoundingBox(shape);
      drawSelectionBox(ctx, bb.x, bb.y, bb.width, bb.height);
    }
  }

  if (input.draft) {
    ctx.save();
    ctx.globalAlpha = 0.65;
    ctx.setLineDash([8, 6]);
    drawShape(ctx, draftAsShape(input.draft));
    ctx.restore();
  }

  ctx.restore();
}
