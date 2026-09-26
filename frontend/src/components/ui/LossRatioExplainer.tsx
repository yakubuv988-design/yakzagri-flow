"use client";

import { useState } from "react";

export interface LossRatioExplainerProps {
  buyerRatio?: number;
  sellerRatio?: number;
  compact?: boolean;
  className?: string;
}

export function LossRatioExplainer({
  buyerRatio = 50,
  sellerRatio = 50,
  compact = false,
  className = "",
}: LossRatioExplainerProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);

  return (
    <div className={`rounded-lg border border-border-default bg-bg-elevated p-4 ${className}`}>
      {/* Header with toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left hover:opacity-70 transition-opacity"
        aria-expanded={isExpanded}
        aria-label="Toggle loss ratio explanation"
      >
        <h3 className="text-sm font-semibold text-text-primary">
          What is Loss Ratio?
        </h3>
        <svg
          className={`w-5 h-5 text-text-secondary transition-transform duration-200 ${
            isExpanded ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </button>

      {/* Expandable content */}
      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Plain language explanation */}
          <div className="space-y-2">
            <p className="text-sm text-text-secondary">
              The loss ratio defines how any loss or damage during delivery is shared between buyer and seller. It protects both parties by making the risk explicit.
            </p>
            <p className="text-sm text-text-secondary">
              For example, if goods worth ₦100,000 are lost in transit:
            </p>
          </div>

          {/* Visual diagram */}
          <div className="space-y-3">
            {/* Buyer's split */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-text-secondary">
                  Buyer absorbs loss
                </span>
                <span className="text-xs font-semibold text-text-primary">
                  {buyerRatio}%
                </span>
              </div>
              <div className="h-6 bg-bg-card rounded-full overflow-hidden border border-border-default">
                <div
                  className="h-full bg-gradient-to-r from-gold to-gold/70 flex items-center justify-center transition-all duration-300"
                  style={{ width: `${buyerRatio}%` }}
                  role="presentation"
                >
                  {buyerRatio > 20 && (
                    <span className="text-xs font-semibold text-text-inverse px-2 whitespace-nowrap">
                      ₦{(100000 * (buyerRatio / 100)).toLocaleString("en-NG")}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Seller's split */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-text-secondary">
                  Seller absorbs loss
                </span>
                <span className="text-xs font-semibold text-text-primary">
                  {sellerRatio}%
                </span>
              </div>
              <div className="h-6 bg-bg-card rounded-full overflow-hidden border border-border-default">
                <div
                  className="h-full bg-gradient-to-r from-status-success to-status-success/70 flex items-center justify-center transition-all duration-300"
                  style={{ width: `${sellerRatio}%` }}
                  role="presentation"
                >
                  {sellerRatio > 20 && (
                    <span className="text-xs font-semibold text-text-inverse px-2 whitespace-nowrap">
                      ₦{(100000 * (sellerRatio / 100)).toLocaleString("en-NG")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Example scenarios with proper contrast and non-color indicators */}
          <div className="space-y-2 border-t border-border-default pt-4">
            <p className="text-xs font-semibold text-text-primary">
              Common scenarios:
            </p>
            <ul className="space-y-2 text-xs text-text-secondary">
              <li className="flex gap-2">
                <span className="font-semibold min-w-fit">50/50 Split:</span>
                <span>Both parties share risk equally. Fair when both take precautions.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold min-w-fit">30/70 Split:</span>
                <span>Buyer bears more risk. Common when driver/seller is trusted.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold min-w-fit">70/30 Split:</span>
                <span>Seller bears more risk. Common for valuable/fragile goods.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold min-w-fit">100/0 Split:</span>
                <span>One party bears all risk. Only use with strong agreements.</span>
              </li>
            </ul>
          </div>

          {/* Accessibility note */}
          <div className="rounded bg-bg-card p-3 border border-border-default">
            <p className="text-xs text-text-muted">
              <span className="font-semibold">💡 Tip:</span> The loss ratio is locked into the smart contract and cannot be changed once the trade starts. Choose wisely based on trust and goods value.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
