"use client";

import Link from "next/link";
import {
  Target,
  Users,
  Clock,
  AlertTriangle,
  Building2,
  ChevronRight,
  User,
  Phone,
  MessageCircle,
  Plus,
} from "lucide-react";

// Chart: Mon–Sun, Y 0–100. Green stable ~20–45, blue higher then drops.
const chartGreen = [20, 35, 25, 45, 40, 30, 25];
const chartBlue = [75, 80, 78, 85, 82, 45, 30];
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const chartHeight = 180;
const chartWidth = 560;

const attentionCards = [
  { label: "Pending Reviews", value: "0 awaiting", icon: Clock, color: "text-amber-600", iconBg: "text-amber-600", href: "#" },
  { label: "Flagged Calls", value: "2 need review", icon: AlertTriangle, color: "text-red-600", iconBg: "text-red-600", href: "#" },
  { label: "Active Clients", value: "43 clients", icon: Building2, color: "text-blue-600", iconBg: "text-blue-600", href: "#" },
];

const recentCandidates = [
  { name: "Harry Hogarth", email: "harryhogarthmva@gmail.com", status: "Onboarding", statusColor: "text-blue-600" },
  { name: "Samantha Bell", email: "sbell@email.com", status: "Active", statusColor: "text-green-600" },
  { name: "Logan Hughes", email: "lhughes@email.com", status: "Active", statusColor: "text-green-600" },
  { name: "Hannah Price", email: "hprice@email.com", status: "Active", statusColor: "text-green-600" },
  { name: "Austin Cooper", email: "acooper@email.com", status: "Active", statusColor: "text-green-600" },
];

const recentCalls = [
  { name: "Emma Johnson", company: "TechFlow Corp", status: "Completed" },
  { name: "John Anderson", company: "Enterprise Tech Inc", status: "Completed" },
  { name: "Sarah Williams", company: "Integration Pro", status: "Completed" },
  { name: "David Martinez", company: "Sync Solutions", status: "Completed" },
  { name: "Michael Roberts", company: "CloudNet Solutions", status: "Completed" },
];

const chartPadLeft = 24;

function linePath(values: number[], width: number, height: number, maxVal: number, offsetX: number) {
  const step = width / (values.length - 1);
  return values
    .map((v, i) => `${i === 0 ? "M" : "L"} ${offsetX + i * step} ${height - (v / maxVal) * height}`)
    .join(" ");
}

export function DashboardHome() {
  const maxVal = 100;
  const w = chartWidth;
  const h = chartHeight;
  const greenPath = linePath(chartGreen, w, h, maxVal, chartPadLeft);
  const bluePath = linePath(chartBlue, w, h, maxVal, chartPadLeft);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Top: Line graph + 2 KPI cards */}
      <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="overflow-x-auto">
            <svg viewBox={`0 0 ${w + chartPadLeft + 20} ${h + 28}`} className="w-full min-h-[200px]" preserveAspectRatio="xMidYMid meet">
              <text x={8} y={h + 4} fill="#9ca3af" fontSize={10} textAnchor="start">0</text>
              <text x={8} y={h / 2 + 4} fill="#9ca3af" fontSize={10} textAnchor="start">50</text>
              <text x={8} y={4} fill="#9ca3af" fontSize={10} textAnchor="start">100</text>
              <line x1={chartPadLeft} y1={h} x2={w + chartPadLeft} y2={h} stroke="#e5e7eb" strokeWidth={1} />
              <line x1={chartPadLeft} y1={0} x2={chartPadLeft} y2={h} stroke="#e5e7eb" strokeWidth={1} />
              <path d={greenPath} fill="none" stroke="#22c55e" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              <path d={bluePath} fill="none" stroke="#6366f1" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              {days.map((day, i) => (
                <text
                  key={day}
                  x={chartPadLeft + (i * w) / (days.length - 1)}
                  y={h + 20}
                  fill="#6b7280"
                  fontSize={10}
                  textAnchor="middle"
                >
                  {day}
                </text>
              ))}
            </svg>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-gray-200 bg-emerald-50/80 p-4 shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100">
              <Target className="h-5 w-5 text-emerald-700" />
            </div>
            <p className="mt-3 text-sm font-medium text-gray-800">Conversions</p>
            <p className="mt-0.5 text-2xl font-bold text-gray-900">8</p>
            <p className="mt-0.5 text-xs text-gray-600">Target: 100/week</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-violet-50/80 p-4 shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100">
              <Users className="h-5 w-5 text-violet-700" />
            </div>
            <p className="mt-3 text-sm font-medium text-gray-800">Team Size</p>
            <p className="mt-0.5 text-2xl font-bold text-gray-900">27</p>
            <p className="mt-0.5 text-xs text-gray-600">Active representatives</p>
          </div>
        </div>
      </div>

      {/* Bottom: 3 columns */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Attention Required */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Attention Required
          </h2>
          <div className="flex flex-col gap-2">
            {attentionCards.map((card) => (
              <Link
                key={card.label}
                href={card.href}
                className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-3 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <card.icon className={`h-5 w-5 shrink-0 ${card.iconBg}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{card.label}</p>
                    <p className={`text-sm font-medium ${card.color}`}>{card.value}</p>
                  </div>
                </div>
                <Plus className="h-4 w-4 shrink-0 text-gray-400" />
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Candidates */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <User className="h-4 w-4 text-blue-600" />
              Recent Candidates
            </h2>
            <Link
              href="/dashboard/talent/candidates"
              className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              View All
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <ul className="divide-y divide-gray-100">
            {recentCandidates.map((c) => (
              <li key={c.email} className="flex items-center gap-3 px-4 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                  {c.name.slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{c.name}</p>
                  <p className="truncate text-xs text-gray-500">{c.email}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    c.status === "Onboarding" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {c.status}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Recent Calls */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Phone className="h-4 w-4 text-green-600" />
              Recent Calls
            </h2>
            <Link
              href="/dashboard/call-center"
              className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              View All
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <ul className="divide-y divide-gray-100">
            {recentCalls.map((c) => (
              <li key={c.name + c.company} className="flex items-center gap-3 px-4 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100">
                  <Phone className="h-4 w-4 text-green-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{c.name}</p>
                  <p className="truncate text-xs text-gray-500">{c.company}</p>
                </div>
                <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                  {c.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Floating action button */}
      <button
        type="button"
        className="fixed bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg hover:bg-violet-700"
        aria-label="Chat"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    </div>
  );
}
