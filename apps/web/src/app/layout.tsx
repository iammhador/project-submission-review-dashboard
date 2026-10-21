import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Project Submission & Review",
  description:
    "A dashboard where students submit projects and mentors review them.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
