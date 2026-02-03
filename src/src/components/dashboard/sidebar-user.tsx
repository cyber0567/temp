"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import type { Session } from "next-auth";

type SidebarUserProps = {
  session: Session | null;
};

export function SidebarUser({ session }: SidebarUserProps) {
  if (!session?.user) return null;

  const { name, email, image } = session.user;
  const initials = name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?";

  return (
    <div className="border-t border-zinc-800 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-sm font-semibold text-white">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={name ?? "User"}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            initials
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">
            {name ?? "User"}
          </p>
          <p className="truncate text-xs text-zinc-400">{email ?? ""}</p>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="shrink-0 rounded p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
