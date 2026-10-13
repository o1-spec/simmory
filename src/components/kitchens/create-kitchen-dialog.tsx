"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2, FolderHeart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CreateKitchenDialog({ triggerText = "Create New Kitchen" }: { triggerText?: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please provide a name for this family kitchen.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/kitchens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create kitchen");
      }

      setName("");
      setDescription("");
      setIsOpen(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create kitchen");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="primary"
        size="md"
        leftIcon={<Plus className="w-4 h-4" />}
        onClick={() => setIsOpen(true)}
      >
        {triggerText}
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
                <div className="w-9 h-9 rounded-xl bg-terracotta-100 text-terracotta-700 flex items-center justify-center">
                  <FolderHeart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-medium text-warm-900">
                    Create Family Kitchen
                  </h3>
                  <p className="text-xs text-warm-500">
                    A private sanctuary for preserving recipes and cooking memories
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

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl">
                  {error}
                </div>
              )}

              <Input
                label="Kitchen Name"
                placeholder="e.g. Abuela Rosa's Oaxaca Kitchen, Sunday Dinners"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
                helperText="Give your collection a warm name representing your family branch or tradition."
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-warm-800">
                  Description <span className="text-warm-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-warm-200 bg-white placeholder:text-warm-400 focus:outline-hidden focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 transition-colors resize-none h-24"
                  placeholder="Share a few words about what makes this kitchen special..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isLoading}
                  maxLength={500}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-warm-100">
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={() => setIsOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isLoading || !name.trim()}
                  leftIcon={isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
                >
                  {isLoading ? "Creating Kitchen..." : "Create Kitchen"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
