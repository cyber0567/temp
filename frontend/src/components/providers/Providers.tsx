"use client";

import { type ReactNode } from "react";
import { Toaster } from "sonner";
import { WebSocketProvider } from "@/contexts/WebSocketContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <>
      <WebSocketProvider>{children}</WebSocketProvider>
      <Toaster richColors position="top-center" closeButton />
    </>
  );
}
