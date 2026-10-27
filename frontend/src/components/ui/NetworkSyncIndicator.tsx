"use client";

import { useEffect, useState, useRef } from "react";
import { useOffline } from "@/hooks/useOffline";
import { useOfflineQueueStore } from "@/stores/offlineQueueStore";

export function NetworkSyncIndicator() {
  const { isOffline, retryOnline } = useOffline();
  const queue = useOfflineQueueStore((s) => s.queue);
  const dequeue = useOfflineQueueStore((s) => s.dequeue);

  const [mounted, setMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  if (!mounted) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-border-default bg-elevated/50 text-text-muted">
        <span className="w-2 h-2 rounded-full bg-border-default" />
        <span className="hidden sm:inline">Connecting...</span>
      </div>
    );
  }

  const isSyncing = !isOffline && queue.length > 0;
  const statusLabel = isOffline
    ? queue.length > 0
      ? `Offline (${queue.length})`
      : "Offline"
    : isSyncing
    ? `Syncing (${queue.length})`
    : "Online";

  const ariaStatus = isOffline
    ? `Network offline. ${queue.length} actions queued.`
    : isSyncing
    ? `Synchronizing ${queue.length} queued actions.`
    : "Network online. All actions synced.";

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => {
          if (queue.length > 0) {
            setDropdownOpen((prev) => !prev);
          } else if (isOffline) {
            void retryOnline();
          }
        }}
        aria-expanded={queue.length > 0 ? dropdownOpen : undefined}
        aria-haspopup={queue.length > 0 ? "dialog" : undefined}
        aria-label={ariaStatus}
        role="status"
        title={isOffline ? "Click to retry connection" : queue.length > 0 ? "Click to view queued actions" : "Connection active"}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors focus-visible:outline-2 focus-visible:outline-gold ${
          isOffline
            ? "border-status-danger/30 bg-status-danger/10 text-status-danger hover:bg-status-danger/20"
            : isSyncing
            ? "border-gold/30 bg-gold-muted text-gold hover:bg-gold-muted/80"
            : "border-border-default bg-elevated text-emerald hover:border-emerald/40"
        }`}
      >
        <span className="relative flex h-2 w-2">
          {isSyncing && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75" />
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isOffline
                ? "bg-status-danger"
                : isSyncing
                ? "bg-gold"
                : "bg-emerald"
            }`}
          />
        </span>
        <span className="hidden sm:inline font-mono text-[11px] font-semibold">{statusLabel}</span>
      </button>

      {dropdownOpen && queue.length > 0 && (
        <div
          role="dialog"
          aria-label="Offline queued actions"
          className="absolute right-0 mt-2 w-72 sm:w-80 rounded-lg border border-border-default bg-bg-elevated p-3 shadow-xl z-50 text-left"
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-border-default">
            <span className="text-xs font-semibold text-text-primary">
              Queued Actions ({queue.length})
            </span>
            {isOffline && (
              <button
                type="button"
                onClick={() => void retryOnline()}
                className="text-[11px] font-medium text-gold hover:underline"
              >
                Retry connection
              </button>
            )}
          </div>

          <ul className="max-h-48 overflow-y-auto space-y-1.5">
            {queue.map((action) => (
              <li
                key={action.id}
                className="flex items-center justify-between gap-2 p-1.5 rounded bg-bg-secondary text-[11px] border border-border-default/50"
              >
                <div className="min-w-0 flex-1">
                  <span className="font-semibold text-text-primary uppercase tracking-wider block truncate">
                    {action.type}
                  </span>
                  <span className="text-text-muted truncate block">
                    {action.method} {action.endpoint}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => dequeue(action.id)}
                  title="Remove from queue"
                  className="shrink-0 text-text-muted hover:text-status-danger px-1.5 py-0.5 rounded text-[10px]"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
