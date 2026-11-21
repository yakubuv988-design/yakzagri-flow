"use client";

import { useEffect, useState } from "react";

const STORAGE_PREFIX = "mediator-scratchpad:";

// Storage can be blocked (private windows, disabled site data). Notes are a convenience,
// so failures fall back to an empty scratchpad rather than breaking the dispute page.
function readNotes(disputeId: string): string {
  try {
    return window.localStorage.getItem(STORAGE_PREFIX + disputeId) ?? "";
  } catch {
    return "";
  }
}

function writeNotes(disputeId: string, notes: string): void {
  try {
    if (notes) {
      window.localStorage.setItem(STORAGE_PREFIX + disputeId, notes);
    } else {
      window.localStorage.removeItem(STORAGE_PREFIX + disputeId);
    }
  } catch {
    // Ignored: the notes stay in memory for this visit.
  }
}

/** Private, collapsible notes for one dispute, saved in this browser only (#399). */
export function MediatorScratchpad({ disputeId }: { disputeId: string }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setNotes(readNotes(disputeId));
    setLoaded(true);
  }, [disputeId]);

  // Auto-save on every change, scoped to this dispute.
  useEffect(() => {
    if (loaded) writeNotes(disputeId, notes);
  }, [disputeId, notes, loaded]);

  function handleClear() {
    if (window.confirm("Clear your scratchpad notes for this dispute? This cannot be undone.")) {
      setNotes("");
    }
  }

  return (
    <section className="mx-6 mb-8 rounded-lg border border-border-default bg-bg-elevated">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-text-primary"
      >
        Mediator Scratchpad
        <span aria-hidden className="text-text-muted">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="space-y-3 border-t border-border-default p-4">
          <p className="text-xs text-text-muted">
            Private to you. Notes stay in this browser and are never published to the parties.
          </p>
          <textarea
            aria-label="Scratchpad notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={6}
            className="w-full rounded-md border border-border-default bg-surface-1 p-3 text-sm text-text-primary"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleClear}
              disabled={!notes}
              className="rounded-md border border-border-default px-3 py-1 text-xs text-text-secondary hover:text-text-primary disabled:opacity-40"
            >
              Clear notes
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
