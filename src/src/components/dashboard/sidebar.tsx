import { SidebarLogo } from "./sidebar-logo";
import { SidebarNavItem } from "./sidebar-nav-item";
import { SidebarNavSection } from "./sidebar-nav-section";
import { SidebarUser } from "./sidebar-user";
import type { Session } from "next-auth";

type SidebarProps = {
  session: Session | null;
};

export function Sidebar({ session }: SidebarProps) {
  return (
    <aside className="flex h-full w-64 flex-col bg-zinc-900">
      <SidebarLogo />

      <nav className="flex-1 overflow-y-auto py-2">
        <div className="space-y-0.5">
          <SidebarNavItem href="/dashboard" label="Dashboard" icon="LayoutDashboard" />
          <SidebarNavItem href="/dashboard/rep-portal" label="Rep Portal" icon="Users" />
          <SidebarNavItem
            href="/dashboard/client-command"
            label="Client Command Center"
            icon="Zap"
          />
          <SidebarNavItem
            href="/dashboard/business-metrics"
            label="Business Metrics"
            icon="BarChart3"
          />
        </div>

        <div className="mt-4 space-y-0">
          <SidebarNavSection
            label="Talent"
            icon="UsersRound"
            links={[
              { href: "/dashboard/talent/application", label: "Application Process" },
              { href: "/dashboard/talent/screening", label: "AI Language Screening" },
              { href: "/dashboard/talent/sourcing", label: "AI Candidate Sourcing" },
              { href: "/dashboard/talent/candidates", label: "Candidates" },
              { href: "/dashboard/talent/active-reps", label: "Active Reps" },
              { href: "/dashboard/talent/screening-list", label: "Screening" },
            ]}
          />
          <SidebarNavSection
            label="Clients"
            icon="Building2"
            links={[{ href: "/dashboard/clients", label: "Clients" }]}
          />
          <SidebarNavSection
            label="Quote Approvals"
            icon="CheckSquare"
            links={[{ href: "/dashboard/quote-approvals", label: "Quote Approvals" }]}
          />
          <SidebarNavSection
            label="Campaigns"
            icon="Megaphone"
            links={[{ href: "/dashboard/campaigns", label: "Campaigns" }]}
          />
          <SidebarNavSection
            label="Call Center"
            icon="Phone"
            links={[{ href: "/dashboard/call-center", label: "Call Center" }]}
          />
          <SidebarNavSection
            label="AI Coaching"
            icon="GraduationCap"
            links={[{ href: "/dashboard/ai-coaching", label: "AI Coaching" }]}
          />
          <SidebarNavSection
            label="AI Lead Engagement"
            icon="Zap"
            links={[{ href: "/dashboard/ai-lead", label: "AI Lead Engagement" }]}
          />
        </div>
      </nav>

      <SidebarUser session={session} />
    </aside>
  );
}
