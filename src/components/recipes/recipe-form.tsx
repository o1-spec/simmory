"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Loader2,
  BookOpen,
  Eye,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";

export interface KitchenOption {
  id: string;
  name: string;
}

export interface IngredientFormData {
  id?: string;
  name: string;
  quantity: string;
  notes: string;
}

export interface StepFormData {
  id?: string;
  instruction: string;
  sensoryCue: string;
  duration: string;
  notes: string;
}

export interface RecipeFormData {
  id?: string;
  kitchenId: string;
  title: string;
  cookName: string;
  description: string;
  story: string;
  origin: string;
  notes: string;
  ingredients: IngredientFormData[];
  steps: StepFormData[];
}

interface RecipeFormProps {
  initialData?: RecipeFormData;
  kitchens: KitchenOption[];
  isEditing?: boolean;
}

export function RecipeForm({
  initialData,
  kitchens,
  isEditing = false,
}: RecipeFormProps) {
  const router = useRouter();

  const [kitchenId, setKitchenId] = useState(
    initialData?.kitchenId || (kitchens[0]?.id ?? "")
  );
  const [title, setTitle] = useState(initialData?.title || "");
  const [cookName, setCookName] = useState(initialData?.cookName || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [story, setStory] = useState(initialData?.story || "");
  const [origin, setOrigin] = useState(initialData?.origin || "");
  const [notes, setNotes] = useState(initialData?.notes || "");

  const [ingredients, setIngredients] = useState<IngredientFormData[]>(
    initialData?.ingredients?.length
      ? initialData.ingredients
      : [
          { name: "", quantity: "", notes: "" },
          { name: "", quantity: "", notes: "" },
          { name: "", quantity: "", notes: "" },
        ]
  );

  const [steps, setSteps] = useState<StepFormData[]>(
    initialData?.steps?.length
      ? initialData.steps
      : [
          { instruction: "", sensoryCue: "", duration: "", notes: "" },
          { instruction: "", sensoryCue: "", duration: "", notes: "" },
        ]
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ingredient helpers
  const addIngredient = () => {
    setIngredients((prev) => [...prev, { name: "", quantity: "", notes: "" }]);
  };

  const removeIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const moveIngredient = (index: number, direction: "up" | "down") => {
    setIngredients((prev) => {
      const copy = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= copy.length) return copy;
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const updateIngredient = (
    index: number,
    field: keyof IngredientFormData,
    value: string
  ) => {
    setIngredients((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Step helpers
  const addStep = () => {
    setSteps((prev) => [
      ...prev,
      { instruction: "", sensoryCue: "", duration: "", notes: "" },
    ]);
  };

  const removeStep = (index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const moveStep = (index: number, direction: "up" | "down") => {
    setSteps((prev) => {
      const copy = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= copy.length) return copy;
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const updateStep = (
    index: number,
    field: keyof StepFormData,
    value: string
  ) => {
    setSteps((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please provide a recipe title.");
      return;
    }
    if (!cookName.trim()) {
      setError("Please specify the original cook's name.");
      return;
    }
    if (!kitchenId) {
      setError("Please select a target family kitchen.");
      return;
    }

    // Filter out completely blank ingredients
    const cleanedIngredients = ingredients
      .filter((ing) => ing.name.trim().length > 0)
      .map((ing, idx) => ({
        name: ing.name.trim(),
        quantity: ing.quantity.trim() || undefined,
        notes: ing.notes.trim() || undefined,
        position: idx,
      }));

    // Filter out completely blank steps
    const cleanedSteps = steps
      .filter((st) => st.instruction.trim().length > 0)
      .map((st, idx) => ({
        instruction: st.instruction.trim(),
        sensoryCue: st.sensoryCue.trim() || undefined,
        duration: st.duration.trim() || undefined,
        notes: st.notes.trim() || undefined,
        position: idx,
      }));

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        kitchenId,
        title: title.trim(),
        cookName: cookName.trim(),
        description: description.trim() || undefined,
        story: story.trim() || undefined,
        origin: origin.trim() || undefined,
        notes: notes.trim() || undefined,
        ingredients: cleanedIngredients,
        steps: cleanedSteps,
      };

      const url = isEditing
        ? `/api/recipes/${initialData?.id}`
        : "/api/recipes";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save recipe");
      }

      const recipeId = isEditing ? initialData?.id : data.recipe?.id;
      toast.success(
        isEditing ? "Recipe updated" : "Recipe preserved",
        isEditing
          ? `Changes to "${title}" were safely saved.`
          : `"${title}" has been added to your family cookbook.`
      );
      router.push(`/recipes/${recipeId}`);
      router.refresh();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to save recipe";
      setError(errMsg);
      toast.error("Could not save recipe", errMsg);
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto pb-16">
      {error && (
        <div className="p-4 text-sm text-red-800 bg-red-50 border border-red-200 rounded-2xl">
          {error}
        </div>
      )}

      {/* 1. Core Header Information */}
      <section className="bg-white rounded-2xl border border-warm-200 p-6 md:p-8 space-y-6">
        <div className="border-b border-warm-100 pb-4">
          <h2 className="font-serif text-xl font-medium text-warm-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-terracotta-600" />
            Recipe Overview & Heritage
          </h2>
          <p className="text-xs text-warm-500 mt-1">
            Capture the dish, who created it, and the family story behind it.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-warm-800 mb-1.5">
              Family Kitchen *
            </label>
            <select
              value={kitchenId}
              onChange={(e) => setKitchenId(e.target.value)}
              disabled={isEditing || kitchens.length === 0}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-warm-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 transition-colors"
            >
              {kitchens.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Original Cook's Name *"
            placeholder="e.g. Abuela Rosa, Aunt Mei, Nonna Maria"
            value={cookName}
            onChange={(e) => setCookName(e.target.value)}
            required
            helperText="The loved one whose instincts and technique created this dish."
          />
        </div>

        <Input
          label="Recipe Title *"
          placeholder="e.g. Mole Negro Oaxaqueño, Sunday Ragu, Hainanese Chicken Rice"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input
            label="Cuisine or Cultural Origin"
            placeholder="e.g. Oaxaca, Mexico; Emilia-Romagna, Italy"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-warm-800">
              Short Summary / Description
            </label>
            <input
              type="text"
              placeholder="e.g. Deep celebratory black mole made for family weddings"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-warm-200 bg-white placeholder:text-warm-400 focus:outline-hidden focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 transition-colors"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-warm-800">
            Family Story & Culinary Memory{" "}
            <span className="text-warm-400 font-normal">(Optional)</span>
          </label>
          <textarea
            rows={3}
            className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-warm-200 bg-white placeholder:text-warm-400 focus:outline-hidden focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 transition-colors resize-none"
            placeholder="What memories, holidays, or feelings accompany this meal? What did they say while making it?"
            value={story}
            onChange={(e) => setStory(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-warm-800">
            Preparation Notes & Advice{" "}
            <span className="text-warm-400 font-normal">(Optional)</span>
          </label>
          <textarea
            rows={2}
            className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-warm-200 bg-white placeholder:text-warm-400 focus:outline-hidden focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 transition-colors resize-none"
            placeholder="Important tips passed down (e.g. Always char the chiles slowly on a dry comal; never use high flame)."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </section>

      {/* 2. Ingredients Section */}
      <section className="bg-white rounded-2xl border border-warm-200 p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-warm-100 pb-4">
          <div>
            <h2 className="font-serif text-xl font-medium text-warm-900">
              Ingredients
            </h2>
            <p className="text-xs text-warm-500 mt-1">
              Descriptive quantities are welcome (e.g. &ldquo;a handful&rdquo;, &ldquo;a pinch&rdquo;, &ldquo;until covered&rdquo;).
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={addIngredient}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Ingredient
          </Button>
        </div>

        <div className="space-y-3">
          {ingredients.map((ing, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-3 bg-warm-50/50 rounded-xl border border-warm-200/60"
            >
              <div className="flex flex-col gap-0.5 text-warm-400">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => moveIngredient(index, "up")}
                  className="p-1 hover:text-warm-700 disabled:opacity-30"
                  aria-label="Move up"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={index === ingredients.length - 1}
                  onClick={() => moveIngredient(index, "down")}
                  className="p-1 hover:text-warm-700 disabled:opacity-30"
                  aria-label="Move down"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-6">
                  <input
                    type="text"
                    placeholder="Ingredient name (e.g. Dried chilhuacle chiles)"
                    value={ing.name}
                    onChange={(e) => updateIngredient(index, "name", e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-warm-200 bg-white focus:outline-hidden focus:ring-1 focus:ring-terracotta-500"
                  />
                </div>
                <div className="sm:col-span-3">
                  <input
                    type="text"
                    placeholder="Amount (e.g. 2 cups, a handful)"
                    value={ing.quantity}
                    onChange={(e) => updateIngredient(index, "quantity", e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-warm-200 bg-white focus:outline-hidden focus:ring-1 focus:ring-terracotta-500"
                  />
                </div>
                <div className="sm:col-span-3">
                  <input
                    type="text"
                    placeholder="Notes (e.g. seeded, toasted)"
                    value={ing.notes}
                    onChange={(e) => updateIngredient(index, "notes", e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-warm-200 bg-white focus:outline-hidden focus:ring-1 focus:ring-terracotta-500"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeIngredient(index)}
                disabled={ingredients.length <= 1}
                className="p-2 text-warm-400 hover:text-red-600 disabled:opacity-20 transition-colors"
                aria-label="Remove ingredient"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Cooking Steps with Sensory Cues */}
      <section className="bg-white rounded-2xl border border-warm-200 p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-warm-100 pb-4">
          <div>
            <h2 className="font-serif text-xl font-medium text-warm-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              Cooking Steps & Sensory Cues
            </h2>
            <p className="text-xs text-warm-500 mt-1">
              Include the visual cues, aromas, and sounds the cook relied on to know when it was ready.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={addStep}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Step
          </Button>
        </div>

        <div className="space-y-4">
          {steps.map((st, index) => (
            <div
              key={index}
              className="p-4 bg-warm-50/50 rounded-2xl border border-warm-200/80 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-warm-200 text-warm-800 text-xs font-semibold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-xs font-semibold text-warm-800">
                    Step {index + 1}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => moveStep(index, "up")}
                    className="p-1 text-warm-400 hover:text-warm-700 disabled:opacity-30"
                    aria-label="Move step up"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={index === steps.length - 1}
                    onClick={() => moveStep(index, "down")}
                    className="p-1 text-warm-400 hover:text-warm-700 disabled:opacity-30"
                    aria-label="Move step down"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={steps.length <= 1}
                    onClick={() => removeStep(index)}
                    className="p-1 text-warm-400 hover:text-red-600 disabled:opacity-20 ml-2"
                    aria-label="Remove step"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <textarea
                  rows={2}
                  placeholder={`Describe what the cook did in step ${index + 1}...`}
                  value={st.instruction}
                  onChange={(e) => updateStep(index, "instruction", e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-warm-200 bg-white placeholder:text-warm-400 focus:outline-hidden focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 transition-colors"
                />
              </div>

              {/* Sensory Cue Callout Input */}
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                  <Eye className="w-3.5 h-3.5 text-amber-600" />
                  <span>Sensory Cue</span>
                  <span className="text-amber-700 font-normal">(Visual, aroma, sound, or texture tell)</span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. Cook until the oil rises to the surface, or Stir until the color deepens to brick red"
                  value={st.sensoryCue}
                  onChange={(e) => updateStep(index, "sensoryCue", e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-amber-300/80 bg-white placeholder:text-amber-400/80 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 text-warm-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-warm-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Approx duration (e.g. 15-20 mins)"
                    value={st.duration}
                    onChange={(e) => updateStep(index, "duration", e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-warm-200 bg-white"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Cook's note (e.g. Grandmother said don't leave the pot)"
                  value={st.notes}
                  onChange={(e) => updateStep(index, "notes", e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-warm-200 bg-white"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Action Buttons */}
      <div className="flex items-center justify-end gap-4 pt-4">
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={isSubmitting || !title.trim() || !cookName.trim()}
          leftIcon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
        >
          {isSubmitting
            ? isEditing
              ? "Saving Changes..."
              : "Preserving Recipe..."
            : isEditing
            ? "Save Recipe Changes"
            : "Preserve Recipe in Kitchen"}
        </Button>
      </div>
    </form>
  );
}
