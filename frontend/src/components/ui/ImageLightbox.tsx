"use client";

import { useEffect, useState } from "react";

const ZOOM_STEP = 0.25;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;

interface ImageLightboxProps {
  src: string;
  alt: string;
  onClose: () => void;
}

/** Full-screen image viewer with zoom and rotation, closed by Escape or a backdrop click (#398). */
export function ImageLightbox({ src, alt, onClose }: ImageLightboxProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const controlClass =
    "rounded-md border border-white/20 px-3 py-1 text-sm text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Preview: ${alt}`}
      className="fixed inset-0 z-50 flex flex-col bg-black/90"
      onClick={onClose}
    >
      <div
        className="flex items-center justify-center gap-2 p-3"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className={controlClass} aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP))}>
          −
        </button>
        <button type="button" className={controlClass} aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP))}>
          +
        </button>
        <button type="button" className={controlClass} aria-label="Rotate" onClick={() => setRotation((r) => (r + 90) % 360)}>
          Rotate
        </button>
        <button type="button" className={controlClass} onClick={onClose}>
          Close
        </button>
      </div>
      <div className="flex flex-1 items-center justify-center overflow-auto p-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- IPFS and Pinata URLs are not known at build time */}
        <img
          src={src}
          alt={alt}
          className="max-h-full max-w-full transition-transform"
          style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
          onClick={(event) => event.stopPropagation()}
        />
      </div>
    </div>
  );
}
