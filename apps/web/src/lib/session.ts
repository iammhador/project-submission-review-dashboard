import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { AUTH_COOKIE_NAME, type UserSummary } from "@awi/shared";

import { ApiError, apiFetch } from "./api";

async function sessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value;
}

/**
 * The signed-in user, or null when there is no valid session. Cached per
 * request so layouts and pages can both call it without refetching.
 */
export const getCurrentUser = cache(async (): Promise<UserSummary | null> => {
  const token = await sessionToken();
  if (!token) return null;

  try {
    const { user } = await apiFetch<{ user: UserSummary }>("/api/auth/me", {
      token,
    });
    return user;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
});

/**
 * Server-side API call on behalf of the signed-in user. Redirects to the
 * login page when the session is missing or expired, and renders the 404
 * page when the resource doesn't exist or isn't visible to this user.
 */
export async function serverFetch<T>(path: string): Promise<T> {
  const token = await sessionToken();
  if (!token) redirect("/login");

  try {
    return await apiFetch<T>(path, { token });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect("/login");
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}
