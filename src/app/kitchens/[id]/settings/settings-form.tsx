"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, Trash2, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface KitchenSettingsFormProps {
  kitchen: {
    id: string;
    name: string;
    description: string | null;
  };
  isOwner: boolean;
  canEdit: boolean;
}

export function KitchenSettingsForm({
  kitchen,
  isOwner,
  canEdit,
}: KitchenSettingsFormProps) {
  const router = useRouter();
  const [name, setName] = useState(kitchen.name);
  const [description, setDescription] = useState(kitchen.description || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setUpdateError("Kitchen name cannot be empty.");
      return;
    }

    setIsUpdating(true);
    setUpdateError(null);
    setUpdateSuccess(false);

    try {
      const res = await fetch(`/api/kitchens/${kitchen.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update kitchen");
      }

      setUpdateSuccess(true);
      router.refresh();
    } catch (err: unknown) {
      setUpdateError(
        err instanceof Error ? err.message : "Failed to update kitchen"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmName.trim() !== kitchen.name.trim()) {
      setDeleteError("Typed name does not match the kitchen name exactly.");
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/kitchens/${kitchen.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete kitchen");
      }

      router.push("/kitchens");
      router.refresh();
    } catch (err: unknown) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete kitchen"
      );
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-[#DDDCD3] shadow-sm p-6 sm:p-10 space-y-10">
      <div className="flex items-center gap-3 pb-6 border-b border-[#DDDCD3]">
        <div className="w-12 h-12 rounded-2xl bg-[#2E4742]/10 text-[#2E4742] flex items-center justify-center">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#202723]">
            Kitchen Settings
          </h1>
          <p className="text-xs text-[#202723]/60 mt-0.5">
            Manage details and preferences for {kitchen.name}
          </p>
        </div>
      </div>

      <form onSubmit={handleUpdate} className="space-y-6">
        <div>
          <h2 className="font-display text-lg font-bold text-[#202723] mb-1">
            General Information
          </h2>
          <p className="text-xs text-[#202723]/60">
            Update the title and generational lore associated with this kitchen archive.
          </p>
        </div>

        {updateError && (
          <div className="p-3.5 text-xs text-red-800 bg-red-50 border border-red-200 rounded-xl">
            {updateError}
          </div>
        )}

        {updateSuccess && (
          <div className="p-3.5 text-xs text-[#2E4742] bg-[#2E4742]/10 border border-[#2E4742]/20 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#2E4742] shrink-0" />
            Kitchen details updated successfully.
          </div>
        )}

        <Input
          label="Kitchen Name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setUpdateSuccess(false);
          }}
          required
          disabled={!canEdit || isUpdating}
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-mono font-medium text-[#202723] uppercase tracking-wider">
            Description
          </label>
          <textarea
            className="w-full px-4 py-3 rounded-xl text-sm border border-[#DDDCD3] bg-[#FAF9F5] text-[#202723] placeholder:text-[#202723]/40 focus:outline-none focus:ring-2 focus:ring-[#2E4742]/20 focus:border-[#2E4742] transition-colors resize-none h-28"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setUpdateSuccess(false);
            }}
            disabled={!canEdit || isUpdating}
            maxLength={500}
            placeholder="Generational traditions, memories, and culinary lore..."
          />
        </div>

        {canEdit && (
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="forest"
              size="md"
              disabled={isUpdating || !name.trim()}
              leftIcon={
                isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined
              }
            >
              {isUpdating ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </form>

      {isOwner && (
        <div className="pt-8 border-t border-warm-200/80">
          <div className="rounded-2xl border border-red-200/90 bg-red-50/50 p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-900">
                  Danger Zone: Delete Kitchen
                </h3>
                <p className="text-xs text-red-700 mt-1 leading-relaxed">
                  Deleting this kitchen permanently removes all associated recipes, cooking steps, ingredients, and member records. This action is irreversible.
                </p>

                {!showDeleteConfirm ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-4 text-red-600 border-red-300 hover:bg-red-100 hover:text-red-700"
                    leftIcon={<Trash2 className="w-4 h-4" />}
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    Delete This Kitchen...
                  </Button>
                ) : (
                  <form onSubmit={handleDelete} className="mt-4 space-y-4 max-w-md">
                    {deleteError && (
                      <div className="p-3 text-xs text-red-800 bg-red-100 border border-red-300 rounded-xl">
                        {deleteError}
                      </div>
                    )}
                    <p className="text-xs text-red-800 font-medium">
                      Please type <span className="font-bold underline">{kitchen.name}</span> to confirm permanent deletion:
                    </p>
                    <input
                      type="text"
                      className="w-full px-3.5 py-2 text-sm border border-red-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20"
                      placeholder={kitchen.name}
                      value={confirmName}
                      onChange={(e) => setConfirmName(e.target.value)}
                      disabled={isDeleting}
                    />
                    <div className="flex items-center gap-3">
                      <Button
                        type="submit"
                        size="sm"
                        className="bg-red-600 text-white hover:bg-red-700 border-transparent text-xs"
                        disabled={
                          isDeleting || confirmName.trim() !== kitchen.name.trim()
                        }
                        leftIcon={
                          isDeleting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : undefined
                        }
                      >
                        {isDeleting ? "Deleting..." : "Permanently Delete Kitchen"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setConfirmName("");
                        }}
                        disabled={isDeleting}
                        className="text-xs text-warm-600"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
