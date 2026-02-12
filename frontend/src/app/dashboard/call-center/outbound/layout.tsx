import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Outbound Calls",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
