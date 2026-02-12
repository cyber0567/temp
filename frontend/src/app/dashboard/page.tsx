import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-2xl">
        Dashboard
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 sm:text-base">
        Placeholder — content coming soon.
      </p>
    </div>
  );
}
