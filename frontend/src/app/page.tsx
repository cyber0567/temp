import Link from "next/link";
import { EmailSignInForm } from "@/components/auth/email-sign-in-form";
import { SignInGoogleButton } from "@/components/auth/sign-in-google-button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-100 via-slate-50 to-white px-6 py-16">
      <main className="w-full max-w-sm">
        <Card className="border-none bg-white/90 shadow-2xl shadow-slate-200/60">
          <CardContent className="px-8 py-10">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-white text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 shadow-lg">
                LOGO
              </div>
              <h1 className="text-2xl font-semibold text-slate-900">
                App Title
              </h1>
              <p className="text-sm text-slate-500">Sign in to continue</p>
            </div>

            <div className="mt-6 space-y-4">
              {process.env.GOOGLE_CLIENT_ID ? (
                <SignInGoogleButton />
              ) : (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-800">
                  Set <code className="font-mono text-xs">GOOGLE_CLIENT_ID</code> and{" "}
                  <code className="font-mono text-xs">GOOGLE_CLIENT_SECRET</code> in{" "}
                  <code className="font-mono text-xs">.env.local</code> to enable Google sign-in.
                </p>
              )}

              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="h-px flex-1 bg-slate-200" />
                OR
                <span className="h-px flex-1 bg-slate-200" />
              </div>

              <EmailSignInForm />

              <div className="flex items-center justify-between text-xs text-slate-500">
                <button className="hover:text-slate-700" type="button">
                  Forgot password?
                </button>
                <Link href="/signup" className="hover:text-slate-700">
                  Need an account? <span className="font-semibold">Sign up</span>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
