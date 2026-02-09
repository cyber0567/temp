"use client";

import { type ReactNode, useEffect, useState } from "react";
import { Toaster, toast } from "sonner";
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
    setCloseButtonPosition(
      isMac() ? "!absolute !left-2 !top-2 !right-auto" : "!absolute !right-2 !top-2 !left-auto"
    );
  }, []);

  useEffect(() => {
    // Show any alerts that fired before React mounted (queued by inline script in layout)
    const queue = (window as Window & { __alertQueue?: string[] }).__alertQueue;
    if (queue?.length) {
      queue.forEach((msg) => toast(msg, { duration: 5000 }));
      (window as Window & { __alertQueue?: string[] }).__alertQueue = [];
    }
    // From now on, alert() shows as toast
    window.alert = (message: string) => {
      toast(message, { duration: 5000 });
    };
  }, []);

  return (
    <>
      <WebSocketProvider>{children}</WebSocketProvider>
      <Toaster
        richColors
        position="top-center"
        closeButton
        toastOptions={{
          classNames: { closeButton: closeButtonPosition },
        }}
      />
    </>
  );
}
