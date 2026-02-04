"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const WS_BASE =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3001")
    : "ws://localhost:3001";

/** Path to WebSocket endpoint; backend typically serves at /ws */
const WS_PATH = typeof window !== "undefined" ? (process.env.NEXT_PUBLIC_WS_PATH ?? "ws") : "ws";

export type WebSocketStatus = "connecting" | "open" | "closing" | "closed" | "error";

export type UseWebSocketOptions = {
  path?: string;
  /** Optional token for backend auth (e.g. ?token=...) */
  token?: string | null;
  onMessage?: (data: unknown) => void;
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  reconnect?: boolean;
  reconnectInterval?: number;
  reconnectAttempts?: number;
};

/**
 * Hook to connect to backend WebSocket and read messages.
 * Assumes backend URL is localhost:3001 (or NEXT_PUBLIC_WS_URL).
 */
export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    path = "",
    token,
    onMessage,
    onOpen,
    onClose,
    onError,
    reconnect = true,
    reconnectInterval = 3000,
    reconnectAttempts = 10,
  } = options;

  const [status, setStatus] = useState<WebSocketStatus>("closed");
  const [lastMessage, setLastMessage] = useState<unknown>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (typeof window === "undefined") return;
    const base = WS_BASE.replace(/\/$/, "");
    const segment = path || WS_PATH;
    let url = segment ? `${base}/${segment.replace(/^\//, "")}` : base;
    if (token) {
      const sep = url.includes("?") ? "&" : "?";
      url = `${url}${sep}token=${encodeURIComponent(token)}`;
    }
    setStatus("connecting");
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("open");
      reconnectCountRef.current = 0;
      onOpen?.();
    };

    ws.onmessage = (event: MessageEvent) => {
      let data: unknown;
      try {
        data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      } catch {
        data = event.data;
      }
      setLastMessage(data);
      onMessage?.(data);
    };

    ws.onclose = (event: CloseEvent) => {
      wsRef.current = null;
      setStatus("closed");
      onClose?.(event);
      if (reconnect && reconnectCountRef.current < reconnectAttempts) {
        reconnectCountRef.current += 1;
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, reconnectInterval);
      }
    };

    ws.onerror = (event: Event) => {
      setStatus("error");
      onError?.(event);
    };
  }, [path, token, onMessage, onOpen, onClose, onError, reconnect, reconnectInterval, reconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    reconnectCountRef.current = reconnectAttempts;
    if (wsRef.current) {
      setStatus("closing");
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const send = useCallback((data: string | object) => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(typeof data === "string" ? data : JSON.stringify(data));
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { status, lastMessage, send, connect, disconnect };
}
