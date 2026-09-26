"use client";

import { useEffect, useState } from "react";
import { useTrade } from "./TradeContext";

interface DraftBannerProps {
  onResume?: () => void;
  onDiscard?: () => void;
}

export function DraftBanner({ onResume, onDiscard }: DraftBannerProps) {
  const { data } = useTrade();
  const [hasDraft, setHasDraft] = useState(false);
  const [loadError, setLoadError] = useState<string>("");
  const [saveError, setSaveError] = useState<string>("");

  useEffect(() => {
    // Check if there's actually a draft with meaningful data
    const STORAGE_KEY = "amana:draft-trade";
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Only show banner if there's meaningful data beyond defaults
        const hasData =
          (parsed.data?.commodity && parsed.data.commodity.trim()) ||
          (parsed.data?.quantity && parsed.data.quantity.trim());
        setHasDraft(hasData || false);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setLoadError(`Failed to load draft: ${message}`);
    }
  }, []);

  // Monitor for save errors from TradeContext
  useEffect(() => {
    const checkForSaveErrors = () => {
      // In a real implementation, the TradeContext would expose save state
      // For now, we listen for storage events
    };
    
    const handleStorageError = (e: StorageEvent) => {
      if (e.key === "amana:draft-trade" && e.newValue === null && e.oldValue !== null) {
        setSaveError("Draft was cleared unexpectedly");
      }
    };

    window.addEventListener("storage", handleStorageError);
    return () => window.removeEventListener("storage", handleStorageError);
  }, []);

  const handleResume = () => {
    setLoadError("");
    setSaveError("");
    onResume?.();
  };

  const handleDiscard = () => {
    const STORAGE_KEY = "amana:draft-trade";
    try {
      localStorage.removeItem(STORAGE_KEY);
      setHasDraft(false);
      setLoadError("");
      setSaveError("");
      onDiscard?.();
    } catch (error) {
      setSaveError("Failed to discard draft");
    }
  };

  if (!hasDraft) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 top-0 z-40 bg-bg-card border-b border-border-default">
      <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Left: Message and icons */}
          <div className="flex items-start sm:items-center gap-3">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-gold mt-0.5 sm:mt-0"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">
                You have a draft trade in progress
              </p>
              <p className="text-xs text-text-secondary mt-1">
                Your trade details have been saved locally.{" "}
                {data?.commodity && `Commodity: ${data.commodity}`}
              </p>
              {loadError && (
                <p className="text-xs text-status-danger mt-2 flex items-center gap-1">
                  <span aria-hidden="true">⚠️</span>
                  {loadError}
                </p>
              )}
              {saveError && (
                <p className="text-xs text-status-danger mt-2 flex items-center gap-1">
                  <span aria-hidden="true">⚠️</span>
                  {saveError}
                </p>
              )}
            </div>
          </div>

          {/* Right: Action buttons */}
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={handleResume}
              className="flex-1 sm:flex-none px-4 py-2 bg-gradient-gold-cta text-text-inverse text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              aria-label="Resume draft trade"
            >
              Resume
            </button>
            <button
              onClick={handleDiscard}
              className="flex-1 sm:flex-none px-4 py-2 border border-border-default text-text-secondary text-sm font-medium rounded-lg hover:border-border-hover transition-colors disabled:opacity-50"
              aria-label="Discard draft trade"
            >
              Discard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
