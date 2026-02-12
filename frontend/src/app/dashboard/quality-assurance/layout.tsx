import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quality Assurance",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
