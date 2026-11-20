/**
 * Minimal IndexedDB queue helpers for offline mutations.
 *
 * These utilities are intentionally small and dependency-free so they can be
 * shared between the offline queue store and the dev-test diagnostic view.
 */

export const OFFLINE_DB_NAME = 'handsoff-offline';
export const OFFLINE_DB_VERSION = 1;
export const OFFLINE_QUEUE_STORE = 'mutations';

export interface QueuedMutation {
  id: string;
  type: string;
  payload: unknown;
  createdAt: number;
  attempts: number;
}

export interface QueueEntrySummary {
  key: IDBValidKey;
  summary: string;
}

function isIndexedDbAvailable(): boolean {
  return typeof indexedDB !== 'undefined';
}

export function openOfflineDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDbAvailable()) {
      reject(new Error('IndexedDB is not available in this environment'));
      return;
    }

    const request = indexedDB.open(OFFLINE_DB_NAME, OFFLINE_DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(OFFLINE_QUEUE_STORE)) {
        db.createObjectStore(OFFLINE_QUEUE_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open offline DB'));
  });
}

function summarizeValue(value: unknown): string {
  if (value === null || value === undefined) {
    return String(value);
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const type = typeof record.type === 'string' ? record.type : 'object';
    const payload = record.payload;
    let payloadSummary = '';

    try {
      payloadSummary = JSON.stringify(payload);
    } catch {
      payloadSummary = '[unserializable]';
    }

    if (payloadSummary && payloadSummary.length > 80) {
      payloadSummary = `${payloadSummary.slice(0, 77)}...`;
    }

    return payloadSummary ? `${type}: ${payloadSummary}` : type;
  }

  return String(value);
}

/**
 * List every key currently stored in the offline queue with a short payload
 * summary. Used by the dev-test diagnostic view.
 */
export async function listQueueEntries(): Promise<QueueEntrySummary[]> {
  const db = await openOfflineDb();

  try {
    return await new Promise<QueueEntrySummary[]>((resolve, reject) => {
      const tx = db.transaction(OFFLINE_QUEUE_STORE, 'readonly');
      const store = tx.objectStore(OFFLINE_QUEUE_STORE);
      const entries: QueueEntrySummary[] = [];

      const cursorRequest = store.openCursor();
      cursorRequest.onsuccess = () => {
        const cursor = cursorRequest.result;
        if (cursor) {
          entries.push({ key: cursor.key, summary: summarizeValue(cursor.value) });
          cursor.continue();
        }
      };

      tx.oncomplete = () => resolve(entries);
      tx.onerror = () => reject(tx.error ?? new Error('Failed to read offline queue'));
      tx.onabort = () => reject(tx.error ?? new Error('Offline queue read aborted'));
    });
  } finally {
    db.close();
  }
}

/**
 * Remove every entry from the offline queue.
 */
export async function clearQueue(): Promise<void> {
  const db = await openOfflineDb();

  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(OFFLINE_QUEUE_STORE, 'readwrite');
      tx.objectStore(OFFLINE_QUEUE_STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Failed to clear offline queue'));
      tx.onabort = () => reject(tx.error ?? new Error('Offline queue clear aborted'));
    });
  } finally {
    db.close();
  }
}

/**
 * Insert a mutation into the offline queue. Used by the dev-test diagnostic
 * view to inject test mutations.
 */
export async function enqueueMutation(mutation: QueuedMutation): Promise<void> {
  const db = await openOfflineDb();

  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(OFFLINE_QUEUE_STORE, 'readwrite');
      tx.objectStore(OFFLINE_QUEUE_STORE).put(mutation);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Failed to enqueue mutation'));
      tx.onabort = () => reject(tx.error ?? new Error('Offline queue write aborted'));
    });
  } finally {
    db.close();
  }
}
