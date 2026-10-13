"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeleteVideoDialogProps {
  videoId: string;
  videoTitle: string;
  redirectTo?: string;
  onDeleted?: () => void;
}

export function DeleteVideoDialog({
  videoId,
  videoTitle,
  redirectTo = "/videos",
  onDeleted,
}: DeleteVideoDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/videos/${videoId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete video");
      }

      setIsOpen(false);
      if (onDeleted) {
        onDeleted();
      } else {
        router.push(redirectTo);
        router.refresh();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Deletion failed");
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
      >
        <Trash2 className="w-4 h-4" />
        <span>Delete Video</span>
      </Button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl border border-warm-200 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="font-serif text-lg text-warm-900 font-medium">
                Delete Cooking Video
              </h3>
            </div>

            <p className="text-xs text-warm-600 leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <strong>&ldquo;{videoTitle}&rdquo;</strong>? This action cannot be
              undone and will remove the video from your family kitchen and Cloudflare
              R2 storage.
            </p>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white border-transparent"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Permanently Delete Video"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
