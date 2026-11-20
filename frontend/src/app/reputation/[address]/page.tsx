"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, type ReputationResponse } from "@/lib/api";
import { t as translateCopy } from "@/lib/i18n";
import type { CooperativeAffiliation } from "@/lib/api/types";

function formatAccreditationDate(value?: string): string {
  if (!value) return translateCopy("ui.coop_not_specified");
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? translateCopy("ui.coop_not_specified")
    : date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

function CooperativeBadge({ cooperative }: { cooperative?: CooperativeAffiliation | null }) {
  if (!cooperative || !cooperative.name) {
    return (
      <span
        data-testid="cooperative-badge-independent"
        className="inline-flex items-center rounded-full border border-border-default px-3 py-1 text-xs text-text-secondary"
      >
        {translateCopy("ui.coop_independent")}
      </span>
    );
  }
  const tooltip = cooperative.verified
    ? `${translateCopy("ui.coop_verified_by")}: ${cooperative.verificationSource ?? translateCopy("ui.coop_not_specified")} · ${translateCopy("ui.coop_accredited_on")}: ${formatAccreditationDate(cooperative.accreditationDate)}`
    : translateCopy("ui.coop_unverified");
  return (
    <span
      data-testid="cooperative-badge"
      title={tooltip}
      className="inline-flex items-center gap-2 rounded-full border border-border-default bg-bg-card px-3 py-1 text-xs text-text-primary"
    >
      {cooperative.verified && (
        <svg
          role="img"
          aria-label={translateCopy("ui.coop_verified")}
          viewBox="0 0 20 20"
          className="h-4 w-4 text-status-success"
          fill="currentColor"
        >
          <path fillRule="evenodd" clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z" />
        </svg>
      )}
      <span className="font-medium">{cooperative.name}</span>
      {cooperative.registrationId && (
        <span className="font-mono text-text-muted">
          {translateCopy("ui.coop_registration_id")}: {cooperative.registrationId}
        </span>
      )}
    </span>
  );
}

export default function UserReputationPage() {
  const params = useParams<{ address: string }>();
  const address = params.address;
  const [data, setData] = useState<ReputationResponse | null>(null);
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
          <div className="mt-3">
            <CooperativeBadge cooperative={data.cooperative} />
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