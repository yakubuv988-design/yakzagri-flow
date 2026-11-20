import { summarizeReputation, NEW_PARTICIPANT_LABEL } from "../reputation";
import type { ReputationResponse } from "../types";

const base: ReputationResponse = {
  trustScore: 0,
  totalTrades: 0,
  completedTrades: 0,
  disputedTrades: 0,
  successRate: 0,
  history: [],
};

describe("summarizeReputation", () => {
  it("returns an unrated state without NaN for 0 trades", () => {
    const s = summarizeReputation({ ...base, trustScore: NaN, successRate: NaN });
    expect(s.isNewParticipant).toBe(true);
    expect(s.scoreLabel).toBe(NEW_PARTICIPANT_LABEL);
    expect(s.tooltip).toMatch(/first trade/i);
    expect(Number.isNaN(s.ringScore)).toBe(false);
    expect(s.ringScore).toBe(0);
  });

  it("scores a profile with 1 trade", () => {
    const s = summarizeReputation({ ...base, trustScore: 50, totalTrades: 1, completedTrades: 1, successRate: 100 });
    expect(s.isNewParticipant).toBe(false);
    expect(s.scoreLabel).toBe("50");
    expect(s.ringScore).toBe(2.5);
    expect(s.tooltip).toBeNull();
  });

  it("clamps values for 100+ trades", () => {
    const s = summarizeReputation({ ...base, trustScore: 140, totalTrades: 150, completedTrades: 120, successRate: 80 });
    expect(s.trustScore).toBe(100);
    expect(s.ringScore).toBe(5);
    expect(s.successRate).toBe(80);
  });

  it("sanitizes NaN scores for users with trades", () => {
    const s = summarizeReputation({ ...base, trustScore: NaN, totalTrades: 3, completedTrades: 2, successRate: NaN });
    expect(s.trustScore).toBe(0);
    expect(s.successRate).toBe(0);
  });
});
