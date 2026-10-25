import type { ComponentProps, ReactNode } from "react";

function controlClasses(invalid: boolean) {
  return `block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-4 ${
    invalid
      ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100"
      : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-100"
  }`;
}

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  optional?: boolean;
  children: ReactNode;
}

/** Label, control, and either a hint or an error message underneath. */
export function Field({ id, label, error, hint, optional, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="flex items-baseline justify-between text-sm font-medium text-slate-700"
      >
        {label}
        {optional && (
          <span className="text-xs font-normal text-slate-400">Optional</span>
        )}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-rose-600">
          {error}
        </p>
      ) : (
        hint && <div className="text-xs text-slate-500">{hint}</div>
      )}
    </div>
  );
}

type ControlProps = { invalid?: boolean };

export function Input({
  invalid = false,
  className = "",
  ...props
}: ComponentProps<"input"> & ControlProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      aria-describedby={invalid && props.id ? `${props.id}-error` : undefined}
      className={`${controlClasses(invalid)} h-10 ${className}`}
      {...props}
    />
  );
}

export function Textarea({
  invalid = false,
  className = "",
  ...props
}: ComponentProps<"textarea"> & ControlProps) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      aria-describedby={invalid && props.id ? `${props.id}-error` : undefined}
      className={`${controlClasses(invalid)} ${className}`}
      {...props}
    />
  );
}

export function FormAlert({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700"
    >
      {children}
    </div>
  );
}
