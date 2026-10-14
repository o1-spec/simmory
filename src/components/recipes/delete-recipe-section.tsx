"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeleteRecipeSectionProps {
  recipeId: string;
  recipeTitle: string;
  redirectUrl?: string;
}

export function DeleteRecipeSection({
  recipeId,
  recipeTitle,
  redirectUrl = "/recipes",
}: DeleteRecipeSectionProps) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/recipes/${recipeId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete recipe");
      }

      router.push(redirectUrl);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete recipe");
      setIsDeleting(false);
    }
  };

  if (!isConfirming) {
    return (
      <Button
        variant="outline"
        size="md"
        leftIcon={<Trash2 className="w-4 h-4 text-red-500" />}
        onClick={() => setIsConfirming(true)}
        className="text-red-600 border-red-200 hover:bg-red-50"
      >
        Delete Recipe
      </Button>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-red-200 bg-red-50/60 p-5 text-left space-y-3">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-red-900">
            Permanently delete this recipe?
          </h4>
          <p className="text-xs text-red-700 mt-1 leading-relaxed">
            Are you sure you want to delete <strong className="font-semibold text-red-900">{recipeTitle}</strong>? All instructions, sensory cues, and personal memories will be permanently removed from this kitchen archive. This action cannot be undone.
          </p>

          {error && (
            <div className="mt-2 p-2.5 rounded-lg bg-red-100 border border-red-300 text-xs text-red-800">
              {error}
            </div>
          )}

          <div className="flex items-center gap-2.5 mt-3 pt-1">
            <Button
              type="button"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700 border-transparent text-xs"
              leftIcon={
                isDeleting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )
              }
            >
              {isDeleting ? "Deleting..." : "Yes, Delete Recipe"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsConfirming(false);
                setError(null);
              }}
              disabled={isDeleting}
              className="text-xs text-warm-700 hover:bg-red-100"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
