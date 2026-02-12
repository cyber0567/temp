"use client";

import { DemoDialerContent } from "../DemoDialerContent";

/** /dashboard/rep-portal/dialer/ended = call ended (disposition) */
export default function DialerEndedPage() {
  return <DemoDialerContent callState="ended" />;
}
