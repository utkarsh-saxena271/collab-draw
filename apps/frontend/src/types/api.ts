import type { ShapeTypeEnum } from "@repo/common";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  createdAt?: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export interface MeResponse {
  user: AuthUser;
}

export interface RoomSummary {
  id: string;
  slug: string;
  name: string | null;
  ownerId: string;
  createdAt: string;
}

export type RoomRole = "OWNER" | "EDITOR";

export interface RoomMemberDto {
  id: string;
  roomId: string;
  userId: string;
  role: RoomRole;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ShapeDto {
  id: string;
  roomId: string;
  type: ShapeTypeEnum;
  data: unknown;
  color: string;
  strokeWidth: number;
  createdById: string;
  createdAt: string;
}

export interface StrokeDto {
  id: string;
  roomId: string;
  points: unknown;
  color: string;
  width: number;
  offsetX: number;
  offsetY: number;
  createdById: string;
  createdAt: string;
}

export interface RoomDetailDto extends RoomSummary {
  members: RoomMemberDto[];
  shapes: ShapeDto[];
  strokes: StrokeDto[];
}

export interface CreateRoomResponse {
  room: RoomSummary;
}

export interface ListRoomsResponse {
  rooms: RoomSummary[];
}

export interface GetRoomResponse {
  room: RoomDetailDto;
}

export interface InviteMemberResponse {
  inviteToken: string;
  expiresAt: string;
}

export interface AcceptInvitationResponse {
  roomId: string;
}

export interface DeleteRoomResponse {
  deletedRoomId: string;
}
