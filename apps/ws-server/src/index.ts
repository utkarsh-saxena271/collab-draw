import "dotenv/config";
import { WebSocketServer, WebSocket } from "ws";
import { ClientMessageSchema, AuthMessageSchema } from "@repo/common";
import { verifyAccessToken } from "./utils/token.utils";
import { registerAuthenticatedSocket, removeSocket, broadcastToRoom, getSocketState } from "./socket-manager";
import { handleClientMessage } from "./message-handlers";

const PORT = process.env.WS_PORT ? Number(process.env.WS_PORT) : 8080;
const wss = new WebSocketServer({ port: PORT });

wss.on("connection", (ws: WebSocket) => {
  let authenticated = false;

  ws.once("message", (raw) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw.toString());
    } catch {
      ws.send(JSON.stringify({ type: "AUTH_ERROR", message: "Invalid message format" }));
      ws.close();
      return;
    }

    const authResult = AuthMessageSchema.safeParse(parsed);
    if (!authResult.success) {
      ws.send(JSON.stringify({ type: "AUTH_ERROR", message: "First message must be AUTH" }));
      ws.close();
      return;
    }

    try {
      const payload = verifyAccessToken(authResult.data.token);
      registerAuthenticatedSocket(ws, payload.userId, payload.email);
      authenticated = true;
      ws.send(JSON.stringify({ type: "AUTH_OK", userId: payload.userId }));
    } catch {
      ws.send(JSON.stringify({ type: "AUTH_ERROR", message: "Invalid or expired token" }));
      ws.close();
      return;
    }

    ws.on("message", async (raw) => {
      if (!authenticated) return;

      let parsed: unknown;
      try {
        parsed = JSON.parse(raw.toString());
      } catch {
        ws.send(JSON.stringify({ type: "ERROR", message: "Invalid message format" }));
        return;
      }

      const result = ClientMessageSchema.safeParse(parsed);
      if (!result.success) {
        ws.send(JSON.stringify({ type: "ERROR", message: "Invalid message shape" }));
        return;
      }

      await handleClientMessage(ws, result.data);
    });
  });

  ws.on("close", () => {
    const state = getSocketState(ws);
    const roomId = removeSocket(ws);
    if (roomId && state) {
      broadcastToRoom(roomId, { type: "USER_LEFT", roomId, userId: state.userId });
    }
  });
});

console.log(`ws-server listening on port ${PORT}`);