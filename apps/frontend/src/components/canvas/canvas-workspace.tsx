"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ChevronLeft,
  Eraser,
  Maximize2,
  Minus,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import type { ServerMessage } from "@repo/common";
import type { RoomDetailDto } from "@/types/api";
import { deleteRoom, getRoomBySlug } from "@/lib/api/rooms";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";
import { useCanvasEngine, type TextEditor } from "@/hooks/use-canvas-engine";
import { useRoomSocket } from "@/hooks/use-room-socket";
import type { CanvasTool } from "@/lib/canvas/types";
import { Brand } from "@/components/layout/brand";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PageLoader, Spinner } from "@/components/ui/spinner";
import { CanvasToolbar } from "./canvas-toolbar";
import { CollaboratorStack } from "./collaborator-stack";
import { ConnectionStatus } from "./connection-status";
import { ShareDialog } from "./share-dialog";
import { TextEditorOverlay } from "./text-editor-overlay";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;

  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"].includes(target.tagName)
  );
}

export function CanvasWorkspace({ slug }: { slug: string }) {
  const { user, token } = useAuth();
  const router = useRouter();

  const [room, setRoom] = useState<RoomDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [roomError, setRoomError] = useState<{
    message: string;
    status: number | null;
  } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [tool, setTool] = useState<CanvasTool>("pencil");
  const [color, setColor] = useState("#312e81");
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [fontSize, setFontSize] = useState(18);
  const [textEditor, setTextEditor] = useState<TextEditor | null>(null);
  const [canvasActionError, setCanvasActionError] = useState<string | null>(
    null,
  );
  const [shareOpen, setShareOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"clear" | "delete" | null>(
    null,
  );

  // The socket is created before the engine (the engine needs `send`), so
  // incoming messages are forwarded through a ref that the engine updates.
  // This keeps the socket lifecycle independent of engine callback identity.
  const serverMessageRef = useRef<(message: ServerMessage) => void>(() => {});

  const handleServerMessage = useCallback((message: ServerMessage) => {
    serverMessageRef.current(message);
  }, []);

  const socket = useRoomSocket({
    enabled: token !== null && room !== null,
    token,
    roomId: room?.id ?? null,
    onMessage: handleServerMessage,
  });

  const {
    canvasRef,
    containerRef,
    scale,
    hasContent,
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
  } = useCanvasEngine({
    roomId: room?.id ?? "",
    userId: user?.id ?? "",
    tool,
    color,
    strokeWidth,
    fontSize,
    enabled: room !== null,
    send: socket.send,
    onTextEditorOpen: setTextEditor,
    onTextEditorClose: () => setTextEditor(null),
    onActionError: setCanvasActionError,
  });

  useEffect(() => {
    serverMessageRef.current = (message) => {
      switch (message.type) {
        case "SHAPE_CREATED":
          applyShapeCreated(message);
          break;
        case "STROKE_STARTED":
          applyStrokeStarted(message);
          break;
        case "STROKE_POINT_BROADCAST":
          applyStrokePoints(message);
          break;
        case "STROKE_ENDED":
          applyStrokeEnded(message);
          break;
        case "ELEMENTS_DELETED":
          applyElementsDeleted(message);
          break;
        case "ELEMENTS_MOVED":
          applyElementsMoved(message);
          break;
        case "CANVAS_CLEARED":
          applyCanvasCleared(message);
          break;
        case "ERROR":
          setCanvasActionError(message.message);
          break;
        default:
          break;
      }
    };
  }, [
    applyShapeCreated,
    applyStrokeStarted,
    applyStrokePoints,
    applyStrokeEnded,
    applyElementsDeleted,
    applyElementsMoved,
    applyCanvasCleared,
  ]);

  // Initial load: the persisted scene is fetched over HTTP before/while the
  // socket handshake happens, then merged so nothing is lost either way.
  useEffect(() => {
    if (!token) return;

    const controller = new AbortController();

    getRoomBySlug(token, slug, controller.signal)
      .then((result) => {
        setRoom(result.room);
        mergeScene(result.room.strokes, result.room.shapes);
        setLoading(false);
      })
      .catch((caught) => {
        if (caught instanceof DOMException && caught.name === "AbortError") {
          return;
        }

        setRoomError({
          message:
            caught instanceof ApiError
              ? caught.message
              : "Could not open this canvas. Please try again.",
          status: caught instanceof ApiError ? caught.status : null,
        });
        setLoading(false);
      });

    return () => controller.abort();
  }, [token, slug, reloadKey, mergeScene]);

  // Every accepted JOIN (including reconnects) refetches the persisted scene.
  // `mergeScene` deduplicates by id and content signature, so this is additive
  // and cannot wipe events that arrived over the socket in the meantime.
  useEffect(() => {
    if (socket.status !== "joined" || !token) return;

    const controller = new AbortController();

    getRoomBySlug(token, slug, controller.signal)
      .then((result) => {
        setRoom(result.room);
        mergeScene(result.room.strokes, result.room.shapes);
      })
      .catch(() => {
        // The live socket is still the source of truth; a failed resync is
        // retried on the next successful reconnect.
      });

    return () => controller.abort();
  }, [socket.status, token, slug, mergeScene]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (shareOpen) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;

      switch (event.key.toLowerCase()) {
        case "v":
          setTool("select");
          break;
        case "h":
          setTool("hand");
          break;
        case "p":
          setTool("pencil");
          break;
        case "r":
          setTool("rectangle");
          break;
        case "o":
          setTool("ellipse");
          break;
        case "l":
          setTool("line");
          break;
        case "t":
          setTool("text");
          break;
        case "e":
          setTool("eraser");
          break;
        default:
          return;
      }

      event.preventDefault();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shareOpen]);

  const retryRoom = useCallback(() => {
    setLoading(true);
    setRoomError(null);
    setReloadKey((key) => key + 1);
  }, []);

  const roomName = room?.name?.trim() || "Untitled canvas";
  const isOwner = Boolean(room && user && room.ownerId === user.id);

  const memberCount = useMemo(() => {
    if (!room) return 0;
    return new Set([
      room.ownerId,
      ...room.members.map((member) => member.userId),
    ]).size;
  }, [room]);

  const showLiveBanner =
    room !== null &&
    (socket.status === "reconnecting" || socket.status === "error");

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#faf9f6]">
      <header className="z-30 flex h-16 shrink-0 items-center justify-between gap-2 border-b border-gray-200/80 bg-white/85 px-2.5 backdrop-blur sm:px-5">
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
          <Link
            href="/dashboard"
            aria-label="Back to dashboard"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-500 transition hover:bg-violet-50 hover:text-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>

          <Brand
            href="/dashboard"
            size="sm"
            className="hidden shrink-0 md:inline-flex"
          />

          <span
            aria-hidden="true"
            className="hidden h-8 w-px bg-gray-200 md:block"
          />

          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold tracking-tight text-gray-900 sm:text-base">
              {roomName}
            </h1>
            <p className="hidden truncate text-xs text-gray-500 sm:block">
              {isOwner ? "You own this canvas" : "You're a collaborator"}
              {room ? ` · ${memberCount} with access` : null}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <ConnectionStatus
            status={socket.status}
            error={socket.error}
            onRetry={socket.retry}
          />

          <div className="hidden sm:flex">
            <CollaboratorStack
              collaborators={socket.collaborators}
              selfUserId={socket.selfUserId}
            />
          </div>

          {isOwner && room && token ? (
            <>
              <Button
                size="sm"
                onClick={() => setShareOpen(true)}
                className="hidden sm:inline-flex"
              >
                <UserPlus className="h-4 w-4" />
                Share
              </Button>
              <Button
                size="icon"
                aria-label="Invite collaborators"
                title="Invite collaborators"
                onClick={() => setShareOpen(true)}
                className="sm:hidden"
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            </>
          ) : null}

          {isOwner && room && token ? (
            <div className="relative">
              <button
                type="button"
                aria-label="Canvas options"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                title="Canvas options"
                onClick={() => setMenuOpen((open) => !open)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition hover:bg-violet-50 hover:text-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>

              {menuOpen ? (
                <>
                  <button
                    type="button"
                    aria-label="Close canvas options"
                    tabIndex={-1}
                    onClick={() => setMenuOpen(false)}
                    className="fixed inset-0 z-40 cursor-default"
                  />
                  <div
                    role="menu"
                    aria-label="Canvas options"
                    className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white p-1 shadow-xl shadow-gray-900/10"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        setConfirmAction("clear");
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition hover:bg-violet-50 hover:text-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                    >
                      <Eraser className="h-4 w-4 text-gray-400" />
                      Clear canvas
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        setConfirmAction("delete");
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete canvas
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          ) : null}

          <UserMenu compact />
        </div>
      </header>

      <main className="relative flex-1 overflow-hidden">
        <div ref={containerRef} className="absolute inset-0">
          <canvas
            ref={canvasRef}
            className="block h-full w-full touch-none select-none"
            aria-label={`Collaborative drawing canvas for ${roomName}`}
          >
            Your browser does not support the canvas element.
          </canvas>
        </div>

        {!loading && !roomError && room ? (
          <>
            {canvasActionError ? (
              <div
                role="alert"
                className="absolute left-1/2 top-14 z-30 flex max-w-[calc(100%-1.5rem)] -translate-x-1/2 items-start gap-2 rounded-xl border border-red-200 bg-white/95 px-3.5 py-2.5 text-xs font-medium text-red-800 shadow-xl shadow-gray-900/10 backdrop-blur"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <span className="leading-5">{canvasActionError}</span>
                <button
                  type="button"
                  aria-label="Dismiss canvas error"
                  onClick={() => setCanvasActionError(null)}
                  className="ml-1 shrink-0 rounded px-1 text-red-600 hover:bg-red-50"
                >
                  ×
                </button>
              </div>
            ) : null}

            <TextEditorOverlay
              editor={textEditor}
              onCommit={(shapeId, text, width, height) => {
                return commitTextEdit(shapeId, text, width, height);
              }}
              onDismiss={() => setTextEditor(null)}
            />

            <div className="absolute left-3 top-3 z-20 flex items-center gap-0.5 rounded-xl border border-gray-200/90 bg-white/95 p-1 shadow-lg shadow-gray-900/5 backdrop-blur sm:left-4 sm:top-4">
              <button
                type="button"
                onClick={zoomOut}
                aria-label="Zoom out"
                title="Zoom out"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition hover:bg-violet-50 hover:text-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                <Minus className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={resetView}
                title="Reset view"
                aria-label="Reset view to 100%"
                className="min-w-12 rounded-lg px-1 py-1 text-xs font-semibold text-gray-600 transition hover:bg-violet-50 hover:text-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                {Math.round(scale * 100)}%
              </button>

              <button
                type="button"
                onClick={zoomIn}
                aria-label="Zoom in"
                title="Zoom in"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition hover:bg-violet-50 hover:text-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                <Plus className="h-4 w-4" />
              </button>

              <span
                aria-hidden="true"
                className="mx-0.5 h-5 w-px bg-gray-200"
              />

              <button
                type="button"
                onClick={resetView}
                aria-label="Center canvas"
                title="Center canvas"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition hover:bg-violet-50 hover:text-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>

            <CanvasToolbar
              tool={tool}
              onToolChange={setTool}
              color={color}
              onColorChange={setColor}
              strokeWidth={strokeWidth}
              onStrokeWidthChange={setStrokeWidth}
              fontSize={fontSize}
              onFontSizeChange={setFontSize}
            />

            {!loading &&
            ["connecting", "authenticating", "joining"].includes(
              socket.status,
            ) ? (
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6">
                <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white/90 px-5 py-3.5 shadow-sm backdrop-blur">
                  <Spinner
                    className="h-4 w-4 text-violet-600"
                    label="Connecting to canvas"
                  />
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-800">
                      Joining the live session…
                    </p>
                    <p className="text-xs text-gray-500">
                      Start drawing now — strokes sync once connected.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {!hasContent && socket.status === "joined" && !loading ? (
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6">
                <div className="max-w-sm rounded-2xl border border-dashed border-violet-200 bg-white/80 px-6 py-7 text-center shadow-sm backdrop-blur">
                  <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                    <Pencil className="h-5 w-5" />
                  </span>
                  <p className="mt-3 text-sm font-bold text-gray-800">
                    This canvas is blank
                  </p>
                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Pick a tool below and start sketching. Everyone in the room
                    sees your strokes live.
                  </p>
                </div>
              </div>
            ) : null}

            <p className="pointer-events-none absolute bottom-5 right-4 z-10 hidden text-[11px] font-medium text-gray-400 lg:block">
              Space + drag to pan · Ctrl/⌘ + scroll to zoom · E to erase
            </p>
          </>
        ) : null}

        {showLiveBanner ? (
          <div
            role="status"
            className="absolute left-1/2 top-3 z-30 flex max-w-[calc(100%-1.5rem)] -translate-x-1/2 items-start gap-2.5 rounded-xl border border-amber-200 bg-white/95 px-3.5 py-2.5 text-xs font-medium text-amber-800 shadow-xl shadow-gray-900/10 backdrop-blur sm:top-4"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <span className="leading-5">
              {socket.error ??
                "The live connection dropped. Your saved work is safe."}
            </span>
            {socket.status === "error" ? (
              <button
                type="button"
                onClick={socket.retry}
                className="ml-1 shrink-0 rounded-lg bg-amber-100 px-2 py-1 font-semibold text-amber-900 transition hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                Retry
              </button>
            ) : null}
          </div>
        ) : null}

        {loading ? (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#faf9f6]/90 backdrop-blur-sm">
            <PageLoader message="Opening your canvas…" />
          </div>
        ) : null}

        {roomError ? (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#faf9f6]/95 px-5 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-7 text-center shadow-xl shadow-gray-900/5">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <AlertTriangle className="h-6 w-6" />
              </span>

              <h2 className="mt-4 text-lg font-bold text-gray-900">
                {roomError.status === 403
                  ? "You don't have access to this canvas"
                  : roomError.status === 404
                    ? "This canvas doesn't exist"
                    : "We couldn't open this canvas"}
              </h2>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
                {roomError.status === 403
                  ? "Ask the room owner for an invite link, then try again."
                  : roomError.status === 404
                    ? "It may have been deleted, or the link is incorrect."
                    : roomError.message}
              </p>

              <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
                <Button variant="secondary" onClick={retryRoom}>
                  <RefreshCw className="h-4 w-4" />
                  Try again
                </Button>
                <Link
                  href="/dashboard"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white shadow-sm shadow-violet-200 transition hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf9f6]"
                >
                  <Users className="h-4 w-4" />
                  Back to dashboard
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </main>

      {room && token ? (
        <ConfirmDialog
          open={confirmAction === "clear"}
          title="Clear this canvas?"
          description="Every stroke and shape will be removed for everyone in this room. This can't be undone."
          confirmLabel="Clear canvas"
          tone="danger"
          onClose={() => setConfirmAction(null)}
          onConfirm={() => {
            const sent = socket.send({
              type: "CLEAR_CANVAS",
              roomId: room.id,
            });

            if (!sent) {
              throw new Error(
                "Reconnect to the canvas before clearing it, then try again.",
              );
            }

            setConfirmAction(null);
          }}
        />
      ) : null}

      {room && token ? (
        <ConfirmDialog
          open={confirmAction === "delete"}
          title="Delete this canvas?"
          description={`"${roomName}" and everything in it will be permanently deleted for you and every collaborator. This can't be undone.`}
          confirmLabel="Delete canvas"
          tone="danger"
          onClose={() => setConfirmAction(null)}
          onConfirm={async () => {
            await deleteRoom(token, room.id);
            setConfirmAction(null);
            router.push("/dashboard");
            router.refresh();
          }}
        />
      ) : null}

      {room && token && shareOpen ? (
        <ShareDialog
          open
          onClose={() => setShareOpen(false)}
          token={token}
          roomId={room.id}
          roomName={roomName}
        />
      ) : null}
    </div>
  );
}
