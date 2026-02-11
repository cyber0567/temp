"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock } from "lucide-react";
import { AuthCard } from "@/components/ui/AuthCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Separator } from "@/components/ui/Separator";
import { SwpLogo } from "@/components/auth/SwpLogo";
import { validateEmail, validatePassword } from "@/lib/validation";
import { api, API_URL, type ApiError } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password, 1);
    const newErrors: { email?: string; password?: string } = {};
    if (emailError) newErrors.email = emailError;
    if (passwordError) newErrors.password = passwordError;
    setErrors(newErrors);
    setFormError(null);
    if (emailError || passwordError) return;

    setLoading(true);
    setFormError(null);
    try {
      const res = await api.login(email, password);
      const token = (res as { token?: string; access_token?: string }).token ?? (res as { access_token?: string }).access_token;
      if (token && res.user) {
        if (typeof window !== "undefined") {
          localStorage.setItem("token", token);
          localStorage.setItem("user", JSON.stringify(res.user));
        }
        router.push("/dashboard");
        return;
      }
    } catch (err) {
      const apiErr = err as ApiError;
      setFormError("Invalid email or password");
      if (apiErr.errors) {
        setErrors((prev) => ({ ...prev, ...apiErr.errors }));
      }
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleSignIn() {
    window.location.href = `${API_URL}/auth/google`;
  }

  return (
    <AuthCard>
      <div className="flex flex-col gap-6 text-center">
        <SwpLogo />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Welcome to SWP OS V1
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Sign in to continue
          </p>
        </div>

        <div className="text-left">
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            type="button"
            disabled={loading}
            onClick={handleGoogleSignIn}
            leftIcon={
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            }
          >
            Continue with Google
          </Button>
        </div>

        <Separator text="OR" className="text-gray-400" />

        <form className="flex flex-col gap-4 text-left" onSubmit={handleSubmit} noValidate>
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
            leftIcon={<Mail className="h-5 w-5 text-gray-400" />}
            error={errors.email}
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            placeholder="........"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              if (formError) setFormError(null);
            }}
            leftIcon={<Lock className="h-5 w-5 text-gray-400" />}
            error={errors.password}
            autoComplete="current-password"
          />
          {formError && (
            <div
              className="w-full rounded-lg border border-red-200 bg-red-50 py-3 text-center text-sm font-medium text-red-600"
              role="alert"
            >
              Invalid email or password
            </div>
          )}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <div className="flex items-center justify-between text-sm text-gray-600">
          <Link href="/forgot-password" className="hover:text-gray-800">
            Forgot password?
          </Link>
          <Link href="/signup" className="hover:text-gray-600">
            Need an account? <span className="font-medium text-gray-900 underline underline-offset-2 hover:text-gray-800">Sign up</span>
          </Link>
        </div>
      </div>
    </AuthCard>
  );
}
