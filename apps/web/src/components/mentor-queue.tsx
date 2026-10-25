import Link from "next/link";

import {
  SUBMISSION_STATUSES,
  type Paginated,
  type Submission,
  type SubmissionStats,
  type SubmissionStatus,
} from "@awi/shared";

import { StatusBadge } from "@/components/status-badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { displayUrl, formatDate } from "@/lib/format";
import { serverFetch } from "@/lib/session";

const PAGE_SIZE = 10;

interface Filters {
  status?: SubmissionStatus;
  q?: string;
  page: number;
}

const tabs: { label: string; status?: SubmissionStatus; stat: keyof SubmissionStats }[] = [
  { label: "Pending", status: "PENDING", stat: "pending" },
  { label: "Approved", status: "APPROVED", stat: "approved" },
  { label: "Changes requested", status: "REJECTED", stat: "rejected" },
  { label: "All", stat: "total" },
];

function dashboardHref({ status, q, page }: Partial<Filters>) {
  const params = new URLSearchParams();
  params.set("status", status ?? "ALL");
  if (q) params.set("q", q);
  if (page && page > 1) params.set("page", String(page));
  return `/dashboard?${params}`;
}

/** Reads mentor filters from the URL; the queue defaults to pending work. */
export function parseMentorFilters(params: Record<string, string | string[] | undefined>): Filters {
  const first = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  const rawStatus = first(params.status) ?? "PENDING";
  const status = Object.values(SUBMISSION_STATUSES).find((s) => s === rawStatus);
  const q = first(params.q)?.trim().slice(0, 100) || undefined;
  const page = Math.max(1, Number(first(params.page)) || 1);

  return { status, q, page };
}

export async function MentorQueue({ filters }: { filters: Filters }) {
  const query = new URLSearchParams({
    page: String(filters.page),
    pageSize: String(PAGE_SIZE),
  });
  if (filters.status) query.set("status", filters.status);
  if (filters.q) query.set("q", filters.q);

  const [stats, result] = await Promise.all([
    serverFetch<SubmissionStats>("/api/submissions/stats"),
    serverFetch<Paginated<Submission>>(`/api/submissions?${query}`),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Review queue</h1>
        <p className="mt-1 text-sm text-slate-500">
          {stats.pending === 0
            ? "You're all caught up."
            : `${stats.pending} submission${stats.pending === 1 ? "" : "s"} waiting for review, oldest first.`}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Waiting for review" value={stats.pending} accent="text-amber-600" />
        <StatCard label="Approved" value={stats.approved} accent="text-emerald-600" />
        <StatCard label="Changes requested" value={stats.rejected} accent="text-rose-600" />
        <StatCard label="All submissions" value={stats.total} accent="text-slate-900" />
      </dl>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-3 sm:flex-row sm:items-center sm:justify-between">
          <nav className="flex gap-1 overflow-x-auto" aria-label="Filter by status">
            {tabs.map((tab) => {
              const active = filters.status === tab.status;
              return (
                <Link
                  key={tab.label}
                  href={dashboardHref({ status: tab.status, q: filters.q })}
                  aria-current={active ? "page" : undefined}
                  className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`rounded-full px-1.5 text-xs tabular-nums ${
                      active ? "bg-white/20" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {stats[tab.stat]}
                  </span>
                </Link>
              );
            })}
          </nav>

          <form action="/dashboard" className="flex gap-2" role="search">
            <input type="hidden" name="status" value={filters.status ?? "ALL"} />
            <Input
              name="q"
              type="search"
              defaultValue={filters.q}
              placeholder="Search title or student"
              aria-label="Search submissions"
              className="h-9 sm:w-64"
            />
            <Button type="submit" variant="secondary" size="sm" className="h-9">
              Search
            </Button>
          </form>
        </div>

        {result.items.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="font-medium text-slate-900">
              {filters.q ? "No submissions match your search" : "Nothing here"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {filters.q ? (
                <Link
                  href={dashboardHref({ status: filters.status })}
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Clear search
                </Link>
              ) : filters.status === "PENDING" ? (
                "New submissions from students will show up here."
              ) : (
                "No submissions have this status yet."
              )}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {result.items.map((submission) => (
              <li key={submission.id}>
                <Link
                  href={`/dashboard/submissions/${submission.id}`}
                  className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{submission.title}</p>
                    <p className="mt-0.5 truncate text-sm text-slate-500">
                      <span className="text-slate-700">{submission.student.name}</span> ·{" "}
                      {displayUrl(submission.repoUrl)} · {formatDate(submission.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <StatusBadge status={submission.status} />
                    {submission.status === "PENDING" && (
                      <span className="hidden text-sm font-medium text-indigo-600 sm:inline">
                        Review →
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {result.totalPages > 1 && (
        <nav className="flex items-center justify-between text-sm text-slate-500">
          <span>
            Page {result.page} of {result.totalPages} · {result.total} results
          </span>
          <div className="flex gap-2">
            {filters.page > 1 && (
              <ButtonLink
                href={dashboardHref({ ...filters, page: filters.page - 1 })}
                variant="secondary"
                size="sm"
              >
                Previous
              </ButtonLink>
            )}
            {filters.page < result.totalPages && (
              <ButtonLink
                href={dashboardHref({ ...filters, page: filters.page + 1 })}
                variant="secondary"
                size="sm"
              >
                Next
              </ButtonLink>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className={`mt-1 text-2xl font-semibold tabular-nums ${accent}`}>{value}</dd>
    </div>
  );
}
