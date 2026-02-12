import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Training Modules",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
