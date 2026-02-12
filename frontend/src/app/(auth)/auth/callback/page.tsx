"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { getDashboardRedirectForRole } from "@/lib/roles";
import { api } from "@/lib/api";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const token = searchParams.get("token");
    const userParam = searchParams.get("user");

    // Google (or other) callback with ?token= & user=
    if (token) {
      try {
        const user = userParam ? (JSON.parse(decodeURIComponent(userParam)) as { id: string; email?: string; platformRole?: "rep" | "admin" | "super_admin" }) : { id: "", email: "" };
        if (typeof window !== "undefined") {
          localStorage.setItem("token", token);
          localStorage.setItem("user", JSON.stringify(user));
        }
        queueMicrotask(() => setStatus("success"));
        router.replace(user.platformRole ? getDashboardRedirectForRole(user.platformRole) : "/dashboard");
      } catch {
        queueMicrotask(() => setStatus("error"));
        toast.error("Invalid callback data");
      }
      return;
    }

    // Supabase: magic link (signup via signInWithOtp) or password recovery
    if (typeof window !== "undefined" && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = hashParams.get("access_token");
      const type = hashParams.get("type");
      if (type === "recovery") {
        router.replace("/auth/reset-password" + window.location.hash);
        return;
      }
      if (accessToken && (type === "magiclink" || type === "email")) {
        api
          .exchangeSupabaseSession(accessToken)
          .then((res) => {
            const t = (res as { token?: string }).token ?? (res as { access_token?: string }).access_token;
            if (t && res.user && typeof window !== "undefined") {
              localStorage.setItem("token", t);
              localStorage.setItem("user", JSON.stringify(res.user));
            }
            setStatus("success");
            router.replace(getDashboardRedirectForRole(res.user.platformRole));
          })
          .catch(() => {
            setStatus("error");
            toast.error("Sign-up link invalid or expired");
          });
        return;
      }
    }

    queueMicrotask(() => setStatus("error"));
    toast.error("Missing token");
  }, [searchParams, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA]">
        <p className="text-gray-600">Signing you in…</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F8F9FA] p-4">
        <p className="text-center text-red-600">Something went wrong.</p>
        <a
          href="/login"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Back to sign in
        </a>
      </div>
    );
  }

  return null;
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA]">
          <p className="text-gray-600">Signing you in…</p>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
