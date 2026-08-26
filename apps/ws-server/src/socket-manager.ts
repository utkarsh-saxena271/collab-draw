import { WebSocket } from "ws";

export interface SocketState {
  userId: string;
  email: string;
  roomId: string | null;
}

const socketState = new Map<WebSocket, SocketState>();
const roomSockets = new Map<string, Set<WebSocket>>();

export function registerAuthenticatedSocket(ws: WebSocket, userId: string, email: string): void {
  socketState.set(ws, { userId, email, roomId: null });
}

export function getSocketState(ws: WebSocket): SocketState | undefined {
  return socketState.get(ws);
}

export function joinRoom(ws: WebSocket, roomId: string): void {
  const state = socketState.get(ws);
  if (!state) return;

  if (state.roomId) {
    leaveRoom(ws);
  }

  state.roomId = roomId;

  if (!roomSockets.has(roomId)) {
    roomSockets.set(roomId, new Set());
  }
  roomSockets.get(roomId)!.add(ws);
}

export function leaveRoom(ws: WebSocket): string | null {
  const state = socketState.get(ws);
  if (!state || !state.roomId) return null;

  const roomId = state.roomId;
  const sockets = roomSockets.get(roomId);
  if (sockets) {
    sockets.delete(ws);
    if (sockets.size === 0) {
      roomSockets.delete(roomId);
    }
  }

  state.roomId = null;
  return roomId;
}

export function removeSocket(ws: WebSocket): string | null {
  const roomId = leaveRoom(ws);
  socketState.delete(ws);
  return roomId;
}

export function broadcastToRoom(roomId: string, message: unknown, exclude?: WebSocket): void {
  const sockets = roomSockets.get(roomId);
  if (!sockets) return;

  const payload = JSON.stringify(message);
  for (const socket of sockets) {
    if (socket !== exclude && socket.readyState === WebSocket.OPEN) {
      socket.send(payload);
    }
  }
}