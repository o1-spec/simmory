"use client";

import React from "react";
import { Play, Film, Clock, BookOpen, Quote } from "lucide-react";
import { VideoPlayer } from "@/components/videos/video-player";
import { Button } from "@/components/ui/button";

export interface StepEvidenceInfo {
  id: string;
  videoId: string;
  videoFilename: string;
  duration?: number | null;
  startTimestamp: number;
  endTimestamp?: number | null;
  evidenceFrames?: unknown;
  transcriptSegments?: unknown;
}

interface CookingVideoPanelProps {
  currentStepPosition: number;
  stepInstruction: string;
  evidence?: StepEvidenceInfo | null;
  playbackUrl?: string | null;
  seekTime: number | null;
  onSeek: (seconds: number) => void;
  className?: string;
}

export function CookingVideoPanel({
  currentStepPosition,
  stepInstruction,
  evidence,
  playbackUrl,
  seekTime,
  onSeek,
  className = "",
}: CookingVideoPanelProps) {
  const hasVideoEvidence = !!evidence && !!playbackUrl;

  const formatTimestamp = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${String(mins).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div
      className={`flex flex-col bg-warm-900 rounded-3xl overflow-hidden shadow-xl border border-warm-800 text-white ${className}`}
    >
      {/* Video Stream Area or Honest No-Video Fallback */}
      <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
        {hasVideoEvidence ? (
          <VideoPlayer
            src={playbackUrl!}
            title={evidence.videoFilename}
            seekTime={seekTime}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center max-w-sm">
            <div className="w-12 h-12 rounded-2xl bg-warm-800/80 text-warm-300 flex items-center justify-center mb-3">
              <BookOpen className="w-6 h-6 text-terracotta-400" />
            </div>
            <h4 className="font-serif text-base text-warm-100 font-medium mb-1">
              Handwritten Family Recipe
            </h4>
            <p className="text-xs text-warm-400 leading-relaxed">
              No synchronized video recording is attached to this step. Follow the verified written instructions and sensory cues on the right.
            </p>
          </div>
        )}
      </div>

      {/* Video Context Footer */}
      <div className="p-4 sm:p-5 bg-warm-900/90 border-t border-warm-800/80 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Film className="w-4 h-4 text-terracotta-400 shrink-0" />
            <span className="text-xs font-semibold text-warm-200 truncate">
              {evidence ? evidence.videoFilename : "Audio & Video Demonstration"}
            </span>
          </div>

          {evidence && hasVideoEvidence && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-terracotta-300 bg-warm-800/90 px-2.5 py-1 rounded-lg border border-warm-700">
                {formatTimestamp(evidence.startTimestamp)}
                {evidence.endTimestamp ? ` – ${formatTimestamp(evidence.endTimestamp)}` : ""}
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onSeek(evidence.startTimestamp)}
                leftIcon={<Play className="w-3.5 h-3.5 fill-white" />}
                className="shadow-sm"
              >
                Watch Moment
              </Button>
            </div>
          )}
        </div>

        {/* Evidence Quote / Spoken Transcript snippet if present */}
        {evidence && Array.isArray(evidence.transcriptSegments) && evidence.transcriptSegments.length > 0 ? (
          <div className="p-2.5 rounded-xl bg-warm-800/60 border border-warm-700/60 text-xs text-warm-300 flex items-start gap-2">
            <Quote className="w-3.5 h-3.5 text-terracotta-400 mt-0.5 shrink-0" />
            <p className="italic leading-normal">
              &ldquo;
              {evidence.transcriptSegments
                .map((seg: unknown) =>
                  typeof seg === "object" && seg !== null && "text" in seg
                    ? String((seg as { text: string }).text)
                    : ""
                )
                .join(" ")
                .trim()}
              &rdquo;
            </p>
          </div>
        ) : evidence ? (
          <div className="flex items-center gap-2 text-[11px] text-warm-400">
            <Clock className="w-3 h-3 text-warm-400 shrink-0" />
            <span>
              Indexed to Step {currentStepPosition + 1}: &ldquo;{stepInstruction.slice(0, 48)}
              {stepInstruction.length > 48 ? "..." : ""}&rdquo;
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
