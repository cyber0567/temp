"use client";

import { useState } from "react";
import {
  BookOpen,
  FileStack,
  Eye,
  ThumbsUp,
  Search,
  FileText,
  TrendingUp,
  Sparkles,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

const metricCards = [
  { label: "Total Articles", value: "0", icon: BookOpen, iconBg: "bg-blue-100", iconColor: "text-blue-600" },
  { label: "Categories", value: "0", icon: FileStack, iconBg: "bg-violet-100", iconColor: "text-violet-600" },
  { label: "Total Views", value: "0", icon: Eye, iconBg: "bg-green-100", iconColor: "text-green-600" },
  { label: "Helpful Votes", value: "0", icon: ThumbsUp, iconBg: "bg-amber-100", iconColor: "text-amber-600" },
];

const tabs = [
  { id: "browse", label: "Browse" },
  { id: "ai-search", label: "AI Search" },
  { id: "popular", label: "Popular" },
];

const filterChips = [
  { id: "all", label: "All Articles", icon: BookOpen },
  { id: "company", label: "Company Info", icon: FileText },
  { id: "playbook", label: "Sales Playbook", icon: TrendingUp },
  { id: "product", label: "Product Docs", icon: FileText },
  { id: "practices", label: "Best Practices", icon: Sparkles },
];

export default function KnowledgeBasePage() {
  const [activeTab, setActiveTab] = useState("browse");
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [aiQuery, setAiQuery] = useState("");

  // return (
  //   <div className="flex flex-col gap-6 p-6">
  //     <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
  //       <div>
  //         <h1 className="text-2xl font-bold tracking-tight text-gray-900">
  //           Knowledge Base
  //         </h1>
  //         <p className="mt-0.5 text-sm text-gray-500">
  //           Company information, sales playbooks, and best practices
  //         </p>
  //       </div>
  //       <Button
  //         className="mt-2 shrink-0 sm:mt-0"
  //         leftIcon={<Plus className="h-4 w-4" />}
  //       >
  //         + New Article
  //       </Button>
  //     </div>

  //     <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
  //       {metricCards.map((card) => (
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

  //     <div className="flex flex-wrap gap-1 border-b border-gray-200">
  //       {tabs.map((tab) => (
  //         <button
  //           key={tab.id}
  //           type="button"
  //           onClick={() => setActiveTab(tab.id)}
  //           className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
  //             activeTab === tab.id
  //               ? "border-gray-900 text-gray-900"
  //               : "border-transparent text-gray-500 hover:text-gray-700"
  //           }`}
  //         >
  //           {tab.label}
  //         </button>
  //       ))}
  //     </div>

  //     {activeTab === "browse" && (
  //       <>
  //         <div className="flex flex-wrap gap-2">
  //           {filterChips.map((chip) => (
  //             <button
  //               key={chip.id}
  //               type="button"
  //               onClick={() => setActiveFilter(chip.id)}
  //               className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
  //                 activeFilter === chip.id
  //                   ? "border-gray-800 bg-gray-800 text-white"
  //                   : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
  //               }`}
  //             >
  //               <chip.icon className="h-4 w-4" />
  //               {chip.label}
  //             </button>
  //           ))}
  //         </div>
  //         <div className="relative">
  //           <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
  //           <input
  //             type="search"
  //             placeholder="Search articles..."
  //             value={searchQuery}
  //             onChange={(e) => setSearchQuery(e.target.value)}
  //             className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
  //           />
  //         </div>
  //       </>
  //     )}

  //     {activeTab === "ai-search" && (
  //       <div className="rounded-xl border border-gray-200 bg-white p-6">
  //         <div className="flex items-center gap-2 text-gray-900">
  //           <Sparkles className="h-5 w-5 text-violet-500" />
  //           <h2 className="text-lg font-semibold">AI-Powered Search</h2>
  //         </div>
  //         <p className="mt-1 text-sm text-gray-500">
  //           Ask questions in natural language and get intelligent, context-aware results.
  //         </p>
  //         <div className="mt-4 flex gap-2">
  //           <input
  //             type="text"
  //             placeholder="e.g., How do I handle price objections?"
  //             value={aiQuery}
  //             onChange={(e) => setAiQuery(e.target.value)}
  //             className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
  //           />
  //           <Button className="shrink-0" leftIcon={<Search className="h-4 w-4" />}>
  //             Search
  //           </Button>
  //         </div>
  //       </div>
  //     )}

  //     {activeTab === "popular" && (
  //       <div className="grid gap-4 lg:grid-cols-2">
  //         <div className="rounded-xl border border-gray-200 bg-white p-4">
  //           <h3 className="font-semibold text-gray-900">Most Viewed</h3>
  //           <div className="mt-4 min-h-[120px]" />
  //         </div>
  //         <div className="rounded-xl border border-gray-200 bg-white p-4">
  //           <h3 className="font-semibold text-gray-900">Recently Updated</h3>
  //           <div className="mt-4 min-h-[120px]" />
  //         </div>
  //       </div>
  //     )}

  //     {activeTab === "browse" && (
  //       <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-gray-50/50 py-16">
  //         <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200">
  //           <BookOpen className="h-10 w-10 text-gray-400" />
  //         </div>
  //         <p className="mt-4 text-lg font-semibold text-gray-900">No articles found</p>
  //         <p className="mt-1 text-sm text-gray-500">
  //           Try adjusting your search or filters
  //         </p>
  //       </div>
  //     )}
  //   </div>
  // );
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Knowledge Base
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Placeholder — content coming soon.
      </p>
    </div>
  );
}
