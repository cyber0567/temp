"use client";

import { useState } from "react";
import {
  User,
  Building2,
  Bell,
  Shield,
  Settings as SettingsIcon,
  Save,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useUser } from "@/contexts/UserContext";

const settingTabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "organization", label: "Organization", icon: Building2 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "compliance", label: "Compliance", icon: Shield },
  { id: "quality", label: "Quality", icon: SettingsIcon },
];

const notificationOptions = [
  { id: "email", label: "Email Alerts", desc: "Receive important alerts via email", on: true },
  { id: "flagged", label: "Flagged Call Notifications", desc: "Get notified when calls are flagged for review", on: true },
  { id: "daily", label: "Daily Digest", desc: "Receive a daily summary of activities", on: false },
  { id: "weekly", label: "Weekly Report", desc: "Receive weekly performance reports", on: true },
];

const complianceOptions = [
  { id: "review", label: "Automatic Compliance Review", desc: "Automatically review all calls for compliance", on: true },
  { id: "disclosure", label: "Require Disclosure", desc: "Require disclosure statements on all calls", on: true },
  { id: "threshold", label: "Auto-Flag Threshold", desc: "Flag calls below this compliance score", value: 60 } as { id: string; label: string; desc: string; value: number },
];

const qualityOptions = [
  { id: "minScore", label: "Minimum QA Score", desc: "Minimum acceptable QA score for calls", value: 70 } as { id: string; label: string; desc: string; value: number },
  { id: "autoApprove", label: "Auto-Approve Threshold", desc: "Automatically approve calls above this score", value: 85 } as { id: string; label: string; desc: string; value: number },
  { id: "escalation", label: "Enable Escalation", desc: "Allow escalation of low-quality calls to supervisors", on: true },
];

export default function SettingsPage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("profile");
  const [fullName, setFullName] = useState("YEVHEN NEFEDOV");
  const [role, setRole] = useState("admin");
  const [orgName, setOrgName] = useState("SalesOS Enterprise");
  const [industry, setIndustry] = useState("Technology");
  const [companySize, setCompanySize] = useState("51-200 employees");
  const [notifications, setNotifications] = useState(notificationOptions);
  const [compliance, setCompliance] = useState(complianceOptions);
  const [quality, setQuality] = useState(qualityOptions);

  const toggleNotification = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, on: !n.on } : n))
    );
  };

  const toggleCompliance = (id: string) => {
    setCompliance((prev) =>
      prev.map((c) => (c.id === id && "on" in c ? { ...c, on: !(c as { on?: boolean }).on } : c))
    );
  };
  const setComplianceValue = (id: string, value: number) => {
    setCompliance((prev) =>
      prev.map((c) => (c.id === id && "value" in c ? { ...c, value } : c))
    );
  };

  const toggleQuality = (id: string) => {
    setQuality((prev) =>
      prev.map((q) => (q.id === id && "on" in q ? { ...q, on: !(q as { on?: boolean }).on } : q))
    );
  };
  const setQualityValue = (id: string, value: number) => {
    setQuality((prev) =>
      prev.map((q) => (q.id === id && "value" in q ? { ...q, value } : q))
    );
  };

  return (
    <div className="min-h-full flex flex-col gap-6 bg-white p-6 dark:bg-zinc-50">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Settings
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Manage your platform configuration
          </p>
        </div>
        <Button
          className="mt-2 shrink-0 bg-gray-900 hover:bg-gray-800 sm:mt-0"
          leftIcon={<Save className="h-4 w-4" />}
        >
          Save Changes
        </Button>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-gray-200">
        {settingTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "profile" && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Profile Settings</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Manage your personal account information
          </p>
          <div className="mt-6 flex flex-col gap-6 sm:flex-row">
            <div className="flex flex-col items-start gap-3">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-200 text-2xl font-semibold text-gray-600">
                {user?.email?.slice(0, 1).toUpperCase() ?? "Y"}
              </div>
              <Button variant="secondary" size="sm" leftIcon={<Camera className="h-4 w-4" />}>
                Change Photo
              </Button>
            </div>
            <div className="grid flex-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={user?.email ?? ""}
                  readOnly
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Timezone</label>
                <select className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500">
                  <option>UTC</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Currency</label>
                <select className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500">
                  <option>$ US Dollar (USD)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "organization" && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Organization Settings</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Configure your organization details
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Organization Name</label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Industry</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
              >
                <option>Technology</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Company Size</label>
              <select
                value={companySize}
                onChange={(e) => setCompanySize(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
              >
                <option>51-200 employees</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {activeTab === "notifications" && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Choose how you want to be notified
          </p>
          <ul className="mt-6 space-y-4">
            {notifications.map((opt) => (
              <li
                key={opt.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
              >
                <div>
                  <p className="font-medium text-gray-900">{opt.label}</p>
                  <p className="text-sm text-gray-500">{opt.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleNotification(opt.id)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    opt.on ? "bg-gray-900" : "bg-gray-200"
                  }`}
                  role="switch"
                  aria-checked={opt.on}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      opt.on ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeTab === "compliance" && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Compliance Settings</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Configure compliance monitoring and enforcement
          </p>
          <ul className="mt-6 space-y-4">
            {compliance.map((opt) => (
              <li
                key={opt.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
              >
                <div>
                  <p className="font-medium text-gray-900">{opt.label}</p>
                  <p className="text-sm text-gray-500">{opt.desc}</p>
                </div>
                {"value" in opt ? (
                  <input
                    type="number"
                    value={opt.value}
                    onChange={(e) => setComplianceValue(opt.id, parseInt(e.target.value, 10) || 0)}
                    className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-center text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleCompliance(opt.id)}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                      opt.on ? "bg-gray-900" : "bg-gray-200"
                    }`}
                    role="switch"
                    aria-checked={opt.on}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        opt.on ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeTab === "quality" && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Quality Assurance Settings</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Configure QA thresholds and automation
          </p>
          <ul className="mt-6 space-y-4">
            {quality.map((opt) => (
              <li
                key={opt.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
              >
                <div>
                  <p className="font-medium text-gray-900">{opt.label}</p>
                  <p className="text-sm text-gray-500">{opt.desc}</p>
                </div>
                {"value" in opt ? (
                  <input
                    type="number"
                    value={opt.value}
                    onChange={(e) => setQualityValue(opt.id, parseInt(e.target.value, 10) || 0)}
                    className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-center text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleQuality(opt.id)}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                      opt.on ? "bg-gray-900" : "bg-gray-200"
                    }`}
                    role="switch"
                    aria-checked={opt.on}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        opt.on ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
