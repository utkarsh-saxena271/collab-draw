import { z } from "zod";

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
export type LoginInput = z.infer<typeof LoginSchema>;

// Decoded JWT payload shape — keep this in sync with what http-server signs
// and what ws-server verifies on the AUTH handshake.
export const AccessTokenPayloadSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
});
export type AccessTokenPayload = z.infer<typeof AccessTokenPayloadSchema>;