import jwt from "jsonwebtoken";
import { AccessTokenPayload } from "@repo/common";
import { envConfig } from "../config/env.config";

const JWT_SECRET = envConfig.JWT_SECRET as string;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set in environment variables");
}

const ACCESS_TOKEN_EXPIRY = "15m";

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, JWT_SECRET);
  return decoded as AccessTokenPayload;
}