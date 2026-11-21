"use client";

import { useEffect, useState } from "react";
import { getNetworkMismatch, type NetworkMismatch } from "@/lib/wallet/network";

/** Warns when Freighter is on a different Stellar network from this app (#410). */
export function NetworkMismatchBanner() {
  const [mismatch, setMismatch] = useState<NetworkMismatch | null>(null);

  useEffect(() => {
    let cancelled = false;
    const check = () => {
      void getNetworkMismatch().then((result) => {
        if (!cancelled) setMismatch(result);
      });
    };

    check();
    // Re-check when the user returns from switching networks in the extension.
    window.addEventListener("focus", check);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", check);
    };
  }, []);

  if (!mismatch) return null;

  return (
    <div
      role="alert"
      className="flex items-center justify-center bg-status-danger px-4 py-2 text-center text-sm text-text-inverse"
    >
      Your Freighter wallet is on a different Stellar network from this app. Switch Freighter to
      the network this app uses before creating or signing transactions.
    </div>
  );
}
