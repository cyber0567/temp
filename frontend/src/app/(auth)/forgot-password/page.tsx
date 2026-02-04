"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { AuthCard } from "@/components/ui/AuthCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LogoBadge } from "@/components/auth/LogoBadge";
import { validateEmail } from "@/lib/validation";
import { api, type ApiError } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ email?: string }>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const emailError = validateEmail(email);
    setErrors(emailError ? { email: emailError } : {});
    if (emailError) return;

    setLoading(true);
    try {
      await api.forgotPassword(email);
      setSuccess(true);
      toast.success("Check your email for the reset link");
    } catch (err) {
      const apiErr = err as ApiError;
      toast.error(apiErr.message ?? "Failed to send reset link");
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
        <div className="flex flex-col gap-6">
          <LogoBadge title="MVP" />
          <div className="text-center">
            <h1 className="text-3xl font-bold text-black">
              Check your email
            </h1>
            <p className="mt-2 text-gray-600">
              We&apos;ve sent a password reset link to <strong>{email}</strong>.
            </p>
          </div>
          <Link
            href="/login"
            className="rounded-lg bg-gray-900 py-3 text-center text-sm font-medium text-white hover:bg-gray-800"
          >
            Back to sign in
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
          className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 w-fit"
        >
          ← Back to sign in
        </Link>

        <LogoBadge title="MVP" />
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
            }}
            leftIcon={<Mail className="h-5 w-5" />}
            error={errors.email}
            autoComplete="email"
          />
          <Button type="submit" variant="primary" size="lg" fullWidth disabled={loading}>
            {loading ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      </div>
    </AuthCard>
  );
}
