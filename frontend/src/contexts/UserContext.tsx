"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, type MeResponse, type PlatformRole } from "@/lib/api";

type UserContextValue = {
  user: MeResponse["user"];
  orgs: MeResponse["orgs"];
  platformRole: PlatformRole;
  loading: boolean;
  refetch: () => Promise<void>;
};

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<MeResponse>({
    user: null,
    orgs: [],
  });
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const res = await api.getMe();
      setData(res);
    } catch {
      setData({ user: null, orgs: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const value = useMemo<UserContextValue>(
    () => ({
      user: data.user,
      orgs: data.orgs,
      platformRole: data.user?.platformRole ?? "rep",
      loading,
      refetch,
    }),
    [data, loading, refetch]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
