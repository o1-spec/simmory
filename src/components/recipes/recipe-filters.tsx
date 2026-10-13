"use client";

import React, { useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface RecipeFiltersProps {
  kitchens: { id: string; name: string }[];
  currentQuery?: string;
  currentKitchenId?: string;
  currentStatus?: string;
  totalCount: number;
}

export function RecipeFilters({
  kitchens,
  currentQuery = "",
  currentKitchenId = "",
  currentStatus = "",
  totalCount,
}: RecipeFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [search, setSearch] = useState(currentQuery);

  const applyFilters = (updates: {
    q?: string;
    kitchenId?: string;
    status?: string;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    if ("q" in updates) {
      if (updates.q && updates.q.trim()) {
        params.set("q", updates.q.trim());
      } else {
        params.delete("q");
      }
    }

    if ("kitchenId" in updates) {
      if (updates.kitchenId) {
        params.set("kitchenId", updates.kitchenId);
      } else {
        params.delete("kitchenId");
      }
    }

    if ("status" in updates) {
      if (updates.status) {
        params.set("status", updates.status);
      } else {
        params.delete("status");
      }
    }

    params.set("page", "1"); // Reset pagination on filter change

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters({ q: search });
  };

  const clearSearch = () => {
    setSearch("");
    applyFilters({ q: "" });
  };

  return (
    <div className="space-y-4 mb-8">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search bar */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Input
            placeholder="Search dish title, cook, or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-warm-400" />}
            rightIcon={
              search ? (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="p-1 text-warm-400 hover:text-warm-700"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : undefined
            }
          />
        </form>

        {/* Kitchen filter select */}
        {kitchens.length > 1 && (
          <div className="w-full sm:w-64">
            <select
              value={currentKitchenId}
              onChange={(e) => applyFilters({ kitchenId: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-warm-200 bg-white text-warm-800 focus:outline-hidden focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500"
            >
              <option value="">All Family Kitchens</option>
              {kitchens.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Status pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 text-xs">
        <button
          type="button"
          onClick={() => applyFilters({ status: "" })}
          className="focus:outline-hidden"
        >
          <Badge
            variant={!currentStatus ? "terracotta" : "outline"}
            className="cursor-pointer"
          >
            All Recipes ({totalCount})
          </Badge>
        </button>
        <button
          type="button"
          onClick={() => applyFilters({ status: "DRAFT" })}
          className="focus:outline-hidden"
        >
          <Badge
            variant={currentStatus === "DRAFT" ? "terracotta" : "outline"}
            className="cursor-pointer"
          >
            Draft Recipes
          </Badge>
        </button>
        <button
          type="button"
          onClick={() => applyFilters({ status: "VERIFIED" })}
          className="focus:outline-hidden"
        >
          <Badge
            variant={currentStatus === "VERIFIED" ? "terracotta" : "outline"}
            className="cursor-pointer"
          >
            Verified by Cook
          </Badge>
        </button>
      </div>
    </div>
  );
}
