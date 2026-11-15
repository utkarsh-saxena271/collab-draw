// Centralised runtime configuration. Only NEXT_PUBLIC_* values are exposed to
// the browser, and none of them contain secrets (the JWT is issued at runtime).
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000"
).replace(/\/+$/, "");

export const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080";
