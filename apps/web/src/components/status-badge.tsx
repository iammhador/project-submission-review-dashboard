import type { SubmissionStatus } from "@awi/shared";

const styles: Record<SubmissionStatus, { label: string; className: string }> = {
  PENDING: {
    label: "Pending review",
    className: "bg-amber-50 text-amber-700 ring-amber-600/20",
  },
  APPROVED: {
    label: "Approved",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  },
  REJECTED: {
    label: "Changes requested",
    className: "bg-rose-50 text-rose-700 ring-rose-600/20",
  },
};

export function StatusBadge({ status }: { status: SubmissionStatus }) {
  const { label, className } = styles[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${className}`}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {label}
    </span>
  );
}
