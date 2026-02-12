import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inbound Center",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
