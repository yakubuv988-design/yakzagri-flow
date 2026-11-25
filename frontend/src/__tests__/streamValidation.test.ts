import { createStreamStartTimeSchema } from "@/lib/validation/schemas";
import { estimateStreamLifespanDays, isStreamInsolventSoon } from "@/lib/streamSolvency";

describe("stream start time", () => {
  const now = 1_000_000;
  const schema = createStreamStartTimeSchema(() => now);
  it("rejects past, immediate and now+59", () => {
    expect(schema.safeParse(now - 1).success).toBe(false);
    expect(schema.safeParse(now).success).toBe(false);
    expect(schema.safeParse(now + 59).success).toBe(false);
  });
  it("accepts now+60 and later", () => {
    expect(schema.safeParse(now + 60).success).toBe(true);
    expect(schema.safeParse(now + 3600).success).toBe(true);
  });
});

describe("stream solvency", () => {
  it("computes lifespan", () => {
    expect(estimateStreamLifespanDays(100, 200)).toBe(15);
    expect(estimateStreamLifespanDays(100, 0)).toBe(Infinity);
  });
  it("flags <30 days", () => {
    expect(isStreamInsolventSoon(99, 100)).toBe(true);
    expect(isStreamInsolventSoon(100, 100)).toBe(false);
  });
});

import { compareManifest } from "@/lib/manifestComparison";
describe("compareManifest", () => {
  it("flags discrepancies", () => {
    const rows = compareManifest({ "Bag count": 500, Grade: "A" }, { "Bag count": 420, Grade: "A" });
    expect(rows.find((r) => r.field === "Bag count")?.discrepancy).toBe(true);
    expect(rows.find((r) => r.field === "Grade")?.discrepancy).toBe(false);
  });
});
