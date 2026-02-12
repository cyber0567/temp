"use client";

import { type ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import { canAccessPath, getDashboardRedirectForRole } from "@/lib/roles";

export function RoleRouteGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { platformRole, loading } = useUser();

  useEffect(() => {
    if (loading) return;
    if (!pathname?.startsWith("/dashboard")) return;
    if (!canAccessPath(pathname, platformRole)) {
      router.replace(getDashboardRedirectForRole(platformRole));
    }
  }, [pathname, platformRole, loading, router]);

  return <>{children}</>;
}
