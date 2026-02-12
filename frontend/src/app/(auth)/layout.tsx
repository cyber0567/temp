import { type ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center p-4 py-8 sm:p-6 bg-[#F8F9FB] safe-area-inset">
      {children}
    </div>
  );
}
