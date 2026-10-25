import { afterEach, describe, expect, it, vi } from "vitest";

import { API_URL, ApiError, apiFetch } from "./api";

function mockFetch(response: Response | Error) {
  const fetchMock = vi.fn(() =>
    response instanceof Error ? Promise.reject(response) : Promise.resolve(response),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiFetch", () => {
  it("sends JSON with credentials and an optional bearer token", async () => {
    const fetchMock = mockFetch(json(200, { ok: true }));

    const result = await apiFetch<{ ok: boolean }>("/api/thing", {
      method: "POST",
      body: JSON.stringify({ a: 1 }),
      token: "abc",
    });

    expect(result).toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const headers = new Headers(init.headers);
    expect(url).toBe(`${API_URL}/api/thing`);
    expect(init.credentials).toBe("include");
    expect(headers.get("content-type")).toBe("application/json");
    expect(headers.get("authorization")).toBe("Bearer abc");
  });

  it("returns undefined for 204 No Content", async () => {
    mockFetch(new Response(null, { status: 204 }));

    await expect(apiFetch("/api/auth/logout", { method: "POST" })).resolves.toBeUndefined();
  });

  it("turns API validation errors into an ApiError with field errors", async () => {
    mockFetch(
      json(422, {
        error: {
          message: "Validation failed",
          details: [
            { path: "email", message: "Enter a valid email address" },
            { path: "email", message: "A second email problem" },
            { path: "password", message: "Too short" },
          ],
        },
      }),
    );

    const error = await apiFetch("/api/auth/signup").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(422);
    expect((error as ApiError).fieldErrors()).toEqual({
      email: "Enter a valid email address",
      password: "Too short",
    });
  });

  it("falls back to a generic message when the error body is not JSON", async () => {
    mockFetch(new Response("<html>Bad gateway</html>", { status: 502 }));

    const error = (await apiFetch("/api/x").catch((e: unknown) => e)) as ApiError;

    expect(error.status).toBe(502);
    expect(error.message).toMatch(/something went wrong/i);
    expect(error.issues).toEqual([]);
  });

  it("reports an unreachable server as status 0", async () => {
    mockFetch(new TypeError("fetch failed"));

    const error = (await apiFetch("/api/x").catch((e: unknown) => e)) as ApiError;

    expect(error.status).toBe(0);
    expect(error.message).toMatch(/can't reach the server/i);
  });
});
