import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Signing In",
};

export default function GoogleCallbackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
