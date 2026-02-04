import { DollarSign, Phone, Eye, Pause, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/Button";

type CampaignCardProps = {
  title: string;
  subtitle: string;
  calls: string;
  callsToday: string;
  conversions: string;
  conversionRate: string;
  revenue: string;
  budgetPercent: number;
  budgetSpent: string;
  budgetTotal: string;
};

export function CampaignCard({
  title,
  subtitle,
  calls,
  callsToday,
  conversions,
  conversionRate,
  revenue,
  budgetPercent,
  budgetSpent,
  budgetTotal,
}: CampaignCardProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {title}
            </h3>
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
              active
            </span>
          </div>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-6">
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-zinc-500" />
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {calls}
          </span>
          <span className="text-xs text-zinc-500">0 today</span>
        </div>
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-zinc-500" />
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {conversions}
          </span>
          <span className="text-xs text-zinc-500">{conversionRate} rate</span>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-zinc-500" />
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {revenue}
          </span>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            Budget Utilization
          </span>
          <span className="font-medium text-zinc-900 dark:text-zinc-50">
            {budgetPercent}%
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${budgetPercent}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>{budgetSpent} spent</span>
          <span>{budgetTotal} total</span>
        </div>
      </div>

      <div className="mt-5 flex gap-3">
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Pause className="h-4 w-4" />}
        >
          Pause
        </Button>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<BarChart3 className="h-4 w-4" />}
        >
          Details
        </Button>
      </div>
    </div>
  );
}
