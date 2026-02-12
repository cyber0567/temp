"use client";

import { useState } from "react";
import {
  Send,
  ImageIcon,
  Trophy,
  HelpCircle,
  Megaphone,
  TrendingUp,
  Heart,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

const postTypes = [
  { id: "update", label: "Update", icon: TrendingUp },
  { id: "achievement", label: "Achievement", icon: Trophy },
  { id: "question", label: "Question", icon: HelpCircle },
  { id: "announcement", label: "Announcement", icon: Megaphone },
];

const examplePost = {
  author: "Harry Hogarth",
  initial: "H",
  time: "Jan 20, 2026 • 4:07 PM",
  content: "I've just sold 10k!!",
  likes: 1,
  comments: 0,
  type: "Update",
};

export default function SocialFeedPage() {
  const [content, setContent] = useState("");
  const [activeType, setActiveType] = useState("achievement");

  // return (
  //   <div className="flex flex-col gap-6 p-6">
  //     <div>
  //       <h1 className="text-2xl font-bold tracking-tight text-gray-900">
  //         Social Feed
  //       </h1>
  //       <p className="mt-0.5 text-sm text-gray-500">
  //         Connect with your team, share updates and celebrate wins
  //       </p>
  //     </div>

  //     <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
  //       <textarea
  //         placeholder="What's on your mind? Share updates, wins, or ask questions..."
  //         value={content}
  //         onChange={(e) => setContent(e.target.value)}
  //         rows={3}
  //         className="w-full resize-none rounded-lg border-0 bg-transparent p-0 text-gray-900 placeholder:text-gray-400 focus:ring-0"
  //       />
  //       <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3">
  //         <div className="flex flex-wrap gap-2">
  //           {postTypes.map((type) => (
  //             <button
  //               key={type.id}
  //               type="button"
  //               onClick={() => setActiveType(type.id)}
  //               className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
  //                 activeType === type.id
  //                   ? "bg-gray-900 text-white"
  //                   : "bg-gray-100 text-gray-600 hover:bg-gray-200"
  //               }`}
  //             >
  //               <type.icon className="h-4 w-4" />
  //               {type.label}
  //             </button>
  //           ))}
  //         </div>
  //         <div className="flex items-center gap-2">
  //           <button
  //             type="button"
  //             className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
  //             aria-label="Add image"
  //           >
  //             <ImageIcon className="h-5 w-5" />
  //           </button>
  //           <Button leftIcon={<Send className="h-4 w-4" />}>Post</Button>
  //         </div>
  //       </div>
  //     </div>

  //     <div className="space-y-4">
  //       <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
  //         <div className="flex items-start justify-between gap-3">
  //           <div className="flex gap-3">
  //             <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-500 text-sm font-semibold text-white">
  //               {examplePost.initial}
  //             </div>
  //             <div>
  //               <p className="font-semibold text-gray-900">{examplePost.author}</p>
  //               <p className="text-xs text-gray-500">{examplePost.time}</p>
  //             </div>
  //           </div>
  //           <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
  //             {examplePost.type}
  //           </span>
  //         </div>
  //         <p className="mt-3 text-gray-900">{examplePost.content}</p>
  //         <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
  //           <span className="inline-flex items-center gap-1">
  //             <Heart className="h-4 w-4" />
  //             {examplePost.likes} Like{examplePost.likes !== 1 ? "s" : ""}
  //           </span>
  //           <span className="inline-flex items-center gap-1">
  //             <MessageCircle className="h-4 w-4" />
  //             {examplePost.comments} Comment{examplePost.comments !== 1 ? "s" : ""}
  //           </span>
  //         </div>
  //       </div>
  //     </div>
  //   </div>
  // );
  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Social Feed
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Placeholder — content coming soon.
      </p>
    </div>
  );
}
