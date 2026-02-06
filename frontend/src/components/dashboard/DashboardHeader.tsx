"use client";

import { useEffect, useState } from "react";
import { Phone, Loader2 } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function DashboardHeader() {
  const { platformRole, orgs } = useUser();
  const [ringCentralConnected, setRingCentralConnected] = useState<boolean | null>(null);

  useEffect(() => {
    api
      .getRingCentralStatus()
      .then((res) => setRingCentralConnected(res.connected))
      .catch(() => setRingCentralConnected(false));
  }, []);

  async function handleConnectRingCentral() {
    try {
      const { authUrl } = await api.getRingCentralAuthUrl();
      window.location.href = authUrl;
    } catch (e: unknown) {
      const err = e as { message?: string };
      toast.error(err?.message ?? "Failed to connect RingCentral");
    }
  }

  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-zinc-200 bg-zinc-800/80 px-4 dark:border-zinc-800 dark:bg-zinc-900/80">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-zinc-400">MVP</span>
        <span className="hidden rounded-md bg-zinc-700 px-2 py-0.5 text-xs font-medium text-zinc-300 sm:inline-block">
          {platformRole === "super_admin" ? "Super Admin" : platformRole === "admin" ? "Admin" : "Rep"}
        </span>
        {orgs.length > 0 && (
          <span className="hidden text-xs text-zinc-500 sm:inline-block">
            {orgs.map((o) => o.name).join(", ")}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {ringCentralConnected === null ? (
          <span className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Checking RingCentral…
          </span>
        ) : ringCentralConnected ? (
          <span className="flex items-center gap-1.5 text-xs text-emerald-400">
            <Phone className="h-3.5 w-3.5" />
            RingCentral connected
          </span>
        ) : (
          <button
            type="button"
            onClick={handleConnectRingCentral}
            className="flex items-center gap-1.5 rounded-md border border-zinc-600 px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
          >
            <Phone className="h-3.5 w-3.5" />
            Connect RingCentral
          </button>
        )}
      </div>
    </header>
  );
}
