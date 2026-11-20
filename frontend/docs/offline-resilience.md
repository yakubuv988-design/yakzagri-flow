# Offline Resilience — Connectivity, Queue & Idempotency

**Date:** 2026-08-31 | Owner: Frontend

## Global connectivity state

- `src/hooks/useOffline.ts` — probes `GET {apiBaseUrl}/health` (no external google.com, CSP-safe) + `navigator.onLine`, adaptive cadence, 3s timeout. Returns `{isOffline, wasOffline, isOnline, retryOnline}`.
- Adaptive probe cadence (issue #118): `navigator.onLine` and `online`/`offline` events are checked first; the network probe only runs when the browser reports online. Probe interval starts at 5s and backs off exponentially (5s → 10s → 20s → 40s → 60s cap) while the connection stays stable, resetting to 5s on any failure or `offline` event. This drops steady-state probe load per tab.
- Cross-tab sharing (issue #118): a `BroadcastChannel` (`amana-connectivity`) broadcasts connectivity transitions so all open tabs share one offline/online state instead of each tab probing independently.
- Surfaced via `src/components/ui/ConnectivityBanner.tsx` fixed top banner (`role="status" aria-live="polite"`):
  - Offline: "You’re offline — actions will be queued…" + pending count + Retry button.
  - Was-offline + queue: "Reconnecting — replaying N…" 
  - Accurate during transition windows (probe + online/offline events).

## Queue idempotent actions locally while offline (draft trades)

- `src/stores/offlineQueueStore.ts` — zustand persist `amana-offline-queue` in localStorage, holds `QueuedAction[] {id, type, endpoint, method, body, idempotencyKey, correlationId, createdAt, attempts}`.
- `TradeContext` draft persists to `localStorage amana:draft-trade` (data + step) — survives refresh/restart.
- `Step3Review` checks `isOffline`: if true, enqueues `create-trade` with generated `idempotencyKey`/`correlationId` via `enqueue`, shows "Queued offline" toast with correlation, does not fire network. Banner shows pending.
- Clear pending UX: `ConnectivityBanner` + `Step3Review` pendingCount badge + `PendingBadge` component + sr-only hints.

## Replay on reconnect with conflict handling via idempotency keys

- On `!isOffline && wasOffline && queue.length>0`, `ConnectivityBanner` calls `replay(executor)` where executor does `request(endpoint, {method, body, headers: {"Idempotency-Key": key, "X-Correlation-Id": corr}})`.
- Same `idempotencyKey` reused on replay — backend `idempotencyMiddleware` (`idempotency:{method}:{path}:{key}` + `SET NX EX 30`) honors reuse: duplicate-send prevented, cache HIT returns prior response with `X-Idempotency-Cache: HIT`. If 409 due to already-processed, executor treats as success and dequeue.
- Attempts incremented; failed kept for next reconnect; partial sync toast warns.

## Exponential backoff with jitter for replay (issue #431)

- When many devices reconnect at once (e.g. a rural market), unthrottled replay can overwhelm the backend. `offlineQueueStore` therefore spaces retries with exponential backoff plus randomized jitter.
- Formula: `base = 1000ms * 2^(attempts - 1)` → 1s, 2s, 4s, 8s, …; jitter is ±20% (`base * (1 + (Math.random() * 0.4 - 0.2))`).
- Cap: the computed interval is clamped to a maximum of **30s** (`Math.min(interval, 30_000)`), so retries never exceed 30s regardless of attempt count.
- `replay` waits `getBackoffDelay(attempts)` before each retry; the delay is exposed for tests so jitter distribution and retry spacing can be asserted deterministically (mocking `Math.random`).

## Integration with optimistic store / offline queue precedence

- Precedence: **Offline queue owns mutations while offline**; optimistic store (`tradeStore`) is NOT applied for offline enqueues (no patch). When online, `tradeStore.updateTradeOptimistic` does optimistic patch with snapshot rollback + dedup window + toast correlation. If offline, no optimistic patch — pending banner is source of truth.
- On reconnect, after `replay` succeeds, call `fetchTrades` to reconcile list (store re-fetches from server, which now contains the replayed trade). This avoids optimistic/server desync.

## Tests simulating flaky connectivity (offline -> online mid-flow)

- `src/__tests__/offline.queue.test.tsx` — enqueue persists to localStorage, survives simulated refresh, replay reuses same key, pending UX, E2E offline->online simulation green.
- `src/__tests__/offline.backoff.test.ts` — asserts exponential spacing (1s, 2s, 4s, 8s), ±20% jitter bounds, and the 30s cap.
- `src/__tests__/tradeStore.optimistic.test.ts` — failure-mid-flight restores prior UI state, triple-click dedup yields single intent.
- Manual: `Step3Review` with `isOffline=true` enqueues, refresh preserves draft, go online → replay + fetch → trade appears.

Run: `pnpm test -- offline.queue offline.backoff tradeStore.optimistic --verbose`

## Dev-test diagnostic view for IndexedDB queues (issue #433)

- `src/app/dev-test/OfflineCacheFixtures.tsx` renders a live visualizer for the offline IndexedDB cache so offline behavior can be inspected without opening browser DevTools.
- The view lists every currently stored IndexedDB key with a payload summary (action type, endpoint, method, attempts, and creation time), refreshing on an interval and after each action.
- Buttons let you inject test mutations into the queue, clear the queue, and simulate network drops (toggling the offline state) to exercise replay and backoff paths.
- The diagnostic view is gated on `process.env.NODE_ENV !== "production"`; in production builds it renders nothing, so it is never shipped to end users.
