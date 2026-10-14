"use client";

import React from "react";
import { X, Sparkles, Play, ShieldCheck, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReviewedEventData } from "./event-card";
import { ReviewedIngredientData } from "./ingredient-section";

interface RecipePreviewSectionProps {
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

export function RecipePreviewSection({
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
}: RecipePreviewSectionProps) {
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
    <div className="w-full bg-[#FFFDF9] rounded-3xl shadow-sm border border-warm-200 overflow-hidden my-6 animate-in fade-in duration-200">
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
          className="p-1.5 rounded-full hover:bg-warm-200/60 text-warm-400 hover:text-warm-700 transition-colors"
          aria-label="Close preview"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-6 sm:p-8 space-y-8">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-warm-900 mb-2">
            {title}
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-xs text-warm-600">
            <span>Preserved by {cookName}</span>
            <span>&bull;</span>
            <span>{kitchenName}</span>
            {cookVerified && (
              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified by {cookVerifiedBy || cookName}
              </span>
            )}
          </div>
        </div>

        {ingredients.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-serif text-base font-semibold text-warm-900 border-b border-warm-200 pb-2">
              Ingredients & Measurements
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {ingredients.map((ing) => (
                <li
                  key={ing.id}
                  className="flex items-baseline justify-between p-2 rounded-lg bg-warm-50/50"
                >
                  <span className="font-medium text-warm-900">{ing.name}</span>
                  <span className="text-warm-500 font-serif italic text-right">
                    {ing.quantity}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="font-serif text-base font-semibold text-warm-900 border-b border-warm-200 pb-2">
            Preparation Steps ({validEvents.length})
          </h3>
          {validEvents.length === 0 ? (
            <p className="text-xs text-warm-500 italic">
              No accepted or edited steps yet. Review events below to populate this recipe.
            </p>
          ) : (
            <ol className="space-y-4">
              {validEvents.map((ev, index) => (
                <li
                  key={ev.id}
                  className="p-4 rounded-2xl bg-white border border-warm-200/80 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-terracotta-700 font-semibold">
                      Step {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => onSeek(ev.startTimestamp)}
                      className="inline-flex items-center gap-1 text-[11px] text-terracotta-600 hover:text-terracotta-800 font-medium"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      {formatTimestamp(ev.startTimestamp)}
                    </button>
                  </div>
                  <h4 className="font-semibold text-warm-900 text-sm">{ev.title}</h4>
                  <p className="text-warm-700 leading-relaxed">{ev.description}</p>
                  {ev.sensoryCue && (
                    <div className="flex items-start gap-1.5 p-2 rounded-xl bg-amber-50/70 text-amber-900 text-[11px]">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>{ev.sensoryCue}</span>
                    </div>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>

        {notes && (
          <div className="p-4 rounded-2xl bg-warm-50/80 border border-warm-200 text-xs space-y-1">
            <span className="font-semibold text-warm-900 block">Family Notes</span>
            <p className="text-warm-700 leading-relaxed">{notes}</p>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close Preview
          </Button>
        </div>
      </div>
    </div>
  );
}
