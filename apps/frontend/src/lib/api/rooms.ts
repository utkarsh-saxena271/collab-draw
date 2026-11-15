import type {
  AcceptInvitationResponse,
  CreateRoomResponse,
  DeleteRoomResponse,
  GetRoomResponse,
  InviteMemberResponse,
  ListRoomsResponse,
} from "@/types/api";
import { apiFetch } from "./client";

export function listRooms(
  token: string,
  signal?: AbortSignal,
): Promise<ListRoomsResponse> {
  return apiFetch<ListRoomsResponse>("/api/rooms", { token, signal });
}

export function createRoom(
  token: string,
  input: { name: string },
): Promise<CreateRoomResponse> {
  return apiFetch<CreateRoomResponse>("/api/rooms", {
    method: "POST",
    token,
    body: input,
  });
}

export function getRoomBySlug(
  token: string,
  slug: string,
  signal?: AbortSignal,
): Promise<GetRoomResponse> {
  return apiFetch<GetRoomResponse>(`/api/rooms/${encodeURIComponent(slug)}`, {
    token,
    signal,
  });
}

export function inviteMember(
  token: string,
  roomId: string,
  input: { email: string },
): Promise<InviteMemberResponse> {
  return apiFetch<InviteMemberResponse>(
    `/api/rooms/${encodeURIComponent(roomId)}/invite`,
    { method: "POST", token, body: input },
  );
}

export function acceptInvitation(
  token: string,
  inviteToken: string,
): Promise<AcceptInvitationResponse> {
  return apiFetch<AcceptInvitationResponse>(
    `/api/rooms/invitations/${encodeURIComponent(inviteToken)}/accept`,
    { method: "POST", token },
  );
}

export function deleteRoom(
  token: string,
  roomId: string,
): Promise<DeleteRoomResponse> {
  return apiFetch<DeleteRoomResponse>(
    `/api/rooms/id/${encodeURIComponent(roomId)}`,
    { method: "DELETE", token },
  );
}
