import type { LoginInput, RegisterInput } from "@repo/common";
import type { AuthResponse, MeResponse } from "@/types/api";
import { apiFetch } from "./client";

export function loginRequest(input: LoginInput): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: input,
  });
}

export function signupRequest(input: RegisterInput): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/auth/signup", {
    method: "POST",
    body: input,
  });
}

export function meRequest(token: string): Promise<MeResponse> {
  return apiFetch<MeResponse>("/api/auth/me", { token });
}
