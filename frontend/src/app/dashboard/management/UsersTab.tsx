"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { api, type PlatformRole } from "@/lib/api";
import { PLATFORM_ROLE_LABELS } from "@/lib/roles";
import { toast } from "sonner";
import { Users, RefreshCw, Loader2, Search, Trash2 } from "lucide-react";

type UserRow = {
  id: string;
  email?: string;
  full_name?: string;
  platform_role: PlatformRole;
  provider?: string;
  active?: boolean;
};

export function UsersTab() {
  const { platformRole } = useUser();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [confirmRemove, setConfirmRemove] = useState<UserRow | null>(null);

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

  async function handleRemoveUser(user: UserRow) {
    setConfirmRemove(null);
    setRemoving(user.id);
    try {
      await api.removeUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      toast.success("User removed");
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message;
      toast.error(msg ?? "Failed to remove user");
    } finally {
      setRemoving(null);
    }
  }

  const q = search.trim().toLowerCase();
  const filteredUsers = q
    ? users.filter(
        (u) =>
          (u.full_name?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q) ||
            u.id.toLowerCase().includes(q))
      )
    : users;

  return (
    <div className="min-w-0">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-2xl">
            Platform Users
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 sm:text-base">
            Manage users and assign platform roles (Rep, Admin, Super Admin)
          </p>
        </div>
        <button
          type="button"
          onClick={loadUsers}
          disabled={loading}
          className="flex shrink-0 items-center justify-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>
      {users.length > 0 && (
        <div className="mb-4 flex min-w-0 items-center gap-2">
          <Search className="h-4 w-4 shrink-0 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
      )}
      <div className="min-w-0 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
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
                  {platformRole === "super_admin" && (
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={platformRole === "super_admin" ? 4 : 3} className="px-6 py-12 text-center text-sm text-zinc-500">
                      {search ? `No users match "${search}"` : "No users found"}
                    </td>
                  </tr>
                ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">{user.full_name ?? user.email ?? user.id}</p>
                        {(user.email || user.full_name) && (
                          <p className="font-mono text-xs text-zinc-400 dark:text-zinc-500">{user.email ?? user.id}</p>
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
                          {(Object.entries(PLATFORM_ROLE_LABELS) as [PlatformRole, string][]).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                        {updating === user.id && <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />}
                      </div>
                    </td>
                    {platformRole === "super_admin" && (
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setConfirmRemove(user)}
                          disabled={removing === user.id}
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/30"
                          title="Remove user"
                        >
                          {removing === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4" /> Remove
                            </>
                          )}
                        </button>
                      </td>
                    )}
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {confirmRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="remove-user-title">
          <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            <h3 id="remove-user-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Remove user?
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Remove <strong>{confirmRemove.full_name ?? confirmRemove.email ?? confirmRemove.id}</strong> from the platform? This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmRemove(null)}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleRemoveUser(confirmRemove)}
                disabled={removing === confirmRemove.id}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {removing === confirmRemove.id ? "Removing…" : "Remove user"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
