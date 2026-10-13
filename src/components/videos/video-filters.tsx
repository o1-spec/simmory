"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter } from "lucide-react";

interface KitchenOption {
  id: string;
  name: string;
}

export function VideoFilters({ kitchens }: { kitchens: KitchenOption[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentKitchen = searchParams.get("kitchenId") || "";
  const currentStatus = searchParams.get("uploadStatus") || "";

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page"); // Reset page when filtering
    router.push(`/videos?${params.toString()}`);
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-warm-200/80 shadow-xs mb-6">
      <div className="flex items-center gap-2 text-xs font-medium text-warm-600 w-full sm:w-auto">
        <Filter className="w-4 h-4 text-warm-500" />
        <span>Filter Recordings:</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
        {/* Kitchen Select */}
        <select
          value={currentKitchen}
          onChange={(e) => updateParam("kitchenId", e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-warm-300 bg-white text-xs text-warm-800 focus:outline-none focus:ring-2 focus:ring-terracotta-500"
          aria-label="Filter by kitchen"
        >
          <option value="">All Family Kitchens</option>
          {kitchens.map((k) => (
            <option key={k.id} value={k.id}>
              {k.name}
            </option>
          ))}
        </select>

        {/* Status Select */}
        <select
          value={currentStatus}
          onChange={(e) => updateParam("uploadStatus", e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-warm-300 bg-white text-xs text-warm-800 focus:outline-none focus:ring-2 focus:ring-terracotta-500"
          aria-label="Filter by upload status"
        >
          <option value="">All Statuses</option>
          <option value="UPLOADED">Uploaded & Ready</option>
          <option value="PENDING_UPLOAD">Pending Upload</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>
    </div>
  );
}
