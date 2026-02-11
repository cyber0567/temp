"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Lock, CheckCircle2 } from "lucide-react";
import { AuthCard } from "@/components/ui/AuthCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LogoBadge } from "@/components/auth/LogoBadge";
import { validatePassword, validateConfirmPassword } from "@/lib/validation";
import { api } from "@/lib/api";

type ResetStatus = "loading" | "ready" | "invalid_link" | "success";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [status, setStatus] = useState<ResetStatus>("loading");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const token = hashParams.get("access_token");
    const type = hashParams.get("type");
    if (token && type === "recovery") {
      setAccessToken(token);
      setStatus("ready");
      window.history.replaceState(null, "", window.location.pathname);
    } else {
      setStatus("invalid_link");
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const passwordError = validatePassword(password);
    const confirmError = validateConfirmPassword(password, confirmPassword);
    const newErrors: { password?: string; confirmPassword?: string } = {};
    if (passwordError) newErrors.password = passwordError;
    if (confirmError) newErrors.confirmPassword = confirmError;
    setErrors(newErrors);
    if (passwordError || confirmError) return;
    if (!accessToken) {
      toast.error("Reset link invalid or expired");
      return;
    }

    setLoading(true);
    try {
      await api.supabaseUpdatePassword(accessToken, password);
      setStatus("success");
      toast.success("Password updated. Sign in with your new password.");
      setTimeout(() => {
        router.replace("/login");
        router.refresh();
      }, 2000);
    } catch (err) {
      toast.error((err as { message?: string })?.message ?? "Failed to update password");
      setErrors((prev) => ({ ...prev, password: "Update failed" }));
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") {
    return (
      <AuthCard>
        <div className="flex flex-col gap-6 text-center">
          <LogoBadge title="MVP" />
          <p className="text-gray-600">Verifying reset link…</p>
        </div>
      </AuthCard>
    );
  }

  if (status === "invalid_link") {
    return (
      <AuthCard>
        <div className="flex flex-col gap-6 text-center">
          <LogoBadge title="MVP" />
          <h1 className="text-2xl font-bold text-black">Invalid or expired link</h1>
          <p className="text-gray-600">
            This password reset link may have expired. Request a new one below.
          </p>
          <Link
            href="/forgot-password"
            className="rounded-lg bg-gray-900 px-4 py-3 text-center text-sm font-medium text-white hover:bg-gray-800"
          >
            Request new reset link
          </Link>
          <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
            Back to sign in
          </Link>
        </div>
      </AuthCard>
    );
  }

  if (status === "success") {
    return (
      <AuthCard>
        <div className="flex flex-col gap-6 text-center">
          <LogoBadge title="MVP" />
          <div className="flex justify-center">
            <CheckCircle2 className="h-16 w-16 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-black">Password updated</h1>
          <p className="text-gray-600">Redirecting you to sign in…</p>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <div className="flex flex-col gap-6">
        <Link
          href="/login"
          className="inline-flex gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 w-fit"
        >
          ← Back to sign in
        </Link>
        <LogoBadge title="MVP" />
        <div className="text-center">
          <h1 className="text-3xl font-bold text-black">Enter new password</h1>
          <p className="mt-2 text-gray-600">
            You received a password reset link. Enter your new password below.
          </p>
        </div>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <Input
            label="New password"
            type="password"
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
            }}
            leftIcon={<Lock className="h-5 w-5" />}
            error={errors.password}
            autoComplete="new-password"
          />
          <Input
            label="Confirm new password"
            type="password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
            }}
            leftIcon={<Lock className="h-5 w-5" />}
            error={errors.confirmPassword}
            autoComplete="new-password"
          />
          <Button type="submit" variant="primary" size="lg" fullWidth disabled={loading}>
            {loading ? "Updating…" : "Update password"}
          </Button>
        </form>
      </div>
    </AuthCard>
  );
}
