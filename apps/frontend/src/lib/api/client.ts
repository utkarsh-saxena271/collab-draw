import { API_BASE_URL } from "@/lib/config";

export const AUTH_UNAUTHORIZED_EVENT = "collabdraw:unauthorized";

export class ApiError extends Error {
  readonly status: number;
  readonly details: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isNetworkError(): boolean {
    return this.status === 0;
  }
}

interface ApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal;
}

function extractErrorMessage(payload: unknown, status: number): string {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;

    if (typeof record.error === "string" && record.error.trim()) {
      return record.error;
    }

    if (typeof record.message === "string" && record.message.trim()) {
      return record.message;
    }

    if (Array.isArray(record.details)) {
      const firstIssue = record.details.find(
        (issue): issue is { message: string } =>
          Boolean(
            issue &&
              typeof issue === "object" &&
              typeof (issue as { message?: unknown }).message === "string"
          )
      );
      if (firstIssue) return firstIssue.message;
    }
  }

  if (status === 0) {
    return "Unable to reach the server. Check your connection and try again.";
  }

  return `Request failed (${status}). Please try again.`;
}

function notifyUnauthorized(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
  }
}

export async function apiFetch<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    throw new ApiError(0, extractErrorMessage(null, 0));
  }

  let payload: unknown = null;
  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    payload = await response.json().catch(() => null);
  }

  if (!response.ok) {
    if (response.status === 401 && options.token) {
      notifyUnauthorized();
    }

    throw new ApiError(
      response.status,
      extractErrorMessage(payload, response.status),
      payload
    );
  }

  return payload as T;
}
