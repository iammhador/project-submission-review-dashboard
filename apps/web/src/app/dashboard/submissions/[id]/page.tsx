import type { Metadata } from "next";
import Link from "next/link";

import type { Submission } from "@awi/shared";

import { ReviewForm } from "@/components/review-form";
import { StatusBadge } from "@/components/status-badge";
import { displayUrl, formatDate, formatDateTime } from "@/lib/format";
import { getCurrentUser, serverFetch } from "@/lib/session";

export const metadata: Metadata = { title: "Submission" };

export default async function SubmissionPage({
  params,
}: PageProps<"/dashboard/submissions/[id]">) {
  const { id } = await params;
  const [user, submission] = await Promise.all([
    getCurrentUser(),
    serverFetch<Submission>(`/api/submissions/${encodeURIComponent(id)}`),
  ]);
  const { review } = submission;
  const canReview = user?.role === "MENTOR" && submission.status === "PENDING";

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-900">
        ← Back to {user?.role === "MENTOR" ? "review queue" : "submissions"}
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight break-words text-slate-900">
            {submission.title}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Submitted by {submission.student.name} on {formatDate(submission.createdAt)}
          </p>
        </div>
        <StatusBadge status={submission.status} />
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_16rem]">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Description</h2>
          <p className="mt-3 text-sm leading-6 break-words whitespace-pre-wrap text-slate-700">
            {submission.description}
          </p>
        </section>

        <aside className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 text-sm shadow-sm">
          <LinkRow label="Repository" href={submission.repoUrl} />
          {submission.liveUrl ? (
            <LinkRow label="Live demo" href={submission.liveUrl} />
          ) : (
            <div>
              <p className="text-slate-500">Live demo</p>
              <p className="mt-0.5 text-slate-400">Not provided</p>
            </div>
          )}
          <div>
            <p className="text-slate-500">Last updated</p>
            <p className="mt-0.5 text-slate-900">{formatDateTime(submission.updatedAt)}</p>
          </div>
        </aside>
      </div>

      {canReview ? (
        <ReviewForm submissionId={submission.id} />
      ) : (
        <section
          className={`mt-6 rounded-xl border p-6 ${
            !review
              ? "border-slate-200 bg-white"
              : review.decision === "APPROVED"
                ? "border-emerald-200 bg-emerald-50/60"
                : "border-rose-200 bg-rose-50/60"
          }`}
        >
          <h2 className="text-sm font-semibold text-slate-900">Mentor review</h2>
          {review ? (
            <>
              <p className="mt-1 text-sm text-slate-600">
                {review.decision === "APPROVED" ? "Approved" : "Changes requested"} by{" "}
                <span className="font-medium text-slate-900">{review.reviewer.name}</span> on{" "}
                {formatDateTime(review.reviewedAt)}
              </p>
              <p className="mt-4 text-sm leading-6 break-words whitespace-pre-wrap text-slate-700">
                {review.note || "No note was left with this review."}
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm text-slate-500">
              Waiting for a mentor to pick this up. You&apos;ll see their decision
              and feedback here.
            </p>
          )}
        </section>
      )}
    </div>
  );
}

function LinkRow({ label, href }: { label: string; href: string }) {
  return (
    <div>
      <p className="text-slate-500">{label}</p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-0.5 block truncate font-medium text-indigo-600 hover:text-indigo-500"
      >
        {displayUrl(href)} ↗
      </a>
    </div>
  );
}
