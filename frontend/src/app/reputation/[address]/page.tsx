"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, type ReputationResponse } from "@/lib/api";
import { t as translateCopy } from "@/lib/i18n";

export default function UserReputationPage() {
  const params = useParams<{ address: string }>();
  const address = params.address;
  const [data, setData] = useState<ReputationResponse | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.reputation.getUserReputation(address)
      .then((response) => {
        if (!cancelled) setData(response);
      })
      .catch(() => {
        if (!cancelled) setError("Reputation details could not be loaded.");
      });
    return () => {
      cancelled = true;
    };
  }, [address]);

  return (
    <section className="mx-auto max-w-5xl space-y-6 px-6 py-8">
      <Link href="/reputation" className="text-sm text-text-secondary hover:text-text-primary">
        {translateCopy("ui.back_to_reputation")}
      </Link>
      <div>
        <h1 className="text-xl font-semibold text-text-primary">{translateCopy("ui.trader_reputation")}</h1>
        <p className="mt-1 break-all font-mono text-sm text-text-secondary">{address}</p>
        {data && (
          <div className="relative mt-3 inline-block">
            <button
              type="button"
              data-testid="endorsement-pill"
              aria-expanded={showInfo}
              aria-controls="endorsement-info"
              aria-describedby="endorsement-info"
              onClick={() => setShowInfo((v) => !v)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setShowInfo(false);
              }}
              className="rounded-full border border-border-default bg-bg-card px-3 py-1 text-xs font-medium text-text-primary"
            >
              {translateCopy("ui.endorsements_pill", { count: data.endorsementCount ?? 0 })}
            </button>
            <div
              id="endorsement-info"
              role="tooltip"
              hidden={!showInfo}
              className="absolute left-0 z-10 mt-2 w-64 rounded-lg border border-border-default bg-bg-card p-3 text-xs text-text-secondary shadow-lg"
            >
              <p className="font-semibold text-text-primary">{translateCopy("ui.endorsements_info_title")}</p>
              <p className="mt-1">{translateCopy("ui.endorsements_info_body")}</p>
            </div>
          </div>
        )}
      </div>
      {error ? (
        <p role="alert" className="rounded-lg border border-status-danger/40 px-4 py-3 text-sm text-status-danger">
          {error}
        </p>
      ) : data ? (
        <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            [translateCopy("ui.trust_score_2c7902e"), `${data.trustScore}%`],
            [translateCopy("ui.rep_total_trades"), data.totalTrades],
            [translateCopy("ui.completed"), data.completedTrades],
            [translateCopy("ui.disputed"), data.disputedTrades],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-border-default bg-bg-card p-4">
              <dt className="text-xs text-text-muted">{label}</dt>
              <dd className="mt-2 text-xl font-semibold text-text-primary">{value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p role="status" className="text-sm text-text-secondary">{translateCopy("ui.reputation_loading")}</p>
      )}
    </section>
  );
}