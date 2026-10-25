"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { ReviewDecision, Submission } from "@awi/shared";

import { Button, Spinner } from "@/components/ui/button";
import { Field, FormAlert, Textarea } from "@/components/ui/field";
import { ApiError, apiFetch } from "@/lib/api";

const NOTE_MAX = 2000;

export function ReviewForm({ submissionId }: { submissionId: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [pending, setPending] = useState<ReviewDecision | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [noteError, setNoteError] = useState<string | undefined>();

  async function submit(decision: ReviewDecision) {
    setPending(decision);
    setFormError(null);
    setNoteError(undefined);

    try {
      await apiFetch<Submission>(
        `/api/submissions/${encodeURIComponent(submissionId)}/review`,
        { method: "POST", body: JSON.stringify({ decision, note }) },
      );
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError && error.issues.length > 0) {
        setNoteError(error.fieldErrors().note);
        if (!error.fieldErrors().note) setFormError(error.message);
      } else if (error instanceof ApiError && error.status === 409) {
        // Someone else got there first; show the recorded review.
        router.refresh();
      } else {
        setFormError(error instanceof ApiError ? error.message : "Something went wrong.");
      }
    } finally {
      setPending(null);
    }
  }

  return (
    <section className="mt-6 rounded-xl border border-indigo-200 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Your review</h2>
      <p className="mt-1 text-sm text-slate-500">
        The student will see your decision and note. A note is required when
        requesting changes.
      </p>

      <div className="mt-4 space-y-4">
        {formError && <FormAlert>{formError}</FormAlert>}

        <Field
          id="note"
          label="Note to the student"
          error={noteError}
          hint={
            <span className="flex justify-end tabular-nums">
              {note.length}/{NOTE_MAX}
            </span>
          }
        >
          <Textarea
            id="note"
            rows={5}
            maxLength={NOTE_MAX}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="What works well, and what should they improve?"
            invalid={!!noteError}
          />
        </Field>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            variant="danger"
            disabled={pending !== null}
            onClick={() => submit("REJECTED")}
          >
            {pending === "REJECTED" && <Spinner />}
            Request changes
          </Button>
          <Button
            variant="success"
            disabled={pending !== null}
            onClick={() => submit("APPROVED")}
          >
            {pending === "APPROVED" && <Spinner />}
            Approve
          </Button>
        </div>
      </div>
    </section>
  );
}
