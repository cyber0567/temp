"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Pause,
  FileText,
  Lightbulb,
  ShieldCheck,
  ChevronDown,
  Info,
  Sparkles,
  Search,
  MessageCircle,
  Check,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

/** URL structure:
 *  /dashboard/rep-portal           = first screen (Rep Portal home)
 *  /dashboard/rep-portal/dialer     = demo dialer page (ready to dial)
 *  /dashboard/rep-portal/dialer/call   = call page (in progress)
 *  /dashboard/rep-portal/dialer/ended  = call ended (disposition)
 */
export const DIALER_BASE = "/dashboard/rep-portal/dialer";

const DIALER_SCENARIOS = [
  { id: "inbound", label: "Inbound Inquiry" },
  { id: "outbound", label: "Outbound Cold Call" },
  { id: "objection", label: "Objection Heavy" },
  { id: "compliance-risk", label: "Compliance Risk" },
  { id: "hostile", label: "Hostile Customer" },
];

const COMPLIANCE_ITEMS = [
  "Introduced yourself and company",
  "Stated purpose of call",
  "Asked for consent to continue",
  "Disclosed recording (if applicable)",
];

const QUICK_RESPONSES = ["Opening greeting", "Handle objection", "Close"];

const QUICK_ANSWERS = [
  "What's our pricing?",
  "How does implementation work?",
  "What integrations do we support?",
  "What's our competitive advantage?",
  "Tell me about security features",
];

const AI_COACH_PROMPTS = [
  "Start with a warm greeting and confirm you're speaking with the right person",
  "Ask an open-ended discovery question to understand their current situation",
];

const SAMPLE_TRANSCRIPT = {
  label: "Customer",
  text: "Who is this? How did you get my number? I'm really busy right now...",
};

const CALL_OUTCOMES = ["Connected - Interested", "Connected - Not interested", "No answer", "Wrong number", "Callback scheduled", "Other"];

const cardBase = "rounded-xl border border-gray-200 bg-white shadow-sm";

function formatTimer(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export type CallState = "ready" | "in_progress" | "ended";

type Props = { callState: CallState };

export function DemoDialerContent({ callState }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [scenario, setScenario] = useState("outbound");
  const [compliance, setCompliance] = useState<Record<number, boolean>>({ 0: false, 1: false, 2: false, 3: false });
  const [muted, setMuted] = useState(false);
  const [onHold, setOnHold] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);
  const [callOutcome, setCallOutcome] = useState("");
  const [callNotes, setCallNotes] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const handleReset = () => {
      router.replace(DIALER_BASE);
      setCallSeconds(0);
      setCallOutcome("");
      setCallNotes("");
      setCompliance({ 0: false, 1: false, 2: false, 3: false });
      requestAnimationFrame(() => document.querySelector("main")?.scrollTo({ top: 0, behavior: "auto" }));
    };
    window.addEventListener("dialer-reset-to-first", handleReset);
    return () => window.removeEventListener("dialer-reset-to-first", handleReset);
  }, [router]);

  useEffect(() => {
    if (callState === "ready" && searchParams.get("start") === "1") {
      router.replace(`${DIALER_BASE}/call`);
    }
  }, [callState, searchParams, router]);

  useEffect(() => {
    if (callState === "in_progress") {
      timerRef.current = setInterval(() => setCallSeconds((s) => s + 1), 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [callState]);

  const goToCall = () => router.push(`${DIALER_BASE}/call`);
  const endCall = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCallNotes(
      "The customer was initially confused and frustrated, questioning the identity of the caller and expressing that they were busy. The interaction did not progress beyond the customer's inquiries and discomfort about receiving the call."
    );
    router.push(`${DIALER_BASE}/ended`);
  };

  const resetToDialer = () => {
    router.replace(DIALER_BASE);
    setCallSeconds(0);
    setCallOutcome("");
    setCallNotes("");
    setCompliance({ 0: false, 1: false, 2: false, 3: false });
    requestAnimationFrame(() => document.querySelector("main")?.scrollTo({ top: 0, behavior: "auto" }));
  };

  const toggleCompliance = (index: number) => {
    setCompliance((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const isActive = callState === "in_progress";
  const isEnded = callState === "ended";

  return (
    <div className="min-h-full bg-gray-100/80 pb-20">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Demo Dialer</h1>
          <p className="mt-1 text-sm text-gray-500">Practice calls with AI scenarios</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
          <section className={cardBase}>
            <div className="flex flex-col items-center gap-4 p-6">
              <div className="flex flex-col items-center gap-2">
                <span
                  className={`flex h-16 w-16 items-center justify-center rounded-full ${
                    isActive ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  <Phone className="h-8 w-8" />
                </span>
                <p className="text-sm font-medium text-gray-700">
                  {isActive ? "Call in progress" : isEnded ? "Call ended" : "Ready to dial"}
                </p>
                {isActive && <p className="text-2xl font-bold tabular-nums text-gray-900">{formatTimer(callSeconds)}</p>}
              </div>

              {callState === "ready" && (
                <>
                  <div className="w-full space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Select Scenario</label>
                    <div className="relative">
                      <select
                        value={scenario}
                        onChange={(e) => setScenario(e.target.value)}
                        className="w-full appearance-none rounded-lg border border-gray-300 bg-white py-2.5 pl-3 pr-10 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        {DIALER_SCENARIOS.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                    </div>
                  </div>
                  <Button
                    className="w-full bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500"
                    leftIcon={<Phone className="h-5 w-5" />}
                    onClick={goToCall}
                  >
                    Start Call
                  </Button>
                </>
              )}

              {isActive && (
                <>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setMuted((m) => !m)}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    >
                      {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setOnHold((h) => !h)}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    >
                      <Pause className="h-5 w-5" />
                    </button>
                  </div>
                  <Button
                    className="w-full bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500"
                    leftIcon={<PhoneOff className="h-5 w-5" />}
                    onClick={endCall}
                  >
                    End Call
                  </Button>
                  <div className="w-full pt-2">
                    <h3 className="mb-2 text-sm font-semibold text-gray-900">Quick Responses</h3>
                    <div className="space-y-2">
                      {QUICK_RESPONSES.map((r) => (
                        <button key={r} type="button" className="w-full rounded-lg border border-gray-200 bg-white py-2.5 px-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50">
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {isEnded && (
                <div className="w-full pt-2">
                  <h3 className="mb-2 text-sm font-semibold text-gray-900">Quick Responses</h3>
                  <div className="space-y-2">
                    {QUICK_RESPONSES.map((r) => (
                      <button key={r} type="button" className="w-full rounded-lg border border-gray-200 bg-white py-2.5 px-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50">
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          <div className="flex flex-col gap-6">
            <section className={cardBase}>
              <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                  <FileText className="h-5 w-5" />
                </span>
                <h2 className="text-base font-semibold text-gray-900">Live Transcript</h2>
              </div>
              <div className="min-h-[140px] px-5 py-6">
                {(isActive || isEnded) ? (
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{SAMPLE_TRANSCRIPT.label}</p>
                    <p className="mt-1 text-sm text-gray-600">{SAMPLE_TRANSCRIPT.text}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Transcript will appear here during the call</p>
                )}
              </div>
            </section>

            {isActive && (
              <div className="grid gap-6 sm:grid-cols-2">
                <section className="rounded-xl border border-violet-200 bg-violet-50/50 shadow-sm">
                  <div className="flex items-center gap-2 border-b border-violet-100 px-5 py-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                      <Info className="h-5 w-5" />
                    </span>
                    <h2 className="text-base font-semibold text-gray-900">Real-Time Compliance Monitor</h2>
                    <span className="ml-auto flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                      <Activity className="h-3.5 w-3.5" /> Active
                    </span>
                  </div>
                  <div className="space-y-4 px-5 py-6">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Compliance Score</p>
                      <p className="text-2xl font-bold text-gray-900">100%</p>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                        <div className="h-full w-full rounded-full bg-emerald-500" />
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-2 pt-2">
                      <Check className="h-10 w-10 text-emerald-600" />
                      <p className="text-sm font-medium text-gray-700">No compliance issues detected</p>
                    </div>
                  </div>
                </section>

                <section className={cardBase}>
                  <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                      <Sparkles className="h-5 w-5" />
                    </span>
                    <h2 className="text-base font-semibold text-gray-900">AI Call Assistant</h2>
                  </div>
                  <div className="space-y-4 px-5 py-6">
                    <p className="text-sm font-medium text-gray-700">Quick Answers:</p>
                    <div className="flex flex-wrap gap-2">
                      {QUICK_ANSWERS.map((q) => (
                        <button key={q} type="button" className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-100">
                          {q}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ask anything about your prod"
                        className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                      />
                      <button type="button" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white hover:bg-violet-700">
                        <Search className="h-5 w-5" />
                      </button>
                    </div>
                    <p className="flex items-center justify-center gap-1.5 text-xs text-gray-500">
                      <Sparkles className="h-3.5 w-3.5" /> Ask a question to get instant answers
                    </p>
                  </div>
                </section>
              </div>
            )}

            <section className={cardBase}>
              <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                  <Lightbulb className="h-5 w-5" />
                </span>
                <h2 className="text-base font-semibold text-gray-900">AI Coach</h2>
              </div>
              <div className="space-y-3 px-5 py-6">
                {isEnded ? (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Next Action</p>
                    <p className="mt-1 text-sm font-medium text-gray-800">
                      Attempt a follow-up call at a later time with a clear introduction and purpose to engage the customer.
                    </p>
                  </div>
                ) : (
                  AI_COACH_PROMPTS.map((prompt, i) => (
                    <div
                      key={i}
                      className={`rounded-lg border p-4 text-sm font-medium text-gray-800 ${i === 0 ? "border-sky-200 bg-sky-50/80" : "border-violet-200 bg-violet-50/50"}`}
                    >
                      {prompt}
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className={cardBase}>
              <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <h2 className="text-base font-semibold text-gray-900">Compliance</h2>
              </div>
              <ul className="space-y-3 px-5 py-6">
                {COMPLIANCE_ITEMS.map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={`compliance-${index}`}
                      checked={compliance[index] ?? false}
                      onChange={() => toggleCompliance(index)}
                      className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <label htmlFor={`compliance-${index}`} className="text-sm font-medium text-gray-700">
                      {item}
                    </label>
                  </li>
                ))}
              </ul>
            </section>

            {isEnded && (
              <section className={cardBase}>
                <h2 className="border-b border-gray-100 px-5 py-4 text-base font-semibold text-gray-900">Call Disposition</h2>
                <div className="grid gap-6 p-5 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Call Outcome *</label>
                    <div className="relative mt-1">
                      <select
                        value={callOutcome}
                        onChange={(e) => setCallOutcome(e.target.value)}
                        className="w-full appearance-none rounded-lg border border-gray-300 bg-white py-2.5 pl-3 pr-10 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="">Select outcome</option>
                        {CALL_OUTCOMES.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Call Notes</label>
                    <textarea
                      value={callNotes}
                      onChange={(e) => setCallNotes(e.target.value)}
                      rows={4}
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      placeholder="Summarize the call..."
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 border-t border-gray-100 px-5 py-4">
                  <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50" onClick={resetToDialer}>
                    Discard
                  </Button>
                  <Button className="bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500" leftIcon={<Check className="h-5 w-5" />} onClick={resetToDialer}>
                    Save Call
                  </Button>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>

      <a
        href="#"
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg hover:from-violet-600 hover:to-indigo-700"
        aria-label="Open chat"
      >
        <MessageCircle className="h-6 w-6" />
      </a>
    </div>
  );
}
