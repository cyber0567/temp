"use client";

import { useRouter } from "next/navigation";
import {
  Play,
  Target,
  Brain,
  User,
  Rocket,
  Search,
  Shield,
  CheckSquare,
  Scale,
  BookOpen,
  MessageSquare,
  Lightbulb,
  Clock,
  TrendingUp,
  Award,
  Sparkles,
} from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/Button";

const SKILLS = [
  { id: "opening", label: "Opening", icon: Rocket, color: "text-red-500" },
  { id: "discovery", label: "Discovery", icon: Search, color: "text-gray-600" },
  { id: "objection", label: "Objection Handling", icon: Shield, color: "text-red-500" },
  { id: "closing", label: "Closing", icon: CheckSquare, color: "text-green-600" },
  { id: "compliance", label: "Compliance", icon: Scale, color: "text-gray-600" },
  { id: "product", label: "Product Knowledge", icon: BookOpen, color: "text-green-600" },
  { id: "communication", label: "Communication", icon: MessageSquare, color: "text-gray-600" },
  { id: "listening", label: "Active Listening", icon: Lightbulb, color: "text-amber-500" },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function displayName(fullName: string | null | undefined, email: string | undefined): string {
  if (fullName?.trim()) return fullName.trim().toUpperCase();
  if (email) return email.slice(0, email.indexOf("@")).replace(/[._-]/g, " ").toUpperCase() || "REP";
  return "REP";
}

export default function RepPortalPage() {
  const router = useRouter();
  const { user } = useUser();
  const name = displayName(user?.fullName ?? null, user?.email);
  const greeting = getGreeting();

  const cardBase = "rounded-xl border border-gray-200 bg-white shadow-sm";

  return (
    <div className="min-h-full bg-gray-100/80">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Header: Greeting + Start Calling */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              {greeting}, {name}
            </h1>
            <p className="mt-1 text-sm text-gray-500">Let&apos;s make today count</p>
          </div>
          <Button
            className="shrink-0 bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500"
            leftIcon={<Play className="h-5 w-5" />}
            onClick={() => router.push("/dashboard/rep-portal/dialer")}
          >
            Start Calling
          </Button>
        </div>

        {/* Today's Goals */}
        <section className={cardBase}>
          <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-violet-600">
              <Target className="h-5 w-5" />
            </span>
            <h2 className="text-base font-semibold text-gray-900">Today&apos;s Goals</h2>
          </div>
          <div className="grid grid-cols-2 gap-6 px-5 py-5 sm:grid-cols-4">
            {[
              { value: "0/50", label: "Calls" },
              { value: "0/20", label: "Connects" },
              { value: "0/5", label: "Qualified" },
              { value: "0/2", label: "Booked" },
            ].map(({ value, label }) => (
              <div key={label} className="border-b border-gray-200 pb-2">
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="mt-1 text-sm text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* AI Lead Intelligence */}
        <section className={cardBase}>
          <div className="flex flex-col items-center px-5 py-8 text-center">
            <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 text-violet-600">
              <Brain className="h-8 w-8" />
            </span>
            <h2 className="text-lg font-bold text-gray-900">AI Lead Intelligence</h2>
            <p className="mt-1 max-w-sm text-sm text-gray-500">
              Get personalized outreach strategies and engagement predictions
            </p>
            <Button
              className="mt-4 bg-gray-800 text-white hover:bg-gray-900 focus-visible:ring-gray-600"
              size="md"
              leftIcon={<Sparkles className="h-4 w-4" />}
            >
              Analyze Lead
            </Button>
          </div>
        </section>

        {/* My Skills + Current Skill Levels */}
        <section className={cardBase}>
          <div className="flex flex-col gap-4 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                <User className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-base font-semibold text-gray-900">My Skills</h2>
                <p className="text-sm text-gray-500">AI-analyzed proficiencies from your calls</p>
              </div>
            </div>
            <Button
              className="shrink-0 bg-violet-600 text-white hover:bg-violet-700 focus-visible:ring-violet-500"
              size="sm"
              leftIcon={<Sparkles className="h-4 w-4" />}
            >
              Get AI Recommendations
            </Button>
          </div>
          <div className="px-5 py-4">
            <h3 className="text-sm font-semibold text-gray-900">Current Skill Levels</h3>
            <p className="mt-0.5 text-sm text-gray-500">Based on your recent 0 calls</p>
            <ul className="mt-4 space-y-0 divide-y divide-gray-100">
              {SKILLS.map(({ id, label, icon: Icon, color }) => (
                <li key={id} className="flex items-center gap-3 py-3 first:pt-0">
                  <span className={`shrink-0 ${color}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-medium text-gray-900">{label}</span>
                  <div className="h-2 w-24 shrink-0 overflow-hidden rounded-full bg-gray-200">
                    <div className="h-full w-0 rounded-full bg-gray-300" style={{ width: "0%" }} />
                  </div>
                  <span className="w-8 shrink-0 text-right text-sm font-medium text-red-600">0%</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Three metric cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className={cardBase}>
            <div className="p-5">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                  <Clock className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">Callbacks Due</h3>
                    <span className="rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-medium text-white">4</span>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">You have 4 callbacks scheduled for today</p>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-100 px-5 pb-4 pt-3">
              <Button variant="outline" size="sm" className="w-full">
                View Queue
              </Button>
            </div>
          </div>
          <div className={cardBase}>
            <div className="p-5">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                  <TrendingUp className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">High Intent</h3>
                    <span className="rounded-full bg-emerald-500 px-2.5 py-0.5 text-xs font-medium text-white">7</span>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">Hot leads ready to convert right now</p>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-100 px-5 pb-4 pt-3">
              <Button variant="outline" size="sm" className="w-full">
                Call Now
              </Button>
            </div>
          </div>
          <div className={cardBase}>
            <div className="p-5">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                  <Award className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">Active Campaigns</h3>
                    <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-medium text-white">0</span>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">Campaigns you&apos;re certified for</p>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-100 px-5 pb-4 pt-3">
              <Button variant="outline" size="sm" className="w-full">
                View Details
              </Button>
            </div>
          </div>
        </div>

        {/* My Active Campaigns */}
        <section className={cardBase}>
          <div className="px-5 py-4">
            <h2 className="text-base font-semibold text-gray-900">My Active Campaigns</h2>
            <p className="mt-4 py-8 text-center text-sm text-gray-500">No active campaigns assigned</p>
          </div>
        </section>
      </div>
    </div>
  );
}
