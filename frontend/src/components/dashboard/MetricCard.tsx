import { type ReactNode } from "react";

type MetricCardProps = {
  icon: ReactNode;
  label: string;
  value: string;
  change?: string;
  changePositive?: boolean;
  subtext?: string;
};

export function MetricCard({
  icon,
  label,
  value,
  change,
  changePositive = true,
  subtext,
}: MetricCardProps) {
  return (
    <div className="rounded-xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-sm">
      <div className="flex items-start justify-between">
        <span className="text-white/80">{icon}</span>
        {change && (
          <span
            className={`flex items-center gap-0.5 text-xs font-medium ${
              changePositive ? "text-emerald-300" : "text-red-300"
            }`}
          >
            {changePositive ? (
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z"
                  clipRule="evenodd"
                />
              </svg>
            ) : null}
            {change}
          </span>
        )}
      </div>
      <p className="mt-2 text-sm font-medium text-white/80">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
      {subtext && (
        <p className="mt-0.5 text-xs text-white/70">{subtext}</p>
      )}
    </div>
  );
}
