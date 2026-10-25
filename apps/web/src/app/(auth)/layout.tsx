import { redirect } from "next/navigation";

import { Logo } from "@/components/logo";
import { getCurrentUser } from "@/lib/session";

export default async function AuthLayout({ children }: LayoutProps<"/">) {
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Logo />
      <div className="mt-8 w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        {children}
      </div>
    </div>
  );
}
