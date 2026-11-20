import { act } from '@testing-library/react';

/**
 * Integration tests for the offline queue replay mechanism.
 *
 * These tests exercise the store's public surface (enqueue + replay) under
 * simulated network failures, verifying backoff timing, status transitions
 * (QUEUED -> RETRYING -> CONFIRMED) and persistence across mocked restarts.
 */

// In-memory IndexedDB-like persistence layer used to simulate restarts.
const mockPersistence = new Map<string, string>();

jest.mock('@/lib/offline/persistence', () => ({
  loadQueue: jest.fn(async () => {
    const raw = mockPersistence.get('offline-queue');
    return raw ? JSON.parse(raw) : [];
  }),
  saveQueue: jest.fn(async (items: unknown) => {
    mockPersistence.set('offline-queue', JSON.stringify(items));
  }),
}));

// Mock the network transport so we can simulate failures and recovery.
const mockSend = jest.fn();
jest.mock('@/lib/offline/transport', () => ({
  sendQueuedItem: (...args: unknown[]) => mockSend(...args),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { useOfflineQueueStore } = require('@/stores/offlineQueueStore');

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

describe('offlineQueueStore retry logic', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockPersistence.clear();
    mockSend.mockReset();
    act(() => {
      useOfflineQueueStore.getState().reset?.();
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('queues items while offline and transitions QUEUED -> RETRYING -> CONFIRMED', async () => {
    const store = useOfflineQueueStore.getState();

    act(() => {
      store.enqueue({ id: 'item-1', type: 'escrow.create', payload: { amount: 10 } });
    });

    expect(useOfflineQueueStore.getState().items[0].status).toBe('QUEUED');

    // First attempt fails, second succeeds.
    mockSend
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce({ ok: true });

    await act(async () => {
      const replay = useOfflineQueueStore.getState().replay();
      await flushPromises();
      expect(useOfflineQueueStore.getState().items[0].status).toBe('RETRYING');
      jest.advanceTimersByTime(1000);
      await flushPromises();
      await replay;
    });

    expect(mockSend).toHaveBeenCalledTimes(2);
    expect(useOfflineQueueStore.getState().items[0].status).toBe('CONFIRMED');
  });

  it('applies exponential backoff between failed retries', async () => {
    const store = useOfflineQueueStore.getState();

    act(() => {
      store.enqueue({ id: 'item-2', type: 'escrow.create', payload: { amount: 5 } });
    });

    mockSend
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValueOnce({ ok: true });

    await act(async () => {
      const replay = useOfflineQueueStore.getState().replay();
      await flushPromises();
      expect(mockSend).toHaveBeenCalledTimes(1);

      // First backoff window (base delay).
      jest.advanceTimersByTime(1000);
      await flushPromises();
      expect(mockSend).toHaveBeenCalledTimes(2);

      // Second backoff window is longer (exponential).
      jest.advanceTimersByTime(2000);
      await flushPromises();
      expect(mockSend).toHaveBeenCalledTimes(3);

      await replay;
    });

    expect(useOfflineQueueStore.getState().items[0].status).toBe('CONFIRMED');
  });

  it('persists queued items across a mocked restart', async () => {
    const store = useOfflineQueueStore.getState();

    act(() => {
      store.enqueue({ id: 'item-3', type: 'escrow.create', payload: { amount: 42 } });
    });

    await act(async () => {
      await flushPromises();
    });

    // Simulate a restart: reset in-memory state, then rehydrate from persistence.
    act(() => {
      useOfflineQueueStore.getState().reset?.();
    });
    expect(useOfflineQueueStore.getState().items).toHaveLength(0);

    await act(async () => {
      await useOfflineQueueStore.getState().hydrate?.();
      await flushPromises();
    });

    const items = useOfflineQueueStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('item-3');
    expect(items[0].status).toBe('QUEUED');
  });
});
