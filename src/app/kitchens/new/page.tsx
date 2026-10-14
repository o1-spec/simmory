"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FolderHeart, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function NewKitchenPage() {
  const router = useRouter();
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

      router.push(`/kitchens/${data.kitchen.id}`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create kitchen");
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto py-4 sm:py-8">
        <Link
          href="/kitchens"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-warm-500 hover:text-warm-800 transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Kitchens
        </Link>

        <div className="bg-white rounded-3xl border border-warm-200/80 shadow-sm p-6 sm:p-10">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-warm-100">
            <div className="w-12 h-12 rounded-2xl bg-terracotta-50 text-terracotta-600 flex items-center justify-center border border-terracotta-100">
              <FolderHeart className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-semibold text-warm-900">
                Create Family Kitchen
              </h1>
              <p className="text-xs text-warm-500 mt-0.5">
                A private sanctuary to preserve your family&apos;s recipes, demonstrations, and culinary lore.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-terracotta-50 border border-terracotta-200 text-xs text-terracotta-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="kitchen-name"
                className="block text-xs font-semibold text-warm-800 uppercase tracking-wider mb-2"
              >
                Kitchen Name <span className="text-terracotta-600">*</span>
              </label>
              <Input
                id="kitchen-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Grandmother Al-Hassan's Kitchen"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label
                htmlFor="kitchen-description"
                className="block text-xs font-semibold text-warm-800 uppercase tracking-wider mb-2"
              >
                Description <span className="text-warm-400 font-normal lowercase">(optional)</span>
              </label>
              <textarea
                id="kitchen-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Traditional recipes, cooking memories, and techniques preserved across generations."
                rows={4}
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-xl border border-warm-200 bg-warm-50/30 text-warm-900 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 text-sm transition-all"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-warm-100">
              <Link href="/kitchens">
                <Button variant="outline" size="md" type="button" disabled={isLoading}>
                  Cancel
                </Button>
              </Link>
              <Button
                variant="primary"
                size="md"
                type="submit"
                disabled={isLoading}
                leftIcon={isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
              >
                {isLoading ? "Creating Kitchen..." : "Create Kitchen"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
