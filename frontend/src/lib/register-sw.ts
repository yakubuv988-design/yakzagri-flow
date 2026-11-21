export const SW_UPDATE_AVAILABLE_EVENT = "amana:sw-update-available";
export const SYNC_TRADE_QUEUE_EVENT = "amana:sync-trade-queue";
const SYNC_TAG = "sync-trade-queue";

export function registerServiceWorker(onUpdateAvailable?: (waiting: ServiceWorker) => void) {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  const notifyWaiting = (worker: ServiceWorker) => {
    onUpdateAvailable?.(worker);
    window.dispatchEvent(
      new CustomEvent(SW_UPDATE_AVAILABLE_EVENT, { detail: { waiting: worker } }),
    );
  };

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("[SW] Service worker registered");

        if (registration.waiting) {
          notifyWaiting(registration.waiting);
        }

        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (
              installing.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              notifyWaiting(installing);
            }
          });
        });
      })
      .catch((err) => {
        console.warn("[SW] Service worker registration failed:", err);
      });

    // Reload once the new SW takes control so the page is served by it.
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    // The service worker asks open pages to flush the trade queue (#424).
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.type === "SYNC_TRADE_QUEUE") {
        window.dispatchEvent(new Event(SYNC_TRADE_QUEUE_EVENT));
      }
    });
  });

  // Ask for a background sync when the network returns. Browsers without
  // Background Sync flush the queue from the page instead (#424).
  window.addEventListener("online", () => {
    navigator.serviceWorker.ready.then((registration) => {
      const sync = (registration as ServiceWorkerRegistration & {
        sync?: { register(tag: string): Promise<void> };
      }).sync;
      if (!sync) {
        window.dispatchEvent(new Event(SYNC_TRADE_QUEUE_EVENT));
        return;
      }
      sync.register(SYNC_TAG).catch(() => window.dispatchEvent(new Event(SYNC_TRADE_QUEUE_EVENT)));
    });
  });
}
