"use client";

import { useState, useEffect, useRef } from "react";
import {
  User,
  Building2,
  Bell,
  Shield,
  Settings as SettingsIcon,
  Save,
  Camera,
  Loader2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useUser } from "@/contexts/UserContext";
import { api, type SettingsResponse } from "@/lib/api";
import { getPlatformRoleLabel } from "@/lib/roles";
import { toast } from "sonner";

const settingTabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "organization", label: "Organization", icon: Building2 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "compliance", label: "Compliance", icon: Shield },
  { id: "quality", label: "Quality", icon: SettingsIcon },
];

const TIMEZONES: { value: string; label: string }[] = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "Eastern Time" },
  { value: "America/Los_Angeles", label: "Pacific Time" },
  { value: "Europe/Paris", label: "Central European Time" },
];
const CURRENCIES: { value: string; label: string }[] = [
  { value: "GBP", label: "£ British Pound (GBP)" },
  { value: "USD", label: "$ US Dollar (USD)" },
  { value: "EUR", label: "€ Euro (EUR)" },
];
const INDUSTRIES = ["Technology", "Healthcare", "Finance", "Retail", "Other"];
const COMPANY_SIZES = ["1-10 employees", "11-50 employees", "51-200 employees", "201-500 employees", "500+ employees"];

const AVATAR_MAX_SIZE = 192;
const AVATAR_JPEG_QUALITY = 0.7;

function compressImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const scale = Math.min(AVATAR_MAX_SIZE / w, AVATAR_MAX_SIZE / h, 1);
      const cw = Math.round(w * scale);
      const ch = Math.round(h * scale);
      const canvas = document.createElement("canvas");
      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas not supported"));
        return;
      }
      ctx.drawImage(img, 0, 0, cw, ch);
      try {
        const dataUrl = canvas.toDataURL("image/jpeg", AVATAR_JPEG_QUALITY);
        resolve(dataUrl);
      } catch {
        reject(new Error("Failed to compress image"));
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Invalid image"));
    };
    img.src = url;
  });
}

export default function SettingsPage() {
  const { user, orgs, refetch: refetchUser } = useUser();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [timezone, setTimezone] = useState("UTC");
  const [currency, setCurrency] = useState("USD");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [orgName, setOrgName] = useState("");
  const [industry, setIndustry] = useState("Technology");
  const [companySize, setCompanySize] = useState("1-10 employees");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [flaggedCalls, setFlaggedCalls] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [autoReview, setAutoReview] = useState(true);
  const [requireDisclosure, setRequireDisclosure] = useState(true);
  const [autoFlagThreshold, setAutoFlagThreshold] = useState(60);
  const [minQaScore, setMinQaScore] = useState(70);
  const [autoApproveThreshold, setAutoApproveThreshold] = useState(85);
  const [enableEscalation, setEnableEscalation] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);

  function applySettings(data: SettingsResponse) {
    setFullName(data.profile.fullName ?? "");
    setAvatarUrl(data.profile.avatarUrl ?? null);
    const tz = data.profile.timezone ?? "UTC";
    setTimezone(TIMEZONES.some((t) => t.value === tz) ? tz : "UTC");
    setCurrency(data.profile.currency ?? "USD");
    if (data.organization) {
      setOrgName(data.organization.name);
      setIndustry(data.organization.industry || "Technology");
      setCompanySize(data.organization.companySize || "1-10 employees");
    }
    setEmailAlerts(data.notifications.emailAlerts);
    setFlaggedCalls(data.notifications.flaggedCalls);
    setDailyDigest(data.notifications.dailyDigest);
    setWeeklyReport(data.notifications.weeklyReport);
    if (data.compliance) {
      setAutoReview(data.compliance.autoReview);
      setRequireDisclosure(data.compliance.requireDisclosure);
      setAutoFlagThreshold(data.compliance.autoFlagThreshold);
    }
    if (data.quality) {
      setMinQaScore(data.quality.minQaScore);
      setAutoApproveThreshold(data.quality.autoApproveThreshold);
      setEnableEscalation(data.quality.enableEscalation);
    }
    setOrgId(data.orgId ?? data.organization?.id ?? null);
  }

  const primaryOrgId = user?.organizationId ?? orgs?.[0]?.id;
  const isOrgAdminForCurrentOrg =
    user?.platformRole === "super_admin" || (orgId ? orgs?.find((o) => o.id === orgId)?.role === "admin" : false);

  useEffect(() => {
    api
      .getSettings(primaryOrgId ?? undefined)
      .then(applySettings)
      .catch((err) => {
        toast.error(err?.message ?? "Failed to load settings");
      })
      .finally(() => setLoading(false));
  }, [primaryOrgId]);

  async function switchOrganization(newOrgId: string) {
    try {
      const data = await api.getSettings(newOrgId);
      setOrgId(data.orgId ?? data.organization?.id ?? null);
      if (data.organization) {
        setOrgName(data.organization.name);
        setIndustry(data.organization.industry || "Technology");
        setCompanySize(data.organization.companySize || "1-10 employees");
      }
      if (data.compliance) {
        setAutoReview(data.compliance.autoReview);
        setRequireDisclosure(data.compliance.requireDisclosure);
        setAutoFlagThreshold(data.compliance.autoFlagThreshold);
      }
      if (data.quality) {
        setMinQaScore(data.quality.minQaScore);
        setAutoApproveThreshold(data.quality.autoApproveThreshold);
        setEnableEscalation(data.quality.enableEscalation);
      }
    } catch (err) {
      toast.error(err && typeof err === "object" && "message" in err ? String((err as { message: string }).message) : "Failed to load organization");
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await api.saveSettings({
        profile: {
          fullName: fullName.trim(),
          timezone,
          currency,
          avatarUrl: avatarUrl, // send null explicitly so backend clears the photo
        },
        notifications: {
          emailAlerts,
          flaggedCalls,
          dailyDigest,
          weeklyReport,
        },
        ...(orgId && isOrgAdminForCurrentOrg && {
          organization: { orgId, name: orgName || undefined, industry: industry || undefined, companySize: companySize || undefined },
          compliance: { autoReview, requireDisclosure, autoFlagThreshold },
          quality: { minQaScore, autoApproveThreshold, enableEscalation },
        }),
      });
      applySettings(res);
      await refetchUser();
      toast.success("Settings saved");
    } catch (err: unknown) {
      const message = err && typeof err === "object" && "message" in err ? String((err as { message: string }).message) : "Failed to save";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center bg-white p-6 dark:bg-zinc-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
    <div className="flex flex-col gap-4 bg-white p-4 dark:bg-zinc-50 sm:gap-6 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-900">
            Settings
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Manage your platform configuration
          </p>
        </div>
        <Button
          className="mt-2 shrink-0 bg-gray-900 hover:bg-gray-800 sm:mt-0"
          leftIcon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex min-w-0 flex-wrap gap-2">
          {settingTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-gray-300 bg-gray-200 text-gray-800 dark:border-zinc-600 dark:bg-zinc-600 dark:text-zinc-100"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              <tab.icon className="h-4 w-4 shrink-0" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "profile" && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-zinc-200 dark:bg-white sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-900">Profile Settings</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Manage your personal account information
          </p>
          <div className="mt-6 flex flex-col gap-8">
            {/* One row: photo + change button + remove button, full width, vertically centered */}
            <div className="flex w-full flex-row items-center gap-4">
              <div className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 dark:bg-zinc-200">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-3xl font-semibold text-gray-600 dark:text-zinc-600">
                    {(fullName || user?.email)?.slice(0, 1).toUpperCase() ?? "?"}
                  </span>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  compressImageAsDataUrl(file)
                    .then(setAvatarUrl)
                    .catch(() => toast.error("Failed to process image. Try a smaller photo."));
                  e.target.value = "";
                }}
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  leftIcon={<Camera className="h-4 w-4" />}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Change Photo
                </Button>
                {avatarUrl && (
                  <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    leftIcon={<Trash2 className="h-4 w-4" />}
                    onClick={() => setAvatarUrl(null)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30"
                  >
                    Remove photo
                  </Button>
                )}
              </div>
            </div>
            {/* Form fields: 2 columns */}
            <div className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-zinc-700">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 dark:border-zinc-300 dark:bg-white dark:text-zinc-900"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-zinc-700">Email</label>
                <input
                  type="email"
                  value={user?.email ?? ""}
                  disabled
                  className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-zinc-700">Role</label>
                <input
                  type="text"
                  value={getPlatformRoleLabel(user?.platformRole) ?? "—"}
                  disabled
                  className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-zinc-700">Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 dark:border-zinc-300 dark:bg-white dark:text-zinc-900"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-zinc-700">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 dark:border-zinc-300 dark:bg-white dark:text-zinc-900"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "organization" && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-200 dark:bg-zinc-900 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Organization Settings</h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-zinc-400">
            Configure your organization details
          </p>
          {!orgId && (!orgs?.length || orgs.length === 0) ? (
            <p className="mt-4 text-sm text-gray-500 dark:text-zinc-400">You are not in any organization yet.</p>
          ) : (
            <div className="mt-6 space-y-6">
              {!isOrgAdminForCurrentOrg && user?.platformRole !== "super_admin" && (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                  Only organization admins can edit these settings. Your profile and notifications are still saved when you click Save.
                </p>
              )}
              {orgs && orgs.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Organization</label>
                  <select
                    value={orgId ?? ""}
                    onChange={(e) => {
                      const id = e.target.value;
                      if (id) switchOrganization(id);
                    }}
                    className="mt-1 w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 pr-9 text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    <option value="">Select organization…</option>
                    {orgs.map((org) => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">Switch which organization to view and edit</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Organization Name</label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. SalesOS Enterprise"
                  disabled={!isOrgAdminForCurrentOrg}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Industry</label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    disabled={!isOrgAdminForCurrentOrg}
                    className="mt-1 w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 pr-9 text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    <option value="">Select industry</option>
                    {INDUSTRIES.map((i) => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Company Size</label>
                  <select
                    value={companySize}
                    onChange={(e) => setCompanySize(e.target.value)}
                    disabled={!isOrgAdminForCurrentOrg}
                    className="mt-1 w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 pr-9 text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    <option value="">Select size</option>
                    {COMPANY_SIZES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "notifications" && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-zinc-200 dark:bg-white sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-900">Notification Preferences</h2>
          <p className="mt-0.5 text-sm text-gray-500">Choose how you want to be notified</p>
          <ul className="mt-6 space-y-4">
            {[
              { id: "email", label: "Email Alerts", desc: "Receive important alerts via email", on: emailAlerts, set: setEmailAlerts },
              { id: "flagged", label: "Flagged Call Notifications", desc: "Get notified when calls are flagged for review", on: flaggedCalls, set: setFlaggedCalls },
              { id: "daily", label: "Daily Digest", desc: "Receive a daily summary of activities", on: dailyDigest, set: setDailyDigest },
              { id: "weekly", label: "Weekly Report", desc: "Receive weekly performance reports", on: weeklyReport, set: setWeeklyReport },
            ].map((opt) => (
              <li key={opt.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 dark:border-zinc-200 dark:bg-white">
                <div>
                  <p className="font-medium text-gray-900 dark:text-zinc-900">{opt.label}</p>
                  <p className="text-sm text-gray-500">{opt.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => opt.set(!opt.on)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${opt.on ? "bg-gray-900 dark:bg-zinc-900" : "bg-gray-200 dark:bg-zinc-200"}`}
                  role="switch"
                  aria-checked={opt.on}
                >
                  <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${opt.on ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeTab === "compliance" && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-zinc-200 dark:bg-white sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-900">Compliance Settings</h2>
          <p className="mt-0.5 text-sm text-gray-500">Configure compliance monitoring and enforcement (org admin)</p>
          {!orgId ? (
            <p className="mt-4 text-sm text-gray-500">Organization required.</p>
          ) : (
            <>
              {!isOrgAdminForCurrentOrg && user?.platformRole !== "super_admin" && (
                <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                  Only organization admins can edit these settings.
                </p>
              )}
              <ul className="mt-6 space-y-4">
              <li className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 dark:border-zinc-200 dark:bg-white">
                <div>
                  <p className="font-medium text-gray-900 dark:text-zinc-900">Automatic Compliance Review</p>
                  <p className="text-sm text-gray-500">Automatically review all calls for compliance</p>
                </div>
                <button type="button" onClick={() => setAutoReview(!autoReview)} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${autoReview ? "bg-gray-900 dark:bg-zinc-900" : "bg-gray-200 dark:bg-zinc-200"}`} role="switch" aria-checked={autoReview}>
                  <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${autoReview ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </li>
              <li className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 dark:border-zinc-200 dark:bg-white">
                <div>
                  <p className="font-medium text-gray-900 dark:text-zinc-900">Require Disclosure</p>
                  <p className="text-sm text-gray-500">Require disclosure statements on all calls</p>
                </div>
                <button type="button" onClick={() => setRequireDisclosure(!requireDisclosure)} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${requireDisclosure ? "bg-gray-900 dark:bg-zinc-900" : "bg-gray-200 dark:bg-zinc-200"}`} role="switch" aria-checked={requireDisclosure}>
                  <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${requireDisclosure ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </li>
              <li className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 dark:border-zinc-200 dark:bg-white">
                <div>
                  <p className="font-medium text-gray-900 dark:text-zinc-900">Auto-Flag Threshold</p>
                  <p className="text-sm text-gray-500">Flag calls below this compliance score</p>
                </div>
                <input type="number" min={0} max={100} value={autoFlagThreshold} onChange={(e) => setAutoFlagThreshold(parseInt(e.target.value, 10) || 0)} className="w-20 rounded-lg border border-gray-300 bg-white px-3 py-2 text-center text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 dark:border-zinc-300 dark:bg-white dark:text-zinc-900" />
              </li>
            </ul>
            </>
          )}
        </div>
      )}

      {activeTab === "quality" && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-zinc-200 dark:bg-white sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-900">Quality Assurance Settings</h2>
          <p className="mt-0.5 text-sm text-gray-500">Configure QA thresholds and automation (org admin)</p>
          {!orgId ? (
            <p className="mt-4 text-sm text-gray-500">Organization required.</p>
          ) : (
            <>
              {!isOrgAdminForCurrentOrg && user?.platformRole !== "super_admin" && (
                <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                  Only organization admins can edit these settings.
                </p>
              )}
              <ul className="mt-6 space-y-4">
              <li className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 dark:border-zinc-200 dark:bg-white">
                <div>
                  <p className="font-medium text-gray-900 dark:text-zinc-900">Minimum QA Score</p>
                  <p className="text-sm text-gray-500">Minimum acceptable QA score for calls</p>
                </div>
                <input type="number" min={0} max={100} value={minQaScore} onChange={(e) => setMinQaScore(parseInt(e.target.value, 10) || 0)} className="w-20 rounded-lg border border-gray-300 bg-white px-3 py-2 text-center text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 dark:border-zinc-300 dark:bg-white dark:text-zinc-900" />
              </li>
              <li className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 dark:border-zinc-200 dark:bg-white">
                <div>
                  <p className="font-medium text-gray-900 dark:text-zinc-900">Auto-Approve Threshold</p>
                  <p className="text-sm text-gray-500">Automatically approve calls above this score</p>
                </div>
                <input type="number" min={0} max={100} value={autoApproveThreshold} onChange={(e) => setAutoApproveThreshold(parseInt(e.target.value, 10) || 0)} className="w-20 rounded-lg border border-gray-300 bg-white px-3 py-2 text-center text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 dark:border-zinc-300 dark:bg-white dark:text-zinc-900" />
              </li>
              <li className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 dark:border-zinc-200 dark:bg-white">
                <div>
                  <p className="font-medium text-gray-900 dark:text-zinc-900">Enable Escalation</p>
                  <p className="text-sm text-gray-500">Allow escalation of low-quality calls to supervisors</p>
                </div>
                <button type="button" onClick={() => setEnableEscalation(!enableEscalation)} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${enableEscalation ? "bg-gray-900 dark:bg-zinc-900" : "bg-gray-200 dark:bg-zinc-200"}`} role="switch" aria-checked={enableEscalation}>
                  <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${enableEscalation ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </li>
            </ul>
            </>
          )}
        </div>
      )}
    </div>
    </div>
  );
}
