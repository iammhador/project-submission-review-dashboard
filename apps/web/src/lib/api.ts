export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export interface FieldIssue {
  path: string;
  message: string;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly issues: FieldIssue[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }

  /** First validation message per field, keyed by the field name. */
  fieldErrors(): Record<string, string> {
    const errors: Record<string, string> = {};
    for (const issue of this.issues) {
      errors[issue.path] ??= issue.message;
    }
    return errors;
  }
}

/**
 * Calls the Express API. Works in the browser (the session cookie is sent via
 * `credentials: "include"`) and on the server (pass the token explicitly).
 */
export async function apiFetch<T>(
  path: string,
  { token, ...init }: RequestInit & { token?: string } = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set("content-type", "application/json");
  if (token) headers.set("authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers,
      credentials: "include",
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      0,
      "Can't reach the server. Check that the API is running and try again.",
    );
  }

  if (response.status === 204) return undefined as T;

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const error = body?.error;
    throw new ApiError(
      response.status,
      error?.message ?? "Something went wrong. Please try again.",
      Array.isArray(error?.details) ? error.details : [],
    );
  }

  return body as T;
}
