"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { AuthCard } from "@/components/ui/AuthCard";
import { Button } from "@/components/ui/Button";
import { api, type ApiError } from "@/lib/api";
import { getDashboardRedirectForRole } from "@/lib/roles";

const CODE_LENGTH = 8;

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const codeString = code.join("");
  const attemptsExceeded = error?.includes("Too many failed attempts") ?? false;

  useEffect(() => {
    if (!email) {
      router.replace("/signup");
      return;
    }
  }, [email, router]);

  function handleChange(index: number, value: string) {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, CODE_LENGTH).split("");
      const next = [...code];
      digits.forEach((d, i) => {
        if (index + i < CODE_LENGTH) next[index + i] = d;
      });
      setCode(next);
      setError(null);
      const nextIndex = Math.min(index + digits.length, CODE_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
      return;
    }
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);
    setError(null);
    if (digit && index < CODE_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (codeString.length !== CODE_LENGTH) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.verifyEmail(email, codeString);
      if (res.token && res.user) {
        if (typeof window !== "undefined") {
          localStorage.setItem("token", res.token);
          localStorage.setItem("user", JSON.stringify(res.user));
        }
        router.replace(getDashboardRedirectForRole(res.user.platformRole));
        return;
      }
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message ?? "Invalid or expired code");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendLoading) return;
    setError(null);
    setResendLoading(true);
    try {
      await api.resendVerification(email);
      setCode(Array(CODE_LENGTH).fill(""));
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message ?? "Failed to resend code");
    } finally {
      setResendLoading(false);
    }
  }

  if (!email) {
    return null;
  }

  return (
    <AuthCard>
      <div className="flex flex-col gap-6 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-left text-sm font-medium text-gray-700 hover:text-gray-900 w-fit"
        >
          ← Back to sign in
        </Link>

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gray-200 bg-gray-100">
          <ShieldCheck className="h-7 w-7 text-gray-700" strokeWidth={1.5} />
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Verify your email
          </h1>
          <p className="mt-2 text-base text-gray-600">
            We&apos;ve sent an 8-digit code to
          </p>
          <p className="mt-1 font-semibold text-gray-900">{email}</p>
        </div>

        <form className="flex flex-col gap-4 text-left" onSubmit={handleSubmit} noValidate>
          <div className="flex justify-center gap-2">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={8}
                autoComplete="one-time-code"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="h-12 w-11 rounded-lg border border-gray-300 bg-white text-center text-lg font-semibold text-gray-900 outline-none transition focus:border-[#1a1d29] focus:ring-1 focus:ring-[#1a1d29]/20 focus:ring-offset-0"
              />
            ))}
          </div>
          <p className="text-center text-sm text-gray-500">
            Enter the verification code sent to your email
          </p>
          {error && (
            <div
              className="w-full rounded-lg border border-red-200 bg-red-50 py-3 text-center text-sm font-medium text-red-700"
              role="alert"
            >
              {error}
            </div>
          )}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            disabled={loading || codeString.length !== CODE_LENGTH || attemptsExceeded}
          >
            {loading ? "Verifying…" : "Verify email"}
          </Button>
        </form>

        <p className="text-sm text-gray-600">
          Didn&apos;t receive the code?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={resendLoading}
            className="font-medium text-gray-900 underline underline-offset-2 hover:text-gray-700 disabled:no-underline disabled:opacity-60"
          >
            {resendLoading ? "Sending…" : "Resend"}
          </button>
        </p>
      </div>
    </AuthCard>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<AuthCard><div className="flex justify-center py-8 text-gray-500">Loading…</div></AuthCard>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
