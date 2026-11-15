"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import type { ClientMessage, Point, ShapeTypeEnum } from "@repo/common";
import type { ShapeDto, StrokeDto } from "@/types/api";
import {
  clamp,
  distance,
  lineFromPoints,
  parseTextData,
  rectFromPoints,
  screenToWorld,
  shapeBoundingBox,
  shapeHitByPoint,
  shapeSignature,
  strokeBoundingBox,
  strokeHitByPoint,
  strokeSignature,
  zoomCameraAt,
} from "@/lib/canvas/geometry";
import {
  shapeFromDto,
  shapeFromEvent,
  shapePayload,
  strokeFromDto,
  strokeFromStartEvent,
} from "@/lib/canvas/mapper";
import { renderScene } from "@/lib/canvas/renderer";
import {
  MAX_ZOOM,
  MIN_ZOOM,
  type Camera,
  type CanvasClearedEvent,
  type CanvasShape,
  type CanvasTool,
  type ElementsDeletedEvent,
  type ElementsMovedEvent,
  type ShapeCreatedEvent,
  type ShapeDraft,
  type ShapeTool,
  type Stroke,
  type StrokeEndedEvent,
  type StrokePointsEvent,
  type StrokeStartedEvent,
  type TextData,
} from "@/lib/canvas/types";
import { createId } from "@/lib/utils/id";

const SHAPE_TYPES: Record<ShapeTool, ShapeTypeEnum> = {
  rectangle: "RECTANGLE",
  ellipse: "ELLIPSE",
  line: "LINE",
};

const MIN_POINT_DISTANCE = 0.6;
const MIN_SHAPE_DRAG = 3;
/** Extra grab radius around an element, in screen pixels. */
const ERASER_TOLERANCE_PX = 8;
const SELECT_TOLERANCE_PX = 8;

interface EraseSession {
  pointerId: number;
  strokeIds: Set<string>;
  shapeIds: Set<string>;
  strokes: Map<string, Stroke>;
  shapes: Map<string, CanvasShape>;
}

interface PanState {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  cameraX: number;
  cameraY: number;
}

interface DragState {
  pointerId: number;
  startWorld: Point;
  lastWorld: Point;
  shapeId: string | null;
  strokeId: string | null;
}

export interface TextEditor {
  shapeId: string;
  x: number;
  y: number;
  screenX: number;
  screenY: number;
  initialText: string;
  color: string;
  fontSize: number;
}

interface UseCanvasEngineOptions {
  roomId: string;
  userId: string;
  tool: CanvasTool;
  color: string;
  strokeWidth: number;
  fontSize: number;
  enabled: boolean;
  send: (message: ClientMessage) => boolean;
  onTextEditorOpen: (editor: TextEditor) => void;
  onTextEditorClose: () => void;
  onActionError: (message: string) => void;
}

export interface CanvasEngine {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  containerRef: RefObject<HTMLDivElement | null>;
  scale: number;
  hasContent: boolean;
  selectedShapeId: string | null;
  selectedStrokeId: string | null;
  mergeScene: (strokes: StrokeDto[], shapes: ShapeDto[]) => void;
  applyShapeCreated: (event: ShapeCreatedEvent) => void;
  applyStrokeStarted: (event: StrokeStartedEvent) => void;
  applyStrokePoints: (event: StrokePointsEvent) => void;
  applyStrokeEnded: (event: StrokeEndedEvent) => void;
  applyElementsDeleted: (event: ElementsDeletedEvent) => void;
  applyElementsMoved: (event: ElementsMovedEvent) => void;
  applyCanvasCleared: (event: CanvasClearedEvent) => void;
  clearLocalScene: () => void;
  commitTextEdit: (
    shapeId: string,
    text: string,
    width?: number,
    height?: number,
  ) => boolean;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;

  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"].includes(target.tagName)
  );
}

export function useCanvasEngine({
  roomId,
  userId,
  tool,
  color,
  strokeWidth,
  fontSize,
  enabled,
  send,
  onTextEditorOpen,
  onTextEditorClose,
  onActionError,
}: UseCanvasEngineOptions): CanvasEngine {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [scale, setScale] = useState(1);
  const [hasContent, setHasContent] = useState(false);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [selectedStrokeId, setSelectedStrokeId] = useState<string | null>(null);

  const strokesRef = useRef<Map<string, Stroke>>(new Map());
  const shapesRef = useRef<Map<string, CanvasShape>>(new Map());
  const signaturesRef = useRef<Set<string>>(new Set());
  const shapeSignaturesRef = useRef<Set<string>>(new Set());
  const remoteDraftsRef = useRef<Map<string, Stroke>>(new Map());

  const localStrokeRef = useRef<Stroke | null>(null);
  const localStrokeIdsRef = useRef<Set<string>>(new Set());
  const draftRef = useRef<ShapeDraft | null>(null);
  const pendingPointsRef = useRef<Point[]>([]);
  const flushFrameRef = useRef<number | null>(null);
  const renderFrameRef = useRef<number | null>(null);
  const eraseSessionRef = useRef<EraseSession | null>(null);
  const dragRef = useRef<DragState | null>(null);

  const cameraRef = useRef<Camera>({ x: 0, y: 0, scale: 1 });
  const sizeRef = useRef({ width: 0, height: 0, dpr: 1 });
  const panRef = useRef<PanState | null>(null);
  const panKeyRef = useRef(false);

  // Track selected IDs in refs for use in event handlers
  const selectedShapeIdRef = useRef<string | null>(null);
  const selectedStrokeIdRef = useRef<string | null>(null);

  const toolRef = useRef(tool);
  const colorRef = useRef(color);
  const widthRef = useRef(strokeWidth);
  const fontSizeRef = useRef(fontSize);
  const enabledRef = useRef(enabled);
  const sendRef = useRef(send);
  const roomIdRef = useRef(roomId);
  const userIdRef = useRef(userId);
  const onTextEditorOpenRef = useRef(onTextEditorOpen);
  const onTextEditorCloseRef = useRef(onTextEditorClose);
  const onActionErrorRef = useRef(onActionError);

  useEffect(() => { toolRef.current = tool; }, [tool]);
  useEffect(() => { colorRef.current = color; }, [color]);
  useEffect(() => { widthRef.current = strokeWidth; }, [strokeWidth]);
  useEffect(() => { fontSizeRef.current = fontSize; }, [fontSize]);
  useEffect(() => { enabledRef.current = enabled; }, [enabled]);
  useEffect(() => { sendRef.current = send; }, [send]);
  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);
  useEffect(() => { userIdRef.current = userId; }, [userId]);
  useEffect(() => { onTextEditorOpenRef.current = onTextEditorOpen; }, [onTextEditorOpen]);
  useEffect(() => { onTextEditorCloseRef.current = onTextEditorClose; }, [onTextEditorClose]);
  useEffect(() => { onActionErrorRef.current = onActionError; }, [onActionError]);

  const updateSelection = useCallback((shapeId: string | null, strokeId: string | null) => {
    selectedShapeIdRef.current = shapeId;
    selectedStrokeIdRef.current = strokeId;
    setSelectedShapeId(shapeId);
    setSelectedStrokeId(strokeId);
  }, []);

  const render = useCallback(() => {
    renderFrameRef.current = null;

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const { width, height, dpr } = sizeRef.current;
    if (width === 0 || height === 0) return;

    renderScene(context, {
      width,
      height,
      dpr,
      camera: cameraRef.current,
      strokes: Array.from(strokesRef.current.values()),
      localStroke: localStrokeRef.current,
      shapes: Array.from(shapesRef.current.values()),
      remoteStrokes: Array.from(remoteDraftsRef.current.values()),
      draft: draftRef.current,
      selectedShapeId: selectedShapeIdRef.current,
      selectedStrokeId: selectedStrokeIdRef.current,
    });
  }, []);

  const requestRender = useCallback(() => {
    if (renderFrameRef.current !== null) return;
    renderFrameRef.current = window.requestAnimationFrame(render);
  }, [render]);

  const syncHasContent = useCallback(() => {
    setHasContent(
      strokesRef.current.size > 0 ||
        shapesRef.current.size > 0 ||
        remoteDraftsRef.current.size > 0 ||
        localStrokeRef.current !== null,
    );
  }, []);

  const removeStroke = useCallback((strokeId: string): boolean => {
    const stroke = strokesRef.current.get(strokeId);
    if (!stroke) return false;

    strokesRef.current.delete(strokeId);
    signaturesRef.current.delete(strokeSignature(stroke));
    localStrokeIdsRef.current.delete(strokeId);
    remoteDraftsRef.current.delete(strokeId);
    return true;
  }, []);

  const removeShape = useCallback((shapeId: string): boolean => {
    const shape = shapesRef.current.get(shapeId);
    if (!shape) return false;

    shapesRef.current.delete(shapeId);
    shapeSignaturesRef.current.delete(shapeSignature(shape));
    return true;
  }, []);

  const eraseAtPoint = useCallback(
    (point: Point, session: EraseSession) => {
      const tolerance = ERASER_TOLERANCE_PX / cameraRef.current.scale;
      let erased = false;

      for (const [strokeId, stroke] of strokesRef.current) {
        if (session.strokeIds.has(strokeId)) continue;
        if (!strokeHitByPoint(stroke, point, tolerance)) continue;

        session.strokeIds.add(strokeId);
        session.strokes.set(strokeId, stroke);
        removeStroke(strokeId);
        erased = true;
      }

      for (const [shapeId, shape] of shapesRef.current) {
        if (session.shapeIds.has(shapeId)) continue;
        if (!shapeHitByPoint(shape, point, tolerance)) continue;

        session.shapeIds.add(shapeId);
        session.shapes.set(shapeId, shape);
        removeShape(shapeId);
        erased = true;
      }

      if (erased) {
        syncHasContent();
        requestRender();
      }
    },
    [removeShape, removeStroke, requestRender, syncHasContent],
  );

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    const dpr = Math.min(window.devicePixelRatio || 1, 3);

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    sizeRef.current = { width, height, dpr };
    requestRender();
  }, [requestRender]);

  useEffect(() => {
    resize();

    const container = containerRef.current;
    const observer = new ResizeObserver(resize);
    if (container) observer.observe(container);

    window.addEventListener("resize", resize);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, [resize]);

  const flushPoints = useCallback(() => {
    flushFrameRef.current = null;

    const stroke = localStrokeRef.current;
    if (!stroke || pendingPointsRef.current.length === 0) return;

    const points = pendingPointsRef.current.splice(
      0,
      pendingPointsRef.current.length,
    );

    sendRef.current({
      type: "STROKE_POINT",
      roomId: roomIdRef.current,
      strokeId: stroke.id,
      points,
    });
  }, []);

  const scheduleFlush = useCallback(() => {
    if (flushFrameRef.current !== null) return;
    flushFrameRef.current = window.requestAnimationFrame(flushPoints);
  }, [flushPoints]);

  const eventPoint = useCallback((event: PointerEvent): Point => {
    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();

    return screenToWorld(
      event.clientX - (rect?.left ?? 0),
      event.clientY - (rect?.top ?? 0),
      cameraRef.current,
    );
  }, []);

  const screenPoint = useCallback((world: Point): { x: number; y: number } => {
    const camera = cameraRef.current;
    return {
      x: world.x * camera.scale + camera.x,
      y: world.y * camera.scale + camera.y,
    };
  }, []);

  const releasePointer = useCallback((pointerId: number) => {
    const canvas = canvasRef.current;

    if (canvas?.hasPointerCapture(pointerId)) {
      canvas.releasePointerCapture(pointerId);
    }

    if (canvas) {
      canvas.style.cursor = panKeyRef.current
        ? "grab"
        : getCursorForTool(toolRef.current);
    }
  }, []);

  const commitLocalStroke = useCallback(() => {
    const stroke = localStrokeRef.current;
    if (!stroke) return;

    if (flushFrameRef.current !== null) {
      window.cancelAnimationFrame(flushFrameRef.current);
      flushFrameRef.current = null;
    }

    flushPoints();

    sendRef.current({
      type: "STROKE_END",
      roomId: roomIdRef.current,
      strokeId: stroke.id,
    });

    strokesRef.current.set(stroke.id, stroke);
    signaturesRef.current.add(strokeSignature(stroke));
    localStrokeRef.current = null;
    pendingPointsRef.current = [];
    setHasContent(true);
  }, [flushPoints]);

  const commitShape = useCallback(() => {
    const draft = draftRef.current;
    if (!draft) return;

    draftRef.current = null;

    const dragged =
      distance(draft.start, draft.current) * cameraRef.current.scale;

    if (dragged < MIN_SHAPE_DRAG) return;

    const base = {
      id: createId(),
      color: draft.color,
      strokeWidth: draft.strokeWidth,
      createdById: userIdRef.current,
    };

    const shape: CanvasShape =
      draft.tool === "line"
        ? {
            ...base,
            type: "LINE",
            data: lineFromPoints(draft.start, draft.current),
          }
        : draft.tool === "rectangle"
          ? {
              ...base,
              type: "RECTANGLE",
              data: rectFromPoints(draft.start, draft.current),
            }
          : {
              ...base,
              type: "ELLIPSE",
              data: rectFromPoints(draft.start, draft.current),
            };

    const sent = sendRef.current({
      type: "SHAPE_CREATE",
      roomId: roomIdRef.current,
      shapeId: shape.id,
      shapeType: SHAPE_TYPES[draft.tool],
      data: shapePayload(draft.tool, draft.start, draft.current),
      color: draft.color,
      strokeWidth: draft.strokeWidth,
    });

    if (!sent) return;

    shapesRef.current.set(shape.id, shape);
    shapeSignaturesRef.current.add(shapeSignature(shape));
    setHasContent(true);
    requestRender();
  }, [requestRender]);

  /**
   * Commits text to canvas state and WS.
   * Called from the floating textarea overlay when editing is done.
   */
  const commitTextEdit = useCallback(
    (shapeId: string, text: string, width?: number, height?: number) => {
      const existing = shapesRef.current.get(shapeId);
      if (!existing || existing.type !== "TEXT") return false;

      const data: TextData = {
        ...existing.data,
        text,
        ...(width !== undefined
          ? { width: width / cameraRef.current.scale }
          : {}),
        ...(height !== undefined
          ? { height: height / cameraRef.current.scale }
          : {}),
      };

      const updated: CanvasShape = { ...existing, data };
      const sent = sendRef.current({
        type: "SHAPE_CREATE",
        roomId: roomIdRef.current,
        shapeId,
        shapeType: "TEXT",
        data: data as unknown as Record<string, unknown>,
        color: existing.color,
        strokeWidth: existing.strokeWidth,
      });

      if (!sent) {
        onActionErrorRef.current(
          "Text was not saved because the live connection is unavailable. Reconnect and try again.",
        );
        return false;
      }

      shapesRef.current.set(shapeId, updated);
      shapeSignaturesRef.current.delete(shapeSignature(existing));
      shapeSignaturesRef.current.add(shapeSignature(updated));
      requestRender();
      onTextEditorCloseRef.current();
      return true;
    },
    [requestRender],
  );

  /**
   * Place a brand-new text element and immediately open the editor.
   */
  const placeTextElement = useCallback(
    (worldPoint: Point) => {
      const shapeId = createId();
      const data: TextData = {
        x: worldPoint.x,
        y: worldPoint.y,
        text: "",
        fontSize: fontSizeRef.current,
      };

      const shape: CanvasShape = {
        id: shapeId,
        type: "TEXT",
        data,
        color: colorRef.current,
        strokeWidth: 1,
        createdById: userIdRef.current,
      };

      shapesRef.current.set(shapeId, shape);
      shapeSignaturesRef.current.add(shapeSignature(shape));
      setHasContent(true);
      requestRender();

      // Open the text editor overlay
      const sp = screenPoint(worldPoint);
      const camera = cameraRef.current;
      onTextEditorOpenRef.current({
        shapeId,
        x: worldPoint.x,
        y: worldPoint.y,
        screenX: sp.x,
        screenY: sp.y,
        initialText: "",
        color: colorRef.current,
        fontSize: fontSizeRef.current * camera.scale,
      });
    },
    [requestRender, screenPoint],
  );

  /**
   * Open the editor for an existing text element.
   */
  const editTextElement = useCallback(
    (shape: CanvasShape & { type: "TEXT" }) => {
      const sp = screenPoint({ x: shape.data.x, y: shape.data.y });
      const camera = cameraRef.current;
      onTextEditorOpenRef.current({
        shapeId: shape.id,
        x: shape.data.x,
        y: shape.data.y,
        screenX: sp.x,
        screenY: sp.y,
        initialText: shape.data.text,
        color: shape.color,
        fontSize: shape.data.fontSize * camera.scale,
      });
    },
    [screenPoint],
  );

  /**
   * Hit test for select tool.
   */
  const hitTestPoint = useCallback(
    (point: Point): { type: "shape"; id: string } | { type: "stroke"; id: string } | null => {
      const tolerance = SELECT_TOLERANCE_PX / cameraRef.current.scale;

      // Shapes last drawn are on top — iterate in reverse insertion order.
      const shapes = Array.from(shapesRef.current.values()).reverse();
      for (const shape of shapes) {
        if (shapeHitByPoint(shape, point, tolerance)) {
          return { type: "shape", id: shape.id };
        }
      }

      const strokes = Array.from(strokesRef.current.values()).reverse();
      for (const stroke of strokes) {
        if (strokeHitByPoint(stroke, point, tolerance)) {
          return { type: "stroke", id: stroke.id };
        }
      }

      return null;
    },
    [],
  );

  const handlePointerDown = useCallback(
    (event: PointerEvent) => {
      if (!enabledRef.current) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const currentTool = toolRef.current;

      // Pan: middle mouse or Space+drag or hand tool
      if (event.button === 1 || panKeyRef.current || currentTool === "hand") {
        event.preventDefault();
        panRef.current = {
          pointerId: event.pointerId,
          startClientX: event.clientX,
          startClientY: event.clientY,
          cameraX: cameraRef.current.x,
          cameraY: cameraRef.current.y,
        };
        canvas.setPointerCapture(event.pointerId);
        canvas.style.cursor = "grabbing";
        return;
      }

      if (event.pointerType === "mouse" && event.button !== 0) return;

      event.preventDefault();
      canvas.setPointerCapture(event.pointerId);

      const point = eventPoint(event);

      if (currentTool === "eraser") {
        const session: EraseSession = {
          pointerId: event.pointerId,
          strokeIds: new Set(),
          shapeIds: new Set(),
          strokes: new Map(),
          shapes: new Map(),
        };

        eraseSessionRef.current = session;
        eraseAtPoint(point, session);
        return;
      }

      if (currentTool === "select") {
        const hit = hitTestPoint(point);

        if (hit) {
          if (hit.type === "shape") {
            updateSelection(hit.id, null);
            // Check if it's a text element and double-click/open editor
            const shape = shapesRef.current.get(hit.id);
            if (shape?.type === "TEXT") {
              // Start drag but also allow double-click to edit
            }
            dragRef.current = {
              pointerId: event.pointerId,
              startWorld: point,
              lastWorld: point,
              shapeId: hit.id,
              strokeId: null,
            };
          } else {
            updateSelection(null, hit.id);
            dragRef.current = {
              pointerId: event.pointerId,
              startWorld: point,
              lastWorld: point,
              shapeId: null,
              strokeId: hit.id,
            };
          }
        } else {
          updateSelection(null, null);
          onTextEditorCloseRef.current();
        }
        requestRender();
        return;
      }

      if (currentTool === "text") {
        // If clicking an existing text element, edit it
        const hit = hitTestPoint(point);
        if (hit?.type === "shape") {
          const shape = shapesRef.current.get(hit.id);
          if (shape?.type === "TEXT") {
            editTextElement(shape);
            return;
          }
        }
        // Otherwise place a new text element
        placeTextElement(point);
        return;
      }

      if (currentTool === "pencil") {
        const stroke: Stroke = {
          id: createId(),
          points: [point],
          color: colorRef.current,
          width: widthRef.current,
          offsetX: 0,
          offsetY: 0,
          createdById: userIdRef.current,
        };

        localStrokeRef.current = stroke;
        localStrokeIdsRef.current.add(stroke.id);
        pendingPointsRef.current = [];

        sendRef.current({
          type: "STROKE_START",
          roomId: roomIdRef.current,
          strokeId: stroke.id,
          color: stroke.color,
          width: stroke.width,
          startPoint: point,
        });

        requestRender();
        return;
      }

      // Shape drawing tools (rectangle, ellipse, line)
      draftRef.current = {
        tool: currentTool as ShapeTool,
        start: point,
        current: point,
        color: colorRef.current,
        strokeWidth: widthRef.current,
      };
      requestRender();
    },
    [eraseAtPoint, eventPoint, hitTestPoint, requestRender, updateSelection, editTextElement, placeTextElement],
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      const pan = panRef.current;

      if (pan && pan.pointerId === event.pointerId) {
        cameraRef.current = {
          ...cameraRef.current,
          x: pan.cameraX + (event.clientX - pan.startClientX),
          y: pan.cameraY + (event.clientY - pan.startClientY),
        };
        requestRender();
        return;
      }

      const drag = dragRef.current;

      if (drag && drag.pointerId === event.pointerId) {
        const point = eventPoint(event);
        const dx = point.x - drag.lastWorld.x;
        const dy = point.y - drag.lastWorld.y;
        drag.lastWorld = point;

        if (drag.shapeId) {
          const shape = shapesRef.current.get(drag.shapeId);
          if (shape) {
            const moved = applyShapeOffset(shape, dx, dy);
            shapesRef.current.set(drag.shapeId, moved);
          }
        }

        if (drag.strokeId) {
          const stroke = strokesRef.current.get(drag.strokeId);
          if (stroke) {
            strokesRef.current.set(drag.strokeId, {
              ...stroke,
              offsetX: stroke.offsetX + dx,
              offsetY: stroke.offsetY + dy,
            });
          }
        }

        requestRender();
        return;
      }

      const session = eraseSessionRef.current;

      if (session && session.pointerId === event.pointerId) {
        if (!enabledRef.current) return;

        const coalesced =
          typeof event.getCoalescedEvents === "function"
            ? event.getCoalescedEvents()
            : [];
        const samples = coalesced.length > 0 ? coalesced : [event];

        for (const sample of samples) {
          eraseAtPoint(eventPoint(sample), session);
        }

        return;
      }

      const stroke = localStrokeRef.current;

      if (stroke) {
        if (!enabledRef.current) return;

        const coalesced =
          typeof event.getCoalescedEvents === "function"
            ? event.getCoalescedEvents()
            : [];
        const samples = coalesced.length > 0 ? coalesced : [event];

        for (const sample of samples) {
          const point = eventPoint(sample);
          const last = stroke.points[stroke.points.length - 1];

          if (
            last &&
            distance(last, point) * cameraRef.current.scale < MIN_POINT_DISTANCE
          ) {
            continue;
          }

          stroke.points.push(point);
          pendingPointsRef.current.push(point);
        }

        scheduleFlush();
        requestRender();
        return;
      }

      if (draftRef.current && enabledRef.current) {
        draftRef.current = {
          ...draftRef.current,
          current: eventPoint(event),
        };
        requestRender();
      }
    },
    [eraseAtPoint, eventPoint, requestRender, scheduleFlush],
  );

  const handlePointerUp = useCallback(
    (event: PointerEvent) => {
      const pan = panRef.current;

      if (pan && pan.pointerId === event.pointerId) {
        panRef.current = null;
        releasePointer(event.pointerId);
        requestRender();
        return;
      }

      const drag = dragRef.current;

      if (drag && drag.pointerId === event.pointerId) {
        dragRef.current = null;
        releasePointer(event.pointerId);

        const totalDx = drag.lastWorld.x - drag.startWorld.x;
        const totalDy = drag.lastWorld.y - drag.startWorld.y;

        // Only persist if actually moved
        if (Math.abs(totalDx) > 0.5 || Math.abs(totalDy) > 0.5) {
          const sent = sendRef.current({
            type: "MOVE_ELEMENTS",
            roomId: roomIdRef.current,
            shapeIds: drag.shapeId ? [drag.shapeId] : [],
            strokeIds: drag.strokeId ? [drag.strokeId] : [],
            dx: totalDx,
            dy: totalDy,
          });

          if (!sent) {
            if (drag.shapeId) {
              const shape = shapesRef.current.get(drag.shapeId);
              if (shape) {
                shapesRef.current.set(
                  drag.shapeId,
                  applyShapeOffset(shape, -totalDx, -totalDy),
                );
              }
            }
            if (drag.strokeId) {
              const stroke = strokesRef.current.get(drag.strokeId);
              if (stroke) {
                strokesRef.current.set(drag.strokeId, {
                  ...stroke,
                  offsetX: stroke.offsetX - totalDx,
                  offsetY: stroke.offsetY - totalDy,
                });
              }
            }
            onActionErrorRef.current(
              "The move was not saved because the live connection is unavailable. Reconnect and try again.",
            );
          }
        }

        requestRender();
        return;
      }

      const eraseSession = eraseSessionRef.current;

      if (eraseSession && eraseSession.pointerId === event.pointerId) {
        eraseSessionRef.current = null;

        if (eraseSession.strokeIds.size > 0 || eraseSession.shapeIds.size > 0) {
          const sent = sendRef.current({
            type: "DELETE_ELEMENTS",
            roomId: roomIdRef.current,
            strokeIds: Array.from(eraseSession.strokeIds),
            shapeIds: Array.from(eraseSession.shapeIds),
          });
          if (!sent) {
            for (const [strokeId, stroke] of eraseSession.strokes) {
              strokesRef.current.set(strokeId, stroke);
              signaturesRef.current.add(strokeSignature(stroke));
            }
            for (const [shapeId, shape] of eraseSession.shapes) {
              shapesRef.current.set(shapeId, shape);
              shapeSignaturesRef.current.add(shapeSignature(shape));
            }
            syncHasContent();
            onActionErrorRef.current(
              "The erase was not saved because the live connection is unavailable. Reconnect and try again.",
            );
          }
        }

        releasePointer(event.pointerId);
        requestRender();
        return;
      }

      if (localStrokeRef.current) {
        const stroke = localStrokeRef.current;
        const point = eventPoint(event);
        const last = stroke.points[stroke.points.length - 1];

        if (
          !last ||
          distance(last, point) * cameraRef.current.scale >= MIN_POINT_DISTANCE
        ) {
          stroke.points.push(point);
          pendingPointsRef.current.push(point);
        }

        commitLocalStroke();
        releasePointer(event.pointerId);
        requestRender();
        return;
      }

      if (draftRef.current) {
        commitShape();
        releasePointer(event.pointerId);
        requestRender();
      }
    },
    [
      commitLocalStroke,
      commitShape,
      eventPoint,
      releasePointer,
      requestRender,
      syncHasContent,
    ],
  );

  const handlePointerCancel = useCallback(
    (event: PointerEvent) => {
      const pan = panRef.current;

      if (pan && pan.pointerId === event.pointerId) {
        panRef.current = null;
        releasePointer(event.pointerId);
        return;
      }

      const drag = dragRef.current;
      if (drag?.pointerId === event.pointerId) {
        dragRef.current = null;
        const dx = drag.lastWorld.x - drag.startWorld.x;
        const dy = drag.lastWorld.y - drag.startWorld.y;

        if (drag.shapeId) {
          const shape = shapesRef.current.get(drag.shapeId);
          if (shape) {
            shapesRef.current.set(
              drag.shapeId,
              applyShapeOffset(shape, -dx, -dy),
            );
          }
        }
        if (drag.strokeId) {
          const stroke = strokesRef.current.get(drag.strokeId);
          if (stroke) {
            strokesRef.current.set(drag.strokeId, {
              ...stroke,
              offsetX: stroke.offsetX - dx,
              offsetY: stroke.offsetY - dy,
            });
          }
        }
        releasePointer(event.pointerId);
      }

      const eraseSession = eraseSessionRef.current;
      if (eraseSession?.pointerId === event.pointerId) {
        eraseSessionRef.current = null;
        for (const [strokeId, stroke] of eraseSession.strokes) {
          strokesRef.current.set(strokeId, stroke);
          signaturesRef.current.add(strokeSignature(stroke));
        }
        for (const [shapeId, shape] of eraseSession.shapes) {
          shapesRef.current.set(shapeId, shape);
          shapeSignaturesRef.current.add(shapeSignature(shape));
        }
        syncHasContent();
      }

      if (localStrokeRef.current) {
        commitLocalStroke();
      }

      draftRef.current = null;
      releasePointer(event.pointerId);
      requestRender();
    },
    [commitLocalStroke, releasePointer, requestRender, syncHasContent],
  );

  const handleWheel = useCallback(
    (event: WheelEvent) => {
      event.preventDefault();

      const canvas = canvasRef.current;
      if (!canvas) return;

      if (event.ctrlKey || event.metaKey) {
        const rect = canvas.getBoundingClientRect();
        const nextScale = clamp(
          cameraRef.current.scale * Math.exp(-event.deltaY * 0.0015),
          MIN_ZOOM,
          MAX_ZOOM,
        );
        const next = zoomCameraAt(
          cameraRef.current,
          nextScale,
          event.clientX - rect.left,
          event.clientY - rect.top,
        );

        cameraRef.current = next;
        setScale(next.scale);
      } else {
        cameraRef.current = {
          ...cameraRef.current,
          x: cameraRef.current.x - event.deltaX,
          y: cameraRef.current.y - event.deltaY,
        };
      }

      requestRender();
    },
    [requestRender],
  );

  const handleDblClick = useCallback(
    (event: MouseEvent) => {
      if (toolRef.current !== "select") return;

      const canvas = canvasRef.current;
      const rect = canvas?.getBoundingClientRect();
      const point = screenToWorld(
        event.clientX - (rect?.left ?? 0),
        event.clientY - (rect?.top ?? 0),
        cameraRef.current,
      );

      const hit = hitTestPoint(point);
      if (hit?.type === "shape") {
        const shape = shapesRef.current.get(hit.id);
        if (shape?.type === "TEXT") {
          editTextElement(shape);
        }
      }
    },
    [hitTestPoint, editTextElement],
  );

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.code === "Space" && !isInteractiveTarget(event.target)) {
      event.preventDefault();

      if (panKeyRef.current) return;
      panKeyRef.current = true;

      const canvas = canvasRef.current;
      if (canvas) canvas.style.cursor = "grab";
      return;
    }

    // Delete selected element
    if (
      (event.key === "Delete" || event.key === "Backspace") &&
      !isInteractiveTarget(event.target)
    ) {
      const selShape = selectedShapeIdRef.current;
      const selStroke = selectedStrokeIdRef.current;

      if (selShape) {
        const sent = sendRef.current({
          type: "DELETE_ELEMENTS",
          roomId: roomIdRef.current,
          strokeIds: [],
          shapeIds: [selShape],
        });
        if (!sent) {
          onActionErrorRef.current(
            "The delete was not saved because the live connection is unavailable. Reconnect and try again.",
          );
          return;
        }
        removeShape(selShape);
        updateSelection(null, null);
        syncHasContent();
        requestRender();
      } else if (selStroke) {
        const sent = sendRef.current({
          type: "DELETE_ELEMENTS",
          roomId: roomIdRef.current,
          strokeIds: [selStroke],
          shapeIds: [],
        });
        if (!sent) {
          onActionErrorRef.current(
            "The delete was not saved because the live connection is unavailable. Reconnect and try again.",
          );
          return;
        }
        removeStroke(selStroke);
        updateSelection(null, null);
        syncHasContent();
        requestRender();
      }
    }

    // Escape: deselect
    if (event.key === "Escape" && !isInteractiveTarget(event.target)) {
      updateSelection(null, null);
      onTextEditorCloseRef.current();
      requestRender();
    }
  }, [removeShape, removeStroke, updateSelection, syncHasContent, requestRender]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (event.code !== "Space") return;

    panKeyRef.current = false;

    if (panRef.current) return;

    const canvas = canvasRef.current;
    if (canvas) canvas.style.cursor = getCursorForTool(toolRef.current);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", handlePointerUp);
    canvas.addEventListener("pointercancel", handlePointerCancel);
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    canvas.addEventListener("dblclick", handleDblClick);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", handlePointerUp);
      canvas.removeEventListener("pointercancel", handlePointerCancel);
      canvas.removeEventListener("wheel", handleWheel);
      canvas.removeEventListener("dblclick", handleDblClick);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    handleDblClick,
    handleKeyDown,
    handleKeyUp,
    handlePointerCancel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleWheel,
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = panKeyRef.current
        ? "grab"
        : getCursorForTool(tool);
    }
  }, [tool]);

  useEffect(() => {
    return () => {
      if (renderFrameRef.current !== null) {
        window.cancelAnimationFrame(renderFrameRef.current);
        renderFrameRef.current = null;
      }
      if (flushFrameRef.current !== null) {
        window.cancelAnimationFrame(flushFrameRef.current);
        flushFrameRef.current = null;
      }
    };
  }, []);

  const mergeScene = useCallback(
    (strokeDtos: StrokeDto[], shapeDtos: ShapeDto[]) => {
      let changed = false;

      for (const dto of shapeDtos) {
        if (shapesRef.current.has(dto.id)) continue;

        const shape = shapeFromDto(dto);
        if (!shape) continue;

        const signature = shapeSignature(shape);
        if (shapeSignaturesRef.current.has(signature)) continue;

        shapesRef.current.set(shape.id, shape);
        shapeSignaturesRef.current.add(signature);
        changed = true;
      }

      for (const dto of strokeDtos) {
        if (strokesRef.current.has(dto.id)) continue;

        const stroke = strokeFromDto(dto);
        if (!stroke) continue;

        const signature = strokeSignature(stroke);
        if (signaturesRef.current.has(signature)) continue;

        strokesRef.current.set(stroke.id, stroke);
        signaturesRef.current.add(signature);
        changed = true;
      }

      if (changed) {
        setHasContent(true);
        requestRender();
      }
    },
    [requestRender],
  );

  const applyShapeCreated = useCallback(
    (event: ShapeCreatedEvent) => {
      if (event.roomId !== roomIdRef.current) return;
      if (shapesRef.current.has(event.shapeId)) {
        // Update existing shape data (handles text updates)
        const existing = shapesRef.current.get(event.shapeId);
        if (existing) {
          const updated = shapeFromEvent(event);
          if (updated) {
            shapeSignaturesRef.current.delete(shapeSignature(existing));
            shapesRef.current.set(event.shapeId, updated);
            shapeSignaturesRef.current.add(shapeSignature(updated));
            requestRender();
          }
        }
        return;
      }

      const shape = shapeFromEvent(event);
      if (!shape) return;

      const signature = shapeSignature(shape);
      if (shapeSignaturesRef.current.has(signature)) return;

      shapesRef.current.set(shape.id, shape);
      shapeSignaturesRef.current.add(signature);
      setHasContent(true);
      requestRender();
    },
    [requestRender],
  );

  const applyStrokeStarted = useCallback(
    (event: StrokeStartedEvent) => {
      if (event.roomId !== roomIdRef.current) return;
      if (localStrokeIdsRef.current.has(event.strokeId)) return;
      if (remoteDraftsRef.current.has(event.strokeId)) return;

      remoteDraftsRef.current.set(event.strokeId, strokeFromStartEvent(event));
      requestRender();
    },
    [requestRender],
  );

  const applyStrokePoints = useCallback(
    (event: StrokePointsEvent) => {
      if (event.roomId !== roomIdRef.current) return;

      const draft = remoteDraftsRef.current.get(event.strokeId);
      if (!draft) return;

      draft.points.push(...event.points);
      requestRender();
    },
    [requestRender],
  );

  const applyStrokeEnded = useCallback(
    (event: StrokeEndedEvent) => {
      if (event.roomId !== roomIdRef.current) return;

      const draft = remoteDraftsRef.current.get(event.strokeId);
      if (!draft) return;

      remoteDraftsRef.current.delete(event.strokeId);
      strokesRef.current.set(draft.id, draft);
      signaturesRef.current.add(strokeSignature(draft));
      setHasContent(true);
      requestRender();
    },
    [requestRender],
  );

  const applyElementsDeleted = useCallback(
    (event: ElementsDeletedEvent) => {
      if (event.roomId !== roomIdRef.current) return;

      let changed = false;

      for (const strokeId of event.strokeIds) {
        if (removeStroke(strokeId)) changed = true;
      }

      for (const shapeId of event.shapeIds) {
        if (removeShape(shapeId)) changed = true;
      }

      if (changed) {
        syncHasContent();
        requestRender();
      }
    },
    [removeShape, removeStroke, requestRender, syncHasContent],
  );

  const applyElementsMoved = useCallback(
    (event: ElementsMovedEvent) => {
      if (event.roomId !== roomIdRef.current) return;

      const { shapeIds, strokeIds, dx, dy } = event;

      for (const shapeId of shapeIds) {
        const shape = shapesRef.current.get(shapeId);
        if (shape) {
          shapesRef.current.set(shapeId, applyShapeOffset(shape, dx, dy));
        }
      }

      for (const strokeId of strokeIds) {
        const stroke = strokesRef.current.get(strokeId);
        if (stroke) {
          strokesRef.current.set(strokeId, {
            ...stroke,
            offsetX: stroke.offsetX + dx,
            offsetY: stroke.offsetY + dy,
          });
        }
      }

      requestRender();
    },
    [requestRender],
  );

  const clearLocalScene = useCallback(() => {
    strokesRef.current.clear();
    shapesRef.current.clear();
    signaturesRef.current.clear();
    shapeSignaturesRef.current.clear();
    remoteDraftsRef.current.clear();
    localStrokeIdsRef.current.clear();
    localStrokeRef.current = null;
    pendingPointsRef.current = [];
    draftRef.current = null;
    eraseSessionRef.current = null;
    dragRef.current = null;
    updateSelection(null, null);
    setHasContent(false);
    requestRender();
  }, [requestRender, updateSelection]);

  const applyCanvasCleared = useCallback(
    (event: CanvasClearedEvent) => {
      if (event.roomId !== roomIdRef.current) return;
      clearLocalScene();
    },
    [clearLocalScene],
  );

  const zoomBy = useCallback(
    (factor: number) => {
      const { width, height } = sizeRef.current;
      const nextScale = clamp(
        cameraRef.current.scale * factor,
        MIN_ZOOM,
        MAX_ZOOM,
      );
      const next = zoomCameraAt(
        cameraRef.current,
        nextScale,
        width / 2,
        height / 2,
      );

      cameraRef.current = next;
      setScale(next.scale);
      requestRender();
    },
    [requestRender],
  );

  const zoomIn = useCallback(() => zoomBy(1.2), [zoomBy]);
  const zoomOut = useCallback(() => zoomBy(1 / 1.2), [zoomBy]);

  const resetView = useCallback(() => {
    cameraRef.current = { x: 0, y: 0, scale: 1 };
    setScale(1);
    requestRender();
  }, [requestRender]);

  return {
    canvasRef,
    containerRef,
    scale,
    hasContent,
    selectedShapeId,
    selectedStrokeId,
    mergeScene,
    applyShapeCreated,
    applyStrokeStarted,
    applyStrokePoints,
    applyStrokeEnded,
    applyElementsDeleted,
    applyElementsMoved,
    applyCanvasCleared,
    clearLocalScene,
    commitTextEdit,
    zoomIn,
    zoomOut,
    resetView,
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getCursorForTool(tool: CanvasTool): string {
  switch (tool) {
    case "select":
      return "default";
    case "hand":
      return "grab";
    case "eraser":
      return "cell";
    case "text":
      return "text";
    default:
      return "crosshair";
  }
}

function applyShapeOffset(shape: CanvasShape, dx: number, dy: number): CanvasShape {
  if (shape.type === "LINE") {
    return {
      ...shape,
      data: {
        x1: shape.data.x1 + dx,
        y1: shape.data.y1 + dy,
        x2: shape.data.x2 + dx,
        y2: shape.data.y2 + dy,
      },
    };
  }

  if (shape.type === "TEXT") {
    return {
      ...shape,
      data: {
        ...shape.data,
        x: shape.data.x + dx,
        y: shape.data.y + dy,
      },
    };
  }

  return {
    ...shape,
    data: {
      ...shape.data,
      x: shape.data.x + dx,
      y: shape.data.y + dy,
    },
  };
}
