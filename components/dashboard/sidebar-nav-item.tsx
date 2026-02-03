"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SIDEBAR_ICONS, type SidebarIconName } from "./sidebar-icons";

type SidebarNavItemProps = {
  href: string;
  label: string;
  icon: SidebarIconName;
  active?: boolean;
};

export function SidebarNavItem({
  href,
  label,
  icon,
  active,
}: SidebarNavItemProps) {
  const pathname = usePathname();
  const isActive = active ?? pathname === href;
  const Icon = SIDEBAR_ICONS[icon];

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors",
        isActive
          ? "bg-violet-600/90 text-white"
          : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {label}
    </Link>
  );
}
