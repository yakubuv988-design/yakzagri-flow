"use client";

import { useRef, useState } from "react";
import { compareManifest, type ManifestFields } from "@/lib/manifestComparison";

interface Props {
  dispatch: ManifestFields | null;
  delivery: ManifestFields | null;
  dispatchImages?: string[];
  deliveryImages?: string[];
}

/** Two images sharing one zoom/pan state; scrolling one pans the other. */
function SyncedImage({ src, zoom, pan, onPan, alt }: {
  src: string; zoom: number; pan: { x: number; y: number };
  onPan: (p: { x: number; y: number }) => void; alt: string;
}) {
  const drag = useRef<{ x: number; y: number } | null>(null);
  return (
    <div
      className="aspect-video overflow-hidden rounded-md border border-border-default bg-black touch-none cursor-grab"
      onPointerDown={(e) => { drag.current = { x: e.clientX, y: e.clientY }; e.currentTarget.setPointerCapture(e.pointerId); }}
      onPointerMove={(e) => {
        if (!drag.current) return;
        onPan({ x: pan.x + e.clientX - drag.current.x, y: pan.y + e.clientY - drag.current.y });
        drag.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerUp={() => { drag.current = null; }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        draggable={false}
        className="h-full w-full object-contain select-none"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
      />
    </div>
  );
}

export function ManifestComparison({ dispatch, delivery, dispatchImages = [], deliveryImages = [] }: Props) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  if (!dispatch || !delivery) {
    return (
      <section aria-label="Manifest comparison" className="rounded-xl border border-border-default bg-card p-4 text-sm text-text-muted">
        Dispatch manifest or delivery report not available for comparison.
      </section>
    );
  }

  const rows = compareManifest(dispatch, delivery);
  const hasImages = dispatchImages.length > 0 || deliveryImages.length > 0;

  return (
    <section aria-label="Manifest comparison" className="rounded-xl border border-border-default bg-card p-4 space-y-4">
      <h2 className="text-sm font-semibold text-text-primary">Dispatch manifest vs delivery report</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {(["dispatched", "delivered"] as const).map((side) => (
          <div key={side}>
            <h3 className="mb-2 text-xs font-semibold uppercase text-text-muted">
              {side === "dispatched" ? "Seller dispatch" : "Buyer delivery"}
            </h3>
            <dl className="space-y-1 text-sm">
              {rows.map((r) => (
                <div
                  key={r.field}
                  className={`flex justify-between gap-3 rounded px-2 py-1 ${r.discrepancy ? "bg-status-danger/10 text-status-danger" : "text-text-secondary"}`}
                >
                  <dt>{r.field}</dt>
                  <dd className="font-medium">{r[side] ?? "—"}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      {hasImages && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <label htmlFor="cmp-zoom" className="text-text-secondary">Zoom</label>
            <input id="cmp-zoom" type="range" min={1} max={4} step={0.25} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} aria-label="Zoom both images" />
            <button type="button" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="rounded border border-border-default px-2 py-0.5">Reset</button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>{dispatchImages[0] && <SyncedImage src={dispatchImages[0]} zoom={zoom} pan={pan} onPan={setPan} alt="Dispatch evidence" />}</div>
            <div>{deliveryImages[0] && <SyncedImage src={deliveryImages[0]} zoom={zoom} pan={pan} onPan={setPan} alt="Delivery evidence" />}</div>
          </div>
        </div>
      )}
    </section>
  );
}
