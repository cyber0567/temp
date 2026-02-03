"use client";

import {
  LayoutDashboard,
  Users,
  Zap,
  BarChart3,
  UsersRound,
  Building2,
  CheckSquare,
  Megaphone,
  Phone,
  GraduationCap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const SIDEBAR_ICON_NAMES = [
  "LayoutDashboard",
  "Users",
  "Zap",
  "BarChart3",
  "UsersRound",
  "Building2",
  "CheckSquare",
  "Megaphone",
  "Phone",
  "GraduationCap",
] as const;

export type SidebarIconName = (typeof SIDEBAR_ICON_NAMES)[number];

export const SIDEBAR_ICONS: Record<SidebarIconName, LucideIcon> = {
  LayoutDashboard,
  Users,
  Zap,
  BarChart3,
  UsersRound,
  Building2,
  CheckSquare,
  Megaphone,
  Phone,
  GraduationCap,
};
