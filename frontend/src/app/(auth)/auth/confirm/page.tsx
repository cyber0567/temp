"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";
import { AuthCard } from "@/components/ui/AuthCard";
import { LogoBadge } from "@/components/auth/LogoBadge";
import { getSupabase } from "@/lib/supabase";

export default function ConfirmEmailPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "verified" | "error">("loading");
  const doneRef = useRef(false);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setStatus("error");
      return;
    }
    const goVerified = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      setStatus("verified");
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", window.location.pathname);
      }
      supabase.auth.signOut().finally(() => {
        setTimeout(() => router.replace("/login?verified=1"), 2000);
      });
    };
    let subscription: { unsubscribe: () => void } | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (session) {
        goVerified();
        return;
      }
      const { data: { subscription: sub } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
          if (session) goVerified();
        }
      });
      subscription = sub;
      timeoutId = setTimeout(() => {
        if (!cancelled && !doneRef.current) setStatus("error");
      }, 8000);
    });

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
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
          <p className="text-gray-600">Redirecting you to sign in…</p>
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
