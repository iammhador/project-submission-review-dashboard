import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SubmissionForm } from "@/components/submission-form";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "New submission" };

export default async function NewSubmissionPage() {
  const user = await getCurrentUser();
  if (user?.role !== "STUDENT") redirect("/dashboard");

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-900">
        ← Back to submissions
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
        New submission
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Mentors see exactly what you enter here, so be specific about what you
        built and what you&apos;d like feedback on.
      </p>
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <SubmissionForm />
      </div>
    </div>
  );
}
