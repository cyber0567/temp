"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";
import { AuthCard } from "@/components/ui/AuthCard";
import { LogoBadge } from "@/components/auth/LogoBadge";
import { api } from "@/lib/api";

export default function ConfirmEmailPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "verified" | "error">("loading");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = hashParams.get("access_token");
    const type = hashParams.get("type");
    const isValidMagicLink = accessToken && (type === "magiclink" || type === "email");

    if (isValidMagicLink) {
      api
        .exchangeSupabaseSession(accessToken)
        .then((res) => {
          const t = (res as { token?: string }).token ?? (res as { access_token?: string }).access_token;
          if (t && res.user && typeof window !== "undefined") {
            localStorage.setItem("token", t);
            localStorage.setItem("user", JSON.stringify(res.user));
          }
          setStatus("verified");
          window.history.replaceState(null, "", window.location.pathname);
          setTimeout(() => router.replace("/dashboard"), 2000);
        })
        .catch(() => queueMicrotask(() => setStatus("error")));
    } else {
      queueMicrotask(() => setStatus("error"));
    }
  }, [router]);

  if (status === "verified") {
    return (
      <AuthCard>
        <div className="flex flex-col gap-6 text-center">
          <LogoBadge title="MVP" />
          <div className="flex justify-center">
            <CheckCircle2 className="h-16 w-16 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-black">Email verified</h1>
          <p className="text-gray-600">Redirecting you to the dashboard…</p>
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </div>
      </AuthCard>
    );
  }

  if (status === "error") {
    return (
      <AuthCard>
        <div className="flex flex-col gap-6 text-center">
          <LogoBadge title="MVP" />
          <h1 className="text-2xl font-bold text-black">Link invalid or expired</h1>
          <p className="text-gray-600">
            This confirmation link may have expired. Try signing in or request a new link.
          </p>
          <Link
            href="/login"
            className="rounded-lg bg-gray-900 px-4 py-3 text-center text-sm font-medium text-white hover:bg-gray-800"
          >
            Go to sign in
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <div className="flex flex-col gap-6 text-center">
        <LogoBadge title="MVP" />
        <div className="flex justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
        </div>
        <p className="text-gray-600">Verifying your email…</p>
      </div>
    </AuthCard>
  );
}
