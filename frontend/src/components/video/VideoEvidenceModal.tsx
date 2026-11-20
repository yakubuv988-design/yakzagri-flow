'use client';

import { useEffect, useRef } from 'react';
import { trapFocus } from '@/lib/a11y/focusTrap';

export interface VideoEvidenceModalProps {
  open: boolean;
  onClose: () => void;
  src: string;
  title?: string;
}

export function VideoEvidenceModal({
  open,
  onClose,
  src,
  title = 'Video evidence',
}: VideoEvidenceModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open || !dialogRef.current) return;

    const release = trapFocus(dialogRef.current, {
      initialFocus: closeButtonRef.current,
      onEscape: onClose,
    });

    return release;
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-3xl rounded-lg bg-white p-4 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close video evidence"
            className="rounded p-1 text-gray-600 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <video
          src={src}
          controls
          className="w-full rounded"
          aria-label={title}
        />
      </div>
    </div>
  );
}
