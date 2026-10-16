"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Utensils,
  Clock,
  Maximize2,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Check,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CookingStepCard, CookAlongStep } from "./cooking-step-card";
import { CookingVideoPanel, StepEvidenceInfo } from "./cooking-video-panel";
import { CookingProgress } from "./cooking-progress";
import { IngredientChecklist, CookAlongIngredient } from "./ingredient-checklist";
import { CookingTimer, extractDurationMinutes } from "./cooking-timer";
import { CookingFocusMode } from "./cooking-focus-mode";
import { CookingComplete } from "./cooking-complete";

export interface CookAlongRecipeData {
  id: string;
  kitchenId: string;
  kitchenName: string;
  title: string;
  description?: string | null;
  cookName: string;
  story?: string | null;
  origin?: string | null;
  notes?: string | null;
  status: string;
  cookVerified: boolean;
  cookVerifiedAt?: string | Date | null;
  cookVerifiedBy?: string | null;
  reviewedAt?: string | Date | null;
  ingredients: CookAlongIngredient[];
  steps: CookAlongStep[];
}

interface CookAlongWorkspaceProps {
  recipe: CookAlongRecipeData;
  initialSession: {
    id: string;
    recipeId: string;
    userId: string;
    kitchenId: string;
    status: string;
    currentStepId: string | null;
    currentStepPosition: number;
    startedAt: string | Date;
    version: number;
    sessionSteps: Array<{ stepId: string; completed: boolean }>;
    sessionIngredients: Array<{ ingredientId: string; checked: boolean }>;
  } | null;
  videoPlaybackUrls: Record<string, string | null>;
}

export function CookAlongWorkspace({
  recipe,
  initialSession,
  videoPlaybackUrls,
}: CookAlongWorkspaceProps) {
  // Active cooking session
  const [session, setSession] = useState(initialSession);
  const [currentStepIndex, setCurrentStepIndex] = useState(() => {
    if (initialSession && initialSession.currentStepPosition !== undefined) {
      return Math.min(
        Math.max(0, initialSession.currentStepPosition),
        Math.max(0, recipe.steps.length - 1)
      );
    }
    return 0;
  });

  // Track completed steps and checked ingredients
  const [completedStepIds, setCompletedStepIds] = useState<Set<string>>(() => {
    const set = new Set<string>();
    if (initialSession?.sessionSteps) {
      for (const s of initialSession.sessionSteps) {
        if (s.completed) set.add(s.stepId);
      }
    }
    return set;
  });

  const [checkedIngredientIds, setCheckedIngredientIds] = useState<Set<string>>(
    () => {
      const set = new Set<string>();
      if (initialSession?.sessionIngredients) {
        for (const i of initialSession.sessionIngredients) {
          if (i.checked) set.add(i.ingredientId);
        }
      }
      return set;
    }
  );

  // Video seeking state
  const [seekTime, setSeekTime] = useState<number | null>(null);

  // Panels and widgets
  const [isIngredientsOpen, setIsIngredientsOpen] = useState(false);
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(5);
  const [isFocusModeOpen, setIsFocusModeOpen] = useState(false);
  const [isCompletedScreen, setIsCompletedScreen] = useState(
    initialSession?.status === "COMPLETED"
  );
  const [completionSummary, setCompletionSummary] = useState<{
    elapsedSeconds: number;
    completedStepsCount: number;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"SAVED" | "SAVING" | "ERROR">("SAVED");

  // Ensure an active session exists; if not, create one automatically
  useEffect(() => {
    if (!session) {
      const initSession = async () => {
        try {
          setSaveStatus("SAVING");
          const res = await fetch("/api/cook-sessions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ recipeId: recipe.id }),
          });
          if (res.ok) {
            const data = await res.json();
            setSession(data.session);
            setSaveStatus("SAVED");
          } else {
            setSaveStatus("ERROR");
          }
        } catch {
          setSaveStatus("ERROR");
        }
      };

      initSession();
    }
  }, [session, recipe.id]);

  // Current active step
  const currentStep = recipe.steps[currentStepIndex] || null;
  const currentEvidence: StepEvidenceInfo | null =
    currentStep?.evidence && currentStep.evidence.length > 0
      ? currentStep.evidence[0]
      : null;
  const currentPlaybackUrl = currentEvidence?.videoId
    ? videoPlaybackUrls[currentEvidence.videoId] || null
    : null;

  // Persist step navigation change to session
  const persistStepChange = useCallback(
    async (newIndex: number) => {
      if (!session) return;
      const targetStep = recipe.steps[newIndex];
      try {
        setSaveStatus("SAVING");
        await fetch(`/api/cook-sessions/${session.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentStepId: targetStep?.id || null,
            currentStepPosition: newIndex,
          }),
        });
        setSaveStatus("SAVED");
      } catch {
        setSaveStatus("ERROR");
      }
    },
    [session, recipe.steps]
  );

  const handleSelectStep = (index: number) => {
    if (index >= 0 && index < recipe.steps.length) {
      setCurrentStepIndex(index);
      persistStepChange(index);
    }
  };

  const handlePreviousStep = useCallback(() => {
    if (currentStepIndex > 0) {
      const prev = currentStepIndex - 1;
      setCurrentStepIndex(prev);
      persistStepChange(prev);
    }
  }, [currentStepIndex, persistStepChange]);

  const handleNextStep = useCallback(() => {
    if (currentStepIndex < recipe.steps.length - 1) {
      const next = currentStepIndex + 1;
      setCurrentStepIndex(next);
      persistStepChange(next);
    }
  }, [currentStepIndex, recipe.steps.length, persistStepChange]);

  // Toggle step completion
  const handleToggleComplete = async () => {
    if (!currentStep || !session) return;

    const isCurrentlyCompleted = completedStepIds.has(currentStep.id);
    const newCompletedState = !isCurrentlyCompleted;

    // Optimistic UI update
    setCompletedStepIds((prev) => {
      const next = new Set(prev);
      if (newCompletedState) {
        next.add(currentStep.id);
      } else {
        next.delete(currentStep.id);
      }
      return next;
    });

    try {
      setSaveStatus("SAVING");
      const res = await fetch(
        `/api/cook-sessions/${session.id}/steps/${currentStep.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completed: newCompletedState }),
        }
      );
      if (!res.ok) {
        throw new Error("Failed to save step completion");
      }
      setSaveStatus("SAVED");
    } catch {
      // Rollback on failure
      setCompletedStepIds((prev) => {
        const rollback = new Set(prev);
        if (isCurrentlyCompleted) {
          rollback.add(currentStep.id);
        } else {
          rollback.delete(currentStep.id);
        }
        return rollback;
      });
      setSaveStatus("ERROR");
    }
  };

  // Toggle ingredient checklist item
  const handleToggleIngredient = async (
    ingredientId: string,
    checked: boolean
  ) => {
    if (!session) return;

    // Optimistic update
    setCheckedIngredientIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(ingredientId);
      } else {
        next.delete(ingredientId);
      }
      return next;
    });

    try {
      setSaveStatus("SAVING");
      const res = await fetch(
        `/api/cook-sessions/${session.id}/ingredients/${ingredientId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ checked }),
        }
      );
      if (!res.ok) {
        throw new Error("Failed to save ingredient checklist");
      }
      setSaveStatus("SAVED");
    } catch {
      // Rollback
      setCheckedIngredientIds((prev) => {
        const rollback = new Set(prev);
        if (!checked) {
          rollback.add(ingredientId);
        } else {
          rollback.delete(ingredientId);
        }
        return rollback;
      });
      setSaveStatus("ERROR");
    }
  };

  // Finish/Complete Cooking Session
  const handleCompleteSession = async () => {
    if (!session) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/cook-sessions/${session.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        throw new Error("Failed to complete cooking session");
      }
      const data = await res.json();
      setCompletionSummary({
        elapsedSeconds: data.summary.elapsedSeconds,
        completedStepsCount: data.summary.completedStepsCount,
      });
      setIsFocusModeOpen(false);
      setIsCompletedScreen(true);
    } catch {
      setSessionError("Failed to complete cooking session. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cook Again (Start fresh session)
  const handleCookAgain = async () => {
    setIsRestarting(true);
    try {
      const res = await fetch("/api/cook-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId: recipe.id, forceNew: true }),
      });
      if (res.ok) {
        const data = await res.json();
        setSession(data.session);
        setCurrentStepIndex(0);
        setCompletedStepIds(new Set());
        setCheckedIngredientIds(new Set());
        setIsCompletedScreen(false);
      }
    } catch {
      setSessionError("Failed to restart cooking session. Please try again.");
    } finally {
      setIsRestarting(false);
    }
  };

  // Video seeking trigger
  const handleSeekVideo = (seconds: number) => {
    setSeekTime(seconds);
    // Smooth scroll video into view on small screens
    if (window.innerWidth < 1024) {
      window.scrollTo({ top: 120, behavior: "smooth" });
    }
  };

  // Keyboard navigation (Arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePreviousStep();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNextStep();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePreviousStep, handleNextStep]);

  // If completed, render the celebratory CookingComplete screen
  if (isCompletedScreen) {
    return (
      <CookingComplete
        recipeId={recipe.id}
        recipeTitle={recipe.title}
        cookName={recipe.cookName}
        story={recipe.story}
        totalSteps={recipe.steps.length}
        completedStepsCount={
          completionSummary?.completedStepsCount ?? completedStepIds.size
        }
        elapsedSeconds={completionSummary?.elapsedSeconds ?? 0}
        onCookAgain={handleCookAgain}
        isRestarting={isRestarting}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6 animate-in fade-in duration-200">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-[#DDDCD3]">
        <div className="flex items-center gap-3">
          <Link
            href={`/recipes/${recipe.id}`}
            className="p-2 rounded-xl bg-[#FAF9F5] border border-[#DDDCD3] hover:bg-[#DDDCD3]/40 text-[#202723] transition-colors"
            title="Return to recipe details"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#2E4742] font-medium">
                Cook Along
              </span>
              <span className="text-[#DDDCD3]">•</span>
              <span className="text-xs text-[#202723]/60 font-medium">
                {recipe.kitchenName}
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl text-[#202723] font-bold leading-tight">
              {recipe.title}
            </h1>
          </div>
        </div>

        {/* Quick Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Autosave Indicator */}
          <div className="flex items-center gap-1.5 text-xs text-warm-500 px-2.5 py-1">
            {saveStatus === "SAVED" ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[11px]">Progress saved</span>
              </>
            ) : saveStatus === "SAVING" ? (
              <span className="text-[11px] text-terracotta-600 animate-pulse">
                Saving...
              </span>
            ) : (
              <span className="text-[11px] text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Save issue
              </span>
            )}
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsIngredientsOpen(true)}
            leftIcon={<Utensils className="w-3.5 h-3.5 text-warm-600" />}
          >
            Mise en Place ({checkedIngredientIds.size}/{recipe.ingredients.length})
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              const mins = extractDurationMinutes(currentStep?.duration);
              setTimerMinutes(mins || 5);
              setIsTimerOpen(true);
            }}
            leftIcon={<Clock className="w-3.5 h-3.5 text-warm-600" />}
          >
            Timer
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsFocusModeOpen(true)}
            leftIcon={<Maximize2 className="w-3.5 h-3.5 text-warm-600" />}
            title="Open distraction-free cooking focus mode"
          >
            Focus
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleCompleteSession}
            isLoading={isSubmitting}
            leftIcon={<CheckCircle2 className="w-3.5 h-3.5 fill-white text-terracotta-600" />}
          >
            Finish
          </Button>
        </div>
      </div>

      {/* Verification Attribution Banner */}
      <div className="mb-6 p-3 rounded-2xl bg-warm-50 border border-warm-200/80 flex items-center justify-between gap-3 text-xs text-warm-700 flex-wrap">
        <div className="flex items-center gap-2">
          {recipe.cookVerified ? (
            <Badge variant="sage" size="sm">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              Verified by {recipe.cookVerifiedBy || recipe.cookName}
            </Badge>
          ) : recipe.reviewedAt ? (
            <Badge variant="warm" size="sm">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-terracotta-600" />
              Human Reviewed
            </Badge>
          ) : (
            <Badge variant="outline" size="sm">
              Handwritten Family Recipe
            </Badge>
          )}

          <span className="text-warm-600">
            Guided by the preserved cooking of{" "}
            <strong className="text-warm-900 font-semibold">
              {recipe.cookName}
            </strong>
          </span>
        </div>

        {recipe.origin && (
          <span className="text-warm-500 font-mono text-[11px]">
            Origin: {recipe.origin}
          </span>
        )}
      </div>

      {sessionError && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-sm text-rose-800 flex items-center justify-between">
          <span>{sessionError}</span>
          <button
            onClick={() => setSessionError(null)}
            className="text-xs text-rose-600 hover:text-rose-900 underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Two-Panel Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Panel: Video Synchronization (Sticky on Desktop) */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-6">
          <CookingVideoPanel
            currentStepPosition={currentStepIndex}
            stepInstruction={currentStep?.instruction || ""}
            evidence={currentEvidence}
            playbackUrl={currentPlaybackUrl}
            seekTime={seekTime}
            onSeek={handleSeekVideo}
          />

          {/* Quick Active Timer Widget if opened */}
          {isTimerOpen && (
            <CookingTimer
              initialMinutes={timerMinutes}
              label={
                currentStep?.duration
                  ? `Timer for Step ${currentStepIndex + 1}`
                  : "Cooking Timer"
              }
              onClose={() => setIsTimerOpen(false)}
            />
          )}
        </div>

        {/* Right Panel: Step Guidance & Progress */}
        <div className="lg:col-span-7 space-y-6">
          {/* Progress Bar & Step Navigation Chips */}
          <CookingProgress
            steps={recipe.steps}
            currentStepIndex={currentStepIndex}
            completedStepIds={completedStepIds}
            onSelectStep={handleSelectStep}
          />

          {/* Current Step Card */}
          {currentStep ? (
            <CookingStepCard
              step={currentStep}
              stepIndex={currentStepIndex}
              totalSteps={recipe.steps.length}
              isCompleted={completedStepIds.has(currentStep.id)}
              onToggleComplete={handleToggleComplete}
              onPrevious={handlePreviousStep}
              onNext={handleNextStep}
              canPrevious={currentStepIndex > 0}
              canNext={currentStepIndex < recipe.steps.length - 1}
              onOpenTimerWithMinutes={(mins) => {
                setTimerMinutes(mins);
                setIsTimerOpen(true);
              }}
              onSeekVideo={handleSeekVideo}
            />
          ) : (
            <div className="p-8 text-center text-warm-500 bg-white rounded-3xl border border-warm-200">
              No steps defined for this recipe.
            </div>
          )}

          {/* Ingredient Checklist Drawer / Expandable Section */}
          {isIngredientsOpen && (
            <div className="animate-in fade-in duration-200">
              <IngredientChecklist
                ingredients={recipe.ingredients}
                checkedIngredientIds={checkedIngredientIds}
                onToggleIngredient={handleToggleIngredient}
                onClose={() => setIsIngredientsOpen(false)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Focus Mode Fullscreen Overlay */}
      {currentStep && (
        <CookingFocusMode
          isOpen={isFocusModeOpen}
          onClose={() => setIsFocusModeOpen(false)}
          recipeTitle={recipe.title}
          step={currentStep}
          stepIndex={currentStepIndex}
          totalSteps={recipe.steps.length}
          isCompleted={completedStepIds.has(currentStep.id)}
          onToggleComplete={handleToggleComplete}
          onPrevious={handlePreviousStep}
          onNext={handleNextStep}
          canPrevious={currentStepIndex > 0}
          canNext={currentStepIndex < recipe.steps.length - 1}
          onOpenIngredients={() => setIsIngredientsOpen(true)}
          onOpenTimer={(mins) => {
            setTimerMinutes(mins || 5);
            setIsTimerOpen(true);
          }}
          onSeekVideo={handleSeekVideo}
        />
      )}
    </div>
  );
}
