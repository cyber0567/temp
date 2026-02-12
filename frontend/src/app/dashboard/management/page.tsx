"use client";

import { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { OrgsTab } from "./OrgsTab";
import { UsersTab } from "./UsersTab";
import { Shield } from "lucide-react";

type TabId = "orgs" | "users";

export default function ManagementPage() {
  const { platformRole } = useUser();
  const [tab, setTab] = useState<TabId>("orgs");
  const showUsersTab = platformRole === "super_admin";

  return (
    <div className="mx-auto w-full max-w-7xl">
      {/* Hero section - matches Campaign Command Center */}
      <section className="rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-700 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20 sm:h-12 sm:w-12">
                <Shield className="h-6 w-6 text-white sm:h-7 sm:w-7" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-white sm:text-2xl lg:text-3xl truncate">
                  Roles & Organizations
                </h1>
                <p className="text-sm text-white/90 sm:text-base">Manage organizations and platform roles</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content section */}
      <section className="flex-1 py-6 sm:py-8">
        <div className="mx-auto w-full">
          {/* Tabs - matches dashboard style */}
          <div className="border-b border-zinc-200 dark:border-zinc-700">
            <nav className="-mb-px flex flex-wrap gap-x-6 gap-y-2 sm:gap-x-8" aria-label="Tabs">
              <button
                type="button"
                onClick={() => setTab("orgs")}
                className={`whitespace-nowrap border-b-2 py-4 text-sm font-medium transition-colors ${
                  tab === "orgs"
                    ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                    : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
                }`}
              >
                Organizations
              </button>
              <button
                type="button"
                onClick={() => setTab("users")}
                className={`whitespace-nowrap border-b-2 py-4 text-sm font-medium transition-colors ${
                  tab === "users"
                    ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                    : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
                }`}
              >
                User Management
              </button>
            </nav>
          </div>

          <div className="mt-8">
            {tab === "orgs" && <OrgsTab />}
            {tab === "users" && (
              showUsersTab ? (
                <UsersTab />
              ) : (
                <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 rounded-xl border border-zinc-200 bg-zinc-50/50 p-8 dark:border-zinc-700 dark:bg-zinc-800/30">
                  <div className="rounded-full bg-amber-100 p-4 dark:bg-amber-900/30">
                    <Shield className="h-12 w-12 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Access restricted</h2>
                  <p className="max-w-sm text-center text-sm text-zinc-500 dark:text-zinc-400">
                    User management is only available to Super Admins. Contact your platform
                    administrator to request access.
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
