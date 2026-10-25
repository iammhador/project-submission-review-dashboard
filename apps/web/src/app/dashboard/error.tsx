"use client";

import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-xl border border-rose-200 bg-white px-6 py-16 text-center">
      <h1 className="font-semibold text-slate-900">Something went wrong</h1>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
        {error.message || "We couldn't load this page."}
      </p>
      <Button variant="secondary" className="mt-6" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
