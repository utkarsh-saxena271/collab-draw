"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ServerMessageSchema,
  type ClientMessage,
  type RoomCollaborator,
  type ServerMessage,
} from "@repo/common";
import { WS_URL } from "@/lib/config";

const MAX_RECONNECT_ATTEMPTS = 5;
// Strokes made before the join acknowledgement are buffered here. The cap
// keeps a long outage from growing memory without bound.
const MAX_QUEUED_MESSAGES = 4000;

export type RoomConnectionStatus =
  | "idle"
  | "connecting"
  | "authenticating"
  | "joining"
  | "joined"
  | "reconnecting"
  | "error";

interface UseRoomSocketOptions {
  enabled: boolean;
  token: string | null;
  roomId: string | null;
  onMessage: (message: ServerMessage) => void;
}

export interface RoomSocket {
  status: RoomConnectionStatus;
  error: string | null;
  collaborators: RoomCollaborator[];
  selfUserId: string | null;
  send: (message: ClientMessage) => boolean;
  retry: () => void;
}

/**
 * Owns the WebSocket lifecycle for one room. The handshake is strictly
 * sequential: open -> AUTH -> AUTH_OK -> JOIN_ROOM -> ROOM_JOINED. Application
 * messages are only sent and accepted once the server has acknowledged the
 * join, so we never draw into a room we are not a member of.
 */
export function useRoomSocket({
  enabled,
  token,
  roomId,
  onMessage,
}: UseRoomSocketOptions): RoomSocket {
  const [status, setStatus] = useState<RoomConnectionStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [collaborators, setCollaborators] = useState<RoomCollaborator[]>([]);
  const [selfUserId, setSelfUserId] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const socketRef = useRef<WebSocket | null>(null);
  const joinedRef = useRef(false);
  const attemptsRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const shouldReconnectRef = useRef(true);
  const onMessageRef = useRef(onMessage);
  const queueRef = useRef<ClientMessage[]>([]);
  const canQueueRef = useRef(false);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const send = useCallback((message: ClientMessage): boolean => {
    const socket = socketRef.current;

    if (
      socket !== null &&
      socket.readyState === WebSocket.OPEN &&
      joinedRef.current
    ) {
      socket.send(JSON.stringify(message));
      return true;
    }

    // Still authenticating, joining or briefly reconnecting: draw locally now,
    // then flush in order as soon as the server confirms the join.
    if (canQueueRef.current) {
      if (queueRef.current.length >= MAX_QUEUED_MESSAGES) {
        queueRef.current.shift();
      }
      queueRef.current.push(message);
      return true;
    }

    return false;
  }, []);

  const retry = useCallback(() => {
    setRetryKey((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!enabled || !token || !roomId) return;

    let disposed = false;
    shouldReconnectRef.current = true;
    joinedRef.current = false;
    attemptsRef.current = 0;
    queueRef.current = [];
    canQueueRef.current = true;

    const activeToken = token;
    const activeRoomId = roomId;

    function scheduleReconnect(): void {
      if (disposed || !shouldReconnectRef.current) return;

      if (attemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
        canQueueRef.current = false;
        queueRef.current = [];
        setStatus("error");
        setError(
          "Lost the live connection to this room. Check your connection and try again.",
        );
        return;
      }

      attemptsRef.current += 1;
      const delay = Math.min(1000 * 2 ** (attemptsRef.current - 1), 15000);

      setStatus("reconnecting");
      setError(
        `Connection lost. Reconnecting in ${Math.max(
          1,
          Math.round(delay / 1000),
        )}s…`,
      );

      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        openSocket();
      }, delay);
    }

    function handleMessage(socket: WebSocket, raw: string): void {
      let parsed: unknown;

      try {
        parsed = JSON.parse(raw);
      } catch {
        return;
      }

      const result = ServerMessageSchema.safeParse(parsed);
      if (!result.success) return;

      const message = result.data;

      switch (message.type) {
        case "AUTH_OK":
          setSelfUserId(message.userId);
          setStatus("joining");
          socket.send(
            JSON.stringify({
              type: "JOIN_ROOM",
              roomId: activeRoomId,
            } satisfies ClientMessage),
          );
          break;

        case "AUTH_ERROR":
          shouldReconnectRef.current = false;
          canQueueRef.current = false;
          queueRef.current = [];
          setStatus("error");
          setError(
            message.message ||
              "Your session has expired. Please sign in again.",
          );
          socket.close(1000, "Authentication failed");
          break;

        case "ROOM_JOINED":
          joinedRef.current = true;
          attemptsRef.current = 0;
          setStatus("joined");
          setError(null);
          setCollaborators(message.collaborators);
          onMessageRef.current(message);

          // Flush strokes made while the handshake was in flight. Sending
          // directly keeps ordering and avoids re-queueing here.
          for (const queued of queueRef.current.splice(0)) {
            socket.send(JSON.stringify(queued));
          }
          break;

        case "USER_JOINED":
          setCollaborators((current) => {
            if (current.some((entry) => entry.userId === message.userId)) {
              return current;
            }
            return [...current, { userId: message.userId, name: message.name }];
          });
          onMessageRef.current(message);
          break;

        case "USER_LEFT":
          setCollaborators((current) =>
            current.filter((entry) => entry.userId !== message.userId),
          );
          onMessageRef.current(message);
          break;

        case "ERROR":
          if (!joinedRef.current) {
            shouldReconnectRef.current = false;
            canQueueRef.current = false;
            queueRef.current = [];
            setStatus("error");
            setError(message.message);
            socket.close(1000, "Room access denied");
          } else {
            setError(message.message);
          }
          onMessageRef.current(message);
          break;

        default:
          if (joinedRef.current) {
            onMessageRef.current(message);
          }
      }
    }

    function openSocket(): void {
      if (disposed) return;

      setStatus(attemptsRef.current === 0 ? "connecting" : "reconnecting");
      setError(null);
      setCollaborators([]);
      setSelfUserId(null);

      let socket: WebSocket;

      try {
        socket = new WebSocket(WS_URL);
      } catch {
        scheduleReconnect();
        return;
      }

      socketRef.current = socket;

      socket.onopen = () => {
        if (disposed) return;

        setStatus("authenticating");
        socket.send(
          JSON.stringify({
            type: "AUTH",
            token: activeToken,
          } satisfies ClientMessage),
        );
      };

      socket.onmessage = (event) => {
        handleMessage(socket, String(event.data));
      };

      socket.onerror = () => {
        // The browser follows this with a close event, which owns retries.
      };

      socket.onclose = () => {
        if (socketRef.current === socket) {
          socketRef.current = null;
        }

        joinedRef.current = false;

        if (disposed || !shouldReconnectRef.current) return;

        scheduleReconnect();
      };
    }

    openSocket();

    return () => {
      disposed = true;
      shouldReconnectRef.current = false;
      joinedRef.current = false;
      canQueueRef.current = false;
      queueRef.current = [];

      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      const socket = socketRef.current;
      socketRef.current = null;

      if (
        socket &&
        (socket.readyState === WebSocket.OPEN ||
          socket.readyState === WebSocket.CONNECTING)
      ) {
        socket.close(1000, "Leaving room");
      }
    };
  }, [enabled, token, roomId, retryKey]);

  const idle = !enabled || token === null || roomId === null;

  return {
    status: idle ? "idle" : status,
    error: idle ? null : error,
    collaborators: idle ? [] : collaborators,
    selfUserId: idle ? null : selfUserId,
    send,
    retry,
  };
}
