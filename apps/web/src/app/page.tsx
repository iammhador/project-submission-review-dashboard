import type { SubmissionStatus } from "@awi/shared";

import { Logo } from "@/components/logo";
import { StatusBadge } from "@/components/status-badge";
import { ButtonLink } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/session";

const previewRows: { title: string; repo: string; status: SubmissionStatus }[] = [
  { title: "Portfolio website", repo: "github.com/ayesha/portfolio", status: "APPROVED" },
  { title: "Weather dashboard", repo: "github.com/rahim/weather-app", status: "PENDING" },
  { title: "Todo API with auth", repo: "github.com/nadia/todo-api", status: "REJECTED" },
];

const steps = [
  {
    title: "Submit your project",
    body: "Share the repository and an optional live demo with a short description of what you built.",
  },
  {
    title: "A mentor reviews it",
    body: "Mentors work through the queue, check your code and demo, and leave a written note.",
  },
  {
    title: "Get a clear decision",
    body: "See whether it was approved or needs changes, and exactly what to improve next.",
  },
];

export default async function Home() {
  // The landing page should still render if the API is unreachable.
  const user = await getCurrentUser().catch(() => null);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-2">
          {user ? (
            <ButtonLink href="/dashboard">Go to dashboard</ButtonLink>
          ) : (
            <>
              <ButtonLink href="/login" variant="ghost">
                Sign in
              </ButtonLink>
              <ButtonLink href="/signup">Get started</ButtonLink>
            </>
          )}
        </nav>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-12 pb-20 sm:px-6 lg:grid-cols-2 lg:pt-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-600/10 ring-inset">
              For students and mentors
            </p>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-balance text-slate-900 sm:text-5xl">
              Ship your project. Get a mentor&apos;s verdict.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-pretty text-slate-600">
              One place to submit your work, follow its review, and read
              feedback from your mentor, without chasing anyone in chat.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {user ? (
                <ButtonLink href="/dashboard" size="lg">
                  Open your dashboard
                </ButtonLink>
              ) : (
                <>
                  <ButtonLink href="/signup" size="lg">
                    Create a student account
                  </ButtonLink>
                  <ButtonLink href="/login" size="lg" variant="secondary">
                    I&apos;m a mentor
                  </ButtonLink>
                </>
              )}
            </div>
          </div>

          <div className="relative">
            <div
              className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-tr from-indigo-100 via-white to-sky-100 blur-2xl"
              aria-hidden="true"
            />
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Your submissions</p>
                  <p className="text-xs text-slate-500">3 projects</p>
                </div>
                <span className="rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white">
                  New submission
                </span>
              </div>
              <ul className="divide-y divide-slate-100">
                {previewRows.map((row) => (
                  <li key={row.title} className="flex items-center justify-between gap-4 px-5 py-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{row.title}</p>
                      <p className="truncate text-xs text-slate-500">{row.repo}</p>
                    </div>
                    <StatusBadge status={row.status} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              How it works
            </h2>
            <ol className="mt-8 grid gap-6 sm:grid-cols-3">
              {steps.map((step, index) => (
                <li key={step.title} className="rounded-xl border border-slate-200 p-6">
                  <span className="grid size-8 place-items-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-700">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-slate-500 sm:px-6">
          Associate Web Instructor · Project Submission &amp; Review
        </div>
      </footer>
    </div>
  );
}
