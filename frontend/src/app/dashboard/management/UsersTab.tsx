"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { api, type PlatformRole } from "@/lib/api";
import { toast } from "sonner";
import { Users, RefreshCw, Loader2 } from "lucide-react";

type UserRow = {
  id: string;
  email?: string;
  full_name?: string;
  platform_role: PlatformRole;
  provider?: string;
};

export function UsersTab() {
  const { platformRole } = useUser();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (platformRole !== "super_admin") return;
    loadUsers();
  }, [platformRole]);

  function loadUsers() {
    setLoading(true);
    api
      .getAdminUsers()
      .then((res) => setUsers(res.users))
      .catch(() => toast.error("Failed to load users"))
      .finally(() => setLoading(false));
  }

  async function handleRoleChange(userId: string, newRole: PlatformRole) {
    setUpdating(userId);
    try {
      await api.setUserPlatformRole(userId, newRole);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, platform_role: newRole } : u)));
      toast.success("Role updated");
    } catch {
      toast.error("Failed to update role");
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Platform Users
          </h2>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Manage users and assign platform roles (Rep, Admin, Super Admin)
          </p>
        </div>
        <button
          type="button"
          onClick={loadUsers}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
            <p className="mt-3 text-sm text-zinc-500">Loading users…</p>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Users className="h-12 w-12 text-zinc-300" />
            <p className="mt-3 text-sm text-zinc-500">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">User</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Provider</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Platform Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700">
                {users.map((user) => (
                  <tr key={user.id} className="transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">{user.email ?? user.full_name ?? user.id}</p>
                        {(user.email || user.full_name) && (
                          <p className="font-mono text-xs text-zinc-400 dark:text-zinc-500">{user.id}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
                        {user.provider ?? "email"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <select
                          value={user.platform_role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as PlatformRole)}
                          disabled={updating === user.id}
                          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                        >
                          <option value="rep">Rep</option>
                          <option value="admin">Admin</option>
                          <option value="super_admin">Super Admin</option>
                        </select>
                        {updating === user.id && <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
