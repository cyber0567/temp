"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Mic,
  CheckCircle2,
  Circle,
  Loader2,
  Wifi,
  WifiOff,
  Play,
  Square,
  ClipboardCheck,
  MessageSquare,
} from "lucide-react";
import { useWebSocket } from "@/lib/websocket";
import { Button } from "@/components/ui/Button";

export type TranscriptEntry = {
  id: string;
  speaker: "agent" | "customer";
  text: string;
  timestamp: number;
};

const DEFAULT_CHECKLIST = [
  { id: "greeting", label: "Opened with approved greeting" },
  { id: "intro", label: "Stated company name and purpose of call" },
  { id: "disclosure", label: "Required disclosure read verbatim" },
  { id: "objections", label: "Addressed objections per script" },
  { id: "closing", label: "Closing statement given" },
  { id: "consent", label: "Consent recorded (if applicable)" },
];

const MOCK_LINES: { speaker: "agent" | "customer"; text: string }[] = [
  { speaker: "agent", text: "Hi, this is Sarah from TechCorp Solutions. May I speak with the account holder?" },
  { speaker: "customer", text: "Yes, this is James." },
  { speaker: "agent", text: "Thanks, James. I'm calling about your current service plan. Do you have a moment?" },
  { speaker: "customer", text: "Sure, go ahead." },
  { speaker: "agent", text: "As required, I need to read our short disclosure: This call may be recorded for quality and compliance." },
  { speaker: "customer", text: "That's fine." },
  { speaker: "agent", text: "Great. We have an offer that could save you about 20% on your next renewal." },
];

export function RepPortal() {
  const [token, setToken] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [checklist, setChecklist] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(DEFAULT_CHECKLIST.map((c) => [c.id, false]))
  );
  const [simulateRunning, setSimulateRunning] = useState(false);
  const simulateIndexRef = useRef(0);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setToken(typeof window !== "undefined" ? localStorage.getItem("token") : null);
  }, []);

  const handleMessage = useCallback((data: unknown) => {
    const msg = data as { type?: string; payload?: { speaker?: string; text?: string }; speaker?: string; text?: string };
    const payload = msg?.payload ?? msg;
    const speaker = (payload?.speaker === "agent" || payload?.speaker === "customer"
      ? payload.speaker
      : msg.type === "transcript"
        ? (payload?.speaker as "agent" | "customer")
        : null) as "agent" | "customer" | null;
    const text = (payload?.text as string) ?? (msg?.text as string);
    if (speaker && typeof text === "string" && text.trim()) {
      setTranscript((prev) => [
        ...prev,
        {
          id: `ws-${Date.now()}-${prev.length}`,
          speaker,
          text: text.trim(),
          timestamp: Date.now(),
        },
      ]);
    }
  }, []);

  const { status } = useWebSocket({
    token,
    onMessage: handleMessage,
    reconnect: true,
  });

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  useEffect(() => {
    if (!simulateRunning) return;
    const id = setInterval(() => {
      setTranscript((prev) => {
        const i = simulateIndexRef.current;
        if (i >= MOCK_LINES.length) {
          setSimulateRunning(false);
          simulateIndexRef.current = 0;
          return prev;
        }
        const line = MOCK_LINES[i];
        simulateIndexRef.current = i + 1;
        return [
          ...prev,
          {
            id: `sim-${Date.now()}-${i}`,
            speaker: line.speaker,
            text: line.text,
            timestamp: Date.now(),
          },
        ];
      });
    }, 2200);
    return () => clearInterval(id);
  }, [simulateRunning]);

  const toggleCheck = (id: string) => {
    setChecklist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const completedCount = DEFAULT_CHECKLIST.filter((c) => checklist[c.id]).length;
  const totalChecklist = DEFAULT_CHECKLIST.length;

  const startSimulate = () => {
    setTranscript((prev) => (prev.length === 0 ? prev : prev));
    simulateIndexRef.current = 0;
    setSimulateRunning(true);
  };

  const stopSimulate = () => {
    setSimulateRunning(false);
    simulateIndexRef.current = 0;
  };

  const clearTranscript = () => {
    setTranscript([]);
    stopSimulate();
  };

  const resetChecklist = () => {
    setChecklist(Object.fromEntries(DEFAULT_CHECKLIST.map((c) => [c.id, false])));
  };

  return (
    <div className="flex min-h-full flex-col">
      <section className="border-b border-zinc-200 bg-zinc-800/50 px-6 py-6 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-600/20 text-emerald-400">
                <Mic className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-3xl">
                  Rep Portal
                </h1>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Live transcript & compliance checklist
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                  status === "open"
                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    : status === "connecting"
                      ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                      : "bg-zinc-500/20 text-zinc-600 dark:text-zinc-400"
                }`}
              >
                {status === "open" ? (
                  <Wifi className="h-3.5 w-3.5" />
                ) : status === "connecting" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <WifiOff className="h-3.5 w-3.5" />
                )}
                {status === "open" ? "Live" : status === "connecting" ? "Connecting…" : "Offline"}
              </span>
              {simulateRunning ? (
                <Button variant="outline" size="sm" leftIcon={<Square className="h-4 w-4" />} onClick={stopSimulate}>
                  Stop simulation
                </Button>
              ) : (
                <Button variant="outline" size="sm" leftIcon={<Play className="h-4 w-4" />} onClick={startSimulate}>
                  Simulate transcript
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={clearTranscript}>
                Clear transcript
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="flex-1 px-6 py-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    <MessageSquare className="h-4 w-4 text-emerald-500" />
                    Live transcript
                  </h2>
                  <span className="text-xs text-zinc-500">
                    {transcript.length} line{transcript.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="max-h-[420px] overflow-y-auto p-4">
                  {transcript.length === 0 ? (
                    <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                      Transcript will appear here when you're on a call or run a simulation.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {transcript.map((entry) => (
                        <li
                          key={entry.id}
                          className={`rounded-lg px-3 py-2 ${
                            entry.speaker === "agent"
                              ? "ml-0 mr-8 bg-emerald-500/10 text-zinc-800 dark:text-zinc-200"
                              : "ml-8 mr-0 bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                          }`}
                        >
                          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                            {entry.speaker === "agent" ? "You" : "Customer"}
                          </span>
                          <p className="mt-0.5 text-sm">{entry.text}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div ref={transcriptEndRef} />
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    <ClipboardCheck className="h-4 w-4 text-emerald-500" />
                    Compliance checklist
                  </h2>
                  <span className="text-xs text-zinc-500">
                    {completedCount}/{totalChecklist}
                  </span>
                </div>
                <div className="p-4">
                  <ul className="space-y-2">
                    {DEFAULT_CHECKLIST.map((item) => (
                      <li key={item.id}>
                        <label className="flex cursor-pointer items-start gap-3 rounded-lg p-2 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                          <span className="mt-0.5 shrink-0">
                            {checklist[item.id] ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            ) : (
                              <Circle className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
                            )}
                          </span>
                          <input
                            type="checkbox"
                            checked={!!checklist[item.id]}
                            onChange={() => toggleCheck(item.id)}
                            className="sr-only"
                          />
                          <span
                            className={`text-sm ${checklist[item.id] ? "text-zinc-500 line-through dark:text-zinc-400" : "text-zinc-800 dark:text-zinc-200"}`}
                          >
                            {item.label}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={resetChecklist}
                  >
                    Reset checklist
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
