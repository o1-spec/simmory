"use client";

import React, { useState } from "react";
import { BookOpen, AlertCircle, X, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RecipeConvertSectionProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTitle: string;
  defaultCookName: string;
  onConvert: (options: {
    mode: "CREATE_NEW" | "MERGE_EXISTING";
    targetRecipeId?: string;
    title?: string;
    cookName?: string;
    story?: string;
    origin?: string;
    notes?: string;
  }) => Promise<void>;
  existingRecipes?: Array<{ id: string; title: string }>;
}

export function RecipeConvertSection({
  isOpen,
  onClose,
  defaultTitle,
  defaultCookName,
  onConvert,
  existingRecipes = [],
}: RecipeConvertSectionProps) {
  const [mode, setMode] = useState<"CREATE_NEW" | "MERGE_EXISTING">("CREATE_NEW");
  const [targetRecipeId, setTargetRecipeId] = useState(
    existingRecipes[0]?.id || ""
  );
  const [title, setTitle] = useState(defaultTitle);
  const [cookName, setCookName] = useState(defaultCookName || "Family Cook");
  const [story, setStory] = useState("");
  const [origin, setOrigin] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await onConvert({
        mode,
        targetRecipeId: mode === "MERGE_EXISTING" ? targetRecipeId : undefined,
        title: title.trim() || defaultTitle,
        cookName: cookName.trim() || defaultCookName,
        story: story.trim() || undefined,
        origin: origin.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save recipe");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-warm-200/90 shadow-sm p-6 sm:p-8 space-y-6 my-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between pb-4 border-b border-warm-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-terracotta-500 text-white flex items-center justify-center shadow-xs">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-medium text-warm-900">
              Save Reconstructed Recipe
            </h3>
            <p className="text-xs text-warm-600">
              Turn reviewed events into permanent Family Kitchen recipe steps.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-warm-100 text-warm-400 hover:text-warm-700 transition-colors"
          aria-label="Close preservation form"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-warm-800 uppercase tracking-wider mb-2">
            Destination Recipe
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMode("CREATE_NEW")}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                mode === "CREATE_NEW"
                  ? "border-terracotta-500 bg-terracotta-50/50 ring-2 ring-terracotta-500/20"
                  : "border-warm-200 bg-white hover:bg-warm-50/50"
              }`}
            >
              <span className="block text-xs font-bold text-warm-900 mb-0.5">
                Create New Recipe
              </span>
              <span className="text-[11px] text-warm-600 block">
                Add as a fresh recipe in this kitchen
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMode("MERGE_EXISTING")}
              disabled={existingRecipes.length === 0}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                mode === "MERGE_EXISTING"
                  ? "border-terracotta-500 bg-terracotta-50/50 ring-2 ring-terracotta-500/20"
                  : existingRecipes.length === 0
                  ? "opacity-40 border-warm-200 bg-warm-100 cursor-not-allowed"
                  : "border-warm-200 bg-white hover:bg-warm-50/50"
              }`}
            >
              <span className="block text-xs font-bold text-warm-900 mb-0.5">
                Merge into Existing
              </span>
              <span className="text-[11px] text-warm-600 block">
                Attach evidence to an existing card
              </span>
            </button>
          </div>
        </div>

        {mode === "MERGE_EXISTING" ? (
          <div>
            <label className="block text-xs font-semibold text-warm-800 uppercase tracking-wider mb-1.5">
              Select Recipe to Merge into
            </label>
            <select
              value={targetRecipeId}
              onChange={(e) => setTargetRecipeId(e.target.value)}
              className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-warm-300 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
            >
              {existingRecipes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-warm-500 mt-1">
              Safe merge: Reviewed video steps will be added alongside existing steps without overwriting hand-written instructions.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-warm-800 uppercase tracking-wider mb-1.5">
                Recipe Title <span className="text-terracotta-600">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-warm-300 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-warm-800 uppercase tracking-wider mb-1.5">
                  Original Cook
                </label>
                <input
                  type="text"
                  value={cookName}
                  onChange={(e) => setCookName(e.target.value)}
                  placeholder='e.g. "Grandma Ada", "Uncle Femi"'
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-warm-300 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-warm-800 uppercase tracking-wider mb-1.5">
                  Cultural Origin / Region
                </label>
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder='e.g. "Northern Nigeria (Tuwo Shinkafa)"'
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-warm-300 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-warm-800 uppercase tracking-wider mb-1.5">
                Family Story & Context
              </label>
              <textarea
                rows={2}
                value={story}
                onChange={(e) => setStory(e.target.value)}
                placeholder="Record why this meal is special, when it was prepared, or memories from the cooking session..."
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-warm-300 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-warm-800 uppercase tracking-wider mb-1.5">
                Private Kitchen Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional kitchen notes or family reminders..."
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-warm-300 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
              />
            </div>
          </div>
        )}

        <div className="p-3.5 rounded-2xl bg-warm-50 border border-warm-200/80 text-xs text-warm-700 space-y-1">
          <span className="font-semibold text-warm-900 block text-[11px] uppercase tracking-wider">
            Verification Status
          </span>
          <p className="text-[11px] leading-relaxed text-warm-600">
            Only accepted and human-edited steps will be saved into the recipe. Excluded AI steps are permanently omitted. The recipe will be marked as <strong className="text-warm-900 font-semibold">Reviewed</strong> and preserved privately inside your Family Kitchen.
          </p>
        </div>

        <div className="pt-2 flex items-center justify-end gap-3 border-t border-warm-100">
          <Button variant="secondary" size="md" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            type="submit"
            disabled={isSubmitting}
            leftIcon={
              isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )
            }
          >
            {isSubmitting ? "Preserving..." : "Confirm & Save Recipe"}
          </Button>
        </div>
      </form>
    </div>
  );
}
