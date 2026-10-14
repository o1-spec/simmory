"use client";

import React, { useState } from "react";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ReviewedIngredientData {
  id: string;
  reviewId: string;
  name: string;
  quantity: string | null;
  notes: string | null;
  position: number;
  provenance: "SPOKEN_INSTRUCTION" | "VISUALLY_SUGGESTED" | "HUMAN_SUPPLIED" | "HUMAN_CONFIRMED";
  isUnknownQuantity: boolean;
}

interface IngredientSectionProps {
  ingredients: ReviewedIngredientData[];
  canEdit: boolean;
  onSaveIngredient: (data: {
    ingredientId?: string;
    name: string;
    quantity?: string | null;
    notes?: string | null;
    provenance?: "SPOKEN_INSTRUCTION" | "VISUALLY_SUGGESTED" | "HUMAN_SUPPLIED" | "HUMAN_CONFIRMED";
    isUnknownQuantity?: boolean;
    position?: number;
  }) => Promise<void>;
  onDeleteIngredient: (ingredientId: string) => Promise<void>;
}

export function IngredientSection({
  ingredients,
  canEdit,
  onSaveIngredient,
  onDeleteIngredient,
}: IngredientSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [isUnknown, setIsUnknown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setName("");
    setQuantity("");
    setNotes("");
    setIsUnknown(false);
    setEditingId(null);
    setIsAdding(false);
  };

  const handleEdit = (ing: ReviewedIngredientData) => {
    setEditingId(ing.id);
    setName(ing.name);
    setQuantity(ing.quantity || "");
    setNotes(ing.notes || "");
    setIsUnknown(ing.isUnknownQuantity);
    setIsAdding(true);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await onSaveIngredient({
        ingredientId: editingId || undefined,
        name: name.trim(),
        quantity: isUnknown ? null : quantity.trim() || null,
        notes: notes.trim() || null,
        isUnknownQuantity: isUnknown,
        provenance: "HUMAN_CONFIRMED",
      });
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const getProvenanceBadge = (prov: string) => {
    switch (prov) {
      case "VISUALLY_SUGGESTED":
        return (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            Vision Suggested
          </span>
        );
      case "SPOKEN_INSTRUCTION":
        return (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
            Mentioned in Speech
          </span>
        );
      case "HUMAN_CONFIRMED":
        return (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            Confirmed by Cook
          </span>
        );
      default:
        return (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-warm-100 text-warm-700">
            Family Added
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif text-lg font-medium text-warm-900">
            Reconstructed Ingredients
          </h3>
          <p className="text-xs text-warm-600 font-sans">
            AI never invents ingredients. Add, clarify, or confirm items observed in the footage. Traditional qualitative measures (e.g. &ldquo;two handfuls&rdquo;) are fully preserved.
          </p>
        </div>
        {canEdit && !isAdding && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              resetForm();
              setIsAdding(true);
            }}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Ingredient
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="p-4 rounded-2xl bg-warm-50 border border-warm-200 space-y-3 animate-fadeIn">
          <h4 className="text-xs font-bold text-warm-800 uppercase tracking-wider">
            {editingId ? "Edit Ingredient" : "Add New Ingredient"}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-warm-700 mb-1">
                Ingredient Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Corn flour (Tuwo flour)"
                className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-warm-300 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-warm-700 mb-1">
                Quantity or Traditional Measurement
              </label>
              <input
                type="text"
                value={quantity}
                disabled={isUnknown}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder='e.g. "2 handfuls", "1/2 cup", "until smooth"'
                className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-warm-300 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 disabled:bg-warm-100 disabled:text-warm-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="unknownQuantity"
              checked={isUnknown}
              onChange={(e) => setIsUnknown(e.target.checked)}
              className="rounded border-warm-300 text-terracotta-600 focus:ring-terracotta-500"
            />
            <label htmlFor="unknownQuantity" className="text-xs text-warm-700 select-none">
              Exact quantity is unknown / to taste
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-warm-700 mb-1">
              Preparation Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder='e.g. "Sifted beforehand, mixed with cold water first"'
              className="w-full text-xs px-3 py-1.5 rounded-xl border border-warm-300"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              isLoading={isSubmitting}
            >
              {editingId ? "Save Changes" : "Add to Recipe"}
            </Button>
            <Button variant="ghost" size="sm" onClick={resetForm}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {ingredients.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-warm-50 border border-warm-200 text-xs text-warm-500">
          No ingredients added yet. Add items observed during cooking or confirmed by family!
        </div>
      ) : (
        <div className="divide-y divide-warm-100 border border-warm-200 rounded-2xl bg-white overflow-hidden shadow-xs">
          {ingredients.map((ing) => (
            <div
              key={ing.id}
              className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-warm-50/50 transition-colors"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-warm-900">
                    {ing.name}
                  </span>
                  {getProvenanceBadge(ing.provenance)}
                </div>
                <div className="text-xs text-warm-600 flex items-center gap-2">
                  <span className="font-medium text-terracotta-700">
                    {ing.isUnknownQuantity
                      ? "Amount unknown (to taste)"
                      : ing.quantity || "Quantity not specified"}
                  </span>
                  {ing.notes && (
                    <span className="italic text-warm-500">— {ing.notes}</span>
                  )}
                </div>
              </div>

              {canEdit && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleEdit(ing)}
                    className="p-1.5 rounded-md hover:bg-warm-100 text-warm-500 hover:text-warm-800 transition-colors"
                    title="Edit ingredient"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteIngredient(ing.id)}
                    className="p-1.5 rounded-md hover:bg-rose-50 text-warm-400 hover:text-rose-600 transition-colors"
                    title="Delete ingredient"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
