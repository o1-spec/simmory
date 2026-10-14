"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Sparkles,
  RefreshCw,
  Play,
  HelpCircle,
  AlertTriangle,
  Eye,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  VolumeX,
  Volume2,
  Film,
  Layers,
  BookOpen,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface AIAnalysisSummary {
  id: string;
  status: string;
  speechStatus: string;
  detectedLanguage?: string | null;
  whisperModel: string;
  visionModel: string;
  summary?: string | null;
  totalFrames: number;
  transcriptCount: number;
  observationCount: number;
  proposedEventCount: number;
  needsReview: boolean;
  completedAt?: string | null;
}

export interface ProposedEvent {
  id: string;
  position: number;
  title: string;
  description: string;
  evidenceFrames: string[];
  evidenceTranscripts?: string[];
  observedTimestamps: number[];
  uncertainties: string[];
  questionForCook?: string | null;
  verified: boolean;
}

export interface TranscriptSegment {
  id: string;
  start: number;
  end: number;
  text: string;
  language?: string | null;
  needsReview: boolean;
  position: number;
}

export interface VisualObservation {
  id: string;
  frameId: string;
  timestampSeconds: number;
  visibleObjects: string[];
  visibleAction?: string | null;
  foodAppearance?: string | null;
  uncertainDetails: string[];
}

export interface AiAnalysisCardProps {
  videoId: string;
  validationStatus: string;
  initialProcessingStatus: string;
  canModify: boolean;
  onSeekToTimestamp?: (seconds: number) => void;
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export function AiAnalysisCard({
  videoId,
  validationStatus,
  initialProcessingStatus,
  canModify,
  onSeekToTimestamp,
}: AiAnalysisCardProps) {
  const [aiStatus, setAiStatus] = useState(initialProcessingStatus);
  const [stage, setStage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [summary, setSummary] = useState<AIAnalysisSummary | null>(null);
  const [events, setEvents] = useState<ProposedEvent[]>([]);
  const [transcripts, setTranscripts] = useState<TranscriptSegment[]>([]);
  const [speechStatus, setSpeechStatus] = useState<string>("NO_USABLE_SPEECH");
  const [observations, setObservations] = useState<VisualObservation[]>([]);
  const [activeTab, setActiveTab] = useState<"timeline" | "observations" | "transcript">("timeline");

  const loadAnalysisData = useCallback(async () => {
    try {
      const [sumRes, evRes, trRes, obsRes] = await Promise.all([
        fetch(`/api/videos/${videoId}/analysis`),
        fetch(`/api/videos/${videoId}/analysis/events`),
        fetch(`/api/videos/${videoId}/analysis/transcript`),
        fetch(`/api/videos/${videoId}/analysis/observations`),
      ]);

      if (sumRes.ok) {
        const sumData = await sumRes.json();
        setSummary(sumData);
        setAiStatus(sumData.status);
      }
      if (evRes.ok) {
        const evData = await evRes.json();
        setEvents(evData.events || []);
      }
      if (trRes.ok) {
        const trData = await trRes.json();
        setTranscripts(trData.segments || []);
        setSpeechStatus(trData.speechStatus || "NO_USABLE_SPEECH");
      }
      if (obsRes.ok) {
        const obsData = await obsRes.json();
        setObservations(obsData.observations || []);
      }
    } catch (err) {
      console.warn("Failed to load analysis details:", err);
    }
  }, [videoId]);

  // Initial load
  useEffect(() => {
    let isCancelled = false;

    async function initialFetch() {
      try {
        const [sumRes, evRes, trRes, obsRes] = await Promise.all([
          fetch(`/api/videos/${videoId}/analysis`),
          fetch(`/api/videos/${videoId}/analysis/events`),
          fetch(`/api/videos/${videoId}/analysis/transcript`),
          fetch(`/api/videos/${videoId}/analysis/observations`),
        ]);

        if (isCancelled) return;

        if (sumRes.ok) {
          const sumData = await sumRes.json();
          if (!isCancelled) {
            setSummary(sumData);
            setAiStatus(sumData.status);
          }
        }
        if (evRes.ok) {
          const evData = await evRes.json();
          if (!isCancelled) setEvents(evData.events || []);
        }
        if (trRes.ok) {
          const trData = await trRes.json();
          if (!isCancelled) {
            setTranscripts(trData.segments || []);
            setSpeechStatus(trData.speechStatus || "NO_USABLE_SPEECH");
          }
        }
        if (obsRes.ok) {
          const obsData = await obsRes.json();
          if (!isCancelled) setObservations(obsData.observations || []);
        }
      } catch (err) {
        console.warn("Failed to load analysis details:", err);
      }
    }

    initialFetch();

    return () => {
      isCancelled = true;
    };
  }, [videoId]);


  // Status polling when AI job is in progress
  const pollStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/videos/${videoId}/processing`);
      if (!res.ok) return;
      const data = await res.json();

      if (data.video) {
        setAiStatus(data.video.processingStatus);
      }
      if (data.latestAiJob) {
        setStage(data.latestAiJob.stage);
        if (data.latestAiJob.errorMessage) {
          setErrorMsg(data.latestAiJob.errorMessage);
        }
      }

      if (data.video?.processingStatus === "COMPLETED") {
        await loadAnalysisData();
      }
    } catch (err) {
      console.warn("AI status polling error:", err);
    }
  }, [videoId, loadAnalysisData]);

  useEffect(() => {
    const isRunning = aiStatus === "QUEUED" || aiStatus === "PROCESSING";
    if (!isRunning) return;

    const timer = setInterval(() => {
      pollStatus();
    }, 3000);

    return () => clearInterval(timer);
  }, [aiStatus, pollStatus]);


  const handleStartAnalysis = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/videos/${videoId}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to trigger AI analysis");
      }

      setAiStatus("QUEUED");
      setStage("WAITING_FOR_DISPATCH");
      await pollStatus();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to start AI analysis");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isMediaValidated = validationStatus === "VALIDATED";
  const isCompleted = aiStatus === "COMPLETED";
  const isProcessing = aiStatus === "QUEUED" || aiStatus === "PROCESSING";
  const isFailed = aiStatus === "FAILED";

  return (
    <Card className="p-6 bg-white border-warm-200/80 shadow-xs space-y-6">
      {/* Header & Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-warm-100">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-terracotta-500" />
            <h3 className="font-serif text-lg text-warm-900 font-medium">
              AI Video Analysis & Recipe Reconstruction
            </h3>
          </div>
          <p className="text-xs text-warm-500 mt-1">
            Local multi-modal analysis using Faster-Whisper and Gemma 4 via Ollama.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isCompleted && (
            <Badge variant="sage" className="gap-1.5 py-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Provisional Reconstruction
            </Badge>
          )}

          {isProcessing && (
            <Badge variant="warm" className="gap-1.5 py-1 animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-terracotta-500" />
              {aiStatus === "PROCESSING" ? "Analyzing Video..." : "Queued in Outbox"}
            </Badge>
          )}

          {isFailed && (
            <Badge variant="terracotta" className="gap-1.5 py-1">
              <AlertCircle className="w-3.5 h-3.5" />
              Analysis Failed
            </Badge>
          )}

          {aiStatus === "NOT_STARTED" && (
            <Badge variant="outline" className="gap-1.5 py-1">
              <Clock className="w-3.5 h-3.5" />
              Ready for Analysis
            </Badge>
          )}

          <Badge variant="outline" className="text-[11px] text-warm-600 bg-warm-50">
            Whisper &bull; Gemma 4
          </Badge>
        </div>
      </div>

      {/* Action / Trigger Bar */}
      {!isCompleted && !isProcessing && (
        <div className="p-4 bg-warm-50/70 rounded-xl border border-warm-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-xs font-medium text-warm-900">
              Preserve tacit cooking techniques & visual cues
            </p>
            <p className="text-[11px] text-warm-500">
              {isMediaValidated
                ? "This recording has passed technical stream validation and can now be processed."
                : "Awaiting technical media validation before AI analysis can be started."}
            </p>
          </div>

          {canModify && (
            <Button
              onClick={handleStartAnalysis}
              disabled={!isMediaValidated || isSubmitting}
              className="gap-2 shrink-0 bg-terracotta-600 hover:bg-terracotta-700 text-white text-xs"
              size="sm"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isSubmitting ? "animate-spin" : ""}`} />
              {isFailed ? "Retry AI Analysis" : "Analyze Video with AI"}
            </Button>
          )}
        </div>
      )}

      {/* In-Progress Stage Card */}
      {isProcessing && (
        <div className="p-5 bg-warm-50 rounded-xl border border-warm-200/80 space-y-3">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 animate-spin text-terracotta-600 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-warm-900">
                AI Processing Pipeline Active
              </p>
              <p className="text-xs text-warm-600 mt-0.5 font-mono">
                Stage: <strong>{stage || "PREPARING_MEDIA"}</strong>
              </p>
            </div>
          </div>
          <p className="text-[11px] text-warm-500">
            Extracting audio track, analyzing video frames at ~10-second intervals, and synthesizing provisional cooking stages with Gemma 4.
          </p>
        </div>
      )}

      {/* Error Message */}
      {isFailed && errorMsg && (
        <div className="p-4 bg-terracotta-50/80 rounded-xl border border-terracotta-200 text-xs text-terracotta-800 space-y-1">
          <div className="flex items-center gap-1.5 font-medium">
            <AlertCircle className="w-4 h-4 text-terracotta-600 shrink-0" />
            Analysis failed
          </div>
          <p className="text-terracotta-700 pl-5">{errorMsg}</p>
        </div>
      )}

      {/* Completed Results View */}
      {isCompleted && (
        <div className="space-y-6">
          {/* Summary Metric Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-warm-50/70 rounded-xl border border-warm-100 text-xs">
              <span className="text-[11px] text-warm-400 block mb-0.5">Analyzed Frames</span>
              <span className="font-medium text-warm-900 flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-warm-500" />
                {summary?.totalFrames || observations.length} frames
              </span>
            </div>

            <div className="p-3 bg-warm-50/70 rounded-xl border border-warm-100 text-xs">
              <span className="text-[11px] text-warm-400 block mb-0.5">Proposed Events</span>
              <span className="font-medium text-warm-900 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-terracotta-500" />
                {events.length} stages
              </span>
            </div>

            <div className="p-3 bg-warm-50/70 rounded-xl border border-warm-100 text-xs">
              <span className="text-[11px] text-warm-400 block mb-0.5">Speech Recognition</span>
              <span className="font-medium text-warm-900 flex items-center gap-1.5">
                {speechStatus === "USABLE_SPEECH" ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-sage-600" />
                    Narrated ({transcripts.length} segments)
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-warm-500" />
                    No Speech Detected
                  </>
                )}
              </span>
            </div>

            <div className="p-3 bg-warm-50/70 rounded-xl border border-warm-100 text-xs">
              <span className="text-[11px] text-warm-400 block mb-0.5">Human Verification</span>
              <span className="font-medium text-terracotta-700 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-terracotta-500" />
                Ready for Review
              </span>
            </div>
          </div>

          {/* Review & Reconstruct Call to Action */}
          <div className="p-4 bg-terracotta-50/90 rounded-2xl border border-terracotta-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-terracotta-900 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-terracotta-600" />
                Human Review & Recipe Reconstruction Available
              </p>
              <p className="text-[11px] text-warm-700 font-sans leading-relaxed">
                Review candidate steps, confirm ingredients, add sensory cues, and preserve tacit cooking knowledge.
              </p>
            </div>
            <Link href={`/review/${videoId}`}>
              <Button size="sm" variant="primary" className="gap-1.5 shrink-0">
                <BookOpen className="w-3.5 h-3.5" />
                Review & Reconstruct Recipe
              </Button>
            </Link>
          </div>

          {/* Speech Status Banner (Crucial hallucination guardrail notice) */}
          {speechStatus !== "USABLE_SPEECH" && (
            <div className="p-3.5 bg-warm-100/70 rounded-xl border border-warm-200/80 flex items-start gap-2.5 text-xs text-warm-800">
              <VolumeX className="w-4 h-4 text-warm-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-warm-900">
                  No usable narration was detected. Simmory analyzed the visible cooking activity instead.
                </p>
                <p className="text-[11px] text-warm-600 mt-0.5">
                  Whisper detected silence or background sounds rather than intelligible spoken instructions. No spoken dialogue was fabricated.
                </p>
              </div>
            </div>
          )}

          {/* Review Notice */}
          <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/70 text-xs text-amber-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Provisional AI Recipe Reconstruction.</strong> These events are candidate cooking instructions grounded in video timestamps. Tacit techniques, ingredient quantities, and temperatures remain uncertain until human review in Phase 7.
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex border-b border-warm-200 gap-4 text-xs font-medium">
            <button
              onClick={() => setActiveTab("timeline")}
              className={`pb-2.5 flex items-center gap-1.5 transition-colors ${
                activeTab === "timeline"
                  ? "border-b-2 border-terracotta-600 text-terracotta-700 font-semibold"
                  : "text-warm-500 hover:text-warm-800"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Proposed Cooking Timeline ({events.length})
            </button>

            <button
              onClick={() => setActiveTab("observations")}
              className={`pb-2.5 flex items-center gap-1.5 transition-colors ${
                activeTab === "observations"
                  ? "border-b-2 border-terracotta-600 text-terracotta-700 font-semibold"
                  : "text-warm-500 hover:text-warm-800"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Visual Observations ({observations.length})
            </button>

            <button
              onClick={() => setActiveTab("transcript")}
              className={`pb-2.5 flex items-center gap-1.5 transition-colors ${
                activeTab === "transcript"
                  ? "border-b-2 border-terracotta-600 text-terracotta-700 font-semibold"
                  : "text-warm-500 hover:text-warm-800"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Speech Transcript ({transcripts.length})
            </button>
          </div>

          {/* Tab 1: Proposed Cooking Timeline */}
          {activeTab === "timeline" && (
            <div className="space-y-4">
              {events.length === 0 ? (
                <p className="text-xs text-warm-500 italic py-4">
                  No cooking events reconstructed yet.
                </p>
              ) : (
                events.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-4 bg-warm-50/50 rounded-xl border border-warm-200/80 space-y-3 transition-all hover:bg-warm-50/80"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-terracotta-100 text-terracotta-700 text-xs font-semibold flex items-center justify-center shrink-0">
                          {ev.position + 1}
                        </span>
                        <h4 className="font-serif text-sm font-medium text-warm-900">
                          {ev.title}
                        </h4>
                      </div>

                      {/* Evidence Timestamps (Clickable video seek triggers) */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] text-warm-400 mr-1">Video Moments:</span>
                        {ev.observedTimestamps.map((ts, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => onSeekToTimestamp?.(ts)}
                            title={`Jump video to ${formatTimestamp(ts)}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-warm-200 text-xs font-mono text-terracotta-600 hover:bg-terracotta-50 hover:border-terracotta-300 transition-colors cursor-pointer shadow-2xs"
                          >
                            <Play className="w-2.5 h-2.5 fill-current" />
                            {formatTimestamp(ts)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-warm-700 leading-relaxed">
                      {ev.description}
                    </p>

                    {/* Uncertainties & Clarification Question */}
                    <div className="pt-2 border-t border-warm-200/60 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {ev.uncertainties.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[11px] font-medium text-warm-500 uppercase tracking-wider block">
                            Uncertain Details
                          </span>
                          <ul className="list-disc list-inside text-warm-600 space-y-0.5">
                            {ev.uncertainties.map((u, i) => (
                              <li key={i}>{u}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {ev.questionForCook && (
                        <div className="p-2.5 bg-amber-50/50 rounded-lg border border-amber-200/60 space-y-0.5">
                          <span className="text-[11px] font-semibold text-amber-800 flex items-center gap-1">
                            <HelpCircle className="w-3 h-3 text-amber-600" />
                            Question for Family Cook
                          </span>
                          <p className="text-amber-900 italic">
                            &ldquo;{ev.questionForCook}&rdquo;
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 2: Visual Observations */}
          {activeTab === "observations" && (
            <div className="space-y-3">
              {observations.length === 0 ? (
                <p className="text-xs text-warm-500 italic py-4">
                  No visual observations extracted.
                </p>
              ) : (
                observations.map((obs) => (
                  <div
                    key={obs.id}
                    className="p-3 bg-warm-50/50 rounded-xl border border-warm-200/80 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-warm-500 font-medium">
                          {obs.frameId}
                        </span>
                        <button
                          type="button"
                          onClick={() => onSeekToTimestamp?.(obs.timestampSeconds)}
                          className="inline-flex items-center gap-1 text-[11px] text-terracotta-600 hover:underline font-mono"
                        >
                          <Play className="w-2.5 h-2.5 fill-current" />
                          {formatTimestamp(obs.timestampSeconds)} ({obs.timestampSeconds}s)
                        </button>
                      </div>

                      {obs.visibleObjects && obs.visibleObjects.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {obs.visibleObjects.map((obj, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 bg-white border border-warm-200 rounded text-[10px] text-warm-600"
                            >
                              {obj}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {obs.visibleAction && (
                      <p className="text-warm-800">
                        <strong>Action:</strong> {obs.visibleAction}
                      </p>
                    )}

                    {obs.foodAppearance && (
                      <p className="text-warm-700">
                        <strong>Appearance:</strong> {obs.foodAppearance}
                      </p>
                    )}

                    {obs.uncertainDetails && obs.uncertainDetails.length > 0 && (
                      <p className="text-warm-500 italic text-[11px]">
                        Uncertain: {obs.uncertainDetails.join(", ")}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 3: Speech Transcript */}
          {activeTab === "transcript" && (
            <div className="space-y-3">
              {speechStatus !== "USABLE_SPEECH" || transcripts.length === 0 ? (
                <div className="p-6 text-center text-warm-500 space-y-2">
                  <VolumeX className="w-8 h-8 mx-auto text-warm-400" />
                  <p className="text-xs">
                    No intelligible narration detected in this recording.
                  </p>
                  <p className="text-[11px] text-warm-400 max-w-sm mx-auto">
                    Simmory does not invent dialogue or fabricate verbal instructions when a cooking demonstration is silent.
                  </p>
                </div>
              ) : (
                transcripts.map((seg) => (
                  <div
                    key={seg.id}
                    className="p-3 bg-warm-50/50 rounded-xl border border-warm-200/80 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onSeekToTimestamp?.(seg.start)}
                          className="font-mono text-terracotta-600 hover:underline flex items-center gap-1"
                        >
                          <Play className="w-2.5 h-2.5 fill-current" />
                          {formatTimestamp(seg.start)} &ndash; {formatTimestamp(seg.end)}
                        </button>
                        {seg.needsReview && (
                          <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-300 bg-amber-50">
                            Low confidence
                          </Badge>
                        )}
                      </div>
                      <p className="text-warm-800 leading-relaxed">
                        &ldquo;{seg.text}&rdquo;
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
