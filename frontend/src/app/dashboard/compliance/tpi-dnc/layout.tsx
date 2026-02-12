import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TPI & DNC Checker",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
