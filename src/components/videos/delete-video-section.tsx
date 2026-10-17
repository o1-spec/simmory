"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";

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
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/videos/${videoId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete video");
      }

      toast.success(
        "Cooking video deleted",
        `"${videoTitle}" has been removed from your archive.`
      );
      setIsOpen(false);

      if (onDeleted) {
        onDeleted();
      } else {
        router.push(redirectTo);
        router.refresh();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Deletion failed";
      toast.error("Could not delete video", message);
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 text-[#9A2C2C] border-[#DDDCD3] hover:bg-[#FDF2F2] hover:border-[#E97B77]/40 cursor-pointer"
      >
        <Trash2 className="w-3.5 h-3.5 text-[#E97B77]" />
        Delete Video
      </Button>

      <ConfirmModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleDelete}
        title="Permanently delete cooking video?"
        description={`Are you sure you want to delete "${videoTitle}"? The media recording and associated step analysis will be permanently removed. This cannot be undone.`}
        confirmLabel="Yes, Delete Video"
        cancelLabel="Keep Video"
        variant="danger"
        isLoading={isDeleting}
        icon={<Trash2 className="w-5 h-5 text-[#E97B77]" />}
      />
    </>
  );
}
