import { getNetworkDetails } from "@stellar/freighter-api";
import { apiConfig } from "@/lib/api";

export interface NetworkMismatch {
  walletPassphrase: string;
  expectedPassphrase: string;
}

/**
 * Compare Freighter's active network with the one this app is configured for (#410).
 * Returns null when they match, or when Freighter cannot report its network.
 */
export async function getNetworkMismatch(): Promise<NetworkMismatch | null> {
  try {
    const details = await getNetworkDetails();
    if (details.error !== undefined || !details.networkPassphrase) return null;

    const expectedPassphrase = apiConfig.getStellarNetworkPassphrase();
    if (details.networkPassphrase === expectedPassphrase) return null;

    return { walletPassphrase: details.networkPassphrase, expectedPassphrase };
  } catch {
    return null;
  }
}
