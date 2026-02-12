"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock } from "lucide-react";
import { AuthCard } from "@/components/ui/AuthCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getDashboardRedirectForRole } from "@/lib/roles";
import {
  validatePassword,
  validateConfirmPassword,
} from "@/lib/validation";
import { api, type ApiError } from "@/lib/api";

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      router.replace("/login");
    }
  }, [token, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const passwordError = validatePassword(password, 6);
    const confirmError = validateConfirmPassword(password, confirmPassword);
    const newErrors: { password?: string; confirmPassword?: string } = {};
    if (passwordError) newErrors.password = passwordError;
    if (confirmError) newErrors.confirmPassword = confirmError;
    setErrors(newErrors);
    setFormError(confirmError ? "Passwords do not match" : null);
    if (passwordError || confirmError) return;

    setLoading(true);
    setFormError(null);
    try {
      const res = await api.acceptInvite(token, password);
      const t = (res as { token?: string }).token ?? (res as { access_token?: string }).access_token;
      if (t && res.user && typeof window !== "undefined") {
        localStorage.setItem("token", t);
        localStorage.setItem("user", JSON.stringify(res.user));
      }
      router.push(getDashboardRedirectForRole(res.user.platformRole));
      return;
    } catch (err) {
      const apiErr = err as ApiError;
      setFormError(apiErr.message ?? "Invalid or expired invitation");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA]">
        <p className="text-gray-600">Redirecting…</p>
      </div>
    );
  }

  return (
    <AuthCard>
      <div className="flex flex-col gap-6 text-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Set your password
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            You’ve been invited to join. Create a password to finish your account.
          </p>
        </div>

        <form className="flex flex-col gap-4 text-left" onSubmit={handleSubmit} noValidate>
          <Input
            label="Password"
            type="password"
            placeholder="Min. 6 characters"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              if (formError) setFormError(null);
            }}
            leftIcon={<Lock className="h-5 w-5 text-gray-400" />}
            error={errors.password}
            autoComplete="new-password"
          />
          <Input
            label="Confirm password"
            type="password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              if (formError) setFormError(null);
            }}
            leftIcon={<Lock className="h-5 w-5 text-gray-400" />}
            error={errors.confirmPassword}
            autoComplete="new-password"
          />
          {formError && (
            <div
              className="w-full rounded-lg border border-red-200 bg-red-50 py-3 text-center text-sm font-medium text-red-600"
              role="alert"
            >
              {formError}
            </div>
          )}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            disabled={loading}
          >
            {loading ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
          Already have an account? Sign in
        </Link>
      </div>
    </AuthCard>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA]">
          <p className="text-gray-600">Loading…</p>
        </div>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  );
}
