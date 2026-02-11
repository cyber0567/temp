"use client";

import { cn } from "@/lib/utils";

type SeparatorProps = {
  text?: string;
  className?: string;
};

export function Separator({ text = "OR", className = "" }: SeparatorProps) {
  return (
    <div
      className={cn("flex items-center gap-3", className)}
      aria-hidden="true"
    >
      <span className="h-px flex-1 bg-gray-200 dark:bg-zinc-700" />
      <span className="text-sm text-gray-400 dark:text-zinc-500">{text}</span>
      <span className="h-px flex-1 bg-gray-200 dark:bg-zinc-700" />
    </div>
  );
}
