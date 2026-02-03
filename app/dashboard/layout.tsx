import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import { Sidebar } from "@/components/dashboard/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar session={session} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
