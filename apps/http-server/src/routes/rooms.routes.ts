import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { acceptInvitation, createRoom, getRoomBySlug, inviteToRoom, listRooms } from "../controllers/rooms.controller";

const roomRouter: Router = Router()

roomRouter.post("/", authMiddleware, createRoom);
roomRouter.get("/", authMiddleware, listRooms);
roomRouter.get("/:slug", authMiddleware, getRoomBySlug);
roomRouter.post("/:roomId/invite", authMiddleware, inviteToRoom);
roomRouter.post("/invitations/:token/accept", authMiddleware, acceptInvitation);

export default roomRouter