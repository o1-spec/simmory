"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Film,
  Sparkles,
  Layers,
  Volume2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface VideoProcessingCardProps {
  videoId: string;
  initialValidationStatus: string;
  initialProcessingStatus: string;
  initialDuration?: number | null;
  initialVideoCodec?: string | null;
  initialAudioCodec?: string | null;
  initialWidth?: number | null;
  initialHeight?: number | null;
  initialFps?: number | null;
  initialError?: string | null;
  canModify: boolean;
  onStatusChange?: (status: string) => void;
}

export function VideoProcessingCard({
  videoId,
  initialValidationStatus,
  initialProcessingStatus,
  initialDuration,
  initialVideoCodec,
  initialAudioCodec,
  initialWidth,
  initialHeight,
  initialFps,
  initialError,
  canModify,
  onStatusChange,
}: VideoProcessingCardProps) {
  const [validationStatus, setValidationStatus] = useState(initialValidationStatus);
  const [stage, setStage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(initialError || null);
  const [metadata, setMetadata] = useState({
    duration: initialDuration,
    videoCodec: initialVideoCodec,
    audioCodec: initialAudioCodec,
    width: initialWidth,
    height: initialHeight,
    fps: initialFps,
  });
  const [isRetrying, setIsRetrying] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/videos/${videoId}/processing`);
      if (!res.ok) return;
      const data = await res.json();

      if (data.video) {
        setValidationStatus(data.video.validationStatus);
        onStatusChange?.(data.video.validationStatus);
        if (data.video.validationError) {
          setErrorMsg(data.video.validationError);
        }
        setMetadata({
          duration: data.video.duration,
          videoCodec: data.video.videoCodec,
          audioCodec: data.video.audioCodec,
          width: data.video.width,
          height: data.video.height,
          fps: data.video.fps,
        });
      }

      if (data.latestJob) {
        setStage(data.latestJob.stage);
        if (data.latestJob.errorMessage) {
          setErrorMsg(data.latestJob.errorMessage);
        }
      }
    } catch {
      // Polling network blip - retry on next cycle
    }
  }, [videoId]);

  // Polling effect: poll every 3s while active (QUEUED or VALIDATING)
  useEffect(() => {
    const isTerminal = validationStatus === "VALIDATED" || validationStatus === "FAILED";
    if (isTerminal) return;

    const timer = setInterval(() => {
      fetchStatus();
    }, 3000);

    return () => clearInterval(timer);
  }, [validationStatus, fetchStatus]);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      const res = await fetch(`/api/videos/${videoId}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        setValidationStatus("QUEUED");
        setStage("WAITING_FOR_DISPATCH");
        setErrorMsg(null);
        await fetchStatus();
      } else {
        setErrorMsg("Failed to retry validation. Please try again.");
      }
    } catch {
      setErrorMsg("Failed to retry validation due to network error.");
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Media Validation Card */}
      <Card className="p-6 bg-white border-warm-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-warm-100">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-warm-700" />
            <h3 className="font-serif text-base text-warm-900 font-medium">
              Technical Media Stream Validation
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {validationStatus === "VALIDATED" && (
              <Badge variant="sage" className="gap-1.5 py-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Validated Streams
              </Badge>
            )}

            {(validationStatus === "QUEUED" || validationStatus === "VALIDATING") && (
              <Badge variant="warm" className="gap-1.5 py-1 animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-terracotta-500" />
                {validationStatus === "VALIDATING" ? "Validating Video..." : "Queued in Worker"}
              </Badge>
            )}

            {validationStatus === "FAILED" && (
              <Badge variant="terracotta" className="gap-1.5 py-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Validation Failed
              </Badge>
            )}

            {validationStatus === "NOT_STARTED" && (
              <Badge variant="outline" className="gap-1.5 py-1">
                <Clock className="w-3.5 h-3.5" />
                Awaiting Upload
              </Badge>
            )}
          </div>
        </div>

        {/* Status description */}
        {validationStatus === "VALIDATED" && (
          <div className="space-y-4">
            <p className="text-xs text-warm-600">
              FFprobe independently confirmed a decodable video stream, container integrity, and timing metadata.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="p-3 bg-warm-50/70 rounded-xl border border-warm-100 text-xs">
                <span className="text-[11px] text-warm-400 block mb-0.5">Duration</span>
                <span className="font-medium text-warm-900">
                  {metadata.duration ? `${metadata.duration}s` : "Unknown"}
                </span>
              </div>

              <div className="p-3 bg-warm-50/70 rounded-xl border border-warm-100 text-xs">
                <span className="text-[11px] text-warm-400 block mb-0.5">Resolution</span>
                <span className="font-medium text-warm-900">
                  {metadata.width && metadata.height ? `${metadata.width}x${metadata.height}` : "Unknown"}
                </span>
              </div>

              <div className="p-3 bg-warm-50/70 rounded-xl border border-warm-100 text-xs">
                <span className="text-[11px] text-warm-400 block mb-0.5">Video Codec</span>
                <span className="font-medium text-warm-900">
                  {metadata.videoCodec ? metadata.videoCodec.toUpperCase() : "N/A"}
                </span>
              </div>

              <div className="p-3 bg-warm-50/70 rounded-xl border border-warm-100 text-xs">
                <span className="text-[11px] text-warm-400 block mb-0.5">Audio Track</span>
                <span className="font-medium text-warm-900 flex items-center gap-1">
                  <Volume2 className="w-3 h-3 text-warm-500" />
                  {metadata.audioCodec ? metadata.audioCodec.toUpperCase() : "None"}
                </span>
              </div>
            </div>
          </div>
        )}

        {(validationStatus === "QUEUED" || validationStatus === "VALIDATING") && (
          <div className="space-y-3 p-4 bg-warm-50/80 rounded-xl border border-warm-200/80">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-4 h-4 animate-spin text-terracotta-500" />
              <div>
                <p className="text-xs font-medium text-warm-900">
                  {validationStatus === "VALIDATING"
                    ? `Inspecting stream metadata (${stage || "DOWNLOADING"})...`
                    : `Queued in background outbox (${stage || "WAITING_FOR_DISPATCH"})...`}
                </p>
                <p className="text-[11px] text-warm-500">
                  Worker processes validation jobs asynchronously. Updates appear automatically.
                </p>
              </div>
            </div>
          </div>
        )}

        {validationStatus === "FAILED" && (
          <div className="space-y-3 p-4 bg-terracotta-50/70 rounded-xl border border-terracotta-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-terracotta-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-medium text-terracotta-900">
                  Video stream validation failed
                </p>
                <p className="text-xs text-terracotta-700 mt-1">
                  {errorMsg || "The media container was invalid, unreadable, or missing decodable video streams."}
                </p>
              </div>
            </div>

            {canModify && (
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="gap-1.5 text-xs text-terracotta-700 border-terracotta-300 hover:bg-terracotta-100"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? "animate-spin" : ""}`} />
                  {isRetrying ? "Submitting..." : "Retry Validation"}
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* 2. Separate AI Analysis Section (Phase 6 Reserved) */}
      <Card className="p-6 bg-warm-50/50 border-warm-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-warm-400" />
            <h3 className="font-serif text-sm text-warm-700 font-medium">
              AI Speech & Sensory Cue Reconstruction (Phase 6)
            </h3>
          </div>
          <Badge variant="outline" className="text-[11px]">
            Reserved: Phase 6
          </Badge>
        </div>

        <p className="text-xs text-warm-500 leading-relaxed">
          Audio transcription (Faster-Whisper) and visual cooking stage reasoning (Gemma 4) will be executed in a dedicated Python AI service in Phase 6. Validated media containers will be fed into the AI timeline queue once the inference cluster is connected.
        </p>

        <div className="flex items-center gap-2 text-[11px] text-warm-400 pt-1">
          <Layers className="w-3.5 h-3.5" />
          <span>Pipeline State: <strong>{initialProcessingStatus}</strong> (Isolated from media validation)</span>
        </div>
      </Card>
    </div>
  );
}
