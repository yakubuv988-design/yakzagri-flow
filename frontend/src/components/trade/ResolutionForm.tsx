"use client";

import { useState } from "react";

export interface ResolutionFormProps {
  tradeId: string;
  totalAmount?: number;
  currency?: string;
  onSubmit?: (resolution: {
    sellerGetsBps: number;
    notes: string;
    splitRationale: string;
  }) => void;
  isSubmitting?: boolean;
}

/**
 * Structured resolution form for mediator decisions.
 * Includes split options, split rationale, and resolution notes.
 */
export function ResolutionForm({
  tradeId,
  totalAmount = 100000,
  currency = "NGN",
  onSubmit,
  isSubmitting = false,
}: ResolutionFormProps) {
  const [splitOption, setSplitOption] = useState<"50-50" | "30-70" | "70-30" | "custom">("50-50");
  const [customSplit, setCustomSplit] = useState<number>(50);
  const [splitRationale, setSplitRationale] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const splits: Record<string, { sellerBps: number; label: string }> = {
    "50-50": { sellerBps: 5000, label: "50/50 split" },
    "30-70": { sellerBps: 7000, label: "Buyer 30% / Seller 70%" },
    "70-30": { sellerBps: 3000, label: "Buyer 70% / Seller 30%" },
    custom: { sellerBps: customSplit * 100, label: `${100 - customSplit}% / ${customSplit}%` },
  };

  const sellerBps = splits[splitOption]?.sellerBps || splits["50-50"].sellerBps;
  const buyerBps = 10000 - sellerBps;
  const sellerAmount = (totalAmount * sellerBps) / 10000;
  const buyerAmount = (totalAmount * buyerBps) / 10000;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!splitRationale.trim()) {
      newErrors.splitRationale = "Please explain your split decision";
    }

    if (!resolutionNotes.trim()) {
      newErrors.resolutionNotes = "Please document your resolution";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onSubmit?.({
      sellerGetsBps: sellerBps,
      notes: resolutionNotes,
      splitRationale,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Split Selection */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-text-primary">
          Resolution Split
        </legend>
        <div className="space-y-2">
          {(["50-50", "30-70", "70-30"] as const).map((option) => (
            <label key={option} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="split"
                value={option}
                checked={splitOption === option}
                onChange={() => {
                  setSplitOption(option);
                  setErrors((prev) => ({ ...prev, split: "" }));
                }}
                className="w-4 h-4 accent-gold"
              />
              <span className="text-sm text-text-primary">
                {splits[option].label}
              </span>
            </label>
          ))}
          
          {/* Custom split option */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="split"
              value="custom"
              checked={splitOption === "custom"}
              onChange={() => {
                setSplitOption("custom");
                setErrors((prev) => ({ ...prev, split: "" }));
              }}
              className="w-4 h-4 accent-gold"
            />
            <span className="text-sm text-text-primary">Custom split</span>
          </label>

          {splitOption === "custom" && (
            <div className="ml-7 space-y-2">
              <label htmlFor="customSplit" className="text-xs text-text-secondary">
                Seller receives: {customSplit}% ({currency} {sellerAmount.toLocaleString("en-NG")})
              </label>
              <input
                id="customSplit"
                type="range"
                min="0"
                max="100"
                step="5"
                value={customSplit}
                onChange={(e) => setCustomSplit(parseInt(e.target.value))}
                className="w-full accent-gold"
              />
              <div className="flex gap-4 text-xs text-text-secondary">
                <span>Buyer: {100 - customSplit}%</span>
                <span>Seller: {customSplit}%</span>
              </div>
            </div>
          )}
        </div>
      </fieldset>

      {/* Split Summary */}
      <div className="border border-border-default rounded-lg bg-bg-elevated p-4 space-y-3">
        <p className="text-xs font-medium text-text-secondary uppercase">
          Proposed Distribution
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-text-muted">Buyer receives</p>
            <p className="text-sm font-semibold text-text-primary">
              {(buyerBps / 100).toFixed(2)}%
            </p>
            <p className="text-xs text-gold">
              {currency} {buyerAmount.toLocaleString("en-NG")}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Seller receives</p>
            <p className="text-sm font-semibold text-text-primary">
              {(sellerBps / 100).toFixed(2)}%
            </p>
            <p className="text-xs text-status-success">
              {currency} {sellerAmount.toLocaleString("en-NG")}
            </p>
          </div>
        </div>
      </div>

      {/* Split Rationale */}
      <div className="space-y-2">
        <label htmlFor="splitRationale" className="block text-sm font-medium text-text-primary">
          Why this split? <span className="text-status-danger">*</span>
        </label>
        <textarea
          id="splitRationale"
          value={splitRationale}
          onChange={(e) => {
            setSplitRationale(e.target.value);
            setErrors((prev) => ({ ...prev, splitRationale: "" }));
          }}
          placeholder="Explain your reasoning based on the evidence reviewed. Consider: condition of goods, evidence quality, driver responsibility, etc."
          rows={3}
          className="w-full px-3 py-2 border border-border-default rounded-lg bg-bg-input text-text-primary text-sm focus:outline-none focus:border-border-focus resize-none"
        />
        {errors.splitRationale && (
          <p className="text-xs text-status-danger" role="alert">
            {errors.splitRationale}
          </p>
        )}
      </div>

      {/* Resolution Notes */}
      <div className="space-y-2">
        <label htmlFor="resolutionNotes" className="block text-sm font-medium text-text-primary">
          Resolution Notes <span className="text-status-danger">*</span>
        </label>
        <textarea
          id="resolutionNotes"
          value={resolutionNotes}
          onChange={(e) => {
            setResolutionNotes(e.target.value);
            setErrors((prev) => ({ ...prev, resolutionNotes: "" }));
          }}
          placeholder="Document this resolution: what happened, what evidence was reviewed, and what the resolution means. This becomes part of the on-chain record."
          rows={4}
          className="w-full px-3 py-2 border border-border-default rounded-lg bg-bg-input text-text-primary text-sm focus:outline-none focus:border-border-focus resize-none"
        />
        {errors.resolutionNotes && (
          <p className="text-xs text-status-danger" role="alert">
            {errors.resolutionNotes}
          </p>
        )}
      </div>

      {/* Warning */}
      <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3">
        <p className="text-xs text-yellow-800">
          <span className="font-semibold">⚠️ Warning:</span> This resolution will be submitted on-chain and is irreversible. Your rationale and notes become permanent public record.
        </p>
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-12 rounded-lg bg-gradient-gold-cta text-text-inverse font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
      >
        {isSubmitting ? "Submitting Resolution..." : "Submit Resolution"}
      </button>
    </form>
  );
}
