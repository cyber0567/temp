"use client";

import { type ReactNode, useEffect, useState } from "react";
import { Toaster, toast } from "sonner";
import { UserProvider } from "@/contexts/UserContext";
import { WebSocketProvider } from "@/contexts/WebSocketContext";

function isMac(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform) || /Mac/i.test(navigator.userAgent);
}

export function Providers({ children }: { children: ReactNode }) {
  const [closeButtonPosition, setCloseButtonPosition] = useState<string>(
    "!absolute !right-2 !top-2 !left-auto"
  );

  useEffect(() => {
    queueMicrotask(() =>
      setCloseButtonPosition(
        isMac() ? "!absolute !left-2 !top-2 !right-auto" : "!absolute !right-2 !top-2 !left-auto"
      )
    );
  }, []);

  useEffect(() => {
    // Flush any alerts that fired before React mounted (queued by inline script in layout)
    const queue = (window as Window & { __alertQueue?: string[] }).__alertQueue;
    if (queue?.length) {
      queue.forEach((msg) => toast.info(msg, { duration: 5000 }));
      (window as Window & { __alertQueue?: string[] }).__alertQueue = [];
    }
    // Redirect window.alert to Sonner toast (top-right)
    window.alert = (message: string) => {
      toast.info(message, { duration: 5000 });
    };
  }, []);

  return (
    <>
      <UserProvider>
        <WebSocketProvider>{children}</WebSocketProvider>
      <Toaster
        richColors
        position="top-right"
        closeButton
        expand={false}
        toastOptions={{
          duration: 5000,
          classNames: { closeButton: closeButtonPosition },
        }}
      />
      </UserProvider>
    </>
  );
}
