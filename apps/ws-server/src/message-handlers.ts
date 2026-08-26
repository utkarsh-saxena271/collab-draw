import { WebSocket } from "ws";
import prisma, { Prisma } from "@repo/db";
import { ClientMessage, ServerMessage } from "@repo/common";
import {
  getSocketState,
  joinRoom,
  leaveRoom,
  broadcastToRoom,
} from "./socket-manager";
import { startStroke, appendStrokePoints, endStroke } from "./stroke-buffer";

function send(ws: WebSocket, message: ServerMessage): void {
  ws.send(JSON.stringify(message));
}

export async function handleClientMessage(
  ws: WebSocket,
  message: ClientMessage
): Promise<void> {
  const state = getSocketState(ws);
  if (!state) return;

  switch (message.type) {
    case "JOIN_ROOM": {
      const room = await prisma.room.findUnique({ where: { id: message.roomId } });
      if (!room) {
        send(ws, { type: "ERROR", message: "Room not found" });
        return;
      }

      const isOwner = room.ownerId === state.userId;
      const isMember = await prisma.roomMember.findUnique({
        where: { roomId_userId: { roomId: message.roomId, userId: state.userId } },
      });

      if (!isOwner && !isMember) {
        send(ws, { type: "ERROR", message: "You do not have access to this room" });
        return;
      }

      joinRoom(ws, message.roomId);
      broadcastToRoom(
        message.roomId,
        { type: "USER_JOINED", roomId: message.roomId, userId: state.userId, name: state.email },
        ws
      );
      break;
    }

    case "LEAVE_ROOM": {
      const roomId = leaveRoom(ws);
      if (roomId) {
        broadcastToRoom(roomId, { type: "USER_LEFT", roomId, userId: state.userId });
      }
      break;
    }

    case "SHAPE_CREATE": {
      if (state.roomId !== message.roomId) {
        send(ws, { type: "ERROR", message: "Not joined to this room" });
        return;
      }

      const shape = await prisma.shape.create({
        data: {
          roomId: message.roomId,
          type: message.shapeType,
          data: message.data as Prisma.InputJsonValue,
          color: message.color,
          strokeWidth: message.strokeWidth,
          createdById: state.userId,
        },
      });

      broadcastToRoom(message.roomId, {
        type: "SHAPE_CREATED",
        roomId: message.roomId,
        shapeId: shape.id,
        shapeType: message.shapeType,
        data: message.data,
        color: message.color,
        strokeWidth: message.strokeWidth,
        createdById: state.userId,
      });
      break;
    }

    case "STROKE_START": {
      if (state.roomId !== message.roomId) {
        send(ws, { type: "ERROR", message: "Not joined to this room" });
        return;
      }

      startStroke(
        message.strokeId,
        message.roomId,
        state.userId,
        message.color,
        message.width,
        message.startPoint
      );

      broadcastToRoom(message.roomId, {
        type: "STROKE_STARTED",
        roomId: message.roomId,
        strokeId: message.strokeId,
        color: message.color,
        width: message.width,
        startPoint: message.startPoint,
        createdById: state.userId,
      });
      break;
    }

    case "STROKE_POINT": {
      if (state.roomId !== message.roomId) return;

      appendStrokePoints(message.strokeId, message.points);

      broadcastToRoom(
        message.roomId,
        {
          type: "STROKE_POINT_BROADCAST",
          roomId: message.roomId,
          strokeId: message.strokeId,
          points: message.points,
        },
        ws
      );
      break;
    }

    case "STROKE_END": {
      if (state.roomId !== message.roomId) return;

      const stroke = endStroke(message.strokeId);
      if (stroke) {
        await prisma.stroke.create({
          data: {
            roomId: stroke.roomId,
            points: stroke.points,
            color: stroke.color,
            width: stroke.width,
            createdById: stroke.createdById,
          },
        });
      }

      broadcastToRoom(message.roomId, {
        type: "STROKE_ENDED",
        roomId: message.roomId,
        strokeId: message.strokeId,
      });
      break;
    }
  }
}