import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface WalletState {
  publicKey: string | null;
  network: string;
  balances: Record<string, string>;
  isConnected: boolean;
  isConnecting: boolean;
  connect: (publicKey: string, network: string) => void;
  disconnect: () => void;
  setBalances: (balances: Record<string, string>) => void;
  reset: () => void;
}

const memoryStorage = new Map<string, string>();

/**
 * Storage for the wallet session: localStorage, then sessionStorage, then memory (#414).
 * Hardened browsers can block or partition localStorage, so each tier is probed with a
 * write before it is used. The memory tier keeps the store working, but the session
 * is then lost on reload.
 */
function resolveWalletStorage(): Storage {
  if (typeof window !== 'undefined') {
    for (const pick of [() => window.localStorage, () => window.sessionStorage]) {
      try {
        const candidate = pick();
        const probeKey = '__amana_storage_probe__';
        candidate.setItem(probeKey, '1');
        candidate.removeItem(probeKey);
        return candidate;
      } catch {
        // Blocked or unavailable: try the next tier.
      }
    }
  }

  return {
    getItem: (key: string) => memoryStorage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memoryStorage.set(key, value);
    },
    removeItem: (key: string) => {
      memoryStorage.delete(key);
    },
  } as unknown as Storage;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      publicKey: null,
      network: 'public',
      balances: {},
      isConnected: false,
      isConnecting: false,

      connect: (publicKey: string, network: string) => {
        set({
          publicKey,
          network,
          isConnected: true,
          isConnecting: false,
        });
      },

      disconnect: () => {
        set({
          publicKey: null,
          network: 'public',
          balances: {},
          isConnected: false,
          isConnecting: false,
        });
      },

      setBalances: (balances: Record<string, string>) => {
        set({ balances });
      },

      reset: () => {
        set({
          publicKey: null,
          network: 'public',
          balances: {},
          isConnected: false,
          isConnecting: false,
        });
      },
    }),
    {
      name: 'amana_wallet_store',
      storage: createJSONStorage(resolveWalletStorage),
      partialize: (state) => ({
        publicKey: state.publicKey,
        network: state.network,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.publicKey) {
          state.isConnected = true;
        }
      },
    }
  )
);
