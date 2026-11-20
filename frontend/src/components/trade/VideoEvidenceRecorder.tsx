'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

const VideoRecorderCore = dynamic(
  () => import('./VideoRecorderCore').then((mod) => mod.VideoRecorderCore),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8"
        role="status"
        aria-live="polite"
      >
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
        <p className="text-sm text-gray-500">Loading media module…</p>
      </div>
    ),
  }
);

interface VideoEvidenceRecorderProps {
  onRecorded?: (blob: Blob) => void;
  maxDurationSeconds?: number;
}

export function VideoEvidenceRecorder({
  onRecorded,
  maxDurationSeconds = 60,
}: VideoEvidenceRecorderProps) {
  const [isActive, setIsActive] = useState(false);

  if (!isActive) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-gray-200 p-6">
        <p className="text-sm text-gray-600">
          Record a short video to attach as dispute evidence.
        </p>
        <button
          type="button"
          onClick={() => setIsActive(true)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Start recording
        </button>
      </div>
    );
  }

  return (
    <VideoRecorderCore
      onRecorded={onRecorded}
      maxDurationSeconds={maxDurationSeconds}
    />
  );
}
