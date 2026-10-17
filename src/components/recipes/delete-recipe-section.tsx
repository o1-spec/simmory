"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";

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
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/recipes/${recipeId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete recipe");
      }

      toast.success(
        "Recipe deleted",
        `"${recipeTitle}" has been permanently removed from this kitchen archive.`
      );
      setIsOpen(false);
      router.push(redirectUrl);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete recipe";
      toast.error("Could not delete recipe", message);
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="md"
        leftIcon={<Trash2 className="w-4 h-4 text-[#E97B77]" />}
        onClick={() => setIsOpen(true)}
        className="text-[#9A2C2C] border-[#DDDCD3] hover:bg-[#FDF2F2] hover:border-[#E97B77]/40 cursor-pointer"
      >
        Delete Recipe
      </Button>

      <ConfirmModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleDelete}
        title="Permanently delete recipe?"
        description={`Are you sure you want to delete "${recipeTitle}"? All ingredients, cooking cues, and memory notes will be permanently removed from this archive. This action cannot be undone.`}
        confirmLabel="Yes, Delete Recipe"
        cancelLabel="Keep Recipe"
        variant="danger"
        isLoading={isDeleting}
        icon={<Trash2 className="w-5 h-5 text-[#E97B77]" />}
      />
    </>
  );
}
