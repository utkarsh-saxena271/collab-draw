import { Router } from "express";
import { login, signup, me } from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const authRouter: Router = Router()

authRouter.post('/signup', signup)
authRouter.post('/login', login)
authRouter.get('/me', authMiddleware, me)

export default authRouter