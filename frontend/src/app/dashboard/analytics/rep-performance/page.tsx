"use client";

import { useState } from "react";
import {
  Phone,
  Target,
  Award,
  Zap,
  Trophy,
  Crown,
  User,
  BarChart3,
  MessageCircle,
} from "lucide-react";

const kpiCards = [
  { label: "Total Calls", value: "20", icon: Phone, iconBg: "bg-blue-100", iconColor: "text-blue-600" },
  { label: "Avg Conv. Rate", value: "8.6%", icon: Target, iconBg: "bg-green-100", iconColor: "text-green-600" },
  { label: "Avg QA Score", value: "3", icon: Award, iconBg: "bg-violet-100", iconColor: "text-violet-600" },
  { label: "Active Reps", value: "27", icon: Zap, iconBg: "bg-amber-100", iconColor: "text-amber-600" },
];

const tabs = [
  { id: "leaderboard", label: "Leaderboard", icon: Trophy },
  { id: "achievements", label: "Achievements & Goals", icon: Target },
  { id: "trend", label: "Trend Analysis", icon: BarChart3 },
  { id: "coaching", label: "AI Coaching", icon: MessageCircle },
];

const topPerformers = [
  { name: "Priya Sharma", exp: "2 years exp", calls: 1, convRate: "100.0%", score: 68, rank: 1, email: "priya.sharma@email.com", qaScore: 0 },
  { name: "Alexandra Torres", exp: "6 years exp", calls: 3, convRate: "33.3%", score: 68, rank: 2, email: "atorres@email.com", qaScore: 94 },
  { name: "Elena Rodriguez", exp: "6 years exp", calls: 2, convRate: "50.0%", score: 50, rank: 3, email: "elena.r@email.com", qaScore: 0 },
];

const leaderboardRows = [
  ...topPerformers,
  { name: "Sofia Martinez", exp: "", calls: 2, convRate: "50.0%", score: 48, rank: 4, email: "smartinez@email.com", qaScore: 0 },
  { name: "Marcus Johnson", exp: "", calls: 1, convRate: "0.0%", score: 30, rank: 5, email: "mjohnson@email.com", qaScore: 0 },
];

const chartReps = [
  { name: "Priya Sharma", convRate: 100, qaScore: 0 },
  { name: "Alexandra Torres", convRate: 33, qaScore: 94 },
  { name: "Elena Rodriguez", convRate: 50, qaScore: 0 },
  { name: "Sofia Martinez", convRate: 50, qaScore: 0 },
  { name: "Marcus Johnson", convRate: 0, qaScore: 0 },
  { name: "David Kim", convRate: 45, qaScore: 72 },
  { name: "Jessica Palmer", convRate: 38, qaScore: 65 },
  { name: "Aisha Patel", convRate: 42, qaScore: 58 },
];

function scoreColor(score: number) {
  if (score >= 65) return "bg-orange-500";
  if (score >= 48) return "bg-pink-500";
  return "bg-violet-500";
}

export default function RepPerformancePage() {
  const [activeTab, setActiveTab] = useState("leaderboard");

  // return (
  //   <div className="flex flex-col gap-6 p-6">
  //     <div>
  //       <h1 className="text-2xl font-bold tracking-tight text-gray-900">
  //         Rep Performance Analytics
  //       </h1>
  //       <p className="mt-0.5 text-sm text-gray-500">
  //         Comprehensive performance insights and AI-driven coaching
  //       </p>
  //     </div>

  //     <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
  //       {tabs.map((tab) => (
  //         <button
  //           key={tab.id}
  //           type="button"
  //           onClick={() => setActiveTab(tab.id)}
  //           className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
  //             activeTab === tab.id
  //               ? "bg-gray-200 text-gray-900"
  //               : "text-gray-600 hover:bg-gray-100"
  //           }`}
  //         >
  //           <tab.icon className="h-4 w-4" />
  //           {tab.label}
  //         </button>
  //       ))}
  //     </div>

  //     <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
  //       {kpiCards.map((card) => (
  //         <div
  //           key={card.label}
  //           className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
  //         >
  //           <div className="flex items-start justify-between">
  //             <div>
  //               <p className="text-sm font-medium text-gray-500">{card.label}</p>
  //               <p className="mt-1 text-2xl font-bold text-gray-900">{card.value}</p>
  //             </div>
  //             <div
  //               className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.iconBg} ${card.iconColor}`}
  //             >
  //               <card.icon className="h-5 w-5" />
  //             </div>
  //           </div>
  //         </div>
  //       ))}
  //     </div>

  //     {activeTab === "leaderboard" && (
  //       <>
  //         <div className="grid gap-4 sm:grid-cols-3">
  //           {topPerformers.map((p, i) => (
  //             <div
  //               key={p.name}
  //               className={`rounded-xl border p-4 ${
  //                 i === 0 ? "border-amber-200 bg-amber-50/50" : "border-gray-200 bg-white"
  //               }`}
  //             >
  //               <div className="flex items-start justify-between">
  //                 <div className="flex items-center gap-3">
  //                   {p.rank === 1 ? (
  //                     <Crown className="h-8 w-8 text-amber-600" />
  //                   ) : (
  //                     <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
  //                       <User className="h-4 w-4 text-gray-600" />
  //                     </div>
  //                   )}
  //                   <div>
  //                     <p className="font-semibold text-gray-900">{p.name}</p>
  //                     <p className="text-xs text-gray-500">{p.exp}</p>
  //                   </div>
  //                 </div>
  //                 <span
  //                   className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white ${scoreColor(p.score)}`}
  //                 >
  //                   {p.score}
  //                 </span>
  //               </div>
  //               <div className="mt-3 flex justify-between text-sm text-gray-600">
  //                 <span>Calls: {p.calls}</span>
  //                 <span>Conv. Rate: {p.convRate}</span>
  //               </div>
  //             </div>
  //           ))}
  //         </div>
  //         <div className="rounded-xl border border-gray-200 bg-white p-4">
  //           <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
  //             <Trophy className="h-5 w-5" />
  //             Full Leaderboard
  //           </h2>
  //           <div className="mt-4 overflow-x-auto">
  //             <table className="w-full text-sm">
  //               <thead>
  //                 <tr className="border-b border-gray-200 text-left text-gray-500">
  //                   <th className="pb-2 font-medium">Rep</th>
  //                   <th className="pb-2 font-medium">Calls</th>
  //                   <th className="pb-2 font-medium">Conv. Rate</th>
  //                   <th className="pb-2 font-medium">QA Score</th>
  //                   <th className="pb-2 font-medium w-14"></th>
  //                 </tr>
  //               </thead>
  //               <tbody>
  //                 {leaderboardRows.map((row) => (
  //                   <tr key={row.name} className="border-b border-gray-100">
  //                     <td className="py-3">
  //                       <div className="flex items-center gap-3">
  //                         {row.rank <= 3 ? (
  //                           row.rank === 1 ? (
  //                             <Crown className="h-5 w-5 shrink-0 text-amber-600" />
  //                           ) : (
  //                             <User className="h-5 w-5 shrink-0 text-gray-400" />
  //                           )
  //                         ) : (
  //                           <span className="w-6 shrink-0 text-center text-gray-400">#{row.rank}</span>
  //                         )}
  //                         <div className="min-w-0">
  //                           <p className="font-medium text-gray-900">{row.name}</p>
  //                           <p className="truncate text-xs text-gray-500">{row.email}</p>
  //                         </div>
  //                       </div>
  //                     </td>
  //                     <td className="py-3 text-gray-600">{row.calls}</td>
  //                     <td className="py-3 text-gray-600">{row.convRate}</td>
  //                     <td className="py-3 text-gray-600">{row.qaScore}</td>
  //                     <td className="py-3">
  //                       <span
  //                         className={`inline-flex h-6 min-w-[2rem] items-center justify-center rounded-full px-2 text-xs font-bold text-white ${scoreColor(row.score)}`}
  //                       >
  //                         {row.score}
  //                       </span>
  //                     </td>
  //                   </tr>
  //                 ))}
  //               </tbody>
  //             </table>
  //           </div>
  //         </div>
  //       </>
  //     )}

  //     {activeTab === "trend" && (
  //       <div className="rounded-xl border border-gray-200 bg-white p-6">
  //         <h2 className="text-lg font-semibold text-gray-900">Performance Distribution</h2>
  //         <div className="mt-6 flex items-end justify-between gap-1" style={{ height: 260 }}>
  //           {chartReps.map((rep) => (
  //             <div key={rep.name} className="flex flex-1 flex-col items-center gap-2">
  //               <div className="flex h-full w-full items-end justify-center gap-0.5">
  //                 <div
  //                   className="w-full max-w-[12px] rounded-t bg-violet-500"
  //                   style={{ height: `${rep.convRate}%` }}
  //                   title={`Conv. Rate %: ${rep.convRate}`}
  //                 />
  //                 <div
  //                   className="w-full max-w-[12px] rounded-t bg-green-500"
  //                   style={{ height: `${rep.qaScore}%` }}
  //                   title={`QA Score: ${rep.qaScore}`}
  //                 />
  //               </div>
  //               <span className="max-w-full truncate text-xs text-gray-500" title={rep.name}>
  //                 {rep.name.split(" ")[0]}
  //               </span>
  //             </div>
  //           ))}
  //         </div>
  //         <div className="mt-4 flex justify-end gap-4 text-sm text-gray-500">
  //           <span className="flex items-center gap-1.5">
  //             <span className="h-3 w-3 rounded bg-violet-500" />
  //             Conv. Rate %
  //           </span>
  //           <span className="flex items-center gap-1.5">
  //             <span className="h-3 w-3 rounded bg-green-500" />
  //             QA Score
  //           </span>
  //         </div>
  //       </div>
  //     )}

  //     {(activeTab === "achievements" || activeTab === "coaching") && (
  //       <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
  //         <p className="text-gray-500">
  //           {activeTab === "achievements"
  //             ? "Achievements & goals content coming soon."
  //             : "AI Coaching insights coming soon."}
  //         </p>
  //       </div>
  //     )}

  //     <div className="fixed bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg">
  //       <MessageCircle className="h-6 w-6" />
  //     </div>
  //   </div>
  // );
  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Rep Perfomance   
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Placeholder — content coming soon.
      </p>
    </div>
  );
}
