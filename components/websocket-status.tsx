"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";

type ConnectionState = "connecting" | "open" | "closed" | "error" | "unavailable";

export function WebSocketStatus() {
  const wsUrl = useMemo(() => {
    const envUrl = process.env.NEXT_PUBLIC_WS_URL;
    if (envUrl) return envUrl;
    if (typeof window === "undefined") return "";
    return `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws`;
  }, []);
  const [state, setState] = useState<ConnectionState>(
    wsUrl ? "connecting" : "unavailable"
  );
  const [lastMessage, setLastMessage] = useState<string>("(none)");
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    if (!wsUrl) {
      setState("unavailable");
      return;
    }
    const ws = new WebSocket(wsUrl);
    setSocket(ws);

    ws.addEventListener("open", () => setState("open"));
    ws.addEventListener("close", () => setState("closed"));
    ws.addEventListener("error", () => setState("error"));
    ws.addEventListener("message", (event) => {
      setLastMessage(event.data?.toString?.() ?? String(event.data));
    });

    return () => {
      ws.close();
    };
  }, [wsUrl]);

  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm text-muted-foreground">
        Status:{" "}
        <span className="font-medium text-foreground capitalize">{state}</span>
      </div>
      <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        Last message: <span className="text-foreground">{lastMessage}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => socket?.send("ping")}
          disabled={!socket || state !== "open"}
        >
          Send Ping
        </Button>
        <Button type="button" variant="outline" asChild>
          <a
            href="/api/auth/signin"
            target="_blank"
            rel="noreferrer"
          >
            Open OAuth Sign-In
          </a>
        </Button>
      </div>
      <div className="text-xs text-muted-foreground">
        WS endpoint:{" "}
        <span className="text-foreground">
          {wsUrl || "Not configured (optional on Vercel)"}
        </span>
      </div>
    </div>
  );
}
