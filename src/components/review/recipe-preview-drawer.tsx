"use client";

import React from "react";
import { X, Sparkles, Play, ShieldCheck, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReviewedEventData } from "./event-card";
import { ReviewedIngredientData } from "./ingredient-section";

interface RecipePreviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  cookName: string;
  kitchenName: string;
  notes?: string | null;
  cookVerified: boolean;
  cookVerifiedBy?: string | null;
  events: ReviewedEventData[];
  ingredients: ReviewedIngredientData[];
  onSeek: (seconds: number) => void;
}

export function RecipePreviewDrawer({
  isOpen,
  onClose,
  title,
  cookName,
  kitchenName,
  notes,
  cookVerified,
  cookVerifiedBy,
  events,
  ingredients,
  onSeek,
}: RecipePreviewDrawerProps) {
  if (!isOpen) return null;

  const validEvents = events.filter(
    (e) => e.status === "ACCEPTED" || e.status === "EDITED"
  );

  const formatTimestamp = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-warm-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-2xl bg-[#FFFDF9] rounded-3xl shadow-2xl border border-warm-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-linear-to-b from-warm-100/60 to-warm-50/20 border-b border-warm-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-terracotta-700">
            <Heart className="w-4 h-4 fill-current" />
            <span className="font-serif text-xs uppercase tracking-widest font-semibold">
              Family Recipe Heirloom Preview
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-warm-200/60 text-warm-500 hover:text-warm-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content (Heirloom Card Style) */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
          <div className="text-center space-y-2 border-b border-warm-200/80 pb-6">
            <h2 className="font-serif text-2xl sm:text-3xl text-warm-900 font-medium tracking-tight">
              {title}
            </h2>
            <div className="text-xs text-warm-600 flex items-center justify-center gap-3">
              <span>Prepared by <strong>{cookName}</strong></span>
              <span>•</span>
              <span>{kitchenName}</span>
              {cookVerified && (
                <>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified by {cookVerifiedBy || "Cook"}
                  </span>
                </>
              )}
            </div>
            {notes && (
              <p className="text-xs sm:text-sm text-warm-700 italic max-w-lg mx-auto pt-2 font-serif">
                &ldquo;{notes}&rdquo;
              </p>
            )}
          </div>

          {/* Ingredients Section */}
          <div className="space-y-3">
            <h3 className="font-serif text-lg text-warm-900 font-medium">
              Ingredients
            </h3>
            {ingredients.length === 0 ? (
              <p className="text-xs text-warm-500 italic">No ingredients added yet.</p>
            ) : (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {ingredients.map((ing) => (
                  <li
                    key={ing.id}
                    className="p-2.5 rounded-xl bg-warm-100/50 border border-warm-200/60 flex items-start justify-between gap-2"
                  >
                    <span className="font-medium text-warm-900">{ing.name}</span>
                    <span className="text-terracotta-700 font-semibold text-right">
                      {ing.isUnknownQuantity
                        ? "To taste"
                        : ing.quantity || "As needed"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Steps Section */}
          <div className="space-y-4 pt-2">
            <h3 className="font-serif text-lg text-warm-900 font-medium">
              Cooking Instructions & Video Moments
            </h3>
            {validEvents.length === 0 ? (
              <p className="text-xs text-warm-500 italic">
                No steps accepted yet. Accept or edit candidate steps to see them here.
              </p>
            ) : (
              <div className="space-y-4">
                {validEvents.map((step, idx) => (
                  <div
                    key={step.id}
                    className="p-4 rounded-2xl bg-white border border-warm-200/80 shadow-2xs space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-warm-200 text-warm-800 text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <h4 className="font-serif text-sm font-semibold text-warm-900">
                          {step.title}
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onSeek(step.startTimestamp);
                          onClose();
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-terracotta-700 hover:text-terracotta-900 bg-terracotta-50 px-2 py-0.5 rounded-md border border-terracotta-200"
                        title="Jump video to this step"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>{formatTimestamp(step.startTimestamp)}</span>
                      </button>
                    </div>

                    <p className="text-xs sm:text-sm text-warm-700 leading-relaxed font-sans pl-7">
                      {step.description}
                    </p>

                    {step.sensoryCue && (
                      <div className="ml-7 mt-2 p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold block text-[11px]">
                            Sensory Cue:
                          </span>
                          <span>{step.sensoryCue}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-warm-50 border-t border-warm-200/80 flex items-center justify-end">
          <Button variant="secondary" size="md" onClick={onClose}>
            Close Preview
          </Button>
        </div>
      </div>
    </div>
  );
}
