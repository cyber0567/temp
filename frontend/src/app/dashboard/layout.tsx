"use client";

import { type ReactNode } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardAuthGuard } from "@/components/dashboard/DashboardAuthGuard";
import { UserProvider } from "@/contexts/UserContext";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <UserProvider>
      <DashboardAuthGuard>
        <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
          <DashboardSidebar />
          <div className="flex flex-1 flex-col min-w-0">
            <DashboardHeader />
            <main className="flex-1">{children}</main>
          </div>
        </div>
      </DashboardAuthGuard>
    </UserProvider>
  );
}
