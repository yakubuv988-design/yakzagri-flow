export const SOLVENCY_WARNING_DAYS = 30;
const DAYS_PER_MONTH = 30;

/** Days until `balance` is depleted at `monthlyRate`; Infinity if rate <= 0. */
export function estimateStreamLifespanDays(balance: number, monthlyRate: number): number {
  if (!Number.isFinite(balance) || !Number.isFinite(monthlyRate) || monthlyRate <= 0) {
    return Infinity;
  }
  return (Math.max(0, balance) / monthlyRate) * DAYS_PER_MONTH;
}

export function isStreamInsolventSoon(balance: number, monthlyRate: number): boolean {
  return estimateStreamLifespanDays(balance, monthlyRate) < SOLVENCY_WARNING_DAYS;
}
