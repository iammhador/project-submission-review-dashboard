"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import type { Submission } from "@awi/shared";

import { Button, ButtonLink, Spinner } from "@/components/ui/button";
import { Field, FormAlert, Input, Textarea } from "@/components/ui/field";
import { ApiError, apiFetch } from "@/lib/api";

const DESCRIPTION_MAX = 5000;

export function SubmissionForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [description, setDescription] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setFormError(null);
    setFieldErrors({});

    const values = Object.fromEntries(new FormData(event.currentTarget));

    try {
      const submission = await apiFetch<Submission>("/api/submissions", {
        method: "POST",
        body: JSON.stringify(values),
      });
      router.push(`/dashboard/submissions/${submission.id}`);
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError && error.issues.length > 0) {
        setFieldErrors(error.fieldErrors());
      } else if (error instanceof ApiError && error.status === 409) {
        setFieldErrors({ repoUrl: error.message });
      } else {
        setFormError(
          error instanceof ApiError ? error.message : "Something went wrong.",
        );
      }
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {formError && <FormAlert>{formError}</FormAlert>}

      <Field id="title" label="Project title" error={fieldErrors.title}>
        <Input
          id="title"
          name="title"
          placeholder="Personal portfolio website"
          maxLength={120}
          required
          invalid={!!fieldErrors.title}
        />
      </Field>

      <Field
        id="description"
        label="Description"
        error={fieldErrors.description}
        hint={
          <span className="flex justify-between gap-4">
            <span>What does it do, what stack did you use, and where do you want feedback?</span>
            <span className="tabular-nums">
              {description.length}/{DESCRIPTION_MAX}
            </span>
          </span>
        }
      >
        <Textarea
          id="description"
          name="description"
          rows={6}
          maxLength={DESCRIPTION_MAX}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          required
          invalid={!!fieldErrors.description}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="repoUrl" label="Repository URL" error={fieldErrors.repoUrl}>
          <Input
            id="repoUrl"
            name="repoUrl"
            type="url"
            placeholder="https://github.com/you/project"
            required
            invalid={!!fieldErrors.repoUrl}
          />
        </Field>
        <Field id="liveUrl" label="Live demo URL" optional error={fieldErrors.liveUrl}>
          <Input
            id="liveUrl"
            name="liveUrl"
            type="url"
            placeholder="https://project.vercel.app"
            invalid={!!fieldErrors.liveUrl}
          />
        </Field>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
        <ButtonLink href="/dashboard" variant="secondary">
          Cancel
        </ButtonLink>
        <Button type="submit" disabled={pending}>
          {pending && <Spinner />}
          Submit for review
        </Button>
      </div>
    </form>
  );
}
