import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Surge Pricing Offers",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
