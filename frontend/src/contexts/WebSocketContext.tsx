"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useWebSocket, type WebSocketStatus } from "@/lib/websocket";

type WebSocketContextValue = {
  status: WebSocketStatus;
  lastMessage: unknown;
  messages: unknown[];
  clearMessages: () => void;
};

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

const MAX_MESSAGES = 100;

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<unknown[]>([]);

  const handleMessage = useCallback((data: unknown) => {
    setMessages((prev) => [...prev.slice(-(MAX_MESSAGES - 1)), data]);
  }, []);

  const { status, lastMessage } = useWebSocket({
    onMessage: handleMessage,
  });

  const clearMessages = useCallback(() => setMessages([]), []);

  const value = useMemo<WebSocketContextValue>(
    () => ({
      status,
      lastMessage,
      messages,
      clearMessages,
    }),
    [status, lastMessage, messages, clearMessages]
  );

  return (
    <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>
  );
}

export function useWebSocketContext(): WebSocketContextValue {
  const ctx = useContext(WebSocketContext);
  if (!ctx) {
    throw new Error("useWebSocketContext must be used within WebSocketProvider");
  }
  return ctx;
}

/** Use when component might render outside WebSocketProvider; returns null if not available. */
export function useWebSocketContextOptional(): WebSocketContextValue | null {
  return useContext(WebSocketContext);
}
