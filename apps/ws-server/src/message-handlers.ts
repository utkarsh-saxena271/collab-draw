import { WebSocket } from "ws";
import prisma, { Prisma } from "@repo/db";
import { ClientMessage, ServerMessage } from "@repo/common";
import {
  getSocketState,
  joinRoom,
  leaveRoom,
  broadcastToRoom,
  getRoomCollaborators,
} from "./socket-manager";
import {
  startStroke,
  appendStrokePoints,
  endStroke,
  removeActiveStrokes,
  clearActiveStrokes,
} from "./stroke-buffer";

function send(ws: WebSocket, message: ServerMessage): void {
  ws.send(JSON.stringify(message));
}

export async function handleClientMessage(
  ws: WebSocket,
  message: ClientMessage,
): Promise<void> {
  const state = getSocketState(ws);
  if (!state) return;

  switch (message.type) {
    case "JOIN_ROOM": {
      // One round-trip: remote database latency made a serialised room lookup
      // plus membership lookup take several seconds before the first join.
      const room = await prisma.room.findUnique({
        where: { id: message.roomId },
        include: {
          members: {
            where: { userId: state.userId },
            select: { userId: true },
          },
        },
      });

      if (!room) {
        send(ws, { type: "ERROR", message: "Room not found" });
        return;
      }

      const isOwner = room.ownerId === state.userId;
      const isMember = room.members.length > 0;

      if (!isOwner && !isMember) {
        send(ws, {
          type: "ERROR",
          message: "You do not have access to this room",
        });
        return;
      }

      joinRoom(ws, message.roomId);
      send(ws, {
        type: "ROOM_JOINED",
        roomId: message.roomId,
        userId: state.userId,
        collaborators: getRoomCollaborators(message.roomId),
      });
      broadcastToRoom(
        message.roomId,
        {
          type: "USER_JOINED",
          roomId: message.roomId,
          userId: state.userId,
          name: state.email,
        },
        ws,
      );
      break;
    }

    case "LEAVE_ROOM": {
      const roomId = leaveRoom(ws);
      if (roomId) {
        broadcastToRoom(roomId, {
          type: "USER_LEFT",
          roomId,
          userId: state.userId,
        });
      }
      break;
    }

    case "SHAPE_CREATE": {
      if (state.roomId !== message.roomId) {
        send(ws, { type: "ERROR", message: "Not joined to this room" });
        return;
      }

      const shape = await prisma.shape.upsert({
        where: { id: message.shapeId },
        update: {
          roomId: message.roomId,
          type: message.shapeType,
          data: message.data as Prisma.InputJsonValue,
          color: message.color,
          strokeWidth: message.strokeWidth,
          createdById: state.userId,
        },
        create: {
          id: message.shapeId,
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
        message.startPoint,
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
        ws,
      );
      break;
    }

    case "STROKE_END": {
      if (state.roomId !== message.roomId) return;

      const stroke = endStroke(message.strokeId);
      if (stroke) {
        await prisma.stroke.create({
          data: {
            id: message.strokeId,
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

    case "DELETE_ELEMENTS": {
      if (state.roomId !== message.roomId) {
        send(ws, { type: "ERROR", message: "Not joined to this room" });
        return;
      }

      const { strokeIds, shapeIds } = message;
      if (strokeIds.length === 0 && shapeIds.length === 0) return;

      // Scope every delete to the room so a member cannot remove elements from
      // another room by guessing ids.
      await prisma.$transaction([
        prisma.stroke.deleteMany({
          where: { roomId: message.roomId, id: { in: strokeIds } },
        }),
        prisma.shape.deleteMany({
          where: { roomId: message.roomId, id: { in: shapeIds } },
        }),
      ]);

      removeActiveStrokes(strokeIds);

      broadcastToRoom(message.roomId, {
        type: "ELEMENTS_DELETED",
        roomId: message.roomId,
        strokeIds,
        shapeIds,
        deletedById: state.userId,
      });
      break;
    }

    case "CLEAR_CANVAS": {
      if (state.roomId !== message.roomId) {
        send(ws, { type: "ERROR", message: "Not joined to this room" });
        return;
      }

      const room = await prisma.room.findUnique({
        where: { id: message.roomId },
        select: { ownerId: true },
      });

      if (!room) {
        send(ws, { type: "ERROR", message: "Room not found" });
        return;
      }

      if (room.ownerId !== state.userId) {
        send(ws, {
          type: "ERROR",
          message: "Only the room owner can clear the canvas",
        });
        return;
      }

      await prisma.$transaction([
        prisma.stroke.deleteMany({ where: { roomId: message.roomId } }),
        prisma.shape.deleteMany({ where: { roomId: message.roomId } }),
      ]);

      clearActiveStrokes(message.roomId);

      broadcastToRoom(message.roomId, {
        type: "CANVAS_CLEARED",
        roomId: message.roomId,
        clearedById: state.userId,
      });
      break;
    }

    case "MOVE_ELEMENTS": {
      if (state.roomId !== message.roomId) {
        send(ws, { type: "ERROR", message: "Not joined to this room" });
        return;
      }

      const { shapeIds, strokeIds, dx, dy } = message;
      if (shapeIds.length === 0 && strokeIds.length === 0) return;

      const updates: Promise<unknown>[] = [];

      // For shapes: update geometry in the JSON `data` field.
      // We fetch each shape individually so we can apply the delta.
      if (shapeIds.length > 0) {
        const shapes = await prisma.shape.findMany({
          where: { roomId: message.roomId, id: { in: shapeIds } },
          select: { id: true, type: true, data: true },
        });

        for (const shape of shapes) {
          const data = shape.data as Record<string, number>;
          let updated: Record<string, number>;

          if (shape.type === "LINE") {
            updated = {
              ...data,
              x1: (data.x1 ?? 0) + dx,
              y1: (data.y1 ?? 0) + dy,
              x2: (data.x2 ?? 0) + dx,
              y2: (data.y2 ?? 0) + dy,
            };
          } else {
            // RECTANGLE, ELLIPSE, TEXT
            updated = {
              ...data,
              x: (data.x ?? 0) + dx,
              y: (data.y ?? 0) + dy,
            };
          }

          updates.push(
            prisma.shape.update({
              where: { id: shape.id },
              data: { data: updated as Prisma.InputJsonValue },
            })
          );
        }
      }

      // For strokes: accumulate the offset columns.
      if (strokeIds.length > 0) {
        updates.push(
          prisma.stroke.updateMany({
            where: { roomId: message.roomId, id: { in: strokeIds } },
            data: {
              offsetX: { increment: dx },
              offsetY: { increment: dy },
            },
          })
        );
      }

      await Promise.all(updates);

      broadcastToRoom(
        message.roomId,
        {
          type: "ELEMENTS_MOVED",
          roomId: message.roomId,
          shapeIds,
          strokeIds,
          dx,
          dy,
          movedById: state.userId,
        },
        ws,
      );
      break;
    }
  }
}
