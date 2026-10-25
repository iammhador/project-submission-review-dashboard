import { Logo } from "@/components/logo";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <Logo />
      <p className="mt-10 text-sm font-semibold text-indigo-600">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
        Page not found
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        It may have been removed, or you don&apos;t have access to it.
      </p>
      <ButtonLink href="/dashboard" className="mt-6">
        Back to dashboard
      </ButtonLink>
    </div>
  );
}
