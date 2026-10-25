import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2.5 font-semibold tracking-tight text-slate-900"
    >
      <span className="grid size-8 place-items-center rounded-lg bg-indigo-600 text-white shadow-sm">
        <svg viewBox="0 0 24 24" className="size-4.5" fill="none" aria-hidden="true">
          <path
            d="m5 12.5 4.5 4.5L19 7.5"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span>
        Project<span className="text-indigo-600">Review</span>
      </span>
    </Link>
  );
}
