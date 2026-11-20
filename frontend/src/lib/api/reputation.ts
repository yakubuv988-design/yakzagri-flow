import { request } from "./client";
import type { ReputationResponse } from "./types";

export const reputationApi = {
  getMyReputation: (token: string) =>
    request<ReputationResponse>("/users/me/reputation", { token }),

  getUserReputation: (address: string) =>
    request<ReputationResponse>(`/users/${address}/reputation`),
};

export const NEW_PARTICIPANT_LABEL = "Unrated / New";
export const NEW_PARTICIPANT_DESCRIPTION = "New Participant (No trade history yet)";
export const NEW_PARTICIPANT_TOOLTIP =
  "Complete your first trade to establish your trust score. Settle trades on time and avoid disputes to build trust.";

export interface ReputationSummary {
  isNewParticipant: boolean;
  /** Finite trust score clamped to 0-100 (0 for new participants). */
  trustScore: number;
  /** Finite success rate clamped to 0-100 (0 for new participants). */
  successRate: number;
  /** Score on the 0-5 scale used by the score ring. */
  ringScore: number;
  /** Human-readable score, e.g. "72" or "Unrated / New". */
  scoreLabel: string;
  tooltip: string | null;
}

function finiteOr(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

/**
 * Derives display-safe reputation values. Users with zero trades have no
 * meaningful score, so they get a designated "new participant" state rather
 * than NaN produced by dividing by a zero trade count.
 */
export function summarizeReputation(rep: ReputationResponse): ReputationSummary {
  const totalTrades = finiteOr(rep.totalTrades, 0);
  const completedTrades = finiteOr(rep.completedTrades, 0);

  if (totalTrades <= 0 && completedTrades <= 0) {
    return {
      isNewParticipant: true,
      trustScore: 0,
      successRate: 0,
      ringScore: 0,
      scoreLabel: NEW_PARTICIPANT_LABEL,
      tooltip: NEW_PARTICIPANT_TOOLTIP,
    };
  }

  const trustScore = Math.min(100, Math.max(0, finiteOr(rep.trustScore, 0)));
  const successRate = Math.min(100, Math.max(0, finiteOr(rep.successRate, 0)));
  return {
    isNewParticipant: false,
    trustScore,
    successRate,
    ringScore: (trustScore / 100) * 5,
    scoreLabel: String(trustScore),
    tooltip: null,
  };
}
