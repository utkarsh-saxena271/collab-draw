import jwt from "jsonwebtoken";
import { AccessTokenPayload } from "@repo/common";

const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set in environment variables");
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, JWT_SECRET);
  return decoded as AccessTokenPayload;
}