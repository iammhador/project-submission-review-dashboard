import { ZodError, type ZodType } from "zod";

import { HttpError } from "./http-error.js";

/** Validates unknown input and converts failures into a 422 HttpError. */
export function parse<S extends ZodType>(schema: S, value: unknown): S["_output"] {
  const result = schema.safeParse(value);

  if (!result.success) {
    throw new HttpError(422, "Validation failed", formatIssues(result.error));
  }

  return result.data;
}

export function formatIssues(error: ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join(".") || "(root)",
    message: issue.message,
  }));
}
