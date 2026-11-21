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

/**
 * Format an XLM fee for display. Uses fixed 7-decimal precision so small values
 * never render as exponential notation (e.g. `1e-5`), keeps at least 4 decimals,
 * and trims trailing zeros beyond that (#417).
 */
export function formatFeeXlm(xlm: number): string {
  if (!Number.isFinite(xlm)) return "0.0000";
  const [whole, fraction] = xlm.toFixed(7).split(".");
  let trimmed = fraction;
  while (trimmed.length > 4 && trimmed.endsWith("0")) trimmed = trimmed.slice(0, -1);
  return `${whole}.${trimmed}`;
}
