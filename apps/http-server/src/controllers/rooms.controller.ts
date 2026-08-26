import { Request, Response } from "express";
import crypto from "crypto";
import prisma from "@repo/db";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name) || "room";
  let slug = base;
  let attempt = 0;

  while (true) {
    const existing = await prisma.room.findUnique({ where: { slug } });
    if (!existing) return slug;

    attempt++;
    const suffix = crypto.randomBytes(3).toString("hex");
    slug = `${base}-${suffix}`;

    if (attempt > 5) {
      return `${base}-${Date.now()}`;
    }
  }
}

export async function createRoom(
  req: Request,
  res: Response
){
  const { name } = req.body;
  const ownerId = req.user!.userId;

  const slug = await generateUniqueSlug(name ?? "untitled-room");

  const room = await prisma.room.create({
    data: {
      slug,
      name: name ?? null,
      ownerId,
    },
  });

  return res.status(201).json({ room });
}

export async function listRooms(req: Request, res: Response){
  const userId = req.user!.userId;

  const rooms = await prisma.room.findMany({
    where: {
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    },
    orderBy: { createdAt: "desc" },
  });

  return res.status(200).json({ rooms });
}

export async function getRoomBySlug(
  req: Request,
  res: Response
){
  const { slug } = req.params;
  const userId = req.user!.userId;

  const room = await prisma.room.findUnique({
    where: { slug },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
      shapes: true,
      strokes: true,
    },
  });

  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }

  const isOwner = room.ownerId === userId;
  const isMember = room.members.some((m: { userId: string }) => m.userId === userId);

  if (!isOwner && !isMember) {
    return res.status(403).json({ error: "You do not have access to this room" });
  }

  return res.status(200).json({ room });
}

export async function inviteToRoom(
  req: Request,
  res: Response
){
  const { roomId } = req.params;
  const { email } = req.body;
  const invitedById = req.user!.userId;

  if (!email) {
    return res.status(400).json({ error: "email is required" });
  }

  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }

  if (room.ownerId !== invitedById) {
    return res.status(403).json({ error: "Only the room owner can invite members" });
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

  await prisma.invitation.create({
    data: {
      roomId,
      invitedEmail: email,
      invitedById,
      tokenHash,
      expiresAt,
    },
  });

  return res.status(201).json({ inviteToken: rawToken, expiresAt });
}

export async function acceptInvitation(
  req: Request,
  res: Response
){
  const { token } = req.params;
  const userId = req.user!.userId;

  if (typeof token !== "string") {
    return res.status(400).json({ error: "Invalid invitation token" });
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const invitation = await prisma.invitation.findUnique({ where: { tokenHash } });

  if (!invitation) {
    return res.status(404).json({ error: "Invalid invitation" });
  }

  if (invitation.status !== "PENDING") {
    return res.status(410).json({ error: "Invitation already used or expired" });
  }

  if (invitation.expiresAt < new Date()) {
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "EXPIRED" },
    });
    return res.status(410).json({ error: "Invitation has expired" });
  }

  await prisma.$transaction([
    prisma.roomMember.upsert({
      where: { roomId_userId: { roomId: invitation.roomId, userId } },
      create: { roomId: invitation.roomId, userId, role: "EDITOR" },
      update: {},
    }),
    prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED" },
    }),
  ]);

  return res.status(200).json({ roomId: invitation.roomId });
}