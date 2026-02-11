"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock } from "lucide-react";
import { AuthCard } from "@/components/ui/AuthCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SwpLogo } from "@/components/auth/SwpLogo";
import {
  validateEmail,
  validatePassword,
  validateConfirmPassword,
} from "@/lib/validation";
import { api, type ApiError } from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const confirmError = validateConfirmPassword(password, confirmPassword);
    const newErrors: typeof errors = {};
    if (emailError) newErrors.email = emailError;
    if (passwordError) newErrors.password = passwordError;
    if (confirmError) newErrors.confirmPassword = confirmError;
    setErrors(newErrors);
    setFormError(confirmError ? "Passwords do not match" : null);
    if (emailError || passwordError || confirmError) return;

    setLoading(true);
    setFormError(null);
    try {
      await api.signup(email, password, confirmPassword);
      router.push(`/verify-email?email=${encodeURIComponent(email.trim())}`);
      return;
    } catch (err) {
      const apiErr = err as ApiError;
      setFormError(apiErr.message ?? "Sign up failed");
      if (apiErr.errors) {
        setErrors((prev) => ({ ...prev, ...apiErr.errors }));
      }
    } finally {
      setLoading(false);
    }
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

        <SwpLogo />
        <h1 className="text-3xl font-bold text-black text-center">
          Create your account
        </h1>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              if (formError) setFormError(null);
            }}
            leftIcon={<Mail className="h-5 w-5" />}
            error={errors.email}
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              if (errors.confirmPassword)
                setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              if (formError) setFormError(null);
            }}
            leftIcon={<Lock className="h-5 w-5" />}
            error={errors.password}
            autoComplete="new-password"
          />
          <Input
            label="Confirm Password"
            type="password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (errors.confirmPassword)
                setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              if (formError) setFormError(null);
            }}
            leftIcon={<Lock className="h-5 w-5" />}
            error={errors.confirmPassword}
            autoComplete="new-password"
          />
          {formError && (
            <div
              className="w-full rounded-lg border border-red-200 py-3 px-3 text-center text-sm font-medium text-red-600"
              style={{ backgroundColor: "#FEE8E7" }}
              role="alert"
            >
              {formError}
            </div>
          )}
          <Button type="submit" variant="primary" size="lg" fullWidth disabled={loading}>
            {loading ? "Creating account…" : "Create account"}
          </Button>
        </form>
      </div>
    </AuthCard>
  );
}
