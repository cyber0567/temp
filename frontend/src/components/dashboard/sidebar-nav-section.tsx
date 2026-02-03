"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { SIDEBAR_ICONS, type SidebarIconName } from "./sidebar-icons";

type NavLink = {
  href: string;
  label: string;
};

type SidebarNavSectionProps = {
  label: string;
  icon: SidebarIconName;
  links: NavLink[];
  defaultOpen?: boolean;
};

export function SidebarNavSection({
  label,
  icon,
  links,
  defaultOpen = false,
}: SidebarNavSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const Icon = SIDEBAR_ICONS[icon];

  return (
    <div className="border-b border-zinc-800/80">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
      >
        <span className="flex items-center gap-3">
          <Icon className="h-5 w-5 shrink-0" />
          {label}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <div className="bg-zinc-900/50 pb-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block px-4 py-2 pl-12 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
