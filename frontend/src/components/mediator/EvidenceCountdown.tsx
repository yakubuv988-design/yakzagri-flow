"use client";

import { useEffect, useState } from "react";

/** Counter-evidence window, counted from when the dispute was opened (#396). */
export const EVIDENCE_WINDOW_MS = 48 * 60 * 60 * 1000;
const WARNING_THRESHOLD_MS = 6 * 60 * 60 * 1000;
const TICK_MS = 60 * 1000;

export function getEvidenceRemainingMs(createdAt: string, now: number): number {
  const openedAt = Date.parse(createdAt);
  if (!Number.isFinite(openedAt)) return 0;
  return Math.max(0, openedAt + EVIDENCE_WINDOW_MS - now);
}

/** Remaining time to submit counter-evidence. Turns to warning under 6 hours and closes at zero (#396). */
export function EvidenceCountdown({ createdAt }: { createdAt: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(timer);
  }, []);

  const remainingMs = getEvidenceRemainingMs(createdAt, now);

  if (remainingMs === 0) {
    return (
      <span role="status" className="inline-block rounded-md bg-surface-2 px-2 py-0.5 text-xs font-medium text-text-secondary">
        Evidence Period Closed
      </span>
    );
  }

  const hours = Math.floor(remainingMs / 3_600_000);
  const minutes = Math.floor((remainingMs % 3_600_000) / 60_000);
  const isWarning = remainingMs < WARNING_THRESHOLD_MS;

  return (
    <span
      role="status"
      className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${
        isWarning ? "bg-status-warning/15 text-status-warning" : "bg-status-info/15 text-status-info"
      }`}
    >
      Evidence window: {hours}h {minutes}m left
    </span>
  );
}
