import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Campaign Monitor",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
