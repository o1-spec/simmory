"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeleteVideoSectionProps {
  videoId: string;
  videoTitle: string;
  redirectTo?: string;
  onDeleted?: () => void;
}

export function DeleteVideoSection({
  videoId,
  videoTitle,
  redirectTo = "/videos",
  onDeleted,
}: DeleteVideoSectionProps) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
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

  if (!isConfirming) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsConfirming(true)}
        className="flex items-center gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
      >
        <Trash2 className="w-3.5 h-3.5" />
        Delete Video
      </Button>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-red-200 bg-red-50/60 p-4 text-left space-y-2.5">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-xs font-semibold text-red-900">
            Permanently delete this cooking video?
          </h4>
          <p className="text-[11px] text-red-700 mt-0.5 leading-relaxed">
            Are you sure you want to delete <strong className="font-semibold text-red-900">{videoTitle}</strong>? The media recording and associated AI analysis will be removed from this kitchen archive. This cannot be undone.
          </p>

          {error && (
            <div className="mt-2 p-2 rounded-lg bg-red-100 border border-red-300 text-xs text-red-800">
              {error}
            </div>
          )}

          <div className="flex items-center gap-2 mt-2.5">
            <Button
              type="button"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700 border-transparent text-xs h-7 px-3"
              leftIcon={
                isDeleting ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Trash2 className="w-3 h-3" />
                )
              }
            >
              {isDeleting ? "Deleting..." : "Yes, Delete Video"}
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
              className="text-xs text-warm-700 hover:bg-red-100 h-7 px-2.5"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
