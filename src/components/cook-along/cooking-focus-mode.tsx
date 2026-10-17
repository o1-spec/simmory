"use client";

import React from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  RotateCcw,
  Play,
  Clock,
  Utensils,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CookAlongStep } from "./cooking-step-card";
import { SensoryCueCard } from "./sensory-cue-card";
import { extractDurationMinutes } from "./cooking-timer";

interface CookingFocusModeProps {
  isOpen: boolean;
  onClose: () => void;
  recipeTitle: string;
  step: CookAlongStep;
  stepIndex: number;
  totalSteps: number;
  isCompleted: boolean;
  onToggleComplete: () => Promise<void>;
  onPrevious: () => void;
  onNext: () => void;
  canPrevious: boolean;
  canNext: boolean;
  onOpenIngredients: () => void;
  onOpenTimer: (minutes?: number) => void;
  onSeekVideo?: (seconds: number) => void;
}

export function CookingFocusMode({
  isOpen,
  onClose,
  recipeTitle,
  step,
  stepIndex,
  totalSteps,
  isCompleted,
  onToggleComplete,
  onPrevious,
  onNext,
  canPrevious,
  canNext,
  onOpenIngredients,
  onOpenTimer,
  onSeekVideo,
}: CookingFocusModeProps) {
  if (!isOpen) return null;

  const parsedDuration = extractDurationMinutes(step.duration);
  const firstEvidence = step.evidence && step.evidence.length > 0 ? step.evidence[0] : null;

  return (
    <div className="fixed inset-0 z-50 bg-warm-900/95 backdrop-blur-md flex flex-col justify-between text-white p-4 sm:p-8 overflow-y-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 max-w-4xl mx-auto w-full pb-4 border-b border-warm-800">
        <div>
          <span className="text-xs font-mono text-terracotta-400 uppercase tracking-widest block">
            Focus Mode — {recipeTitle}
          </span>
          <span className="text-sm font-semibold text-warm-200">
            Step {stepIndex + 1} of {totalSteps}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenIngredients}
            leftIcon={<Utensils className="w-4 h-4 text-warm-300" />}
            className="text-warm-300 hover:text-white hover:bg-warm-800"
          >
            Ingredients
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenTimer(parsedDuration || 5)}
            leftIcon={<Clock className="w-4 h-4 text-warm-300" />}
            className="text-warm-300 hover:text-white hover:bg-warm-800"
          >
            Timer
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            leftIcon={<X className="w-4 h-4" />}
            className="text-warm-300 hover:text-white hover:bg-warm-800"
          >
            Exit Focus
          </Button>
        </div>
      </div>

      {/* Main Focus Content Area */}
      <div className="max-w-3xl mx-auto w-full my-auto py-8 flex flex-col justify-center">
        {/* Step instruction in extra large, legible font */}
        <p className="font-serif text-3xl sm:text-5xl text-warm-50 leading-tight font-normal text-center sm:text-left mb-8">
          {step.instruction}
        </p>

        {/* Sensory cue highlight in dark theme */}
        {step.sensoryCue && (
          <div className="my-4">
            <SensoryCueCard
              cue={step.sensoryCue}
              notes={step.notes}
              className="bg-amber-950/40 border-amber-800/80 text-amber-200"
            />
          </div>
        )}

        {/* Video Moment Shortcut if evidence exists */}
        {firstEvidence && onSeekVideo && (
          <div className="mt-4 flex items-center justify-between p-4 rounded-2xl bg-warm-800/70 border border-warm-700">
            <div className="flex items-center gap-2 text-sm text-warm-300">
              <Sparkles className="w-4 h-4 text-terracotta-400" />
              <span>
                Demonstration at{" "}
                <strong className="font-mono text-terracotta-300">
                  {Math.floor(firstEvidence.startTimestamp / 60)}:
                  {String(Math.floor(firstEvidence.startTimestamp % 60)).padStart(2, "0")}
                </strong>
              </span>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onSeekVideo(firstEvidence.startTimestamp)}
              leftIcon={<Play className="w-3.5 h-3.5 fill-white" />}
            >
              Watch Video
            </Button>
          </div>
        )}
      </div>

      {/* Large Touch Navigation Controls at bottom */}
      <div className="max-w-3xl mx-auto w-full pt-4 sm:pt-6 border-t border-warm-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 pb-[max(env(safe-area-inset-bottom),0.5rem)]">
        <div className="flex items-center justify-between gap-3 sm:hidden">
          <Button
            variant="secondary"
            size="lg"
            onClick={onPrevious}
            disabled={!canPrevious}
            leftIcon={<ChevronLeft className="w-5 h-5" />}
            className="flex-1 h-12 text-sm bg-warm-800 hover:bg-warm-700 text-white border-warm-700 justify-center"
          >
            Previous
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={onNext}
            disabled={!canNext}
            rightIcon={<ChevronRight className="w-5 h-5" />}
            className="flex-1 h-12 text-sm bg-warm-800 hover:bg-warm-700 text-white border-warm-700 justify-center"
          >
            Next
          </Button>
        </div>

        <Button
          variant="secondary"
          size="lg"
          onClick={onPrevious}
          disabled={!canPrevious}
          leftIcon={<ChevronLeft className="w-6 h-6" />}
          className="hidden sm:inline-flex h-14 px-6 text-base bg-warm-800 hover:bg-warm-700 text-white border-warm-700"
        >
          Previous
        </Button>

        <Button
          variant={isCompleted ? "secondary" : "primary"}
          size="lg"
          onClick={onToggleComplete}
          leftIcon={
            isCompleted ? (
              <RotateCcw className="w-5 h-5 text-warm-300" />
            ) : (
              <CheckCircle2 className="w-6 h-6 fill-white text-terracotta-600" />
            )
          }
          className="h-13 sm:h-14 px-6 sm:px-8 text-sm sm:text-base font-bold shadow-lg justify-center w-full sm:w-auto"
        >
          {isCompleted ? "Completed (Tap to undo)" : "Mark Step Complete"}
        </Button>

        <Button
          variant="secondary"
          size="lg"
          onClick={onNext}
          disabled={!canNext}
          rightIcon={<ChevronRight className="w-6 h-6" />}
          className="hidden sm:inline-flex h-14 px-6 text-base bg-warm-800 hover:bg-warm-700 text-white border-warm-700"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
