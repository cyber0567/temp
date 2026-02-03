"use client";

import Image from "next/image";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function SignInGoogleButton() {
  return (
    <Button
      type="button"
      variant="outline"
      className="h-11 w-full gap-2 rounded-full border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
      onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
    >
      <Image
        src="/imgs/google_icon.png"
        alt="Google"
        width={24}
        height={24}
        className="h-6 w-6"
      />
      Continue with Google
    </Button>
  );
}
