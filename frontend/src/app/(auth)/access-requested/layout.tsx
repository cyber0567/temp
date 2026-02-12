import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Access Requested",
};

export default function AccessRequestedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
