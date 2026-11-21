import { request } from "./client";
import type { ReputationResponse } from "./types";

const finiteOr = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

/**
 * Replace missing or non-finite numbers with 0, so a farmer with no closed
 * trades never renders NaN in the score (#404). `successRate` is 0 when there
 * are no trades, since there is nothing to rate yet.
 */
export function normalizeReputation(raw: ReputationResponse): ReputationResponse {
  const totalTrades = finiteOr(raw.totalTrades, 0);
  return {
    ...raw,
    trustScore: finiteOr(raw.trustScore, 0),
    totalTrades,
    completedTrades: finiteOr(raw.completedTrades, 0),
    disputedTrades: finiteOr(raw.disputedTrades, 0),
    successRate: totalTrades > 0 ? finiteOr(raw.successRate, 0) : 0,
    history: raw.history ?? [],
  };
}

export const reputationApi = {
  getMyReputation: async (token: string) =>
    normalizeReputation(await request<ReputationResponse>("/users/me/reputation", { token })),

  getUserReputation: async (address: string) =>
    normalizeReputation(await request<ReputationResponse>(`/users/${address}/reputation`)),
};
