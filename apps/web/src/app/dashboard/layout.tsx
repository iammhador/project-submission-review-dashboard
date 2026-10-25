import { redirect } from "next/navigation";

import { Logo } from "@/components/logo";
import { LogoutButton } from "@/components/logout-button";
import { getCurrentUser } from "@/lib/session";

export default async function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const initials = user.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo href="/dashboard" />
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-500">
                {user.role === "MENTOR" ? "Mentor" : "Student"}
              </p>
            </div>
            <span
              className="grid size-9 place-items-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700"
              aria-hidden="true"
            >
              {initials}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}
