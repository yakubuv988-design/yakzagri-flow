// Minimal IndexedDB helper for the offline mutation queue.
// Kept dependency-free so it can be used from the service worker and the app.

export const DB_NAME = 'handsoff-offline';
export const DB_VERSION = 1;
export const QUEUE_STORE = 'mutation-queue';

export interface QueuedMutation {
  id?: number;
  url: string;
  method: string;
  body?: unknown;
  headers?: Record<string, string>;
  createdAt: number;
  attempts: number;
  nextAttemptAt: number;
}

export interface QueueEntrySummary {
  key: IDBValidKey;
  summary: string;
}

function isIndexedDbAvailable(): boolean {
  return typeof indexedDB !== 'undefined';
}

export function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDbAvailable()) {
      reject(new Error('IndexedDB is not available in this environment'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        const store = db.createObjectStore(QUEUE_STORE, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('nextAttemptAt', 'nextAttemptAt', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function enqueueMutation(
  mutation: Omit<QueuedMutation, 'id' | 'createdAt' | 'attempts' | 'nextAttemptAt'>,
): Promise<number> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, 'readwrite');
    const store = tx.objectStore(QUEUE_STORE);
    const now = Date.now();
    const record: Omit<QueuedMutation, 'id'> = {
      ...mutation,
      createdAt: now,
      attempts: 0,
      nextAttemptAt: now,
    };
    const request = store.add(record);
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

export async function getAllMutations(): Promise<QueuedMutation[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, 'readonly');
    const store = tx.objectStore(QUEUE_STORE);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as QueuedMutation[]);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

export async function clearQueue(): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, 'readwrite');
    const store = tx.objectStore(QUEUE_STORE);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

/**
 * Diagnostic helper: list every stored key in the queue store along with a
 * short, human-readable payload summary. Used by the dev-test fixtures view.
 */
export async function listQueueEntries(): Promise<QueueEntrySummary[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, 'readonly');
    const store = tx.objectStore(QUEUE_STORE);
    const request = store.openCursor();
    const entries: QueueEntrySummary[] = [];
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) {
        resolve(entries);
        return;
      }
      const value = cursor.value as QueuedMutation;
      const bodyPreview =
        value.body === undefined
          ? ''
          : ` body=${JSON.stringify(value.body).slice(0, 80)}`;
      entries.push({
        key: cursor.key,
        summary: `${value.method} ${value.url} attempts=${value.attempts}${bodyPreview}`,
      });
      cursor.continue();
    };
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}
