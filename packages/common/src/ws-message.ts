import { z } from "zod";

export const ShapeTypeEnum = z.enum(["RECTANGLE", "ELLIPSE", "LINE"]);
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

export const ClientMessageSchema = z.discriminatedUnion("type", [
  AuthMessageSchema,
  JoinRoomMessageSchema,
  LeaveRoomMessageSchema,
  ShapeCreateMessageSchema,
  StrokeStartMessageSchema,
  StrokePointMessageSchema,
  StrokeEndMessageSchema,
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

export const ErrorMessageSchema = z.object({
  type: z.literal("ERROR"),
  message: z.string(),
});

export const ServerMessageSchema = z.discriminatedUnion("type", [
  AuthOkMessageSchema,
  AuthErrorMessageSchema,
  UserJoinedMessageSchema,
  UserLeftMessageSchema,
  ShapeCreatedMessageSchema,
  StrokeStartedMessageSchema,
  StrokePointBroadcastSchema,
  StrokeEndedMessageSchema,
  ErrorMessageSchema,
]);
export type ServerMessage = z.infer<typeof ServerMessageSchema>;