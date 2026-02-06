"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Plus,
  Users,
  ChevronRight,
  Loader2,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { api, type OrgRole, type OrgResponse } from "@/lib/api";
import { toast } from "sonner";

type Member = { user_id: string; role: OrgRole; created_at: string };

export function OrgsTab() {
  const { orgs, refetch } = useUser();
  const [loading, setLoading] = useState(true);
  const [selectedOrg, setSelectedOrg] = useState<OrgResponse | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [creating, setCreating] = useState(false);
  const [addUserId, setAddUserId] = useState("");
  const [addRole, setAddRole] = useState<OrgRole>("member");
  const [adding, setAdding] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    refetch().finally(() => setLoading(false));
  }, [refetch]);

  useEffect(() => {
    if (!selectedOrg || selectedOrg.role !== "admin") {
      setMembers([]);
      return;
    }
    setMembersLoading(true);
    api
      .getOrgMembers(selectedOrg.id)
      .then((r) => setMembers(r.members))
      .catch(() => toast.error("Failed to load members"))
      .finally(() => setMembersLoading(false));
  }, [selectedOrg]);

  async function handleCreateOrg(e: React.FormEvent) {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    setCreating(true);
    try {
      const { org } = await api.createOrg(newOrgName.trim());
      setNewOrgName("");
      await refetch();
      setSelectedOrg({ ...org, role: "admin" });
      toast.success("Organization created");
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? "Failed to create");
    } finally {
      setCreating(false);
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOrg || !addUserId.trim()) return;
    setAdding(true);
    try {
      await api.addOrgMember(selectedOrg.id, addUserId.trim(), addRole);
      setAddUserId("");
      const { members: m } = await api.getOrgMembers(selectedOrg.id);
      setMembers(m);
      toast.success("Member added");
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? "Failed to add");
    } finally {
      setAdding(false);
    }
  }

  async function handleUpdateRole(userId: string, role: OrgRole) {
    if (!selectedOrg) return;
    setUpdating(userId);
    try {
      await api.updateOrgMemberRole(selectedOrg.id, userId, role);
      setMembers((prev) => prev.map((m) => (m.user_id === userId ? { ...m, role } : m)));
      toast.success("Role updated");
    } catch {
      toast.error("Failed to update");
    } finally {
      setUpdating(null);
    }
  }

  async function handleRemoveMember(userId: string) {
    if (!selectedOrg) return;
    setRemoving(userId);
    try {
      await api.removeOrgMember(selectedOrg.id, userId);
      setMembers((prev) => prev.filter((m) => m.user_id !== userId));
      toast.success("Member removed");
    } catch {
      toast.error("Failed to remove");
    } finally {
      setRemoving(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-1">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-zinc-50">
            <Building2 className="h-5 w-5 text-violet-500" />
            Your Organizations
          </h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            </div>
          ) : orgs.length === 0 ? (
            <p className="py-4 text-sm text-zinc-500">No organizations yet. Create one below.</p>
          ) : (
            <ul className="space-y-1">
              {orgs.map((org) => (
                <li key={org.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedOrg(org)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                      selectedOrg?.id === org.id
                        ? "bg-violet-100 text-violet-900 dark:bg-violet-900/30 dark:text-violet-300"
                        : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Building2 className="h-4 w-4 shrink-0 text-zinc-500" />
                      {org.name}
                    </span>
                    <span className="shrink-0 rounded bg-zinc-200 px-1.5 py-0.5 text-xs text-zinc-600">{org.role}</span>
                    <ChevronRight className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${selectedOrg?.id === org.id ? "rotate-90" : ""}`} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">Create Organization</h2>
          <form onSubmit={handleCreateOrg} className="flex gap-2">
            <input
              type="text"
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
              placeholder="Organization name"
              className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <button
              type="submit"
              disabled={creating || !newOrgName.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:opacity-50"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create
            </button>
          </form>
        </div>
      </div>
      <div className="lg:col-span-2">
        {selectedOrg ? (
          <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-700">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                <Users className="h-5 w-5 text-violet-500" />
                {selectedOrg.name} — Members
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {selectedOrg.role === "admin" ? "You can manage members" : "View only (admin can manage)"}
              </p>
            </div>
            <div className="p-6">
              {selectedOrg.role !== "admin" ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Contact an organization admin to manage members.</p>
              ) : (
                <>
                  <form onSubmit={handleAddMember} className="mb-6 flex flex-wrap gap-2">
                    <input
                      type="text"
                      value={addUserId}
                      onChange={(e) => setAddUserId(e.target.value)}
                      placeholder="User ID"
                      className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                    <select
                      value={addRole}
                      onChange={(e) => setAddRole(e.target.value as OrgRole)}
                      className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <button
                      type="submit"
                      disabled={adding || !addUserId.trim()}
                      className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
                    >
                      {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                      Add
                    </button>
                  </form>
                  {membersLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
                    </div>
                  ) : members.length === 0 ? (
                    <p className="py-8 text-center text-sm text-zinc-500">No members yet.</p>
                  ) : (
                    <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
                      <table className="min-w-full">
                        <thead>
                          <tr className="bg-zinc-50 dark:bg-zinc-800">
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">User</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">Role</th>
                            <th className="px-4 py-3 text-right text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                          {members.map((m) => (
                            <tr key={m.user_id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                              <td className="px-4 py-3">
                                <p className="font-mono text-sm text-zinc-900 dark:text-zinc-100">{m.user_id}</p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">Joined {new Date(m.created_at).toLocaleDateString()}</p>
                              </td>
                              <td className="px-4 py-3">
                                <select
                                  value={m.role}
                                  onChange={(e) => handleUpdateRole(m.user_id, e.target.value as OrgRole)}
                                  disabled={updating === m.user_id}
                                  className="rounded border border-zinc-300 bg-white px-2 py-1 text-sm disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                                >
                                  <option value="admin">Admin</option>
                                  <option value="member">Member</option>
                                  <option value="viewer">Viewer</option>
                                </select>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMember(m.user_id)}
                                  disabled={removing === m.user_id}
                                  className="rounded p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                  aria-label="Remove"
                                >
                                  {removing === m.user_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50/50 py-16 dark:border-zinc-700 dark:bg-zinc-800/30">
            <Building2 className="h-12 w-12 text-zinc-300 dark:text-zinc-500" />
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Select an organization</p>
          </div>
        )}
      </div>
    </div>
  );
}
