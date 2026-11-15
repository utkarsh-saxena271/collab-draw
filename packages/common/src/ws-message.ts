import { z } from "zod";

export const ShapeTypeEnum = z.enum(["RECTANGLE", "ELLIPSE", "LINE", "TEXT"]);
export type ShapeTypeEnum = z.infer<typeof ShapeTypeEnum>;

export const PointSchema = z.object({
  x: z.number(),
  y: z.number(),
});
export type Point = z.infer<typeof PointSchema>;

export const AuthMessageSchema = z.object({
  type: z.literal("AUTH"),
  token: z.string(),
});

export const JoinRoomMessageSchema = z.object({
  type: z.literal("JOIN_ROOM"),
  roomId: z.string(),
});

export const LeaveRoomMessageSchema = z.object({
  type: z.literal("LEAVE_ROOM"),
  roomId: z.string(),
});

export const ShapeCreateMessageSchema = z.object({
  type: z.literal("SHAPE_CREATE"),
  roomId: z.string(),
  // Client-generated id so the local optimistic shape and the persisted row
  // share one identity (needed for deletion).
  shapeId: z.string(),
  shapeType: ShapeTypeEnum,
  data: z.record(z.string(), z.any()), // shape-specific geometry (x, y, w, h, etc.)
  color: z.string(),
  strokeWidth: z.number(),
});

export const StrokeStartMessageSchema = z.object({
  type: z.literal("STROKE_START"),
  roomId: z.string(),
  strokeId: z.string(),
  color: z.string(),
  width: z.number(),
  startPoint: PointSchema,
});

export const StrokePointMessageSchema = z.object({
  type: z.literal("STROKE_POINT"),
  roomId: z.string(),
  strokeId: z.string(),
  points: z.array(PointSchema).min(1),
});

export const StrokeEndMessageSchema = z.object({
  type: z.literal("STROKE_END"),
  roomId: z.string(),
  strokeId: z.string(),
});

export const DeleteElementsMessageSchema = z.object({
  type: z.literal("DELETE_ELEMENTS"),
  roomId: z.string(),
  strokeIds: z.array(z.string()).max(500),
  shapeIds: z.array(z.string()).max(500),
});

export const MoveElementsMessageSchema = z.object({
  type: z.literal("MOVE_ELEMENTS"),
  roomId: z.string(),
  /** Shape IDs to move. */
  shapeIds: z.array(z.string()).max(500),
  /** Stroke IDs to move. */
  strokeIds: z.array(z.string()).max(500),
  /** Delta to apply in world coordinates. */
  dx: z.number(),
  dy: z.number(),
});

export const ClearCanvasMessageSchema = z.object({
  type: z.literal("CLEAR_CANVAS"),
  roomId: z.string(),
});

export const ClientMessageSchema = z.discriminatedUnion("type", [
  AuthMessageSchema,
  JoinRoomMessageSchema,
  LeaveRoomMessageSchema,
  ShapeCreateMessageSchema,
  StrokeStartMessageSchema,
  StrokePointMessageSchema,
  StrokeEndMessageSchema,
  DeleteElementsMessageSchema,
  MoveElementsMessageSchema,
  ClearCanvasMessageSchema,
]);
export type ClientMessage = z.infer<typeof ClientMessageSchema>;

export const AuthOkMessageSchema = z.object({
  type: z.literal("AUTH_OK"),
  userId: z.string(),
});

export const AuthErrorMessageSchema = z.object({
  type: z.literal("AUTH_ERROR"),
  message: z.string(),
});

export const RoomCollaboratorSchema = z.object({
  userId: z.string(),
  name: z.string(),
});
export type RoomCollaborator = z.infer<typeof RoomCollaboratorSchema>;

// Sent directly to a socket after its JOIN_ROOM was accepted.
export const RoomJoinedMessageSchema = z.object({
  type: z.literal("ROOM_JOINED"),
  roomId: z.string(),
  userId: z.string(),
  collaborators: z.array(RoomCollaboratorSchema),
});

export const UserJoinedMessageSchema = z.object({
  type: z.literal("USER_JOINED"),
  roomId: z.string(),
  userId: z.string(),
  name: z.string(),
});

export const UserLeftMessageSchema = z.object({
  type: z.literal("USER_LEFT"),
  roomId: z.string(),
  userId: z.string(),
});

export const ShapeCreatedMessageSchema = z.object({
  type: z.literal("SHAPE_CREATED"),
  roomId: z.string(),
  shapeId: z.string(),
  shapeType: ShapeTypeEnum,
  data: z.record(z.string(), z.any()),
  color: z.string(),
  strokeWidth: z.number(),
  createdById: z.string(),
});

export const StrokeStartedMessageSchema = z.object({
  type: z.literal("STROKE_STARTED"),
  roomId: z.string(),
  strokeId: z.string(),
  color: z.string(),
  width: z.number(),
  startPoint: PointSchema,
  createdById: z.string(),
});

export const StrokePointBroadcastSchema = z.object({
  type: z.literal("STROKE_POINT_BROADCAST"),
  roomId: z.string(),
  strokeId: z.string(),
  points: z.array(PointSchema),
});

export const StrokeEndedMessageSchema = z.object({
  type: z.literal("STROKE_ENDED"),
  roomId: z.string(),
  strokeId: z.string(),
});

export const ElementsDeletedMessageSchema = z.object({
  type: z.literal("ELEMENTS_DELETED"),
  roomId: z.string(),
  strokeIds: z.array(z.string()),
  shapeIds: z.array(z.string()),
  deletedById: z.string(),
});

export const ElementsMovedMessageSchema = z.object({
  type: z.literal("ELEMENTS_MOVED"),
  roomId: z.string(),
  shapeIds: z.array(z.string()),
  strokeIds: z.array(z.string()),
  dx: z.number(),
  dy: z.number(),
  movedById: z.string(),
});

export const CanvasClearedMessageSchema = z.object({
  type: z.literal("CANVAS_CLEARED"),
  roomId: z.string(),
  clearedById: z.string(),
});

export const ErrorMessageSchema = z.object({
  type: z.literal("ERROR"),
  message: z.string(),
});

export const ServerMessageSchema = z.discriminatedUnion("type", [
  AuthOkMessageSchema,
  AuthErrorMessageSchema,
  RoomJoinedMessageSchema,
  UserJoinedMessageSchema,
  UserLeftMessageSchema,
  ShapeCreatedMessageSchema,
  StrokeStartedMessageSchema,
  StrokePointBroadcastSchema,
  StrokeEndedMessageSchema,
  ElementsDeletedMessageSchema,
  ElementsMovedMessageSchema,
  CanvasClearedMessageSchema,
  ErrorMessageSchema,
]);
export type ServerMessage = z.infer<typeof ServerMessageSchema>;
