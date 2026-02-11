"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Check } from "lucide-react";
import { AuthCard } from "@/components/ui/AuthCard";

export default function AccessRequestedPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("user");
      const user = raw ? (JSON.parse(raw) as { email?: string }) : null;
      setEmail(user?.email ?? null);
    } catch {
      setEmail(null);
    }
  }, []);

  function handleSwitchAccount() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    router.replace("/login");
  }

  return (
    <AuthCard>
      <div className="flex flex-col gap-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-orange-400 bg-orange-50">
          <Lock className="h-7 w-7 text-orange-600" strokeWidth={1.5} />
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-black">
            Access requested
          </h1>
          <p className="mt-2 text-gray-600">
            Your access request has been submitted successfully.
          </p>
        </div>

        <div
          className="w-full rounded-lg border border-green-200 px-4 py-4 text-left"
          style={{ backgroundColor: "#ECFDF5" }}
          role="status"
        >
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-200">
              <Check className="h-4 w-4 text-green-700" strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-bold text-black">
                Request submitted successfully!
              </p>
              <p className="mt-0.5 text-sm text-gray-800">
                You&apos;ll receive an email when the app admin approves your request.
              </p>
            </div>
          </div>
        </div>

        {email && (
          <p className="text-sm text-gray-500">
            You&apos;re logged in as {email}
          </p>
        )}
        <button
          type="button"
          onClick={handleSwitchAccount}
          className="text-sm font-medium text-blue-600 underline underline-offset-2 hover:text-blue-700"
        >
          Switch account
        </button>
      </div>
    </AuthCard>
  );
}
