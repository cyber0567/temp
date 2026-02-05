import Link from "next/link";
import {
  Zap,
  Plus,
  Download,
  DollarSign,
  Phone,
  Eye,
  User,
  Settings,
} from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { CampaignCard } from "@/components/dashboard/CampaignCard";
import { Button } from "@/components/ui/Button";

export function CampaignCommandCenter() {
  return (
    <>
      <section className="bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-700 px-6 py-8 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
                <Zap className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white sm:text-3xl">
                  Campaign Command Center
                </h1>
                <p className="text-white/90">TechCorp Solutions</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="md"
                leftIcon={<Plus className="h-4 w-4" />}
                className="border-white/50 text-white hover:bg-white/10 hover:text-white"
              >
                New Request
              </Button>
              <Button
                variant="outline"
                size="md"
                leftIcon={<Download className="h-4 w-4" />}
                className="border-white/50 text-white hover:bg-white/10 hover:text-white"
              >
                Export Report
              </Button>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              icon={<DollarSign className="h-6 w-6" />}
              label="Total Revenue"
              value="£195,500"
              change="+24% this month"
              changePositive
            />
            <MetricCard
              icon={<Phone className="h-6 w-6" />}
              label="Total Calls"
              value="3,074"
              change="+12% this week"
              changePositive
            />
            <MetricCard
              icon={<Eye className="h-6 w-6" />}
              label="Conversions"
              value="170"
              subtext="5.5% rate"
            />
            <MetricCard
              icon={<User className="h-6 w-6" />}
              label="Budget Used"
              value="£26,100"
              subtext="47% of £55,000"
            />
          </div>
        </div>
      </section>

      <section className="flex-1 px-6 py-8 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="border-b border-zinc-200 dark:border-zinc-700">
            <nav className="-mb-px flex gap-8" aria-label="Tabs">
              {[
                { name: "My Campaigns", href: "#", current: true },
                { name: "Messages", href: "#", current: false },
                { name: "Training Content", href: "#", current: false },
                { name: "Premium Add-ons", href: "#", current: false },
                { name: "Analytics", href: "#", current: false },
              ].map((tab) => (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={`whitespace-nowrap border-b-2 py-4 text-sm font-medium transition-colors ${
                    tab.current
                      ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                      : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
                  }`}
                >
                  {tab.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                Your Campaigns
              </h2>
              <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                Manage and monitor all your active campaigns
              </p>
            </div>
            <Button
              variant="outline"
              size="md"
              leftIcon={<Settings className="h-4 w-4" />}
            >
              Campaign Settings
            </Button>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <CampaignCard
              title="Customer Retention Campaign"
              subtitle="retention"
              calls="369"
              callsToday="0"
              conversions="20"
              conversionRate="5.4%"
              revenue="£48,000"
              budgetPercent={20}
              budgetSpent="£2,400"
              budgetTotal="£12,000"
            />
            <CampaignCard
              title="Q1 Enterprise Lead Generation"
              subtitle="lead generation"
              calls="1705"
              callsToday="0"
              conversions="100"
              conversionRate="5.9%"
              revenue="£85,000"
              budgetPercent={58}
              budgetSpent="£14,500"
              budgetTotal="£25,000"
            />
            <CampaignCard
              title="Product Launch - CloudSync Pro"
              subtitle="direct sales"
              calls="1000"
              callsToday="0"
              conversions="50"
              conversionRate="5.0%"
              revenue="£62,500"
              budgetPercent={51}
              budgetSpent="£9,200"
              budgetTotal="£18,000"
            />
          </div>
        </div>
      </section>

      <Link
        href="#"
        className="fixed bottom-8 right-8 flex h-14 w-14 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg transition-transform hover:scale-105 hover:bg-violet-500"
        aria-label="Quick action"
      >
        <span className="text-xl font-bold">D</span>
      </Link>
    </>
  );
}
