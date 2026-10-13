"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, Trash2, X, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface KitchenSettingsDialogProps {
  kitchen: {
    id: string;
    name: string;
    description: string | null;
  };
}

export function KitchenSettingsDialog({ kitchen }: KitchenSettingsDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(kitchen.name);
  const [description, setDescription] = useState(kitchen.description || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Deletion state
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

      setIsOpen(false);
      router.refresh();
    } catch (err: unknown) {
      setUpdateError(err instanceof Error ? err.message : "Failed to update kitchen");
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

      setIsOpen(false);
      router.push("/kitchens");
      router.refresh();
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete kitchen");
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button
        variant="secondary"
        size="md"
        leftIcon={<Settings className="w-4 h-4" />}
        onClick={() => {
          setName(kitchen.name);
          setDescription(kitchen.description || "");
          setShowDeleteConfirm(false);
          setConfirmName("");
          setIsOpen(true);
        }}
      >
        Kitchen Settings
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-warm-950/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-lg bg-white rounded-2xl border border-warm-200 shadow-xl overflow-hidden animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-warm-100 bg-warm-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-warm-100 text-warm-700 flex items-center justify-center">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-medium text-warm-900">
                    Kitchen Settings
                  </h3>
                  <p className="text-xs text-warm-500">
                    Manage details and preferences for {kitchen.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-warm-400 hover:text-warm-700 hover:bg-warm-100 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Edit Details Form */}
              <form onSubmit={handleUpdate} className="space-y-4">
                <h4 className="text-sm font-semibold text-warm-900">General Information</h4>
                {updateError && (
                  <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl">
                    {updateError}
                  </div>
                )}

                <Input
                  label="Kitchen Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isUpdating}
                />

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-warm-800">Description</label>
                  <textarea
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-warm-200 bg-white placeholder:text-warm-400 focus:outline-hidden focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 transition-colors resize-none h-20"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isUpdating}
                    maxLength={500}
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isUpdating || !name.trim()}
                    leftIcon={isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : undefined}
                  >
                    {isUpdating ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>

              {/* Danger Zone: Delete Kitchen */}
              <div className="pt-5 border-t border-red-100">
                <div className="rounded-xl border border-red-200/80 bg-red-50/50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h5 className="text-xs font-semibold text-red-900">Danger Zone: Delete Kitchen</h5>
                      <p className="text-[11px] text-red-700 mt-1 leading-relaxed">
                        Deleting this kitchen permanently removes all recipes, ingredients, and member records in this space. This action cannot be undone.
                      </p>

                      {!showDeleteConfirm ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-3 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700"
                          leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                          onClick={() => setShowDeleteConfirm(true)}
                        >
                          Delete This Kitchen...
                        </Button>
                      ) : (
                        <form onSubmit={handleDelete} className="mt-3 space-y-3">
                          {deleteError && (
                            <div className="p-2.5 text-xs text-red-700 bg-red-100 border border-red-300 rounded-lg">
                              {deleteError}
                            </div>
                          )}
                          <p className="text-xs text-red-800 font-medium">
                            Please type <span className="font-bold underline">{kitchen.name}</span> to confirm:
                          </p>
                          <input
                            type="text"
                            className="w-full px-3 py-2 text-xs border border-red-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-red-400"
                            placeholder={kitchen.name}
                            value={confirmName}
                            onChange={(e) => setConfirmName(e.target.value)}
                            disabled={isDeleting}
                          />
                          <div className="flex items-center gap-2">
                            <Button
                              type="submit"
                              size="sm"
                              className="bg-red-600 text-white hover:bg-red-700 border-transparent text-xs"
                              disabled={isDeleting || confirmName.trim() !== kitchen.name.trim()}
                              leftIcon={isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : undefined}
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
                              className="text-xs"
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
            </div>
          </div>
        </div>
      )}
    </>
  );
}
