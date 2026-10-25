import type { Metadata } from "next";
import Link from "next/link";

import type { Paginated, Submission } from "@awi/shared";

import { MentorQueue, parseMentorFilters } from "@/components/mentor-queue";
import { StatusBadge } from "@/components/status-badge";
import { ButtonLink } from "@/components/ui/button";
import { displayUrl, formatDate } from "@/lib/format";
import { getCurrentUser, serverFetch } from "@/lib/session";

export const metadata: Metadata = { title: "Dashboard" };

const PAGE_SIZE = 10;

export default async function DashboardPage({
  searchParams,
}: PageProps<"/dashboard">) {
  const user = await getCurrentUser();
  const params = await searchParams;
  if (user?.role === "MENTOR") {
    return <MentorQueue filters={parseMentorFilters(params)} />;
  }

  const { page: pageParam } = params;
  const page = Math.max(1, Number(pageParam) || 1);
  const result = await serverFetch<Paginated<Submission>>(
    `/api/submissions/mine?page=${page}&pageSize=${PAGE_SIZE}`,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Your submissions
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {result.total === 0
              ? "Nothing submitted yet."
              : `${result.total} project${result.total === 1 ? "" : "s"} submitted`}
          </p>
        </div>
        {result.total > 0 && (
          <ButtonLink href="/dashboard/submissions/new">
            <PlusIcon />
            New submission
          </ButtonLink>
        )}
      </div>

      {result.total === 0 ? (
        <EmptyState />
      ) : (
        <>
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {result.items.map((submission) => (
              <li key={submission.id}>
                <Link
                  href={`/dashboard/submissions/${submission.id}`}
                  className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">
                      {submission.title}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-slate-500">
                      {displayUrl(submission.repoUrl)} · Submitted{" "}
                      {formatDate(submission.createdAt)}
                    </p>
                    {submission.review?.note && (
                      <p className="mt-2 line-clamp-1 text-sm text-slate-600">
                        <span className="font-medium text-slate-700">
                          {submission.review.reviewer.name}:
                        </span>{" "}
                        {submission.review.note}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0">
                    <StatusBadge status={submission.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {result.totalPages > 1 && (
            <nav className="flex items-center justify-between text-sm text-slate-500">
              <span>
                Page {result.page} of {result.totalPages}
              </span>
              <div className="flex gap-2">
                {page > 1 && (
                  <ButtonLink href={`/dashboard?page=${page - 1}`} variant="secondary" size="sm">
                    Previous
                  </ButtonLink>
                )}
                {page < result.totalPages && (
                  <ButtonLink href={`/dashboard?page=${page + 1}`} variant="secondary" size="sm">
                    Next
                  </ButtonLink>
                )}
              </div>
            </nav>
          )}
        </>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-indigo-50 text-indigo-600">
        <PlusIcon className="size-6" />
      </span>
      <h2 className="mt-4 font-semibold text-slate-900">Submit your first project</h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
        Add your repository and a short description. A mentor will review it
        and leave feedback here.
      </p>
      <ButtonLink href="/dashboard/submissions/new" className="mt-6">
        New submission
      </ButtonLink>
    </div>
  );
}

function PlusIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
    </svg>
  );
}
