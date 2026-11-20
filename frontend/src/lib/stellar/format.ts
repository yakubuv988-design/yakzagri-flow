// 1 XLM or 1 USDC = 10_000_000 stroops on Stellar.
//
// These are the on-chain asset formatters. They now delegate grouping/decimal
// rendering to the shared i18n module (`@/lib/i18n`) instead of ad-hoc
// `toLocaleString("en-US")` calls. For fiat (NGN) amounts use `formatNaira`.
//
// The stroops-based helpers (`formatStroops`, `formatUsdc`, `formatXlm`) now
// accept `number | bigint | string` and use pure BigInt math internally so that
// large amounts (up to Int64 max) are never distorted by IEEE-754 division.

import { formatMoney, formatNumber } from "@/lib/i18n/format";
import { stroopsToAmount } from "./assets";

export { formatNaira, formatMoney, formatDate, formatDateTime } from "@/lib/i18n/format";

function fixedGrouped(value: number, decimals: number): string {
  return formatNumber(value, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format a stroops value as a grouped decimal string with `decimals` precision.
 *
 * Delegates to `stroopsToAmount` (pure BigInt) so there is no floating-point
 * drift for large values.
 */
export function formatStroops(stroops: number | bigint | string, decimals: number): string {
  return stroopsToAmount(stroops, decimals);
}

export function formatUsdc(stroops: number | bigint | string): string {
  return formatMoney(stroopsToAmount(stroops, 7), { currency: "USD", locale: "en-US" });
}

export function formatXlm(stroops: number | bigint | string): string {
  return `${stroopsToAmount(stroops, 7)} XLM`;
}

const XLM_MAX_DECIMALS = 7;
const XLM_MIN_DISPLAY_DECIMALS = 4;

/**
 * Format a human-readable XLM amount (not stroops) as a fixed-point string.
 *
 * Never emits scientific notation (e.g. `0.00001` stays `0.00001`, not `1e-5`).
 * Rounds to at most 7 decimals (Stellar precision), then trims trailing zeroes
 * but always keeps at least 4 decimals for a clean display.
 */
export function formatXlmAmount(amount: number | string): string {
  const value = typeof amount === "string" ? Number(amount.replace(/[,\s]/g, "")) : amount;
  if (!Number.isFinite(value)) return (0).toFixed(XLM_MIN_DISPLAY_DECIMALS);

  const fixed = value.toFixed(XLM_MAX_DECIMALS);
  const [whole, frac = ""] = fixed.split(".");
  let trimmed = frac;
  while (trimmed.length > XLM_MIN_DISPLAY_DECIMALS && trimmed.endsWith("0")) {
    trimmed = trimmed.slice(0, -1);
  }
  const result = `${whole}.${trimmed}`;
  // Avoid "-0.0000" for values that round to zero.
  return /^-0\.0+$/.test(result) ? result.slice(1) : result;
}
