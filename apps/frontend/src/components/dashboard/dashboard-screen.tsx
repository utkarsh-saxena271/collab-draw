"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  FolderOpen,
  LoaderCircle,
  Plus,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import type { RoomSummary } from "@/types/api";
import { deleteRoom, listRooms } from "@/lib/api/rooms";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";
import { Brand } from "@/components/layout/brand";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CreateRoomDialog } from "./create-room-dialog";
import { RoomCard } from "./room-card";

function RoomSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="h-28 animate-pulse bg-gray-100" />
      <div className="space-y-3 p-5">
        <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-gray-100" />
        <div className="h-5 w-1/2 animate-pulse rounded-full bg-gray-100" />
      </div>
    </div>
  );
}

export function DashboardScreen() {
  const router = useRouter();
  const { user, token } = useAuth();

  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [roomToDelete, setRoomToDelete] = useState<RoomSummary | null>(null);

  useEffect(() => {
    if (!token) return;

    const controller = new AbortController();

    listRooms(token, controller.signal)
      .then((result) => {
        setRooms(result.rooms);
        setLoading(false);
      })
      .catch((caught) => {
        if (caught instanceof DOMException && caught.name === "AbortError") {
          return;
        }

        setError(
          caught instanceof ApiError
            ? caught.message
            : "Could not load your workspaces. Please try again.",
        );
        setLoading(false);
      });

    return () => controller.abort();
  }, [token, reloadKey]);

  const firstName = user?.name?.trim().split(/\s+/)[0] ?? "there";

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadKey((key) => key + 1);
  }, []);

  const stats = useMemo(() => {
    const owned = rooms.filter((room) => room.ownerId === user?.id).length;
    return {
      owned,
      shared: rooms.length - owned,
    };
  }, [rooms, user?.id]);

  const handleCreated = useCallback(
    (room: RoomSummary) => {
      setCreateOpen(false);
      router.push(`/canvas/${room.slug}`);
    },
    [router],
  );

  return (
    <div className="min-h-dvh bg-[#faf9f6]">
      <header className="sticky top-0 z-40 border-b border-gray-200/70 bg-[#faf9f6]/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Brand href="/dashboard" />

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              size="sm"
              onClick={() => setCreateOpen(true)}
              className="hidden sm:inline-flex"
            >
              <Plus className="h-4 w-4" />
              New canvas
            </Button>
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-3 py-1 text-xs font-semibold text-violet-700">
              <Sparkles className="h-3.5 w-3.5" />
              Your workspace
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Welcome back, {firstName}
            </h1>
            <p className="mt-2 max-w-xl text-base leading-7 text-gray-500">
              Pick up an existing canvas or start something new. Your rooms and
              collaborators are all here.
            </p>
          </div>

          <Button
            size="lg"
            onClick={() => setCreateOpen(true)}
            className="w-full sm:w-auto sm:hidden"
          >
            <Plus className="h-4 w-4" />
            New canvas
          </Button>
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 ring-1 ring-gray-200">
            {loading ? "—" : rooms.length} canvas
            {!loading && rooms.length === 1 ? "" : "es"}
          </span>
          <span className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700">
            {loading ? "—" : stats.owned} owned
          </span>
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            {loading ? "—" : stats.shared} shared with you
          </span>
        </div>

        <section className="mt-10" aria-labelledby="rooms-heading">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2
                id="rooms-heading"
                className="text-lg font-bold tracking-tight text-gray-900"
              >
                Your canvases
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Open a workspace to jump back into the drawing.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <RoomSkeleton key={index} />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <AlertCircle className="h-6 w-6" />
              </span>
              <h2 className="mt-4 text-lg font-bold text-gray-900">
                We couldn&apos;t load your canvases
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                {error}
              </p>
              <Button onClick={reload} variant="secondary" className="mt-5">
                <RefreshCw className="h-4 w-4" />
                Try again
              </Button>
            </div>
          ) : rooms.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-violet-200 bg-white/70 px-6 py-14 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                <FolderOpen className="h-7 w-7" />
              </span>
              <h2 className="mt-4 text-xl font-bold text-gray-900">
                Your first canvas is waiting
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                Create a workspace for a project, a workshop or a passing idea.
                You can invite your team as soon as it exists.
              </p>
              <Button onClick={() => setCreateOpen(true)} className="mt-6">
                <Plus className="h-4 w-4" />
                Create your first canvas
              </Button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {rooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  isOwner={room.ownerId === user?.id}
                  onDelete={setRoomToDelete}
                />
              ))}
            </div>
          )}
        </section>

        <div className="mt-12 flex items-center justify-center gap-2 text-xs text-gray-400">
          <LoaderCircle className="h-3.5 w-3.5" />
          Everything is saved automatically as you draw.
        </div>
      </main>

      {token && createOpen ? (
        <CreateRoomDialog
          open
          onClose={() => setCreateOpen(false)}
          token={token}
          onCreated={handleCreated}
        />
      ) : null}

      {token && roomToDelete ? (
        <ConfirmDialog
          open
          title="Delete this canvas?"
          description={`"${
            roomToDelete.name?.trim() || "Untitled canvas"
          }" and everything in it will be permanently deleted for you and every collaborator. This can't be undone.`}
          confirmLabel="Delete canvas"
          onClose={() => setRoomToDelete(null)}
          onConfirm={async () => {
            await deleteRoom(token, roomToDelete.id);
            setRooms((current) =>
              current.filter((room) => room.id !== roomToDelete.id),
            );
            setRoomToDelete(null);
          }}
        />
      ) : null}
    </div>
  );
}
