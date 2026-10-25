"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import type { AuthResponse } from "@awi/shared";

import { Button, Spinner } from "@/components/ui/button";
import { Field, FormAlert, Input } from "@/components/ui/field";
import { ApiError, apiFetch } from "@/lib/api";

type Mode = "login" | "signup";

const copy: Record<Mode, { title: string; subtitle: string; submit: string }> = {
  login: {
    title: "Welcome back",
    subtitle: "Sign in to submit projects or review them.",
    submit: "Sign in",
  },
  signup: {
    title: "Create your account",
    subtitle: "Student accounts can submit projects for review.",
    submit: "Create account",
  },
};

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const text = copy[mode];

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setFormError(null);
    setFieldErrors({});

    const values = Object.fromEntries(new FormData(event.currentTarget));

    try {
      await apiFetch<AuthResponse>(`/api/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify(values),
      });
      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError && error.issues.length > 0) {
        setFieldErrors(error.fieldErrors());
      } else {
        setFormError(
          error instanceof ApiError ? error.message : "Something went wrong.",
        );
      }
      setPending(false);
    }
  }

  return (
    <>
      <h1 className="text-xl font-semibold tracking-tight text-slate-900">{text.title}</h1>
      <p className="mt-1 text-sm text-slate-500">{text.subtitle}</p>

      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
        {formError && <FormAlert>{formError}</FormAlert>}

        {mode === "signup" && (
          <Field id="name" label="Full name" error={fieldErrors.name}>
            <Input
              id="name"
              name="name"
              autoComplete="name"
              required
              invalid={!!fieldErrors.name}
            />
          </Field>
        )}

        <Field id="email" label="Email" error={fieldErrors.email}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            invalid={!!fieldErrors.email}
          />
        </Field>

        <Field
          id="password"
          label="Password"
          error={fieldErrors.password}
          hint={mode === "signup" ? "At least 8 characters." : undefined}
        >
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            required
            invalid={!!fieldErrors.password}
          />
        </Field>

        <Button type="submit" disabled={pending} className="w-full">
          {pending && <Spinner />}
          {text.submit}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        {mode === "login" ? (
          <>
            New here?{" "}
            <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Sign in
            </Link>
          </>
        )}
      </p>
    </>
  );
}
