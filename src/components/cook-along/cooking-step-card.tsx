"use client";

import React from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  Play,
  RotateCcw,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SensoryCueCard } from "./sensory-cue-card";
import { extractDurationMinutes } from "./cooking-timer";

export interface CookAlongStep {
  id: string;
  instruction: string;
  position: number;
  duration?: string | null;
  sensoryCue?: string | null;
  notes?: string | null;
  videoTimestampStart?: number | null;
  videoTimestampEnd?: number | null;
  evidence?: Array<{
    id: string;
    videoId: string;
    videoFilename: string;
    duration?: number | null;
    startTimestamp: number;
    endTimestamp?: number | null;
    evidenceFrames?: unknown;
    transcriptSegments?: unknown;
  }>;
}

interface CookingStepCardProps {
  step: CookAlongStep;
  stepIndex: number;
  totalSteps: number;
  isCompleted: boolean;
  onToggleComplete: () => Promise<void>;
  onPrevious: () => void;
  onNext: () => void;
  canPrevious: boolean;
  canNext: boolean;
  onOpenTimerWithMinutes?: (minutes: number) => void;
  onSeekVideo?: (seconds: number) => void;
  className?: string;
}

export function CookingStepCard({
  step,
  stepIndex,
  totalSteps,
  isCompleted,
  onToggleComplete,
  onPrevious,
  onNext,
  canPrevious,
  canNext,
  onOpenTimerWithMinutes,
  onSeekVideo,
  className = "",
}: CookingStepCardProps) {
  const parsedDuration = extractDurationMinutes(step.duration);
  const hasEvidence = step.evidence && step.evidence.length > 0;
  const firstEvidence = hasEvidence ? step.evidence![0] : null;

  return (
    <div
      className={`bg-white rounded-3xl border border-warm-200/80 shadow-sm p-6 sm:p-8 flex flex-col justify-between transition-all ${className}`}
    >
      <div>
        {/* Step Header */}
        <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-warm-100 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-terracotta-700 uppercase tracking-widest bg-terracotta-50 px-2.5 py-1 rounded-lg border border-terracotta-100">
              Step {stepIndex + 1} of {totalSteps}
            </span>

            {isCompleted ? (
              <Badge variant="sage" size="sm">
                <Check className="w-3 h-3 mr-1 text-emerald-600" />
                Completed
              </Badge>
            ) : (
              <Badge variant="warm" size="sm">
                In Progress
              </Badge>
            )}
          </div>

          {step.duration && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-warm-600 flex items-center gap-1 bg-warm-50 px-2.5 py-1 rounded-lg border border-warm-200">
                <Clock className="w-3.5 h-3.5 text-warm-500" />
                {step.duration}
              </span>
              {parsedDuration && onOpenTimerWithMinutes && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onOpenTimerWithMinutes(parsedDuration)}
                  className="text-xs"
                >
                  Start {parsedDuration}m Timer
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Main Instruction Text */}
        <div className="my-5">
          <p className="font-serif text-xl sm:text-2xl text-warm-900 leading-relaxed font-normal">
            {step.instruction}
          </p>
        </div>

        {/* Sensory Cue Card if present */}
        {step.sensoryCue && (
          <div className="my-5">
            <SensoryCueCard cue={step.sensoryCue} notes={step.notes} />
          </div>
        )}

        {/* Video Moment Jump Shortcut if present */}
        {firstEvidence && onSeekVideo && (
          <div className="mt-4 p-3 rounded-2xl bg-warm-50 border border-warm-200/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-warm-700">
              <Sparkles className="w-4 h-4 text-terracotta-600 shrink-0" />
              <span>
                Demonstrated in original video at{" "}
                <strong className="font-mono text-warm-900">
                  {Math.floor(firstEvidence.startTimestamp / 60)}:
                  {String(Math.floor(firstEvidence.startTimestamp % 60)).padStart(2, "0")}
                </strong>
              </span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onSeekVideo(firstEvidence.startTimestamp)}
              leftIcon={<Play className="w-3 h-3 fill-terracotta-600 text-terracotta-600" />}
            >
              Watch
            </Button>
          </div>
        )}
      </div>

      {/* Footer Navigation & Completion Buttons */}
      <div className="mt-8 pt-6 border-t border-warm-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Toggle Step Completion Button */}
        <Button
          variant={isCompleted ? "secondary" : "primary"}
          size="lg"
          onClick={onToggleComplete}
          leftIcon={
            isCompleted ? (
              <RotateCcw className="w-4 h-4 text-warm-600" />
            ) : (
              <CheckCircle2 className="w-5 h-5 fill-white text-terracotta-600" />
            )
          }
          className="order-2 sm:order-1 font-semibold"
        >
          {isCompleted ? "Mark Incomplete" : "Mark Step Complete"}
        </Button>

        {/* Step Forward / Backward Navigation */}
        <div className="flex items-center gap-2 order-1 sm:order-2">
          <Button
            variant="secondary"
            size="md"
            onClick={onPrevious}
            disabled={!canPrevious}
            leftIcon={<ChevronLeft className="w-4 h-4" />}
          >
            Previous
          </Button>

          <Button
            variant="secondary"
            size="md"
            onClick={onNext}
            disabled={!canNext}
            rightIcon={<ChevronRight className="w-4 h-4" />}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
