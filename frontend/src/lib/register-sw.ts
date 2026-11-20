export const SW_UPDATE_AVAILABLE_EVENT = "amana:sw-update-available";

/**
 * Cache version tag. Bump this whenever the frontend build changes so that
 * legacy cache buckets from older deployments are purged on upgrade.
 */
export const SW_CACHE_VERSION = "v1";
export const SW_CACHE_PREFIX = "amana";
export const SW_CACHE_TAG = `${SW_CACHE_PREFIX}-${SW_CACHE_VERSION}`;

/**
 * Purge every Cache Storage bucket that does not belong to the current
 * version tag. This prevents stale HTML from an older deployment being
 * served alongside freshly deployed JS chunks.
 */
export async function purgeLegacyCaches(
  currentTag: string = SW_CACHE_TAG,
): Promise<string[]> {
  if (typeof window === "undefined") return [];
  if (!("caches" in window)) return [];

  const purged: string[] = [];
  try {
    const keys = await caches.keys();
    await Promise.all(
      keys.map(async (key) => {
        if (key === currentTag) return;
        const deleted = await caches.delete(key);
        if (deleted) purged.push(key);
      }),
    );
    if (purged.length > 0) {
      console.log("[SW] Purged legacy caches:", purged);
    }
  } catch (err) {
    console.warn("[SW] Failed to purge legacy caches:", err);
  }
  return purged;
}

/**
 * Ask the waiting service worker to activate immediately and take control of
 * open clients. The SW is expected to call `clients.claim()` on activate.
 */
export function activateWaitingWorker(worker: ServiceWorker) {
  worker.postMessage({ type: "SKIP_WAITING" });
}

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

        // Clean legacy cache buckets from previous deployments on upgrade.
        void purgeLegacyCaches();

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
  });
}

/**
 * Navigation fallback for offline users.
 *
 * When a navigation request fails because the network is unavailable, the
 * service worker serves the branded `/offline.html` page instead of the
 * browser's default network error. This is a no-op when the SW is not
 * supported or not yet controlling the page.
 */
export function registerOfflineNavigationFallback() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  const OFFLINE_URL = "/offline.html";

  const handleOffline = () => {
    if (window.location.pathname === OFFLINE_URL) return;
    window.location.assign(OFFLINE_URL);
  };

  window.addEventListener("offline", () => {
    // Only redirect on navigation failures, not while the user is active.
    if (navigator.onLine) return;
  });

  navigator.serviceWorker.addEventListener("message", (event) => {
    const data = event.data as { type?: string } | undefined;
    if (data?.type === "NAVIGATION_OFFLINE") {
      handleOffline();
    }
  });
}
