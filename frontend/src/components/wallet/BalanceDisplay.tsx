"use client";

import { useRef } from "react";

/** Minimum gap between balance refreshes, to avoid Horizon rate limits (#412). */
export const BALANCE_REFRESH_THROTTLE_MS = 5_000;

interface BalanceDisplayProps {
  label: string;
  balance: string;
  asset: string | null;
  loading: boolean;
  onRefresh: () => void;
}

/** Wallet balance with a refresh button that spins while the fetch runs (#412). */
export function BalanceDisplay({ label, balance, asset, loading, onRefresh }: BalanceDisplayProps) {
  const lastRefreshRef = useRef(0);

  function handleRefresh() {
    const now = Date.now();
    if (now - lastRefreshRef.current < BALANCE_REFRESH_THROTTLE_MS) return;
    lastRefreshRef.current = now;
    onRefresh();
  }

  return (
    <div className="mt-1 flex items-center gap-2 text-xs text-text-muted">
      <span>
        {label}{" "}
        <span className="font-medium text-text-secondary">
          {balance} {asset}
        </span>
      </span>
      <button
        type="button"
        onClick={handleRefresh}
        disabled={loading}
        aria-label="Refresh balance"
        className="flex h-5 w-5 items-center justify-center rounded text-text-secondary transition-colors hover:text-text-primary disabled:opacity-50"
      >
        <svg
          className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          aria-hidden
        >
          <path d="M13.5 8A5.5 5.5 0 1 1 11.9 4.1" />
          <path d="M12 1.5v3h-3" />
        </svg>
      </button>
    </div>
  );
}
