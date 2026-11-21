import { request } from "./client";
import type { ReputationResponse } from "./types";

/** Reputation responses are reused for five minutes to cut repeat calls (#407). */
const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  value: ReputationResponse;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

async function cachedRequest(key: string, load: () => Promise<ReputationResponse>): Promise<ReputationResponse> {
  const hit = cache.get(key);
  if (hit && Date.now() < hit.expiresAt) return hit.value;

  const value = await load();
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}

/**
 * Drop cached reputation data. Pass an address to clear that user's entry,
 * or nothing to clear everything. Own-reputation entries are always cleared,
 * since a settled trade changes the caller's score too.
 */
export function invalidateReputationCache(address?: string): void {
  for (const key of Array.from(cache.keys())) {
    if (address === undefined || key === `user:${address}` || key.startsWith("me:")) {
      cache.delete(key);
    }
  }
}

export const reputationApi = {
  getMyReputation: (token: string) =>
    cachedRequest(`me:${token}`, () =>
      request<ReputationResponse>("/users/me/reputation", { token }),
    ),

  getUserReputation: (address: string) =>
    cachedRequest(`user:${address}`, () =>
      request<ReputationResponse>(`/users/${address}/reputation`),
    ),
};
