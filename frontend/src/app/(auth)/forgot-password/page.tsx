"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { AuthCard } from "@/components/ui/AuthCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SwpLogo } from "@/components/auth/SwpLogo";
import { validateEmail } from "@/lib/validation";
import { api, type ApiError } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ email?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const emailError = validateEmail(email);
    setErrors(emailError ? { email: emailError } : {});
    setFormError(null);
    if (emailError) return;

    setLoading(true);
    setFormError(null);
    try {
      await api.forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      const apiErr = err as ApiError;
      setFormError(apiErr.message ?? "Failed to send reset link");
      if (apiErr.errors) {
        setErrors((prev) => ({ ...prev, ...apiErr.errors }));
      }
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <AuthCard>
        <div className="flex flex-col gap-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gray-200 bg-gray-100">
            <Mail className="h-7 w-7 text-gray-800" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Check your email
            </h1>
            <p className="mt-2 text-base text-gray-600">
              We&apos;ve sent password reset instructions to
            </p>
            <p className="mt-0.5 text-lg font-semibold text-gray-900">{email}</p>
          </div>
          <div
            className="rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-center text-sm text-green-700"
            role="status"
          >
            Please check your email for the password reset link. It may take a few minutes to arrive.
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900 w-fit"
          >
            ← Back to sign in
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <div className="flex flex-col gap-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900 w-fit"
        >
          ← Back to sign in
        </Link>

        <SwpLogo />
        <div className="text-center">
          <h1 className="text-3xl font-bold text-black">
            Reset your password
          </h1>
          <p className="mt-2 text-gray-600">
            Enter your email and we&apos;ll send you a link to reset your
            password
          </p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors({});
              if (formError) setFormError(null);
            }}
            leftIcon={<Mail className="h-5 w-5" />}
            error={errors.email}
            autoComplete="email"
          />
          {formError && (
            <div
              className="w-full rounded-lg py-3 text-center text-sm font-medium text-red-600"
              style={{ backgroundColor: "#FEE8E7" }}
              role="alert"
            >
              {formError}
            </div>
          )}
          <Button type="submit" variant="primary" size="lg" fullWidth disabled={loading}>
            {loading ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      </div>
    </AuthCard>
  );
}
