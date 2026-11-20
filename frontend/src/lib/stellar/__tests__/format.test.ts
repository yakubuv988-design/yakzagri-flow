import { formatXlmAmount } from "../format";

describe("formatXlmAmount", () => {
  it("formats the smallest unit without scientific notation", () => {
    expect(formatXlmAmount(0.0000001)).toBe("0.0000001");
  });

  it("formats 0.0000100 without exponent and trims trailing zeroes", () => {
    expect(formatXlmAmount(0.00001)).toBe("0.00001");
    expect(formatXlmAmount("0.0000100")).toBe("0.00001");
  });

  it("keeps at least 4 decimals for regular amounts", () => {
    expect(formatXlmAmount(1000.5)).toBe("1000.5000");
    expect(formatXlmAmount(0)).toBe("0.0000");
  });

  it("rounds to 7 decimals and handles invalid input", () => {
    expect(formatXlmAmount(0.123456789)).toBe("0.1234568");
    expect(formatXlmAmount(NaN)).toBe("0.0000");
    expect(formatXlmAmount(-0.00000001)).toBe("0.0000");
  });
});
