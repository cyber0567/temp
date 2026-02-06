"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Zap,
  BarChart3,
  Users,
  Building2,
  FileCheck,
  Megaphone,
  Phone,
  Brain,
  Bolt,
  ChevronDown,
  ChevronUp,
  LogOut,
  Shield,
} from "lucide-react";
import { useState } from "react";
import { useUser } from "@/contexts/UserContext";

const mainNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/management", label: "Roles & Orgs", icon: Shield },
  { href: "/dashboard/rep-portal", label: "Rep Portal", icon: Users },
  { href: "/dashboard/command-center", label: "Client Command Center", icon: Zap },
  { href: "/dashboard/metrics", label: "Business Metrics", icon: BarChart3 },
];

const talentSubNav = [
  { href: "/dashboard/talent/application", label: "Application Process" },
  { href: "/dashboard/talent/screening", label: "AI Language Screening" },
  { href: "/dashboard/talent/sourcing", label: "AI Candidate Sourcing" },
  { href: "/dashboard/talent/candidates", label: "Candidates" },
  { href: "/dashboard/talent/active-reps", label: "Active Reps" },
  { href: "/dashboard/talent/screening-list", label: "Screening" },
];

const expandableNav = [
  {
    label: "Talent",
    icon: Users,
    href: "/dashboard/talent",
    subItems: talentSubNav,
  },
  { label: "Clients", icon: Building2, href: "/dashboard/clients", subItems: [] },
  { label: "Quote Approvals", icon: FileCheck, href: "/dashboard/quote-approvals", subItems: [] },
  { label: "Campaigns", icon: Megaphone, href: "/dashboard/campaigns", subItems: [] },
  { label: "Call Center", icon: Phone, href: "/dashboard/call-center", subItems: [] },
  { label: "AI Coaching", icon: Brain, href: "/dashboard/ai-coaching", subItems: [] },
  { label: "AI Lead Engagement", icon: Bolt, href: "/dashboard/ai-lead", subItems: [] },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, platformRole, orgs } = useUser();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    Talent: true,
  });

  function handleLogout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    router.push("/login");
  }

  const toggle = (label: string) => {
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-zinc-800 bg-zinc-900 dark:bg-zinc-950">
      <div className="flex h-14 items-center gap-2 border-b border-zinc-800 px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-zinc-700 text-sm font-bold text-white">
          V
        </div>
        <span className="text-sm font-semibold text-zinc-100">MVP</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-0.5 px-2">
          {mainNav.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-violet-600 text-white"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                  }`}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
          {expandableNav.map((item) => {
            const hasSub = item.subItems.length > 0;
            const isOpen = expanded[item.label];
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.label}>
                {hasSub ? (
                  <>
                    <button
                      type="button"
                      onClick={() => toggle(item.label)}
                      className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-zinc-800 text-zinc-100"
                          : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <item.icon className="h-5 w-5 shrink-0" />
                        {item.label}
                      </span>
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                    {isOpen && (
                      <ul className="ml-4 mt-0.5 space-y-0.5 border-l border-zinc-700 pl-3">
                        {item.subItems.map((sub) => (
                          <li key={sub.href}>
                            <Link
                              href={sub.href}
                              className={`block py-2 text-xs font-medium transition-colors ${
                                pathname === sub.href
                                  ? "text-violet-400"
                                  : "text-zinc-500 hover:text-zinc-300"
                              }`}
                            >
                              {sub.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-violet-600 text-white"
                        : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                    }`}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {item.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-zinc-800 p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-600 text-sm font-semibold text-white">
            {user?.email?.slice(0, 1).toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-200">
              {user?.email ?? "User"}
            </p>
            <p className="truncate text-xs text-zinc-500">
              {platformRole === "super_admin"
                ? "Super Admin"
                : platformRole === "admin"
                  ? "Admin"
                  : "Rep"}
              {orgs.length > 0 && ` · ${orgs.length} org${orgs.length > 1 ? "s" : ""}`}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="shrink-0 rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
