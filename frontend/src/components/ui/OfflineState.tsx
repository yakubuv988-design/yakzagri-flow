"use client";
import { t as translateCopy } from "@/lib/i18n";


import * as React from "react";
import { clsx } from "clsx";

export interface OfflineStateProps {
  onRetry?: () => void;
  className?: string;
}

export function OfflineState({
  onRetry,
  className,
}: OfflineStateProps) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center gap-4 p-8 text-center",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center">
        <svg
          className="h-6 w-6 text-warning"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
          />
        </svg>
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-content">{translateCopy("ui.you_re_offline_f4d9cea")}</h2>
        <p className="text-sm text-muted">
          {translateCopy("ui.please_check_your_internet_conne_10cd84f")}
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className={clsx(
            "mt-2 rounded-lg px-4 py-2 text-sm font-medium",
            "bg-warning text-white hover:bg-warning/90",
            "transition-colors focus:outline-none focus:ring-2 focus:ring-warning focus:ring-offset-2",
          )}
        >
          {translateCopy("ui.retry_connection_a351235")}
        </button>
      )}
    </div>
  );
}

export function formatCacheAge(cachedAt: number, now: number = Date.now()): string {
  const minutes = Math.floor((now - cachedAt) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

/**
 * Banner shown while a list is displayed from the local cache rather than
 * fresh network data (#428). Render it only in that state; it disappears
 * when the caller stops rendering it after a successful fetch.
 */
export function CachedDataNotice({ cachedAt, className }: { cachedAt: number; className?: string }) {
  return (
    <div
      role="status"
      className={clsx(
        "flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning",
        className,
      )}
    >
      <span aria-hidden>●</span>
      <span>Viewing cached data, cached {formatCacheAge(cachedAt)}</span>
    </div>
  );
}