"use client";

import React from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { CookAlongStep } from "./cooking-step-card";

interface CookingProgressProps {
  steps: CookAlongStep[];
  currentStepIndex: number;
  completedStepIds: Set<string>;
  onSelectStep: (index: number) => void;
  className?: string;
}

export function CookingProgress({
  steps,
  currentStepIndex,
  completedStepIds,
  onSelectStep,
  className = "",
}: CookingProgressProps) {
  const total = steps.length;
  const completedCount = steps.filter((s) => completedStepIds.has(s.id)).length;
  const progressPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Textual summary */}
      <div className="flex items-center justify-between text-xs text-warm-600 font-medium">
        <span>
          Step {currentStepIndex + 1} of {total}
        </span>
        <span>
          {completedCount} of {total} steps completed ({progressPercent}%)
        </span>
      </div>

      {/* Progress Line */}
      <div className="w-full bg-warm-200/80 h-2 rounded-full overflow-hidden">
        <div
          className="h-full bg-terracotta-500 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Interactive Step Pip Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1.5 scrollbar-thin">
        {steps.map((step, idx) => {
          const isCurrent = idx === currentStepIndex;
          const isCompleted = completedStepIds.has(step.id);

          return (
            <button
              key={step.id}
              onClick={() => onSelectStep(idx)}
              title={`Jump to Step ${idx + 1}`}
              aria-label={`Step ${idx + 1}: ${step.instruction.slice(0, 30)}`}
              className={`flex items-center justify-center h-8 px-2.5 rounded-lg text-xs font-mono font-medium transition-all shrink-0 ${
                isCurrent
                  ? "bg-terracotta-600 text-white shadow-sm ring-2 ring-terracotta-400/40"
                  : isCompleted
                    ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200/80"
                    : "bg-warm-100 text-warm-700 hover:bg-warm-200"
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-700" />
              ) : (
                <Circle className="w-2.5 h-2.5 mr-1 text-warm-400" />
              )}
              {idx + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
