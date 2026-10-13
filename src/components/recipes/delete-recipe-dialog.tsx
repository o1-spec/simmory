"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, X, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeleteRecipeDialogProps {
  recipeId: string;
  recipeTitle: string;
  redirectUrl?: string;
}

export function DeleteRecipeDialog({
  recipeId,
  recipeTitle,
  redirectUrl = "/recipes",
}: DeleteRecipeDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
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

      setIsOpen(false);
      router.push(redirectUrl);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete recipe");
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="md"
        leftIcon={<Trash2 className="w-4 h-4 text-red-500" />}
        onClick={() => setIsOpen(true)}
        className="text-red-600 border-red-200 hover:bg-red-50"
      >
        Delete Recipe
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-warm-950/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-white rounded-2xl border border-warm-200 shadow-xl overflow-hidden animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            <div className="p-6">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-serif text-lg font-medium text-warm-900">
                    Delete Preserved Recipe?
                  </h3>
                  <p className="text-xs text-warm-600 mt-1 leading-relaxed">
                    Are you sure you want to permanently delete{" "}
                    <span className="font-semibold text-warm-900">&ldquo;{recipeTitle}&rdquo;</span>?
                    All recorded ingredients, cooking instructions, and sensory cues will be removed.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-warm-400 hover:text-warm-700"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {error && (
                <div className="mt-4 p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl">
                  {error}
                </div>
              )}

              <div className="mt-6 flex items-center justify-end gap-3">
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => setIsOpen(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  className="bg-red-600 hover:bg-red-700 border-transparent text-white"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  leftIcon={isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
                >
                  {isDeleting ? "Deleting..." : "Permanently Delete"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
