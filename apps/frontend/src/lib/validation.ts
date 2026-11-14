import type { ZodError } from "zod";

export type FieldErrors = Record<string, string>;

export function getFieldErrors(error: ZodError): FieldErrors {
  const result: FieldErrors = {};

  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !result[key]) {
      result[key] = issue.message;
    }
  }

  return result;
}
