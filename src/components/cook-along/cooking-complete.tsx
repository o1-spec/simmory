"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, Clock, RotateCcw, ArrowLeft, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CookingCompleteProps {
  recipeId: string;
  recipeTitle: string;
  cookName: string;
  story?: string | null;
  totalSteps: number;
  completedStepsCount: number;
  elapsedSeconds?: number;
  onCookAgain: () => Promise<void>;
  isRestarting?: boolean;
}

export function CookingComplete({
  recipeId,
  recipeTitle,
  cookName,
  story,
  totalSteps,
  completedStepsCount,
  elapsedSeconds = 0,
  onCookAgain,
  isRestarting = false,
}: CookingCompleteProps) {
  const formatTime = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    if (hours > 0) {
      return `${hours} hr ${mins} min`;
    }
    return `${mins} min`;
  };

  return (
    <div className="max-w-2xl mx-auto w-full py-12 px-4 sm:px-6 text-center animate-in fade-in duration-300">
      {/* Icon Badge */}
      <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-6 shadow-sm ring-8 ring-emerald-50">
        <CheckCircle2 className="w-10 h-10 fill-emerald-600 text-white" />
      </div>

      <span className="text-xs font-mono uppercase tracking-widest text-emerald-700 font-semibold block mb-2">
        Cooking Session Complete
      </span>

      <h1 className="font-serif text-3xl sm:text-4xl text-warm-900 font-medium tracking-tight mb-3">
        {recipeTitle}
      </h1>

      <p className="text-sm text-warm-600 max-w-md mx-auto leading-relaxed mb-8">
        You successfully followed the steps preserved from the cooking of{" "}
        <strong className="text-warm-900 font-semibold">{cookName}</strong>.
      </p>

      {/* Metrics Card */}
      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-8">
        <div className="p-4 rounded-2xl bg-white border border-warm-200/80 shadow-sm flex flex-col items-center">
          <span className="text-xs text-warm-500 mb-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Steps Finished
          </span>
          <span className="font-mono text-2xl font-bold text-warm-900">
            {completedStepsCount} / {totalSteps}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-warm-200/80 shadow-sm flex flex-col items-center">
          <span className="text-xs text-warm-500 mb-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-terracotta-600" />
            Cooking Time
          </span>
          <span className="font-mono text-2xl font-bold text-warm-900">
            {formatTime(elapsedSeconds)}
          </span>
        </div>
      </div>

      {/* Preserved Family Story / Heritage Context Card */}
      {story && (
        <div className="max-w-lg mx-auto mb-8 p-5 rounded-2xl bg-warm-50 border border-warm-200 text-left">
          <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-warm-800">
            <Heart className="w-3.5 h-3.5 text-terracotta-500 fill-terracotta-500" />
            <span>Family Heritage Memory</span>
          </div>
          <p className="text-xs sm:text-sm text-warm-700 italic leading-relaxed">
            &ldquo;{story}&rdquo;
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
        <Link href={`/recipes/${recipeId}`} className="w-full sm:w-auto">
          <Button
            variant="primary"
            size="lg"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="w-full sm:w-auto font-medium"
          >
            Return to Recipe
          </Button>
        </Link>

        <Button
          variant="secondary"
          size="lg"
          onClick={onCookAgain}
          isLoading={isRestarting}
          leftIcon={<RotateCcw className="w-4 h-4" />}
          className="w-full sm:w-auto font-medium"
        >
          Cook Again (Fresh Session)
        </Button>
      </div>
    </div>
  );
}
