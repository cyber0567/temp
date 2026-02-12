"use client";

import { type ReactNode, useState } from "react";
import Image from "next/image";
import { Menu } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardAuthGuard } from "@/components/dashboard/DashboardAuthGuard";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <DashboardAuthGuard>
      <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
        {/* Mobile header: menu + logo */}
        <header className="fixed left-0 right-0 top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-900 md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <Image
            src="/mvplogo.jpg"
            alt="Sales Workforce Platform"
            width={32}
            height={32}
            className="h-8 w-8 shrink-0 rounded object-cover"
          />
          <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">SWP OS</span>
        </header>

        {/* Mobile backdrop */}
        {mobileMenuOpen && (
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        <DashboardSidebar
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col pt-14 md:pt-0">
          <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </DashboardAuthGuard>
  );
}
