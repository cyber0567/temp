import Link from "next/link";

export function SidebarLogo() {
  return (
    <Link
      href="/dashboard"
      className="flex items-center gap-2 px-4 py-5 text-white transition-colors hover:bg-zinc-800/80"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold text-white">
        A
      </div>
      <span className="text-sm font-semibold tracking-wide">App Name</span>
    </Link>
  );
}
