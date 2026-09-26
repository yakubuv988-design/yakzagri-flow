"use client";

import { useState } from "react";

/**
 * Side-by-side evidence viewer for mediator resolution.
 * Displays buyer and driver evidence videos for dispute review.
 */
export interface EvidenceReviewerProps {
  buyerVideoUrl?: string | null;
  driverVideoUrl?: string | null;
  onBuyerVideoError?: () => void;
  onDriverVideoError?: () => void;
  buyerVideoLoadState?: "loading" | "ready" | "error";
  driverVideoLoadState?: "loading" | "ready" | "error";
}

export function EvidenceReviewer({
  buyerVideoUrl,
  driverVideoUrl,
  onBuyerVideoError,
  onDriverVideoError,
  buyerVideoLoadState = "loading",
  driverVideoLoadState = "loading",
}: EvidenceReviewerProps) {
  const [selectedEvidence, setSelectedEvidence] = useState<"both" | "buyer" | "driver">("both");

  const buyerReady = buyerVideoLoadState === "ready" && buyerVideoUrl;
  const driverReady = driverVideoLoadState === "ready" && driverVideoUrl;

  return (
    <div className="space-y-4">
      {/* Toggle for view mode */}
      <div className="flex gap-2 border-b border-border-default">
        <button
          onClick={() => setSelectedEvidence("both")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            selectedEvidence === "both"
              ? "text-text-primary border-b-2 border-gold -mb-[2px]"
              : "text-text-secondary hover:text-text-primary"
          }`}
          aria-pressed={selectedEvidence === "both"}
        >
          Side-by-Side
        </button>
        {buyerReady && (
          <button
            onClick={() => setSelectedEvidence("buyer")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              selectedEvidence === "buyer"
                ? "text-text-primary border-b-2 border-gold -mb-[2px]"
                : "text-text-secondary hover:text-text-primary"
            }`}
            aria-pressed={selectedEvidence === "buyer"}
          >
            Buyer Evidence Only
          </button>
        )}
        {driverReady && (
          <button
            onClick={() => setSelectedEvidence("driver")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              selectedEvidence === "driver"
                ? "text-text-primary border-b-2 border-gold -mb-[2px]"
                : "text-text-secondary hover:text-text-primary"
            }`}
            aria-pressed={selectedEvidence === "driver"}
          >
            Driver Evidence Only
          </button>
        )}
      </div>

      {/* Videos container */}
      <div
        className={`grid gap-4 ${
          selectedEvidence === "both"
            ? "grid-cols-1 lg:grid-cols-2"
            : "grid-cols-1"
        }`}
      >
        {/* Buyer Evidence */}
        {(selectedEvidence === "both" || selectedEvidence === "buyer") && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-text-primary">
              Buyer Evidence
            </h3>
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-card border border-border-default">
              {!buyerVideoUrl ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-bg-elevated">
                  <svg
                    className="w-8 h-8 text-text-muted"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-sm text-text-muted">No buyer video</p>
                </div>
              ) : buyerVideoLoadState === "loading" ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin w-6 h-6 border-2 border-gold border-t-transparent rounded-full" />
                    <span className="text-xs text-gray-300">Loading...</span>
                  </div>
                </div>
              ) : buyerVideoLoadState === "error" ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-bg-elevated">
                  <svg
                    className="w-8 h-8 text-status-danger"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 9v2m0 4v2m0 0H8m4 0h4m-13 8a9 9 0 1118 0 9 9 0 01-18 0z"
                    />
                  </svg>
                  <p className="text-xs text-text-muted">Failed to load</p>
                </div>
              ) : (
                <video
                  src={buyerVideoUrl}
                  controls
                  className="w-full h-full"
                  onError={onBuyerVideoError}
                />
              )}
            </div>
            <p className="text-xs text-text-muted">
              Buyer submitted evidence describing the loss/damage
            </p>
          </div>
        )}

        {/* Driver Evidence */}
        {(selectedEvidence === "both" || selectedEvidence === "driver") && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-text-primary">
              Driver Evidence
            </h3>
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-card border border-border-default">
              {!driverVideoUrl ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-bg-elevated">
                  <svg
                    className="w-8 h-8 text-text-muted"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-sm text-text-muted">No driver video</p>
                </div>
              ) : driverVideoLoadState === "loading" ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin w-6 h-6 border-2 border-gold border-t-transparent rounded-full" />
                    <span className="text-xs text-gray-300">Loading...</span>
                  </div>
                </div>
              ) : driverVideoLoadState === "error" ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-bg-elevated">
                  <svg
                    className="w-8 h-8 text-status-danger"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 9v2m0 4v2m0 0H8m4 0h4m-13 8a9 9 0 1118 0 9 9 0 01-18 0z"
                    />
                  </svg>
                  <p className="text-xs text-text-muted">Failed to load</p>
                </div>
              ) : (
                <video
                  src={driverVideoUrl}
                  controls
                  className="w-full h-full"
                  onError={onDriverVideoError}
                />
              )}
            </div>
            <p className="text-xs text-text-muted">
              Driver affirmed or disputed the loss claim
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
