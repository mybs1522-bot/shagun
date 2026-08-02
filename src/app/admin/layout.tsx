import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="w-full max-w-[98%] xl:max-w-[1700px] mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
          <h1 className="text-lg font-semibold tracking-tight">
            Admin Dashboard
          </h1>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to site
          </Link>
        </div>
      </header>
      <main className="w-full max-w-[98%] xl:max-w-[1700px] mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>
    </div>
  );
}
