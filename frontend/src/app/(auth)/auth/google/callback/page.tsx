"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { api, type ApiError } from "@/lib/api";

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setStatus("error");
      const msg = "Missing authorization code";
      setError(msg);
      toast.error(msg);
      return;
    }
    const redirectUri =
      typeof window !== "undefined" ? `${window.location.origin}/auth/google/callback` : undefined;
    api
      .exchangeGoogleCode(code, redirectUri)
      .then((res) => {
        const token =
          (res as { token?: string }).token ?? (res as { access_token?: string }).access_token;
        if (token && res.user && typeof window !== "undefined") {
          localStorage.setItem("token", token);
          localStorage.setItem("user", JSON.stringify(res.user));
        }
        setStatus("success");
        router.replace("/dashboard");
      })
      .catch((err: ApiError) => {
        setStatus("error");
        const msg = err.message ?? "Google sign in failed";
        setError(msg);
        toast.error(msg);
      });
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
        <p className="text-center text-red-600">{error}</p>
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

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA]">
          <p className="text-gray-600">Signing you in…</p>
        </div>
      }
    >
      <GoogleCallbackContent />
    </Suspense>
  );
}
