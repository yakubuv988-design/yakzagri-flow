"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { StreamStartTimeSchema } from "@/lib/validation/schemas";
import { estimateStreamLifespanDays, isStreamInsolventSoon } from "@/lib/streamSolvency";

export function StreamSolvencyForm() {
  const { balance, asset } = useWallet();
  const [rate, setRate] = useState("");
  const [start, setStart] = useState("");

  const available = Number(balance ?? 0);
  const monthlyRate = Number(rate);
  const hasRate = rate !== "" && monthlyRate > 0;
  const lifespan = hasRate ? estimateStreamLifespanDays(available, monthlyRate) : null;

  const startError = useMemo(() => {
    if (!start) return null;
    const ts = Math.floor(new Date(start).getTime() / 1000);
    const result = StreamStartTimeSchema.safeParse(ts);
    return result.success ? null : result.error.issues[0].message;
  }, [start]);

  return (
    <div className="rounded-2xl border border-border-default bg-card p-5 space-y-4">
      <h2 className="text-sm font-semibold text-text-primary">Create stream</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs text-text-secondary">
          Monthly rate ({asset})
          <input
            type="number"
            min="0"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className="mt-1 w-full rounded-md border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-primary"
          />
        </label>
        <label className="text-xs text-text-secondary">
          Start time
          <input
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            aria-invalid={!!startError}
            aria-describedby={startError ? "stream-start-error" : undefined}
            className="mt-1 w-full rounded-md border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-primary"
          />
          {startError && (
            <span id="stream-start-error" role="alert" className="mt-1 block text-status-danger">
              {startError}
            </span>
          )}
        </label>
      </div>

      {lifespan !== null && (
        <p className="text-xs text-text-secondary">
          Estimated lifespan:{" "}
          {Number.isFinite(lifespan) ? `${lifespan.toFixed(1)} days` : "unlimited"} (balance {available} {asset})
        </p>
      )}

      {hasRate && isStreamInsolventSoon(available, monthlyRate) && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-status-danger bg-bg-elevated p-3 text-sm text-status-danger"
        >
          <span>
            Warning: this stream will deplete your funds in under 30 days. Deposit more collateral before creating it.
          </span>
          <Link href="/vault/manage" className="font-medium underline underline-offset-2">
            Deposit collateral
          </Link>
        </div>
      )}
    </div>
  );
}
