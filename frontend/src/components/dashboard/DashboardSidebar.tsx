"use client";

import Image from "next/image";
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
  GraduationCap,
  ClipboardCheck,
  Settings,
  ClipboardList,
  MessageCircle,
  Search,
  Briefcase,
  List,
  Monitor,
  PhoneOutgoing,
  PhoneIncoming,
  BookOpen,
  Award,
  CheckCircle,
  TrendingUp,
  Activity,
  Share2,
  ShieldCheck,
  X,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useUser } from "@/contexts/UserContext";
import { cn } from "@/lib/utils";

const talentSubNav = [
  { href: "/dashboard/talent/application", label: "Application Process", icon: ClipboardList },
  { href: "/dashboard/talent/screening", label: "AI Language Screening", icon: MessageCircle },
  { href: "/dashboard/talent/sourcing", label: "AI Candidate Sourcing", icon: Search },
  { href: "/dashboard/talent/candidates", label: "Candidates", icon: Briefcase },
  { href: "/dashboard/talent/active-reps", label: "Active Reps", icon: Users },
  { href: "/dashboard/talent/screening-list", label: "Screening", icon: Search },
];

const campaignsSubNav = [
  { href: "/dashboard/campaigns", label: "All Campaigns", icon: List },
  { href: "/dashboard/campaigns/monitor", label: "Campaign Monitor", icon: Monitor },
  { href: "/dashboard/campaigns/surge-pricing", label: "Surge Pricing Offers", icon: Megaphone },
  { href: "/dashboard/campaigns/ai-assignments", label: "AI Assignments", icon: Brain },
];

const callCenterSubNav = [
  { href: "/dashboard/call-center/outbound", label: "Outbound Calls", icon: PhoneOutgoing },
  { href: "/dashboard/call-center/inbound", label: "Inbound Center", icon: PhoneIncoming },
];

const trainingSubNav = [
  { href: "/dashboard/training/modules", label: "Training Modules", icon: BookOpen },
  { href: "/dashboard/training/onboarding", label: "Onboarding Admin", icon: ClipboardList },
  { href: "/dashboard/training/skill-development", label: "Skill Development", icon: Award },
];

const complianceSubNav = [
  { href: "/dashboard/compliance", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/compliance/tpi-dnc", label: "TPI & DNC Checker", icon: CheckCircle },
];

const analyticsSubNav = [
  { href: "/dashboard/analytics", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/analytics/sales", label: "Sales Analytics", icon: TrendingUp },
  { href: "/dashboard/analytics/rep-performance", label: "Rep Performance", icon: Activity },
];

const mainNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, subItems: [] },
  { href: "/dashboard/rep-portal", label: "Rep Portal", icon: Users, subItems: [] },
  { href: "/dashboard/command-center", label: "Client Command Center", icon: Settings, subItems: [] },
  { href: "/dashboard/metrics", label: "Business Metrics", icon: BarChart3, subItems: [] },
  { href: "/dashboard/talent", label: "Talent", icon: Users, subItems: talentSubNav },
  { href: "/dashboard/clients", label: "Clients", icon: Building2, subItems: [] },
  { href: "/dashboard/quote-approvals", label: "Quote Approvals", icon: FileCheck, subItems: [] },
  { href: "/dashboard/campaigns", label: "Campaigns", icon: Megaphone, subItems: campaignsSubNav },
  { href: "/dashboard/call-center", label: "Call Center", icon: Phone, subItems: callCenterSubNav },
  { href: "/dashboard/ai-coaching", label: "AI Coaching", icon: Brain, subItems: [] },
  { href: "/dashboard/ai-lead", label: "AI Lead Engagement", icon: Bolt, subItems: [] },
  { href: "/dashboard/training", label: "Training", icon: GraduationCap, subItems: trainingSubNav },
  { href: "/dashboard/compliance", label: "Compliance", icon: Shield, subItems: complianceSubNav },
  { href: "/dashboard/quality-assurance", label: "Quality Assurance", icon: ShieldCheck, subItems: [] },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3, subItems: analyticsSubNav },
  { href: "/dashboard/knowledge-base", label: "Knowledge Base", icon: BookOpen, subItems: [] },
  { href: "/dashboard/social-feed", label: "Social Feed", icon: Share2, subItems: [] },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, subItems: [] },
];

type DashboardSidebarProps = {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

export function DashboardSidebar({ mobileOpen = false, onMobileClose }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, platformRole, orgs } = useUser();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    Talent: true,
    Campaigns: false,
    "Call Center": false,
    Training: false,
    Compliance: false,
    Analytics: false,
  });

  function handleLogout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    router.push("/login");
  }

  const toggle = (e: React.MouseEvent, label: string) => {
    e.preventDefault();
    e.stopPropagation();
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const displayName =
    (user?.fullName?.trim() ||
      user?.email?.slice(0, user.email.indexOf("@")).replace(/[._-]/g, " ").toUpperCase()) ??
    "USER";

  const onMobileCloseRef = useRef(onMobileClose);
  onMobileCloseRef.current = onMobileClose;

  // Close mobile sidebar only when the route actually changes (user navigated)
  useEffect(() => {
    onMobileCloseRef.current?.();
  }, [pathname]);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex h-screen w-64 max-w-[85vw] shrink-0 flex-col border-r border-zinc-800 bg-zinc-900 shadow-xl",
        "transition-transform duration-200 ease-out",
        "md:relative md:sticky md:top-0 md:max-w-none md:shadow-none",
        "-translate-x-full md:translate-x-0",
        mobileOpen && "translate-x-0"
      )}
      aria-hidden={!mobileOpen}
    >
      <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-zinc-800 px-4 md:justify-start">
        <div className="flex items-center gap-2">
          <Image
            src="/mvplogo.jpg"
            alt="Sales Workforce Platform"
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 rounded object-cover"
          />
          <span className="sr-only">Sales Workforce Platform</span>
        </div>
        <button
          type="button"
          onClick={onMobileClose}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 md:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-0.5 px-2">
          {mainNav.map((item) => {
            const hasSub = item.subItems.length > 0;
            const isOpen = expanded[item.label];
            const isActive = hasSub
              ? pathname === item.href || pathname.startsWith(item.href + "/")
              : pathname === item.href;
            return (
              <li key={item.label}>
                {hasSub ? (
                  <>
                    <button
                      type="button"
                      onClick={(e) => toggle(e, item.label)}
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
                        <ChevronUp className="h-4 w-4 shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <ul className="ml-4 mt-0.5 space-y-0.5 border-l border-zinc-700 pl-3">
                        {item.subItems.map((sub, idx) => (
                          <li key={`${sub.href}-${sub.label}-${idx}`}>
                            <Link
                              href={sub.href}
                              className={`flex items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium transition-colors ${
                                pathname === sub.href
                                  ? "bg-zinc-800 text-zinc-100"
                                  : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                              }`}
                            >
                              {sub.icon ? <sub.icon className="h-4 w-4 shrink-0" /> : null}
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
                        ? "bg-zinc-800 text-zinc-100"
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

      <div className="shrink-0 border-t border-zinc-800 p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-600 text-sm font-semibold text-white">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              (user?.fullName || user?.email)?.slice(0, 1).toUpperCase() ?? "?"
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-200">
              {displayName}
            </p>
            <p className="truncate text-xs text-zinc-500">
              {user?.email ?? "—"}
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
