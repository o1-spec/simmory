"use client";

import React from "react";
import { CheckCircle2, Circle, Utensils, X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface CookAlongIngredient {
  id: string;
  name: string;
  quantity?: string | null;
  notes?: string | null;
  position: number;
}

interface IngredientChecklistProps {
  ingredients: CookAlongIngredient[];
  checkedIngredientIds: Set<string>;
  onToggleIngredient: (ingredientId: string, checked: boolean) => Promise<void>;
  onClose?: () => void;
  className?: string;
}

export function IngredientChecklist({
  ingredients,
  checkedIngredientIds,
  onToggleIngredient,
  onClose,
  className = "",
}: IngredientChecklistProps) {
  const total = ingredients.length;
  const checkedCount = ingredients.filter((ing) =>
    checkedIngredientIds.has(ing.id)
  ).length;
  const progressPercent = total > 0 ? Math.round((checkedCount / total) * 100) : 0;

  return (
    <div
      className={`bg-white rounded-2xl border border-warm-200/80 shadow-md p-4 sm:p-6 transition-all ${className}`}
    >
      <div className="flex items-center justify-between pb-3 border-b border-warm-100 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-terracotta-50 text-terracotta-700 flex items-center justify-center">
            <Utensils className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif text-base sm:text-lg text-warm-900 font-semibold leading-tight">
              Mise en Place & Ingredients
            </h3>
            <p className="text-xs text-warm-500">
              {checkedCount} of {total} ingredients ready ({progressPercent}%)
            </p>
          </div>
        </div>

        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-1 text-warm-400 hover:text-warm-700 rounded-lg"
            aria-label="Close ingredient checklist"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-warm-100 h-2 rounded-full overflow-hidden mb-5">
        <div
          className="h-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Ingredient Items */}
      {ingredients.length === 0 ? (
        <p className="text-xs text-warm-500 italic py-4 text-center">
          No ingredients listed for this recipe.
        </p>
      ) : (
        <ul className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {ingredients.map((ing) => {
            const isChecked = checkedIngredientIds.has(ing.id);
            return (
              <li
                key={ing.id}
                onClick={() => onToggleIngredient(ing.id, !isChecked)}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                  isChecked
                    ? "bg-emerald-50/40 border-emerald-200/80 text-warm-600"
                    : "bg-warm-50/50 border-warm-200/80 hover:bg-warm-100/60 text-warm-900"
                }`}
              >
                <button
                  type="button"
                  aria-checked={isChecked}
                  role="checkbox"
                  className="mt-0.5 text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 rounded-md shrink-0"
                >
                  {isChecked ? (
                    <CheckCircle2 className="w-5 h-5 fill-emerald-100 text-emerald-600" />
                  ) : (
                    <Circle className="w-5 h-5 text-warm-300 hover:text-warm-400" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <span
                      className={`text-sm font-medium ${
                        isChecked ? "line-through text-warm-500" : "text-warm-900"
                      }`}
                    >
                      {ing.name}
                    </span>
                    {ing.quantity && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-warm-200/60 text-warm-700">
                        {ing.quantity}
                      </span>
                    )}
                  </div>

                  {ing.notes && (
                    <p className="text-[11px] text-warm-500 mt-1 flex items-center gap-1">
                      <Info className="w-3 h-3 text-warm-400 shrink-0" />
                      <span>{ing.notes}</span>
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-4 pt-3 border-t border-warm-100 flex items-center justify-between text-[11px] text-warm-500">
        <span>Preserves original traditional measurements.</span>
        <span>Tap item to toggle prepared status</span>
      </div>
    </div>
  );
}
