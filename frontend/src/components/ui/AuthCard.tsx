import { type ReactNode } from "react";

export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div className="w-full max-w-md rounded-2xl border border-gray-200/80 bg-white p-8 shadow-lg">
      {children}
    </div>
  );
}
