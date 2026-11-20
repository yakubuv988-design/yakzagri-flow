"use client";

/**
 * Dev-test fixtures for the offline cache layer.
 *
 * Demonstrates:
 *   - StalenessIndicator in each state (fresh / stale / offline)
 *   - Cache write / read / invalidate via direct offlineCache calls
 *   - Live diagnostic view of IndexedDB queues (dev-only)
 */

import { useCallback, useEffect, useState } from "react";
import { StalenessIndicator } from "@/components/ui/StalenessIndicator";
import {
  cacheWrite,
  cacheRead,
  cacheInvalidate,
  getCacheUsageBytes,
  QUOTA_BYTES,
} from "@/lib/offlineCache";

const IDB_NAME = "handsoff-offline";
const IDB_STORE = "offlineQueue";

interface QueueEntry {
  key: string;
  summary: string;
}

function summarize(value: unknown): string {
  try {
    const json = JSON.stringify(value);
    if (!json) return String(value);
    return json.length > 120 ? `${json.slice(0, 120)}…` : json;
  } catch {
    return String(value);
  }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readQueueEntries(): Promise<QueueEntry[]> {
  if (typeof indexedDB === "undefined") return [];
  const db = await openDb();
  try {
    if (!db.objectStoreNames.contains(IDB_STORE)) return [];
    return await new Promise<QueueEntry[]>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const store = tx.objectStore(IDB_STORE);
      const entries: QueueEntry[] = [];
      const cursorReq = store.openCursor();
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (cursor) {
          entries.push({ key: String(cursor.key), summary: summarize(cursor.value) });
          cursor.continue();
        } else {
          resolve(entries);
        }
      };
      cursorReq.onerror = () => reject(cursorReq.error);
    });
  } finally {
    db.close();
  }
}

async function injectMutation(): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const db = await openDb();
  try {
    if (!db.objectStoreNames.contains(IDB_STORE)) return;
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).put(
        { type: "dev-test", payload: { at: Date.now() }, createdAt: Date.now() },
        `dev-test-${Date.now()}`,
      );
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

async function clearQueue(): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const db = await openDb();
  try {
    if (!db.objectStoreNames.contains(IDB_STORE)) return;
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export function OfflineCacheFixtures() {
  const [readResult, setReadResult] = useState<string>("—");
  const [usageBytes, setUsageBytes] = useState(0);
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [simulatedOffline, setSimulatedOffline] = useState(false);

  const refreshQueue = useCallback(async () => {
    try {
      setQueueEntries(await readQueueEntries());
      setQueueError(null);
    } catch (err) {
      setQueueError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    void refreshQueue();
  }, [refreshQueue]);

  function handleWrite() {
    cacheWrite("trades_list", "dev-test-key", {
      items: [{ tradeId: "dev-1", status: "OPEN" }],
      cachedAt: Date.now(),
    });
    setUsageBytes(getCacheUsageBytes());
    setReadResult("written ✓");
  }

  function handleRead() {
    const result = cacheRead("trades_list", "dev-test-key");
    if (result.isMiss) {
      setReadResult("miss (no entry)");
    } else if (result.isStale) {
      setReadResult(`stale hit — cachedAt: ${result.entry?.cachedAt}`);
    } else {
      setReadResult(`fresh hit — cachedAt: ${result.entry?.cachedAt}`);
    }
    setUsageBytes(getCacheUsageBytes());
  }

  function handleInvalidate() {
    cacheInvalidate("trades_list", "dev-test-key");
    setUsageBytes(getCacheUsageBytes());
    setReadResult("invalidated ✓");
  }

  async function handleInject() {
    await injectMutation();
    await refreshQueue();
  }

  async function handleClearQueue() {
    await clearQueue();
    await refreshQueue();
  }

  function handleSimulateDrop() {
    setSimulatedOffline((prev) => !prev);
  }

  const quotaPct = ((usageBytes / QUOTA_BYTES) * 100).toFixed(1);

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <section className="mb-12">
      <h2 className="text-xs font-semibold tracking-widest text-text-muted mb-1 uppercase">
        Offline Cache Fixtures
      </h2>
      <p className="text-text-muted text-xs mb-6">
        Write / read / invalidate a test entry from the localStorage cache.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Cache controls */}
        <div className="bg-bg-card border border-border-default rounded-xl p-6 flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-text-primary">Cache controls</h3>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleWrite}
              className="rounded-lg px-4 py-2 text-sm font-medium bg-accent-gold text-text-inverse hover:bg-accent-gold-hover transition-colors"
            >
              Write entry
            </button>
            <button
              type="button"
              onClick={handleRead}
              className="rounded-lg px-4 py-2 text-sm font-medium bg-bg-elevated border border-border-default text-text-primary hover:bg-bg-elevated/80 transition-colors"
            >
              Read entry
            </button>
            <button
              type="button"
              onClick={handleInvalidate}
              className="rounded-lg px-4 py-2 text-sm font-medium bg-status-danger/10 text-status-danger border border-status-danger/30 hover:bg-status-danger/20 transition-colors"
            >
              Invalidate
            </button>
          </div>
          <code className="text-xs font-mono text-accent-teal bg-bg-elevated rounded px-3 py-2">
            {readResult}
          </code>
          <p className="text-xs text-text-muted">
            Storage used: {(usageBytes / 1024).toFixed(1)} KB / {(QUOTA_BYTES / 1024).toFixed(0)} KB
            ({quotaPct}%)
          </p>
        </div>

        {/* StalenessIndicator states */}
        <div className="bg-bg-card border border-border-default rounded-xl p-6 flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-text-primary">
            StalenessIndicator — all states
          </h3>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs text-text-muted w-24">Fresh:</span>
              <StalenessIndicator isStale={false} isOffline={false} cachedAt={Date.now()} />
              <span className="text-xs text-text-muted italic">(no badge rendered)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-text-muted w-24">Stale:</span>
              <StalenessIndicator
                isStale={true}
                isOffline={false}
                cachedAt={Date.now() - 8 * 60 * 1000}
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-text-muted w-24">Offline:</span>
              <StalenessIndicator
                isStale={true}
                isOffline={true}
                cachedAt={Date.now() - 12 * 60 * 1000}
              />
            </div>
          </div>
        </div>
      </div>

      {/* IndexedDB queue diagnostic view */}
      <div className="mt-6 bg-bg-card border border-border-default rounded-xl p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">
            IndexedDB queue — {queueEntries.length} item(s)
          </h3>
          <button
            type="button"
            onClick={() => void refreshQueue()}
            className="rounded-lg px-3 py-1 text-xs font-medium bg-bg-elevated border border-border-default text-text-primary hover:bg-bg-elevated/80 transition-colors"
          >
            Refresh
          </button>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void handleInject()}
            className="rounded-lg px-4 py-2 text-sm font-medium bg-accent-gold text-text-inverse hover:bg-accent-gold-hover transition-colors"
          >
            Inject mutation
          </button>
          <button
            type="button"
            onClick={() => void handleClearQueue()}
            className="rounded-lg px-4 py-2 text-sm font-medium bg-status-danger/10 text-status-danger border border-status-danger/30 hover:bg-status-danger/20 transition-colors"
          >
            Clear queue
          </button>
          <button
            type="button"
            onClick={handleSimulateDrop}
            className="rounded-lg px-4 py-2 text-sm font-medium bg-bg-elevated border border-border-default text-text-primary hover:bg-bg-elevated/80 transition-colors"
          >
            {simulatedOffline ? "Restore network" : "Simulate network drop"}
          </button>
        </div>

        {simulatedOffline && (
          <p className="text-xs text-status-danger">
            Network drop simulated — offline state active for this session.
          </p>
        )}

        {queueError && (
          <p className="text-xs text-status-danger">Queue read error: {queueError}</p>
        )}

        {queueEntries.length === 0 ? (
          <p className="text-xs text-text-muted italic">No queued items.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {queueEntries.map((entry) => (
              <li
                key={entry.key}
                className="bg-bg-elevated rounded px-3 py-2 text-xs font-mono text-text-primary break-all"
              >
                <span className="text-accent-teal">{entry.key}</span>
                <span className="text-text-muted"> — {entry.summary}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
